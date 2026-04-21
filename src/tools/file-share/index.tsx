import { useState, useRef, useEffect } from 'react';
import { useFilePaste } from '@/hooks/useFilePaste';
import { UploadCloud, Link as LinkIcon, FileHeart, Trash2, Clock, Check, Loader2, HardDrive } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { SEOHelmet } from '@/components/SEOHelmet';
import { getDeviceId, getTodaysUploadSize, uploadFileAndLog, getUploadHistory, type SharedFile } from './schema';

function FilePreview({ file }: { file: File }) {
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file.type.startsWith('text/') || file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTextPreview((e.target?.result as string).slice(0, 1000));
      };
      reader.readAsText(file.slice(0, 1024)); // Only read first 1KB
    } else if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  if (textPreview) {
    return (
      <div className="w-full bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 overflow-hidden border border-gray-200 dark:border-gray-800 shrink-0 mt-3">
         <pre className="text-xs text-left text-gray-700 dark:text-gray-300 font-mono overflow-auto max-h-48 whitespace-pre-wrap">{textPreview}...</pre>
      </div>
    );
  }

  if (previewUrl) {
    if (file.type.startsWith('image/')) {
      return <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-contain rounded-lg shrink-0 mt-3" />;
    }
    if (file.type.startsWith('video/')) {
      return <video src={previewUrl} controls className="w-full max-h-48 rounded-lg shrink-0 mt-3 bg-black" />;
    }
    if (file.type === 'application/pdf') {
      return <iframe src={previewUrl} className="w-full h-48 rounded-lg border border-gray-200 dark:border-gray-800 shrink-0 mt-3" />;
    }
  }

  return null;
}

export default function FileShare() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<SharedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usageBytes, setUsageBytes] = useState(0);
  
  const [history, setHistory] = useState<SharedFile[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useFilePaste((files) => {
    if (files.length > 0) {
      setFile(files[0]);
      setError(null);
    }
  });

  // 50MB daily limit
  const DAILY_LIMIT_BYTES = 50 * 1024 * 1024;

  useEffect(() => {
    const deviceId = getDeviceId();
    getTodaysUploadSize(deviceId).then(setUsageBytes).catch(console.error);
    getUploadHistory(deviceId).then(setHistory).catch(console.error);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    if (usageBytes + file.size > DAILY_LIMIT_BYTES) {
      setError(`Upload denied. Exceeds daily limit of 50MB. Remaining: ${((DAILY_LIMIT_BYTES - usageBytes) / 1024 / 1024).toFixed(2)} MB`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const deviceId = getDeviceId();
      const result = await uploadFileAndLog(file, deviceId);
      setUploadedFile(result);
      setUsageBytes(b => b + file.size);
      setHistory(prev => [result, ...prev]);
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercent = Math.min((usageBytes / DAILY_LIMIT_BYTES) * 100, 100);

  return (
    <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16">
      <SEOHelmet
        title="Temporary File Sharing"
        description="Securely upload and share files, images, and videos. Links expire in 2 days."
      />

      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
          <FileHeart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
          Secure File Share
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
          Upload any file up to 50MB. Your links will expire automatically in 2 days.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="px-5 py-6 flex items-center gap-4 border-gray-100 dark:border-gray-800">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
            <HardDrive className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Daily Quota</p>
            <p className="text-xl font-bold dark:text-white">50 MB</p>
          </div>
        </Card>

        <Card className="px-5 py-6 flex items-center gap-4 border-gray-100 dark:border-gray-800">
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <UploadCloud className="w-6 h-6 text-green-500" />
          </div>
          <div className="w-full">
            <div className="flex justify-between items-end mb-1">
              <p className="text-sm text-gray-500 font-medium">Used Today</p>
              <p className="text-sm font-bold dark:text-white">{formatBytes(usageBytes)}</p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`bg-${usagePercent > 90 ? 'red' : 'green'}-500 h-2 rounded-full`} 
                style={{ width: `${usagePercent}%` }} 
              />
            </div>
          </div>
        </Card>

        <Card className="px-5 py-6 flex items-center gap-4 border-gray-100 dark:border-gray-800">
          <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Link Expiration</p>
            <p className="text-xl font-bold dark:text-white">48 Hours</p>
          </div>
        </Card>
      </div>

      <Card className="p-8 border-brand-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-xl text-center">
        {!file && (
          <div 
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl py-12 px-6 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Click or drag file to upload</h3>
            <p className="text-sm text-gray-500">Max size 50MB.</p>
          </div>
        )}

        {file && (
          <div className="py-6 space-y-6">
            <div className="bg-brand-50 dark:bg-gray-900 rounded-xl p-4 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
                    <FileHeart className="w-6 h-6 text-brand-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white truncate max-w-xs">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFile(null)} 
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full text-gray-500"
                  disabled={isUploading}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <FilePreview file={file} />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button 
              onClick={handleUpload} 
              size="lg" 
              disabled={isUploading}
              className="w-full py-6 bg-brand-600 hover:bg-brand-700 text-white shadow-md gap-2"
            >
              {isUploading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
              ) : (
                <><UploadCloud className="w-5 h-5" /> Upload & Get Link</>
              )}
            </Button>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileSelect}
        />
      </Card>

      {uploadedFile && (
        <Card className="p-6 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10 shadow-lg space-y-4 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Upload Successful!</h3>
          </div>
          
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <LinkIcon className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="truncate">
                <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-brand-600 dark:text-brand-400 font-medium truncate hover:underline">{uploadedFile.url}</a>
                <p className="text-xs text-gray-500">Expires in 48 hours</p>
              </div>
            </div>
            <CopyButton value={uploadedFile.url} className="shrink-0" />
          </div>
        </Card>
      )}

      {history.length > 0 && (
        <div className="space-y-4 pt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-500" />Recent Uploads
          </h2>
          <div className="grid gap-4">
            {history.map(item => (
              <Card key={item.id} className="p-4 md:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:border-brand-500/50 transition-colors">
                <div className="min-w-0 flex-1 space-y-1 w-full">
                  <div className="flex items-center justify-between gap-4">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 dark:text-brand-400 truncate hover:underline">{item.url}</a>
                    <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline-block">
                      {item.expiresAt > new Date() ? `Expires ${item.expiresAt.toLocaleDateString()}` : 'Expired'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{formatBytes(item.size)}</p>
                </div>
                <CopyButton value={item.url} className="w-full sm:w-auto flex-shrink-0" />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
