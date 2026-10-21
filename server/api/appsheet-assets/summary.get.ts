// Overview numbers for the IT asset dashboard (AppSheet DB, read-only).
const ATTENTION_STATUSES = ['ชำรุด', 'ซ่อมบำรุง', 'สูญหาย']

export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')

  const db = await getAppsheetDb()

  const listColumns = `
    a.AssetID, a.AssetTag, a.MachineNumber, a.AssetName, a.Brand, t.TypeName, s.StatusName,
    e.FullName AS AssignedToName, b.BranchName, a.WarrantyEndDate, a.UpdatedAt`
  const listJoins = `
    FROM appsheet_assets a
    LEFT JOIN appsheet_asset_types t ON a.TypeID = t.TypeID
    LEFT JOIN appsheet_asset_status s ON a.StatusID = s.StatusID
    LEFT JOIN appsheet_employees e ON a.AssignedTo = e.EmployeeID
    LEFT JOIN appsheet_branches b ON a.BranchID = b.BranchID`

  const attentionReq = db.request()
  ATTENTION_STATUSES.forEach((name, i) => attentionReq.input(`st${i}`, name))
  const attentionIn = ATTENTION_STATUSES.map((_, i) => `@st${i}`).join(', ')

  const [totals, byStatus, byType, byBranch, expiring, attention] = await Promise.all([
    db.request().query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN a.AssignedTo IS NULL THEN 1 ELSE 0 END) AS unassigned,
        SUM(CASE WHEN a.WarrantyEndDate >= CAST(GETDATE() AS date)
                  AND a.WarrantyEndDate < DATEADD(day, 90, CAST(GETDATE() AS date)) THEN 1 ELSE 0 END) AS warrantyExpiring,
        SUM(CASE WHEN a.WarrantyEndDate < CAST(GETDATE() AS date) THEN 1 ELSE 0 END) AS warrantyExpired,
        SUM(ISNULL(a.Price, 0)) AS totalValue
      FROM appsheet_assets a
      WHERE a.deleted_at IS NULL
    `),
    db.request().query(`
      SELECT ISNULL(a.StatusID, 0) AS StatusID, ISNULL(s.StatusName, N'ไม่ระบุ') AS StatusName, COUNT(*) AS n
      FROM appsheet_assets a
      LEFT JOIN appsheet_asset_status s ON a.StatusID = s.StatusID
      WHERE a.deleted_at IS NULL
      GROUP BY ISNULL(a.StatusID, 0), ISNULL(s.StatusName, N'ไม่ระบุ')
      ORDER BY StatusID
    `),
    db.request().query(`
      SELECT a.TypeID, ISNULL(t.TypeName, N'ไม่ระบุ') AS TypeName, COUNT(*) AS n
      FROM appsheet_assets a
      LEFT JOIN appsheet_asset_types t ON a.TypeID = t.TypeID
      WHERE a.deleted_at IS NULL
      GROUP BY a.TypeID, t.TypeName
      ORDER BY n DESC
    `),
    db.request().query(`
      SELECT a.BranchID, ISNULL(b.BranchName, N'ไม่ระบุ') AS BranchName, COUNT(*) AS n
      FROM appsheet_assets a
      LEFT JOIN appsheet_branches b ON a.BranchID = b.BranchID
      WHERE a.deleted_at IS NULL
      GROUP BY a.BranchID, b.BranchName
      ORDER BY n DESC
    `),
    db.request().query(`
      SELECT TOP 10 ${listColumns} ${listJoins}
      WHERE a.deleted_at IS NULL
        AND a.WarrantyEndDate >= CAST(GETDATE() AS date)
        AND a.WarrantyEndDate < DATEADD(day, 90, CAST(GETDATE() AS date))
      ORDER BY a.WarrantyEndDate
    `),
    attentionReq.query(`
      SELECT TOP 20 ${listColumns} ${listJoins}
      WHERE a.deleted_at IS NULL AND s.StatusName IN (${attentionIn})
      ORDER BY a.UpdatedAt DESC
    `),
  ])

  return {
    totals: totals.recordset[0],
    byStatus: byStatus.recordset,
    byType: byType.recordset,
    byBranch: byBranch.recordset,
    warrantyExpiring: expiring.recordset,
    attention: attention.recordset,
  }
})
