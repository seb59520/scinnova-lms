// Types pour les documents à compléter

export interface FillableDocument {
  id: string
  course_id: string
  title: string
  description: string | null
  template_file_path: string
  template_file_name: string
  template_file_size: number | null
  template_file_type: string | null
  is_required: boolean
  due_date: string | null
  allow_multiple_submissions: boolean
  order_index: number
  published: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export type SubmissionStatus = 'submitted' | 'reviewed' | 'approved' | 'rejected'

export interface FillableDocumentSubmission {
  id: string
  fillable_document_id: string
  user_id: string
  session_id: string | null
  submitted_file_path: string
  submitted_file_name: string
  submitted_file_size: number | null
  submitted_file_type: string | null
  status: SubmissionStatus
  feedback: string | null
  score: number | null
  reviewed_by: string | null
  reviewed_at: string | null
  submitted_at: string
  updated_at: string
}

// Types pour les formulaires
export interface FillableDocumentFormData {
  title: string
  description: string
  templateFile: File | null
  is_required: boolean
  due_date: string | null
  allow_multiple_submissions: boolean
  published: boolean
}
