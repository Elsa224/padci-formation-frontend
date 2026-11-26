/**
 * PADCI-API response envelope (see `app/Modules/Shared/Http/ApiResponse.php`
 * and `ApiExceptionRenderer` on the backend) - every endpoint returns one of
 * these two shapes, never a bare payload.
 */
/** Present on `meta` only when `data` was a paginator (`ApiResponse::pagination`). */
export interface ApiPaginationMeta {
  current_page: number
  per_page: number
  from: number | null
  to: number | null
  total?: number
  last_page?: number
}

export interface ApiMeta {
  request_id: string
  timestamp: string
  pagination?: ApiPaginationMeta
}

export interface ApiSuccess<T> {
  success: true
  message: string | null
  data: T
  meta: ApiMeta
}

export interface ApiFailure {
  success: false
  message: string
  error: {
    code: string
    details: Record<string, unknown> | null
  }
  meta: ApiMeta
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure

export interface EquipmentRequirements {
  min_cpu?: string
  min_ram_gb?: number
  min_storage_gb?: number
  notes?: string | null
}

export interface Pathway {
  id: number
  key: string
  code: string
  name: string
  slug: string
  description: string | null
  equipment_requirements?: EquipmentRequirements | null
  requires_equipment_validation?: boolean
  icon?: string | null
  position?: number
  is_active?: boolean
  programme?: {
    id: number
    key: string
    code: string
    name: string
  } | null
  courses_count?: number
  cohorts_count?: number
  open_cohorts_count?: number
  available_cohorts_count?: number
  created_at?: string
  updated_at?: string
}

export interface Cohort {
  id: number
  key: string
  code: string
  name: string
  session?: string | null
  capacity: number
  enrolled_count: number
  available_seats: number
  is_full: boolean
  starts_at: string | null
  ends_at: string | null
  offline_starts_at?: string | null
  offline_ends_at?: string | null
  status?: string
  pathway_id?: number
  created_at?: string
  updated_at?: string
}

export interface PublicCohort {
  id: number
  key: string
  code: string
  name: string
  session?: string | null
  capacity: number
  enrolled_count: number
  available_seats: number
  is_full: boolean
  starts_at: string | null
  ends_at: string | null
  offline_starts_at?: string | null
  offline_ends_at?: string | null
  status?: string
  available: boolean
}
