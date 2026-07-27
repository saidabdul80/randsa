export type AgentVerificationStatus = 'pending' | 'approved' | 'rejected'

export interface VerificationAsset {
  id: string
  name: string
  mimeType: string
  size: number
  previewUrl: string
  remoteUrl: string | null
  file: File | null
  source: 'local' | 'remote'
}

export interface AgentVerificationFormInput {
  fullName: string
  phone: string
  whatsappNumber: string
  officeAddress: string
  profilePhoto: VerificationAsset | null
  idDocument: VerificationAsset | null
  cacDocument: VerificationAsset | null
  authorizationDocument: VerificationAsset | null
}

export interface AgentVerificationRecord {
  id: string
  agentId: string
  fullName: string
  phone: string
  whatsappNumber: string
  officeAddress: string
  profilePhoto: VerificationAsset
  idDocument: VerificationAsset
  cacDocument: VerificationAsset | null
  authorizationDocument: VerificationAsset
  status: AgentVerificationStatus
  adminNote: string
  submittedAt: string
  reviewedAt: string | null
}

export function createEmptyAgentVerificationForm(): AgentVerificationFormInput {
  return {
    fullName: '',
    phone: '',
    whatsappNumber: '',
    officeAddress: '',
    profilePhoto: null,
    idDocument: null,
    cacDocument: null,
    authorizationDocument: null,
  }
}

export function formatVerificationStatusLabel(status: 'not_submitted' | AgentVerificationStatus) {
  return status.replace(/_/g, ' ')
}

export function createRemoteVerificationAsset(url: string, fallbackName = 'verification-file') {
  const fileName = (() => {
    try {
      const parsedUrl = new URL(url)
      const pathname = decodeURIComponent(parsedUrl.pathname)
      return pathname.split('/').filter(Boolean).pop() ?? fallbackName
    } catch {
      return fallbackName
    }
  })()

  return {
    id: `remote-${crypto.randomUUID()}`,
    name: fileName,
    mimeType: 'application/octet-stream',
    size: 0,
    previewUrl: url,
    remoteUrl: url,
    file: null,
    source: 'remote' as const,
  }
}

export function normalizeVerificationAsset(asset: VerificationAsset): VerificationAsset {
  const remoteUrl = asset.remoteUrl ?? (asset.source === 'remote' ? asset.previewUrl : null)
  const hasStaleBlobPreview = asset.previewUrl.startsWith('blob:')

  return {
    ...asset,
    previewUrl:
      asset.source === 'remote' || (hasStaleBlobPreview && remoteUrl)
        ? (remoteUrl ?? '')
        : asset.previewUrl,
    remoteUrl,
    file: asset.source === 'remote' ? null : asset.file,
  }
}

export function normalizeVerificationRecord(
  record: AgentVerificationRecord
): AgentVerificationRecord {
  return {
    ...record,
    profilePhoto: normalizeVerificationAsset(record.profilePhoto),
    idDocument: normalizeVerificationAsset(record.idDocument),
    cacDocument: record.cacDocument ? normalizeVerificationAsset(record.cacDocument) : null,
    authorizationDocument: normalizeVerificationAsset(record.authorizationDocument),
  }
}
