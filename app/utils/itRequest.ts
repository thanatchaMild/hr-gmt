import { IT_REQUEST_TYPES } from './itRequestTypes'

export const PRIORITIES = [
  { code: 'NORMAL', label: 'ปกติ' },
  { code: 'URGENT', label: 'ด่วน' },
  { code: 'CRITICAL', label: 'ด่วนมาก' }
] as const

export type ITRequestPriority = typeof PRIORITIES[number]['code']

const PRIORITY_LABELS: Record<string, string> = Object.fromEntries(PRIORITIES.map(p => [p.code, p.label]))

export function priorityLabel(code?: string | null): string {
  if (!code) return ''
  return PRIORITY_LABELS[code] ?? code
}

// StatusBadge colour name per priority.
export function priorityBadgeColor(code?: string | null): 'green' | 'yellow' | 'red' {
  if (code === 'CRITICAL') return 'red'
  if (code === 'URGENT') return 'yellow'
  return 'green'
}

export interface RequestedItem {
  category: string
  name: string
  quantity: number
  note: string
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  IT_REQUEST_TYPES.map(t => [t.id, t.name])
)

export function categoryLabel(id?: string | null): string {
  if (!id) return ''
  return CATEGORY_LABELS[id] ?? id
}

function isStructuredItem(item: unknown): item is RequestedItem {
  return !!item && typeof item === 'object' && 'name' in (item as Record<string, unknown>)
}

// Human-readable one-liner for a request's items — accepts the legacy string[] shape
// and the new structured shape.
export function formatRequestedItems(items?: Array<string | RequestedItem> | null): string {
  if (!items?.length) return '-'
  return items
    .map(item => {
      if (typeof item === 'string') return item
      if (isStructuredItem(item)) {
        const qty = item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ''
        return `${item.name || categoryLabel(item.category)}${qty}`
      }
      return String(item)
    })
    .filter(Boolean)
    .join(', ')
}

// Normalises a request's items to the structured shape for table display.
export function toStructuredItems(items?: Array<string | RequestedItem> | null): RequestedItem[] {
  if (!items?.length) return []
  return items.map(item =>
    typeof item === 'string'
      ? { category: '', name: item, quantity: 1, note: '' }
      : { category: item.category || '', name: item.name || '', quantity: item.quantity || 1, note: item.note || '' }
  )
}
