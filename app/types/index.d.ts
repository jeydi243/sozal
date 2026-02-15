import type { AvatarProps } from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface User {
  id: number
  name: string
  email: string
  avatar?: AvatarProps
  status: UserStatus
  location: string
}

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: Avatar
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}
export interface Classe {
  id: string
  table_name?: boolean
  description: string
  code: string
  name: string
  status: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export interface Lookup {
  id: string
  name: string
}

export interface Organisation {
  id: string
  nom: string
  description?: string
  code?: string
  lookup_id?: string
  status?: string
}

export interface Profil {
  id: string
  email: string
  first_name: string
  last_name: string
  user_name: string
  user_id: string
}

export interface Affectation {
  id: number
  user_id: string
  lookup_id: string
  organisation_id?: string
  created_at?: string
  start_date?: string
  end_date?: string
  lookups?: { name: string, description: string }
  organisations?: { name: string, description: string }
}
export interface Article {
  id: number
  name: string
  code: string
  description: string
  lookup_id: string
  created_at?: string
}
export interface Tarifaire {
  id: number
  name: string
  code: string
  description: string
  lookup_id: string
  organisation_id: string
}

export interface TarifaireLine {
  id: number
  tarifaire_id: number
  articles: { name: string, description: string }
  prix: number
}

export interface Patient {
  id: number
  nom: string
  code: string
  prenom: string
  postnom: string
  sexe: string
  date_naissance: string
  status: string,
  mrn: string,
  avatar: string
}
export interface PatientOrg {
  id: number
  patient_id: Patient
  organisation_id: string
  date_debut: string
  date_fin: string
}