export interface AdminCommandItem {
  id: string
  label: string
  description: string
  category: string
  keywords: string[]
  icon: string
  to?: string
  action?: 'refresh' | 'export-properties' | 'export-users' | 'export-bookings' | 'export-payments'
}
