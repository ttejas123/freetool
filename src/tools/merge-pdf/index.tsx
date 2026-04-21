import { useState, useRef } from 'react';
import { useFilePaste } from '@/hooks/useFilePaste';
import { Files, Upload, Download, Trash2, FileText, Loader2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';

interface PdfItem {
  id: string;
  name: string;
  size: number;
  file: File;
}

export default function MergePdf() {
  const [pdfs, setPdfs] = useState<PdfItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: File[] | FileList) => {
    const fileArray = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (fileArray.length > 0) {
      const newPdfs = fileArray.map((file) => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        file,
      }));
      setPdfs((prev) => [...prev, ...newPdfs]);
      // Reset generated URL if new files added
      if (mergedPdfUrl) {
        setMergedPdfUrl(null);
      }
    }
  };

  useFilePaste((files) => {
    addFiles(files);
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePdf = (id: string) => {
    setPdfs(pdfs.filter(pdf => pdf.id !== id));
    if (mergedPdfUrl) {
      URL.revokeObjectURL(mergedPdfUrl);
      setMergedPdfUrl(null);
    }
  };

  const movePdf = (index: number, direction: 'up' | 'down') => {
    const newPdfs = [...pdfs];
    if (direction === 'up' && index > 0) {
      [newPdfs[index - 1], newPdfs[index]] = [newPdfs[index], newPdfs[index - 1]];
      setPdfs(newPdfs);
    } else if (direction === 'down' && index < newPdfs.length - 1) {
      [newPdfs[index + 1], newPdfs[index]] = [newPdfs[index], newPdfs[index + 1]];
      setPdfs(newPdfs);
    }
  };

  const mergePdfs = async () => {
    if (pdfs.length < 2) return;
    setIsMerging(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of pdfs) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setMergedPdfUrl(url);
    } catch (err) {
      console.error('Error merging PDFs:', err);
      alert('Error merging PDFs. Ensure all files are valid PDF documents.');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16">
      <SEOHelmet 
        title="Merge PDF Online Free | Combine PDF Documents Instantly"
        description="Combine multiple PDF files into one single PDF securely. Everything happens in your browser."
      />

      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-brand-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
          <Files className="w-8 h-8 text-brand-600 dark:text-brand-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
          Merge PDF
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
          Upload and combine multiple PDF documents. Processing is completely client-side.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Card className="p-6 border-brand-100 dark:border-gray-700 bg-white dark:bg-gray-800/50">
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                Click to upload PDFs
              </p>
              <p className="text-sm text-gray-500">
                You can select multiple files at once
              </p>
              <input 
                type="file" 
                multiple 
                accept="application/pdf" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>

            {pdfs.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Files to Merge ({pdfs.length})</h3>
                  <Button variant="secondary" size="sm" onClick={() => setPdfs([])} className="text-red-500 hover:text-red-600 border-red-200 dark:border-red-900/30">
                    Clear All
                  </Button>
                </div>
                
                {pdfs.map((pdf, idx) => (
                  <div key={pdf.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col gap-1 text-gray-400">
                      <button 
                        onClick={() => movePdf(idx, 'up')}
                        disabled={idx === 0}
                        className="hover:text-brand-500 disabled:opacity-30 disabled:hover:text-gray-400"
                      >
                        ▲
                      </button>
                      <button 
                        onClick={() => movePdf(idx, 'down')}
                        disabled={idx === pdfs.length - 1}
                        className="hover:text-brand-500 disabled:opacity-30 disabled:hover:text-gray-400"
                      >
                        ▼
                      </button>
                    </div>
                    
                    <FileText className="w-6 h-6 text-brand-500 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                        {pdf.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(pdf.size)}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => removePdf(pdf.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="col-span-1 space-y-6">
          <Card className="p-6 border-brand-100 dark:border-gray-700 bg-white dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Action
            </h3>
            
            <div className="space-y-4">
              <Button 
                onClick={mergePdfs} 
                className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                disabled={pdfs.length < 2 || isMerging}
              >
                {isMerging ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    Merging...
                  </>
                ) : (
                  'Merge PDFs'
                )}
              </Button>
              {pdfs.length < 2 && (
                <p className="text-xs text-orange-500 mt-2 text-center">
                  Add at least 2 PDF files to merge them
                </p>
              )}
            </div>
          </Card>

          {mergedPdfUrl && (
            <Card className="p-6 border-green-100 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto">
                <Files className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                  Merge Successful!
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your files have been combined.
                </p>
              </div>
              <a 
                href={mergedPdfUrl} 
                download="merged_document.pdf" 
                className="flex items-center justify-center w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-md shadow-green-500/20"
              >
                <Download className="w-5 h-5 mr-2" />
                Download PDF
              </a>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
