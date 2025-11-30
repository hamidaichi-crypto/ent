// Type Imports
export type MemberType = {
  id: number
  campaign_code: string | null
  campaign_id: number | null
  campaign_name: string | null
  username: string
  merchant_name: string
  username_merchant: string
  status: number
  date_of_birth: string | null
  name: string
  score?: number // Optional as it's not in the new object
  grade?: string // Optional as it's not in the new object
  email: string
  mobile: string
  member_group_id: number
  kyc_progression: string
  status_name: string
  referrer: string | null
  registration_created_at: string
  registration_site: string
  registration_ip: string
  created_at: string
  remark?: string // Optional as it's not in the new object
  site_id: number
  type: number
  type_name: string
  email_status: number
  gender: number
  vip_birthday_bonus_status: number
  vip_birthday_bonus_message: string
  gender_name: string
  mobile_status: number
  currency_id: number
  currency: string
  group: string
  color: string
  agent_id: number | null
  last_deposit: string | null
  suspicious: number
  dummy: number
  registration_locale_code: string
  last_login: string | null
  last_ip_address: string | null
  last_domain: string | null
  updated_at: string
  updated_by: string
  labels: string[] | null
  member_group?: string // from UserDetailModal usage
  vip_progress?: number // from UserDetailModal usage
  register_ip?: string // from UserDetailModal usage
  register_date?: string // from UserDetailModal usage
  register_domain?: string // from UserDetailModal usage
  register_locales?: string // from UserDetailModal usage
  last_login_ip?: string // from UserDetailModal usage
  last_login_date?: string // from UserDetailModal usage
  last_login_domain?: string // from UserDetailModal usage
  last_login_locales?: string // from UserDetailModal usage
  kyc_status?: string // from UserDetailModal usage
  remarks?: string | null // from UserDetailModal usage
  agents_name?: string | null // from UserDetailModal usage
  affiliate_username?: string | null // from UserDetailModal usage
}

export type Pagination = {
  current_page: number
  from: number
  last_page: number
  per_page: string
  to: number
  total: number
}
