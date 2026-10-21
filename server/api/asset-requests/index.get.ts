// IT asset requests made in myapp, read straight from gypman-tech (read-only).
// Query: page, status, request_type, department_id, search, date_from, date_to,
//        queue=1 (myapp's "รายการขอทรัพย์สิน ที่มีการยืนยันมาแล้ว": everything except drafts).
const PER_PAGE = 15

export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page || '1')))
  const str = (key: string) => String(query[key] ?? '').trim()
  const queue = query.queue === '1'

  const db = await getGypmanDb()
  const attachmentCols = await gypmanColumns('it_asset_request_attachments')

  // Filters shared by the page query and the per-status counts; the status filter is applied separately
  // so the status chips still show every status's count.
  const conditions: string[] = ['h.deleted_at IS NULL']
  const inputs: Record<string, any> = {}
  if (queue) conditions.push(`h.status <> 'draft'`)
  if (str('request_type')) { conditions.push('h.request_type = @requestType'); inputs.requestType = str('request_type') }
  const departmentId = parseInt(str('department_id'))
  if (Number.isFinite(departmentId)) { conditions.push('h.department_id = @departmentId'); inputs.departmentId = departmentId }
  if (str('date_from')) { conditions.push('CAST(h.created_at AS date) >= @dateFrom'); inputs.dateFrom = str('date_from') }
  if (str('date_to')) { conditions.push('CAST(h.created_at AS date) <= @dateTo'); inputs.dateTo = str('date_to') }
  if (str('search')) {
    conditions.push(`(h.doc_no LIKE @search OR h.department LIKE @search OR h.requested_for_name LIKE @search
      OR h.requester_employee_code LIKE @search OR u.name LIKE @search)`)
    inputs.search = `%${str('search')}%`
  }
  const baseWhere = conditions.join(' AND ')
  const statusFilter = str('status')

  // Signed-MEMO progress per request (myapp: attachments with category 'signed_memo'); needs newer columns.
  const memoSelect = attachmentCols.has('category') && attachmentCols.has('confirmed_at')
    ? `(SELECT COUNT(*) FROM it_asset_request_attachments a
         WHERE a.header_id = h.id AND a.category = 'signed_memo' AND a.deleted_at IS NULL) AS memo_count,
       (SELECT COUNT(*) FROM it_asset_request_attachments a
         WHERE a.header_id = h.id AND a.category = 'signed_memo' AND a.deleted_at IS NULL AND a.confirmed_at IS NOT NULL) AS memo_confirmed`
    : 'NULL AS memo_count, NULL AS memo_confirmed'

  const request = () => {
    const r = db.request()
    for (const [k, v] of Object.entries(inputs)) r.input(k, v)
    return r
  }

  const listReq = request()
  listReq.input('offset', (page - 1) * PER_PAGE)
  listReq.input('perPage', PER_PAGE)
  if (statusFilter) listReq.input('status', statusFilter)

  const [list, counts, departments] = await Promise.all([
    listReq.query(`
      SELECT
        h.id, h.doc_no, h.request_type, h.department, h.department_id, h.requested_for_name,
        h.priority, h.status, h.needed_date, h.created_at,
        u.name AS creator_name,
        (SELECT COUNT(*) FROM it_asset_request_lines l WHERE l.header_id = h.id AND l.deleted_at IS NULL) AS line_count,
        ${memoSelect},
        COUNT(*) OVER() AS _total
      FROM it_asset_request_headers h
      LEFT JOIN users u ON u.id = h.created_by
      WHERE ${baseWhere} ${statusFilter ? 'AND h.status = @status' : ''}
      ORDER BY h.created_at DESC, h.id DESC
      OFFSET @offset ROWS FETCH NEXT @perPage ROWS ONLY
    `),
    request().query(`
      SELECT h.status, COUNT(*) AS n,
             SUM(CASE WHEN h.priority = N'ด่วนมาก' THEN 1 ELSE 0 END) AS urgent
      FROM it_asset_request_headers h
      LEFT JOIN users u ON u.id = h.created_by
      WHERE ${baseWhere}
      GROUP BY h.status
    `),
    db.request().query(`SELECT dev_id, dev_name FROM helpdesk_devs WHERE dev_status = 1 ORDER BY dev_name`),
  ])

  const total = list.recordset[0]?._total || 0
  const byStatus: Record<string, number> = {}
  let urgentTotal = 0
  for (const row of counts.recordset) {
    byStatus[row.status] = row.n
    if (!statusFilter || row.status === statusFilter) urgentTotal += row.urgent
  }

  return {
    data: list.recordset,
    meta: { current_page: page, last_page: Math.ceil(total / PER_PAGE) || 1, total, per_page: PER_PAGE },
    counts: { byStatus, urgentTotal },
    filters: { departments: departments.recordset },
  }
})
