export type ResumeFile = {
    id: number
    fileName: string
    file: File
    previewUrl: string
}

export type TemplateId = 'modern' | 'classic' | 'bold'


export type ResumeData = {
    id: string
    name: string
    upload_date: string | null
    url: string
    objectKey: string
}

export type SelectedResume = {
    resume_id: string
    resume_source_url: string
}

export type RemoveResumeData = {
    id: string
    object_key: string
}


export interface TailoredResumeData {
  name?: string;
  contact?: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary?: string;
  skills?: string[];
  experience?: Array<{
    title?: string;
    company?: string;
    dates?: string;
    bullets?: string[];
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    dates?: string;
    details?: string;
  }>;
  certifications?: string[];
}