'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, FileText, Video as VideoIcon, UploadCloud, Trash2 } from 'lucide-react';
import type { BlockData } from '../types';
import { useEditorStore } from '../store';
import { getStorage } from '@/services/storage';

interface MediaBlockProps {
  block: BlockData;
}

export function MediaBlock({ block }: MediaBlockProps) {
  const { updateBlock, deleteBlock } = useEditorStore();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let file: File | undefined;
    
    if ('dataTransfer' in e) {
      e.preventDefault();
      setDragActive(false);
      file = e.dataTransfer.files[0];
    } else {
      file = e.target.files?.[0];
    }

    if (!file) return;

    try {
      setIsUploading(true);
      const storage = await getStorage();
      const result = await storage.upload(file, 'editor-blocks/');
      
      updateBlock(block.id, { 
        content: result.url,
        metadata: {
          filename: file.name,
          size: file.size,
          mimeType: file.type
        }
      });
    } catch (err) {
      console.error('Failed to upload file:', err);
      // Fallback: we could read it as base64 for pure offline...
      // But let's follow the instructions to upload it if configured.
      // If upload fails, just insert a local object url for the session.
      const localUrl = URL.createObjectURL(file);
      updateBlock(block.id, {
        content: localUrl,
        metadata: {
           filename: file.name,
           size: file.size,
           mimeType: file.type,
           localOnly: true
        }
      });
    } finally {
      setIsUploading(false);
    }
  };

  const hasMediaUrl = typeof block.content === 'string' && block.content.length > 0;

  const renderPlaceholder = () => {
    let Icon = FileText;
    let title = 'File';
    let accept = '*/*';

    if (block.type === 'image') { Icon = ImageIcon; title = 'Image'; accept = 'image/*'; }
    if (block.type === 'video') { Icon = VideoIcon; title = 'Video'; accept = 'video/*'; }

    return (
      <div 
        className={`w-full p-8 mt-2 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors relative ${
          dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDrop={(e) => { e.preventDefault(); handleFileUpload(e); }}
      >
        <div className="absolute top-2 right-2">
          <button onClick={() => deleteBlock(block.id)} className="p-1 text-zinc-400 hover:text-red-500"><Trash2 size={16}/></button>
        </div>
        <Icon className="text-zinc-400 mb-2" size={32} />
        {isUploading ? (
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 animate-pulse">Uploading...</p>
        ) : (
          <>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Upload a {title}</p>
            <label className="mt-4 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm rounded-md cursor-pointer flex items-center gap-2 transition-colors">
              <UploadCloud size={16} /> Choose File
              <input type="file" accept={accept} className="hidden" onChange={handleFileUpload} />
            </label>
          </>
        )}
      </div>
    );
  };

  if (!hasMediaUrl) {
    return renderPlaceholder();
  }

  return (
    <div className="w-full relative mt-2 group flex justify-center bg-zinc-50 dark:bg-zinc-900 rounded-lg outline outline-1 outline-zinc-200 dark:outline-zinc-800 overflow-hidden">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
        <button 
          onClick={() => deleteBlock(block.id)}
          className="p-1.5 bg-red-100 text-red-600 rounded shadow-sm hover:bg-red-200"
          title="Delete Media"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {block.type === 'image' && (
        <img 
          src={block.content} 
          alt={block.metadata?.filename || 'Image block'} 
          className="max-h-[500px] object-contain rounded-lg"
          loading="lazy"
        />
      )}

      {block.type === 'video' && (
        <video 
          src={block.content} 
          controls
          className="max-h-[500px] w-full rounded-lg"
        />
      )}

      {block.type === 'file' && (
        <div className="p-4 flex items-center gap-4 w-full">
          <div className="p-3 bg-zinc-200 dark:bg-zinc-800 rounded">
            <FileText size={24} className="text-zinc-500" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {block.metadata?.filename || 'File'}
            </span>
            <span className="text-xs text-zinc-500">
              {block.metadata?.size ? (block.metadata.size / 1024).toFixed(1) + ' KB' : 'Unknown size'}
            </span>
          </div>
          <a shrink-0 
            href={block.content} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
          >
            Download
          </a>
        </div>
      )}
      
      {block.metadata?.localOnly && (
         <div className="absolute bottom-2 left-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded shadow-sm font-medium">
           Local Session Only
         </div>
      )}
    </div>
  );
}
