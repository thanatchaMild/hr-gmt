// Transfer history across all assets (AppSheet DB, read-only).
// Query: page, search (asset code / employee name / note), branch_id, include_initial=1 (also show "เพิ่มข้อมูลครั้งแรก" rows).
export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page || '1')))
  const perPage = 20
  const search = String(query.search || '').trim()
  const branchId = parseInt(String(query.branch_id ?? ''))
  const includeInitial = query.include_initial === '1'

  const conditions: string[] = []
  const req = (await getAppsheetDb()).request()

  if (!includeInitial) conditions.push(`ISNULL(x.Note, N'') <> N'เพิ่มข้อมูลครั้งแรก'`)
  if (search) {
    conditions.push(`(x.AssetTag LIKE @search OR x.MachineNumber LIKE @search OR x.ToEmployeeName LIKE @search
      OR x.FromName LIKE @search OR x.Note LIKE @search)`)
    req.input('search', `%${search}%`)
  }
  if (Number.isFinite(branchId)) {
    conditions.push('(x.ToBranchID = @branchId OR x.FromBranchIDResolved = @branchId)')
    req.input('branchId', branchId)
  }
  req.input('offset', (page - 1) * perPage)
  req.input('perPage', perPage)

  // The CTE computes the inferred "from" (previous holder) over the full history before any filtering.
  const result = await req.query(`
    WITH x AS (
      SELECT
        tr.TransferID, tr.AssetID, tr.TransferDate, tr.Note, tr.CreatedBy, tr.ToBranchID,
        a.AssetTag, a.MachineNumber, t.TypeName,
        te.FullName AS ToEmployeeName, tb.BranchName AS ToBranchName, tl.LocationName AS ToLocationName,
        COALESCE(fe.FullName, LAG(te.FullName) OVER (PARTITION BY tr.AssetID ORDER BY tr.TransferDate, tr.TransferID)) AS FromName,
        COALESCE(fb.BranchName, LAG(tb.BranchName) OVER (PARTITION BY tr.AssetID ORDER BY tr.TransferDate, tr.TransferID)) AS FromBranchName,
        COALESCE(tr.FromBranchID, LAG(tr.ToBranchID) OVER (PARTITION BY tr.AssetID ORDER BY tr.TransferDate, tr.TransferID)) AS FromBranchIDResolved
      FROM appsheet_asset_transfers tr
      LEFT JOIN appsheet_assets a ON a.AssetID = tr.AssetID
      LEFT JOIN appsheet_asset_types t ON a.TypeID = t.TypeID
      LEFT JOIN appsheet_employees te ON tr.ToEmployeeID = te.EmployeeID
      LEFT JOIN appsheet_employees fe ON tr.FromEmployeeID = fe.EmployeeID
      LEFT JOIN appsheet_branches tb ON tr.ToBranchID = tb.BranchID
      LEFT JOIN appsheet_branches fb ON tr.FromBranchID = fb.BranchID
      LEFT JOIN appsheet_branch_storage_locations tl ON tr.ToLocationID = tl.StorageLocationID
    )
    SELECT x.*, COUNT(*) OVER() AS _total
    FROM x
    ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
    ORDER BY x.TransferDate DESC, x.TransferID DESC
    OFFSET @offset ROWS FETCH NEXT @perPage ROWS ONLY
  `)

  const total = result.recordset[0]?._total || 0
  return {
    data: result.recordset,
    meta: { current_page: page, last_page: Math.ceil(total / perPage) || 1, total, per_page: perPage },
    filters: { branches: (await getAppsheetFilters()).branches },
  }
})
