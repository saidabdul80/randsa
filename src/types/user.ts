import type { AgentVerificationStatus } from './verification'

export type UserRole = 'tenant' | 'landlord' | 'agent' | 'admin'

export type VerificationStatus = 'not_submitted' | AgentVerificationStatus

export interface UserProfile {
  uid: string
  fullName: string
  email: string
  phone: string
  role: UserRole
  photoURL: string
  isVerifiedAgent: boolean
  verificationStatus: VerificationStatus
  createdAt: unknown
}

export interface SessionUser {
  uid: string
  email: string | null
  displayName: string | null
}

export interface RegisterPayload {
  fullName: string
  email: string
  phone: string
  password: string
  role: Exclude<UserRole, 'admin'>
}

export interface ProfileCompletionPayload {
  fullName: string
  phone: string
}
