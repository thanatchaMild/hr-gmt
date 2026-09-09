type Severity = 'info' | 'warning' | 'urgent' | 'overdue'

interface Alert {
  id: string
  type: 'PROBATION_WARNING' | 'CONTRACT_WARNING' | 'TENURE_MILESTONE'
  severity: Severity
  message: string
  employeeId: number
  createdAt: string
  read: false
}

const DAY = 86_400_000

function wholeDaysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY)
}

// Tenure milestones for รายเดือน, measured from the start date. Each stays visible
// for two weeks after it is reached.
const TENURE_MILESTONES = [
  { days: 90, label: 'ครบ 90 วัน' },
  { days: 119, label: 'ครบ 119 วัน' },
  { days: 365, label: 'ครบ 1 ปี' },
  { days: 730, label: 'ครบ 2 ปี' }
]
const MILESTONE_VISIBLE_FOR = 13

// Deadline warning (probation date / contract end date): show from 30 days out
// until 30 days overdue, with an escalating severity.
function deadlineTier(daysUntil: number): { severity: Severity; phrase: string } | null {
  if (daysUntil > 30 || daysUntil < -30) return null
  if (daysUntil > 7) return { severity: 'info', phrase: 'ภายใน 1 เดือน' }
  if (daysUntil > 3) return { severity: 'warning', phrase: 'ภายใน 7 วัน' }
  if (daysUntil > 0) return { severity: 'urgent', phrase: 'ภายใน 3 วัน' }
  if (daysUntil === 0) return { severity: 'urgent', phrase: 'วันนี้' }
  return { severity: 'overdue', phrase: `เลยกำหนดมาแล้ว ${-daysUntil} วัน` }
}

export default defineEventHandler(async (event) => {
  await requireRole(event, 'HR_ADMIN')

  const employees = await prisma.employee.findMany({
    where: { status: 'APPROVED' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeType: true,
      hireType: true,
      startDate: true,
      probationDate: true,
      contractEndDate: true
    }
  })

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const nowIso = now.toISOString()
  const alerts: Alert[] = []

  for (const emp of employees) {
    const name = `${emp.firstName} ${emp.lastName}`
    const dateField = hireTypeDateField(emp.hireType ?? emp.employeeType)

    // 1. Deadline warning on the relevant date field.
    const deadline = dateField === 'probation' ? emp.probationDate
      : dateField === 'contract' ? emp.contractEndDate
        : null

    if (deadline) {
      const daysUntil = wholeDaysBetween(today, new Date(
        deadline.getFullYear(), deadline.getMonth(), deadline.getDate()
      ))
      const tier = deadlineTier(daysUntil)
      if (tier) {
        const what = dateField === 'probation' ? 'ครบกำหนดทดลองงาน' : 'สัญญาจ้างหมดอายุ'
        alerts.push({
          id: `${dateField}-${emp.id}`,
          type: dateField === 'probation' ? 'PROBATION_WARNING' : 'CONTRACT_WARNING',
          severity: tier.severity,
          message: `${name} ${what} ${tier.phrase} (${deadline.toISOString().slice(0, 10)})`,
          employeeId: emp.id,
          createdAt: nowIso,
          read: false
        })
      }
    }

    // 2. Tenure milestones — รายเดือน only.
    if (dateField === 'probation' && emp.startDate) {
      const daysWorked = wholeDaysBetween(new Date(
        emp.startDate.getFullYear(), emp.startDate.getMonth(), emp.startDate.getDate()
      ), today)
      for (const m of TENURE_MILESTONES) {
        if (daysWorked >= m.days && daysWorked <= m.days + MILESTONE_VISIBLE_FOR) {
          alerts.push({
            id: `tenure-${emp.id}-${m.days}`,
            type: 'TENURE_MILESTONE',
            severity: 'info',
            message: `${name} ทำงาน${m.label} (เริ่มงาน ${emp.startDate.toISOString().slice(0, 10)})`,
            employeeId: emp.id,
            createdAt: nowIso,
            read: false
          })
        }
      }
    }
  }

  // Most urgent first.
  const rank: Record<Severity, number> = { overdue: 0, urgent: 1, warning: 2, info: 3 }
  alerts.sort((a, b) => rank[a.severity] - rank[b.severity])

  return { alerts }
})
