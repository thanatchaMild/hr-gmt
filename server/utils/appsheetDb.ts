import type sql from 'mssql'

let filterCache: { types: any[]; statuses: any[]; branches: any[]; departments: any[] } | null = null
let filterCacheTime = 0

// AppSheet IT asset database (appsheetdb) — still used by the legacy AppSheet app, so treat as read-only.
export function getAppsheetDb(): Promise<sql.ConnectionPool> {
  return getMssqlPool('APPSHEET', 'AppSheet')
}

// myapp's imported `employees` table when it exists, otherwise AppSheet's own appsheet_employees.
export async function employeeSource(db: sql.ConnectionPool): Promise<'employees' | 'appsheet_employees'> {
  const result = await db.request().query(`SELECT OBJECT_ID(N'dbo.employees', N'U') AS id`)
  return result.recordset[0]?.id ? 'employees' : 'appsheet_employees'
}

export async function getAppsheetFilters() {
  const now = Date.now()
  if (filterCache && now - filterCacheTime < 5 * 60 * 1000) return filterCache

  const db = await getAppsheetDb()
  const [types, statuses, branches, departments] = await Promise.all([
    db.request().query('SELECT TypeID, TypeName FROM appsheet_asset_types ORDER BY TypeName'),
    db.request().query('SELECT StatusID, StatusName FROM appsheet_asset_status ORDER BY StatusID'),
    db.request().query('SELECT BranchID, BranchName FROM appsheet_branches ORDER BY BranchName'),
    db.request().query('SELECT DepartmentID, DepartmentName FROM appsheet_departments ORDER BY DepartmentName'),
  ])

  filterCache = {
    types: types.recordset,
    statuses: statuses.recordset,
    branches: branches.recordset,
    departments: departments.recordset,
  }
  filterCacheTime = now
  return filterCache
}
