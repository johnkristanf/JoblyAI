import { Download } from 'lucide-react'

export function ResumeDownloadBtn({ previewRef, name }: { previewRef: React.RefObject<HTMLDivElement | null>, name: string }) {
  const handleDownload = async () => {
    if (!previewRef.current) return;
    
    // dynamically import to avoid SSR issues
    const { toJpeg } = await import('html-to-image');
    const { jsPDF } = await import('jspdf');
    
    try {
      const dataUrl = await toJpeg(previewRef.current, { quality: 0.98, pixelRatio: 2, skipFonts: true });
      const pdf = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' });
      pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, 297);
      pdf.save(`${name || 'Tailored_Resume'}.pdf`);
    } catch (e) {
      console.error("Failed to generate PDF", e);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:cursor-pointer hover:opacity-75 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
    >
      <Download className="w-4 h-4" />
      Download PDF
    </button>
  );
}
