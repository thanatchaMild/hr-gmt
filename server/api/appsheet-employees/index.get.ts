// AppSheet employee list (appsheetdb, read-only) — same data as myapp's "ข้อมูลพนักงาน (AppSheet)" page.
// Reads the `employees` table myapp imports from the AppSheet Excel; where that table doesn't exist yet
// (e.g. dev DB) it falls back to AppSheet's own appsheet_employees, which has fewer columns.
// Query: page, search, department_id, branch_id, account_type, issues=1, all=1 (export).
export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')

  const query = getQuery(event)
  const exportAll = query.all === '1'
  const page = Math.max(1, parseInt(String(query.page || '1')))
  const perPage = exportAll ? 5000 : 50
  const str = (key: string) => String(query[key] ?? '').trim()
  const int = (key: string) => {
    const n = parseInt(str(key))
    return Number.isFinite(n) ? n : null
  }

  const db = await getAppsheetDb()
  const source = await employeeSource(db)

  const req = db.request()
  const conditions: string[] = ['1 = 1']
  if (str('search')) {
    conditions.push(source === 'employees'
      ? '(e.FullName LIKE @search OR e.EmployeeCode LIKE @search OR e.Email LIKE @search OR e.Nickname LIKE @search)'
      : '(e.FullName LIKE @search OR e.Email LIKE @search OR e.Nickname LIKE @search)')
    req.input('search', `%${str('search')}%`)
  }
  if (int('department_id') !== null) { conditions.push('e.DepartmentID = @departmentId'); req.input('departmentId', int('department_id')) }
  if (int('branch_id') !== null) { conditions.push('e.BranchID = @branchId'); req.input('branchId', int('branch_id')) }
  if (source === 'employees' && str('account_type')) { conditions.push('e.AccountType = @accountType'); req.input('accountType', str('account_type')) }
  if (source === 'employees' && query.issues === '1') conditions.push(`ISNULL(e.Issues, N'') <> N''`)
  req.input('offset', (page - 1) * perPage)
  req.input('perPage', perPage)

  const extraCols = source === 'employees'
    ? 'e.id AS RowID, e.EmployeeCode, e.PersonNo, e.Title, e.AccountType, e.Issues'
    : 'e.EmployeeID AS RowID, NULL AS EmployeeCode, NULL AS PersonNo, NULL AS Title, NULL AS AccountType, NULL AS Issues'
  const order = source === 'employees' ? 'e.EmployeeID, e.PersonNo' : 'e.EmployeeID'

  const [list, filters, accountTypes] = await Promise.all([
    req.query(`
      SELECT ${extraCols},
        e.EmployeeID, e.FullName, e.Nickname, e.PositionTitle, e.Email,
        e.DepartmentID, d.DepartmentName, e.BranchID, b.BranchName,
        (SELECT COUNT(*) FROM appsheet_assets a WHERE a.AssignedTo = e.EmployeeID AND a.deleted_at IS NULL) AS AssetCount,
        COUNT(*) OVER() AS _total
      FROM ${source} e
      LEFT JOIN appsheet_departments d ON d.DepartmentID = e.DepartmentID
      LEFT JOIN appsheet_branches b ON b.BranchID = e.BranchID
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${order}
      OFFSET @offset ROWS FETCH NEXT @perPage ROWS ONLY
    `),
    getAppsheetFilters(),
    source === 'employees'
      ? db.request().query(`SELECT DISTINCT AccountType AS v FROM employees WHERE ISNULL(AccountType, N'') <> N'' ORDER BY AccountType`)
      : Promise.resolve({ recordset: [] as any[] }),
  ])

  const total = list.recordset[0]?._total || 0
  return {
    source,
    data: list.recordset,
    meta: { current_page: page, last_page: Math.ceil(total / perPage) || 1, total, per_page: perPage },
    filters: {
      departments: filters.departments,
      branches: filters.branches,
      accountTypes: accountTypes.recordset.map((r: any) => r.v),
    },
  }
})
