import type sql from 'mssql'

// myapp's main database (gypman-tech): IT asset requests (it_asset_request_*), catalog items, users, devs.
export function getGypmanDb(): Promise<sql.ConnectionPool> {
  return getMssqlPool('GYPMAN', 'myapp (gypman-tech)')
}

// Column sets per table, so queries can adapt when a database lags behind myapp's migrations
// (e.g. the dev copy has no emp_code / it_line_status / attachments.category yet).
const columnCache = new Map<string, { at: number; cols: Set<string> }>()

export async function gypmanColumns(table: string): Promise<Set<string>> {
  const hit = columnCache.get(table)
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.cols
  const db = await getGypmanDb()
  const result = await db.request().input('t', table)
    .query('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @t')
  const cols = new Set<string>(result.recordset.map((r: any) => r.COLUMN_NAME))
  columnCache.set(table, { at: Date.now(), cols })
  return cols
}
