export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')

  const id = getRouterParam(event, 'id')
  const db = await getAppsheetDb()

  const assetResult = await db.request()
    .input('id', id)
    .query(`
      SELECT
        a.*,
        t.TypeName,
        s.StatusName,
        e.FullName AS AssignedToName, e.Nickname, e.PositionTitle, e.Email AS EmployeeEmail,
        b.BranchName,
        loc.LocationName,
        cb.BranchName AS CurrentBranchName,
        cloc.LocationName AS CurrentLocationName,
        ce.FullName AS CurrentEmployeeName,
        d.DepartmentName
      FROM appsheet_assets a
      LEFT JOIN appsheet_asset_types t ON a.TypeID = t.TypeID
      LEFT JOIN appsheet_asset_status s ON a.StatusID = s.StatusID
      LEFT JOIN appsheet_employees e ON a.AssignedTo = e.EmployeeID
      LEFT JOIN appsheet_departments d ON e.DepartmentID = d.DepartmentID
      LEFT JOIN appsheet_branches b ON a.BranchID = b.BranchID
      LEFT JOIN appsheet_branch_storage_locations loc ON a.StorageLocationID = loc.StorageLocationID
      LEFT JOIN appsheet_branches cb ON a.CurrentBranchID = cb.BranchID
      LEFT JOIN appsheet_branch_storage_locations cloc ON a.CurrentLocationID = cloc.StorageLocationID
      LEFT JOIN appsheet_employees ce ON a.CurrentEmployeeID = ce.EmployeeID
      WHERE a.AssetID = @id
    `)

  if (!assetResult.recordset.length) {
    throw createError({ statusCode: 404, statusMessage: 'Asset not found' })
  }

  const asset = assetResult.recordset[0]

  const [licensesResult, transfersResult, transactionsResult] = await Promise.all([
    db.request().input('id', id).query(`
      SELECT l.*, s.SKUCode, s.SKUName
      FROM appsheet_asset_licenses l
      LEFT JOIN appsheet_skus s ON l.SKUID = s.SKUID
      WHERE l.AssetID = @id
      ORDER BY l.ExpireDate DESC
    `),
    db.request().input('id', id).query(`
      SELECT
        tr.*,
        fb.BranchName AS FromBranchName,
        tb.BranchName AS ToBranchName,
        tl.LocationName AS ToLocationName,
        fe.FullName AS FromEmployeeName,
        te.FullName AS ToEmployeeName,
        -- most rows never recorded FromEmployeeID/FromBranchID, so infer them from the previous transfer of the same asset
        LAG(te.FullName) OVER (PARTITION BY tr.AssetID ORDER BY tr.TransferDate, tr.TransferID) AS PrevEmployeeName,
        LAG(tb.BranchName) OVER (PARTITION BY tr.AssetID ORDER BY tr.TransferDate, tr.TransferID) AS PrevBranchName
      FROM appsheet_asset_transfers tr
      LEFT JOIN appsheet_branches fb ON tr.FromBranchID = fb.BranchID
      LEFT JOIN appsheet_branches tb ON tr.ToBranchID = tb.BranchID
      LEFT JOIN appsheet_branch_storage_locations tl ON tr.ToLocationID = tl.StorageLocationID
      LEFT JOIN appsheet_employees fe ON tr.FromEmployeeID = fe.EmployeeID
      LEFT JOIN appsheet_employees te ON tr.ToEmployeeID = te.EmployeeID
      WHERE tr.AssetID = @id
      ORDER BY tr.TransferDate DESC
    `),
    db.request().input('id', id).query(`
      SELECT tx.*, e.FullName AS EmployeeName
      FROM appsheet_asset_transactions tx
      LEFT JOIN appsheet_employees e ON tx.EmployeeID = e.EmployeeID
      WHERE tx.AssetID = @id
      ORDER BY tx.TransactionDate DESC
    `),
  ])

  return {
    asset,
    licenses: licensesResult.recordset,
    transfers: transfersResult.recordset,
    transactions: transactionsResult.recordset,
    relatedRequests: await findRelatedRequests(id),
  }
})

// myapp IT asset requests whose lines were matched to this AppSheet asset.
// Returns null when gypman-tech is unreachable or not yet migrated (no appsheet_asset_id column).
async function findRelatedRequests(assetId: string | undefined) {
  const numericId = parseInt(String(assetId))
  if (!Number.isFinite(numericId)) return []
  try {
    const db = await getGypmanDb()
    const result = await db.request().input('id', numericId).query(`
      SELECT h.id, h.doc_no, h.request_type, h.status, h.requested_for_name, h.department, h.created_at,
             l.item_name, l.it_line_status
      FROM it_asset_request_lines l
      JOIN it_asset_request_headers h ON h.id = l.header_id
      WHERE l.appsheet_asset_id = @id
      ORDER BY h.created_at DESC
    `)
    return result.recordset
  } catch {
    return null
  }
}
