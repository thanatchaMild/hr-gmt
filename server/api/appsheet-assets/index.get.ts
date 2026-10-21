// Live, read-only list of IT assets from the AppSheet DB.
// Query: page, search, type_id, status_id, branch_id, department_id, holder_id,
//        warranty ('expiring' = within 90 days, 'expired'), all=1 (no paging, for Excel export).
export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')

  const query = getQuery(event)
  const exportAll = query.all === '1'
  const page = Math.max(1, parseInt(String(query.page || '1')))
  const perPage = exportAll ? 5000 : 20
  const offset = exportAll ? 0 : (page - 1) * perPage

  const search = String(query.search || '').trim()
  const intParam = (key: string) => {
    const n = parseInt(String(query[key] ?? ''))
    return Number.isFinite(n) ? n : null
  }
  const typeId = intParam('type_id')
  const statusId = intParam('status_id')
  const branchId = intParam('branch_id')
  const departmentId = intParam('department_id')
  const holderId = intParam('holder_id')
  const warranty = String(query.warranty || '')

  const db = await getAppsheetDb()

  const conditions: string[] = ['a.deleted_at IS NULL']
  const params: Record<string, any> = {}

  if (search) {
    conditions.push(`(a.AssetTag LIKE @search OR a.MachineNumber LIKE @search OR a.AssetName LIKE @search
      OR a.Brand LIKE @search OR e.FullName LIKE @search OR e.Nickname LIKE @search)`)
    params.search = `%${search}%`
  }
  if (typeId) { conditions.push('a.TypeID = @typeId'); params.typeId = typeId }
  if (statusId === 0) conditions.push('a.StatusID IS NULL')
  else if (statusId) { conditions.push('a.StatusID = @statusId'); params.statusId = statusId }
  if (branchId) { conditions.push('a.BranchID = @branchId'); params.branchId = branchId }
  if (departmentId) { conditions.push('e.DepartmentID = @departmentId'); params.departmentId = departmentId }
  if (holderId) { conditions.push('a.AssignedTo = @holderId'); params.holderId = holderId }
  if (warranty === 'expiring') {
    conditions.push('a.WarrantyEndDate >= CAST(GETDATE() AS date) AND a.WarrantyEndDate < DATEADD(day, 90, CAST(GETDATE() AS date))')
  } else if (warranty === 'expired') {
    conditions.push('a.WarrantyEndDate < CAST(GETDATE() AS date)')
  }

  const where = conditions.join(' AND ')

  const req = db.request()
  for (const [k, v] of Object.entries(params)) {
    req.input(k, v)
  }
  req.input('offset', offset)
  req.input('perPage', perPage)

  const [dataResult, filters] = await Promise.all([
    req.query(`
      SELECT
        a.AssetID, a.AssetTag, a.MachineNumber, a.AssetName, a.Brand,
        a.TypeID, t.TypeName,
        a.StatusID, s.StatusName,
        a.AssignedTo, e.FullName AS AssignedToName, e.Nickname AS AssignedToNickname,
        d.DepartmentName,
        a.BranchID, b.BranchName,
        loc.LocationName,
        a.PurchaseDate, a.WarrantyEndDate, a.Price,
        a.CreatedAt, a.UpdatedAt,
        COUNT(*) OVER() AS _total
      FROM appsheet_assets a
      LEFT JOIN appsheet_asset_types t ON a.TypeID = t.TypeID
      LEFT JOIN appsheet_asset_status s ON a.StatusID = s.StatusID
      LEFT JOIN appsheet_employees e ON a.AssignedTo = e.EmployeeID
      LEFT JOIN appsheet_departments d ON e.DepartmentID = d.DepartmentID
      LEFT JOIN appsheet_branches b ON a.BranchID = b.BranchID
      LEFT JOIN appsheet_branch_storage_locations loc ON a.StorageLocationID = loc.StorageLocationID
      WHERE ${where}
      ORDER BY TRY_CAST(a.AssetID AS int) DESC, a.AssetID DESC
      OFFSET @offset ROWS FETCH NEXT @perPage ROWS ONLY
    `),
    getAppsheetFilters(),
  ])

  const total = dataResult.recordset[0]?._total || 0

  return {
    data: dataResult.recordset,
    meta: {
      current_page: page,
      last_page: Math.ceil(total / perPage) || 1,
      total,
      per_page: perPage,
    },
    filters,
  }
})
