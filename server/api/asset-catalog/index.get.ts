// myapp's master list of requestable items (it_asset_catalog_items), with how often each was requested. Read-only.
export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')

  const db = await getGypmanDb()
  const result = await db.request().query(`
    SELECT c.id, c.name, c.active, c.created_at, c.updated_at,
      (SELECT name FROM users WHERE id = c.created_by) AS created_by_name,
      (SELECT COUNT(*) FROM it_asset_request_lines l WHERE l.catalog_item_id = c.id AND l.deleted_at IS NULL) AS usage_count
    FROM it_asset_catalog_items c
    WHERE c.deleted_at IS NULL
    ORDER BY c.active DESC, c.name
  `)

  return { items: result.recordset }
})
