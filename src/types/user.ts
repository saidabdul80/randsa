import type { AgentVerificationStatus } from './verification'

export type UserRole = 'user' | 'tenant' | 'landlord' | 'agent' | 'admin'
export type AccountStatus = 'active' | 'suspended' | 'disabled'

export type VerificationStatus = 'not_submitted' | AgentVerificationStatus

export interface UserProfile {
  uid: string
  fullName: string
  email: string
  phone: string
  location: string
  bio: string
  role: UserRole
  photoURL: string
  isVerified: boolean
  isVerifiedAgent: boolean
  verificationStatus: VerificationStatus
  accountStatus: AccountStatus
  createdAt: unknown
  updatedAt: unknown
  termsAcceptedAt: unknown
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
  acceptTerms: boolean
}

export interface ProfileCompletionPayload {
  fullName: string
  phone: string
}
