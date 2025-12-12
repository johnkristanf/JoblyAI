import { useMutation } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { uploadResume } from "~/lib/api/post";
import type { ResumeFile } from "~/types/resume";



function getPDFPageAsImage(file: File): Promise<string | null> {
  // Load PDF.js dynamically to avoid import trouble
  return new Promise((resolve) => {
    if (!file.name.endsWith(".pdf")) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
      // @ts-ignore
      const pdfjsLib = window["pdfjsLib"];
      if (!pdfjsLib) {
        resolve(null);
        return;
      }
      try {
        // @ts-ignore
        const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
        const page = await pdf.getPage(1);

        // Render page to canvas
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/png");
        resolve(dataUrl);
      } catch {
        resolve(null);
      }
    };
    reader.onerror = function () {
      resolve(null);
    };
    reader.readAsArrayBuffer(file);
  });
}

function ResumeCard({
  resume,
  onPreview,
}: {
  resume: ResumeFile;
  onPreview: (file: File) => void;
}) {
  return (
    <div
      className="border border-gray-200 rounded-lg mb-8 p-6 shadow-sm bg-white max-w-xl flex flex-col items-start gap-6 w-full"
    >
      <div className="bg-gray-100 flex items-center justify-center rounded-md overflow-hidden">
        {resume.previewImgUrl ? (
          <img
            src={resume.previewImgUrl}
            alt="Resume first page"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-300 text-sm text-center">
            {resume.fileName.endsWith(".pdf") ? "Loading preview..." : "No preview"}
          </span>
        )}
      </div>
      <div className="w-full flex flex-col justify-center">
        <h2 className="text-lg font-medium mb-2 text-center">{resume.fileName}</h2>
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white cursor-pointer font-bold mt-4 hover:bg-blue-700 transition"
          onClick={() => onPreview(resume.file)}
        >
          Preview
        </button>
      </div>
    </div>
  );
}


declare global {
  interface Window {
    pdfjsLib?: any;
  }
}
function usePDFJS() {
  // Attach PDF.js to window if not loaded
  useEffect(() => {
    if (!window.pdfjsLib) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.10.111/pdf.min.js";
      script.async = true;
      script.onload = function () {
        // Set workerSrc for PDF.js
        // @ts-ignore
        if (window["pdfjsLib"]) {
          // @ts-ignore
          window["pdfjsLib"].GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.10.111/pdf.worker.min.js";
        }
      };
      document.body.appendChild(script);
    }
  }, []);
}

// Upload Card component
function UploadCard({ onClick, inputRef, onChange }: {
  onClick: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-blue-50 cursor-pointer min-h-[240px] p-8 w-full transition"
      aria-label="Upload new resume"
    >
      <PlusIcon className="w-12 h-12 text-blue-500 mb-3" />
      <span className="text-blue-600 font-semibold">Add Resume</span>
      {/* Visually hidden file input */}
      <input
        type="file"
        accept="application/pdf,.doc,.docx"
        multiple
        ref={inputRef}
        onChange={onChange}
        className="hidden"
        tabIndex={-1}
        aria-label="Upload resume file input"
      />
    </div>
  );
}

export default function ResumeCardsPage() {
  usePDFJS();

  const [resumes, setResumes] = useState<ResumeFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate image preview for new PDF files
  useEffect(() => {
    resumes.forEach((resume, idx) => {
      if (
        resume.file.name.endsWith(".pdf") &&
        resume.previewImgUrl === undefined
      ) {
        getPDFPageAsImage(resume.file).then((imgUrl) => {
          setResumes((existing) => {
            const newArr = [...existing];
            if (
              newArr[idx] &&
              newArr[idx].previewImgUrl === undefined
            ) {
              // Use undefined instead of null to match the type
              newArr[idx] = { ...newArr[idx], previewImgUrl: imgUrl ?? undefined };
            }
            return newArr;
          });
        });
      }
    });
    // eslint-disable-next-line
  }, [resumes]);


  const mutation = useMutation({
        mutationFn: uploadResume,
        onSuccess: (response) => {
            console.log("response: ", response);
        },
        onError: (err: any) => {
            toast.error('Error in searching job, please try again later')
        },
    })

  const handleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const mapped: ResumeFile[] = files.map((file, idx) => ({
      id: Date.now() + Math.random() + idx,
      fileName: file.name,
      file,
    }));

    console.log("mapped: ", mapped);

    mutation.mutate(mapped)
    
    setResumes((existing) => [...existing, ...mapped]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPreviewName(file.name);
  };

  const handleClosePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewName(null);
  };

  // Handle upload card click
  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <div className="w-full min-h-screen flex flex-col p-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resume</h1>
        <h3 className="text-md text-blue-600 font-normal">
          Upload and manage your resumes below.
        </h3>
      </div>
      <div className="w-full flex flex-col items-center justify-center mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12 w-full">
          {/* Render resume cards */}
          {resumes.map((resume, idx) => (
            <React.Fragment key={resume.id}>
              <ResumeCard resume={resume} onPreview={handlePreview} />
              {/* Insert upload button next to the latest (last) uploaded resume */}
              {idx === resumes.length - 1 && (
                <UploadCard
                  onClick={triggerFileInput}
                  inputRef={fileInputRef}
                  onChange={handleFilesUpload}
                />
              )}
            </React.Fragment>
          ))}

          {/* If no resume exists, show only the upload card */}
          {resumes.length === 0 && (
            <UploadCard
              onClick={triggerFileInput}
              inputRef={fileInputRef}
              onChange={handleFilesUpload}
            />
          )}
        </div>
      </div>
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={handleClosePreview}
        >
          <div
            className="bg-white rounded-lg p-8 min-w-[320px] max-w-[80vw] max-h-[80vh] overflow-auto relative shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 bg-red-700 text-white border-none rounded px-3 py-1 text-sm cursor-pointer hover:bg-red-800"
              onClick={handleClosePreview}
            >
              Close
            </button>
            <h2 className="text-lg font-semibold mb-4">Preview: {previewName}</h2>
            {previewUrl.endsWith(".pdf") ? (
              <embed
                src={previewUrl}
                type="application/pdf"
                width="100%"
                height="500px"
                className="border border-gray-200 rounded"
              />
            ) : (
              <iframe
                src={previewUrl}
                title={previewName ?? "Resume preview"}
                width="100%"
                height="500px"
                className="border border-gray-200 rounded"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
