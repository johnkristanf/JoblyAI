export type ResumeFile = {
    id: number;
    fileName: string;
    file: File;
    previewImgUrl?: string;
  };


export type ResumeData = {
  id: string;
  name: string;
  uploadDate: string | null;
  url: string;
  objectKey: string;
};