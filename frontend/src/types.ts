export type Department = 'management' | 'it' | 'product' | 'design' | 'marketing' | 'sales' | 'hr' | 'finance' | 'operations' | 'support'

export interface MediaAsset {
  path?: string
  url?: string
  original_url?: string
  webp_url?: string
  alt?: string
}

export interface Service {
  id?: number
  slug: string
  name: string
  summary: string
  short_description?: string
  description?: string
  cover?: MediaAsset | string | null
  features?: string[]
  published?: boolean
  is_published?: boolean
  sort_order?: number
  starting_price?: { amount: number; format: 'fixed' | 'from'; currency: string }
  starting_duration?: string
  plans?: ServicePlan[]
}

export interface ServiceExtra {
  name: string
  price_label: string
  price_amount?: number | null
}

export interface DesignSelection {
  paletteCode?: string
  fontCode?: string
  styleCode?: string
}

export interface ServicePlan {
  id: number
  service_id?: number
  slug: string
  name: string
  description?: string | null
  price_amount: number
  price_format: 'fixed' | 'from'
  currency: string
  duration: string
  included_revisions?: number | null
  extra_revision_price?: number | null
  features: string[]
  extras: ServiceExtra[]
  notice?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface Project {
  slug: string
  title: string
  description: string
  category?: string
  images?: Array<MediaAsset | string>
  external_url?: string | null
}

export interface Review {
  id?: string | number
  author_name?: string
  rating: number
  text: string
  published_at?: string
}

export interface Employee {
  id?: string | number
  slug: string
  name: string
  role: string
  position?: string
  department: Department
  short_bio?: string
  activity?: string
  joined_story?: string
  company_story?: string
  experience?: string
  started_at?: string | null
  photo_url?: string
  photo?: MediaAsset | string | null
  reviews?: Review[]
  published?: boolean
}

export interface PublicContacts {
  phone?: string
  email?: string
  telegram?: string
  whatsapp?: string
  address?: string
  director_name?: string
  online_label?: string
  slogan?: string
}

export type OrderStatus = 'new' | 'briefing' | 'in_progress' | 'review' | 'completed' | 'cancelled'

export interface Order {
  id: string
  public_id?: string
  client_name: string
  service?: Service | string
  summary?: string
  brief?: Record<string, string>
  status: OrderStatus
  assignees?: Employee[]
  due_at?: string | null
  completed_at?: string | null
  client_access_active?: boolean
  created_at?: string
}

export interface Paginated<T> {
  data: T[]
  meta?: { current_page: number; last_page: number; total: number }
}

export interface SiteContent {
  hero_title?: string
  hero_text?: string
  intro_text?: string
  about_title?: string
  about_text?: string
  logo?: MediaAsset | string | null
  logo_url?: string | null
  contacts?: PublicContacts
  project_inquiry?: ProjectInquiryContact
  project_inquiry_employee_id?: number | null
  project_inquiry_name?: string | null
  project_inquiry_position?: string | null
  project_inquiry_telegram?: string | null
  project_inquiry_phone?: string | null
  project_inquiry_active?: boolean
}

export interface ProjectInquiryContact {
  employee_id?: number | null
  name?: string | null
  position?: string | null
  telegram?: string | null
  phone?: string | null
  active: boolean
}

export interface ApiErrorBody {
  message?: string
  errors?: Record<string, string[]>
}
