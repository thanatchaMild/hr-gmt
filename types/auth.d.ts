declare module '#auth-utils' {
  interface User {
    id: string
    username: string
    name: string
    email: string
    role: 'HR_ADMIN' | 'IT_ADMIN'
    permissionsScope: 'ALL' | 'DAILY_ONLY' | 'MONTHLY_ONLY'
  }
}

export {}
