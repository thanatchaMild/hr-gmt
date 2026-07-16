export type Role = 'HR_ADMIN' | 'IT_ADMIN'
export type PermissionScope = 'ALL' | 'DAILY_ONLY' | 'MONTHLY_ONLY'
export type EmployeeType = 'DAILY' | 'MONTHLY'
export type EmployeeStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'OFFBOARDED'
export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
export type RequestType = 'ONBOARDING' | 'OFFBOARDING'
export type AssetStatus = 'IN_STOCK' | 'ASSIGNED' | 'MAINTENANCE'

export interface User {
  id: string
  username: string
  name: string
  email: string
  passwordHash: string
  role: Role
  permissionsScope: PermissionScope
}

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  employeeType: EmployeeType
  status: EmployeeStatus
  employeeCode: string | null
  department: string | null
  managerName: string | null
  pdpaConsent: boolean
  pdpaConsentDate: Date | null
  formData: any // Detailed JSON for the full onboarding form
  startDate: Date | null
  probationDate: Date | null
  contractEndDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Document {
  id: string
  employeeId: string
  documentType: string
  fileUrl: string
  uploadedAt: Date
}

export interface ITRequest {
  id: string
  employeeId: string | null
  employeeName: string
  type: RequestType
  status: RequestStatus
  requestedItems: string[]
  requestType: string | null
  department: string | null
  approver: string | null
  notes: string | null
  requestedBy: string | null // HR Admin who requested, or null if self
  createdAt: Date
  updatedAt: Date
}

export interface AssetCategory {
  id: string
  name: string
  code: string
  status: string
}

export interface Asset {
  id: string
  assetTag: string
  assetType: string
  categoryId: string | null
  status: AssetStatus
  assignedTo: string | null // employeeId
  department: string | null
}
