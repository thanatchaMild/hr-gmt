// Assets held by one AppSheet employee (appsheet_assets.AssignedTo = EmployeeID), read-only.
export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')

  const employeeId = parseInt(String(getRouterParam(event, 'employeeId')))
  if (!Number.isFinite(employeeId)) throw createError({ statusCode: 400, statusMessage: 'Invalid employee id' })

  const db = await getAppsheetDb()
  const result = await db.request().input('id', employeeId).query(`
    SELECT a.AssetID, a.AssetTag, a.MachineNumber, a.AssetName, a.Brand,
           t.TypeName, s.StatusName, b.BranchName, l.LocationName,
           a.PurchaseDate, a.WarrantyEndDate, a.Price
    FROM appsheet_assets a
    LEFT JOIN appsheet_asset_types t ON t.TypeID = a.TypeID
    LEFT JOIN appsheet_asset_status s ON s.StatusID = a.StatusID
    LEFT JOIN appsheet_branches b ON b.BranchID = a.BranchID
    LEFT JOIN appsheet_branch_storage_locations l ON l.StorageLocationID = a.StorageLocationID
    WHERE a.AssignedTo = @id AND a.deleted_at IS NULL
    ORDER BY t.TypeName, a.MachineNumber
  `)

  return { assets: result.recordset }
})
