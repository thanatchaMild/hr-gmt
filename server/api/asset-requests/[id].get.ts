// One myapp IT asset request with its lines, attachments and MEMO (gypman-tech, read-only).
export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')

  const id = parseInt(String(getRouterParam(event, 'id')))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  const db = await getGypmanDb()
  const userName = (col: string, alias: string) => `(SELECT name FROM users WHERE id = h.${col}) AS ${alias}`

  const headerResult = await db.request().input('id', id).query(`
    SELECT h.*,
      ${userName('created_by', 'creator_name')},
      ${userName('it_reviewed_by', 'it_reviewer_name')},
      ${userName('assigned_by', 'assigned_by_name')},
      ${userName('closed_by', 'closed_by_name')}
    FROM it_asset_request_headers h
    WHERE h.id = @id AND h.deleted_at IS NULL
  `)
  const header = headerResult.recordset[0]
  if (!header) throw createError({ statusCode: 404, statusMessage: 'ไม่พบคำขอ' })

  const [lines, attachments, memos] = await Promise.all([
    db.request().input('id', id).query(`
      SELECT l.*, c.name AS catalog_item_name
      FROM it_asset_request_lines l
      LEFT JOIN it_asset_catalog_items c ON c.id = l.catalog_item_id
      WHERE l.header_id = @id AND l.deleted_at IS NULL
      ORDER BY l.line_no, l.id
    `),
    db.request().input('id', id).query(`
      SELECT a.*, (SELECT name FROM users WHERE id = a.uploaded_by) AS uploader_name
      FROM it_asset_request_attachments a
      WHERE a.header_id = @id AND a.deleted_at IS NULL
      ORDER BY a.created_at
    `),
    db.request().input('id', id).query(`
      SELECT m.* FROM it_asset_request_memos m WHERE m.header_id = @id ORDER BY m.id DESC
    `),
  ])

  for (const line of lines.recordset) {
    try {
      line.form_data = line.form_data ? JSON.parse(line.form_data) : null
    } catch {
      line.form_data = null
    }
  }

  return {
    header,
    lines: lines.recordset,
    attachments: attachments.recordset,
    memo: memos.recordset[0] || null,
    linkedAssets: await linkedAppsheetAssets(lines.recordset),
  }
})

// AppSheet assets that IT matched to the lines (appsheet_asset_id), keyed by AssetID.
// Lives in another database, so it's a separate lookup; failures just leave the labels out.
async function linkedAppsheetAssets(lines: any[]) {
  const ids = [...new Set(lines.map(l => l.appsheet_asset_id).filter((v: any) => v !== null && v !== undefined))]
  if (!ids.length) return {}
  try {
    const db = await getAppsheetDb()
    const req = db.request()
    ids.forEach((v, i) => req.input(`a${i}`, String(v)))
    const result = await req.query(`
      SELECT a.AssetID, a.AssetTag, a.MachineNumber, a.AssetName, t.TypeName
      FROM appsheet_assets a
      LEFT JOIN appsheet_asset_types t ON t.TypeID = a.TypeID
      WHERE a.AssetID IN (${ids.map((_, i) => `@a${i}`).join(', ')})
    `)
    return Object.fromEntries(result.recordset.map((a: any) => [a.AssetID, a]))
  } catch {
    return {}
  }
}
