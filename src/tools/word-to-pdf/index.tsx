import { useState, useRef } from 'react';
import { useFilePaste } from '@/hooks/useFilePaste';
import { FileDown, Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import * as mammoth from 'mammoth';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';

export default function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (selected: File) => {
    if (!selected.name.endsWith('.docx') && !selected.name.endsWith('.doc')) {
      setError('Please upload a valid Word document (.doc or .docx)');
      setFile(null);
      return;
    }
    setFile(selected);
    setError(null);
    setSuccess(false);
  };

  useFilePaste((files) => {
    const file = files[0];
    if (file) validateAndSetFile(file);
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
      validateAndSetFile(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const convertToPdf = async () => {
    if (!file) return;
    setIsConverting(true);
    setError(null);
    setSuccess(false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Convert Word to HTML
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      // Create a hidden container for PDF generation
      const renderContainer = document.createElement('div');
      renderContainer.innerHTML = html;
      
      // Basic styling for the PDF
      renderContainer.style.padding = '40px';
      renderContainer.style.fontFamily = 'Arial, sans-serif';
      renderContainer.style.fontSize = '12pt';
      renderContainer.style.color = '#000000';
      renderContainer.style.backgroundColor = '#ffffff';
      renderContainer.style.width = '800px';

      const opt = {
        margin:       10,
        filename:     file.name.replace(/\.[^/.]+$/, "") + '.pdf',
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      // Generate PDF
      await html2pdf().set(opt).from(renderContainer).save();
      setSuccess(true);
    } catch (err) {
      console.error('Conversion error:', err);
      setError('An error occurred during conversion. Please try a simpler document.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16">
      <SEOHelmet 
        title="Word to PDF Converter Online Free | .doc to PDF Instantly"
        description="Convert Microsoft Word (.doc or .docx) files to PDF securely in your browser without uploading to any server."
      />

      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-brand-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
          <FileDown className="w-8 h-8 text-brand-600 dark:text-brand-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
          Word to PDF Converter
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
          Upload your Word document and securely download it as a basic PDF. Completely client-side processing.
        </p>
      </div>

      <Card className="p-6 md:p-8 border-brand-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-xl shadow-brand-500/5">
        <div 
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4 group-hover:text-brand-500 transition-colors" />
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-2 text-lg">
            Click to upload your Document
          </p>
          <p className="text-sm text-gray-500">
            Supports .docx and .doc formats (No complex formatting)
          </p>
          <input 
            type="file" 
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-center border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}

        {file && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/80 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => { setFile(null); setSuccess(false); }}
                className="text-red-500 hover:text-red-600 border-red-200"
              >
                Remove
              </Button>
            </div>

            <Button 
              onClick={convertToPdf} 
              disabled={isConverting}
              size="lg"
              className="w-full py-6 text-lg bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Converting Document...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-6 h-6 mr-3 text-green-300" />
                  Successfully Converted & Downloaded
                </>
              ) : (
                <>
                  <FileDown className="w-6 h-6 mr-3" />
                  Convert to PDF
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
              Note: This basic tool extracts text and styles, but complex formatting, backgrounds, or tables might not render identically.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
