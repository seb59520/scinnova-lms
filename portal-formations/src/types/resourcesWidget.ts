// Types pour le widget de ressources réutilisable

export type ResourceType = 'file' | 'url' | 'video' | 'document' | 'code' | 'data'

export type ResourceParentType = 'course' | 'module' | 'item'

export interface Resource {
  id: string
  course_id: string | null
  module_id: string | null
  item_id: string | null
  title: string
  description: string | null
  resource_type: ResourceType
  file_path: string | null
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  external_url: string | null
  is_required: boolean
  is_visible: boolean
  order_index: number
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ResourceFormData {
  title: string
  description: string
  resource_type: ResourceType
  file: File | null
  external_url: string
  is_required: boolean
  is_visible: boolean
}
