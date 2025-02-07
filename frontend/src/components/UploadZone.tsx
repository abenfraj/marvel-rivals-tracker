import React, { useCallback, useEffect } from 'react';
import { Upload, Clipboard } from 'lucide-react';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileUpload, isProcessing }) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileUpload(file);
  }, [onFileUpload]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    console.log('Paste event triggered');
    const items = e.clipboardData?.items;
    if (!items) {
      console.log('No items in clipboard');
      return;
    }

    for (const item of items) {
      console.log('Clipboard item type:', item.type);
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          console.log('Creating new File object from paste');
          const namedFile = new File([file], 'pasted-image.png', {
            type: file.type,
            lastModified: new Date().getTime()
          });
          console.log('Calling onFileUpload with namedFile:', namedFile);
          onFileUpload(namedFile);
        }
        break;
      }
    }
  }, [onFileUpload]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return (
    <div 
      className="max-w-2xl mx-auto"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="relative border-2 border-dashed border-red-500/50 rounded-lg p-12 text-center hover:border-red-500 transition-colors bg-black/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOGM5Ljk0MSAwIDE4LTguMDU5IDE4LTE4cy04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNHMxNCA2LjI2OCAxNCAxNHMtNi4yNjggMTQtMTQgMTR6Ii8+PC9nPjwvc3ZnPg==')] opacity-5"></div>
        
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileInput}
          accept="image/*"
          disabled={isProcessing}
        />
        
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center justify-center relative z-10"
        >
          <div className="flex items-center space-x-4 mb-4">
            <Upload className="w-16 h-16 text-red-500" />
            <Clipboard className="w-16 h-16 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Upload your Marvel Rivals screenshot
          </h3>
          <p className="text-gray-400 mb-2">
            Drag and drop, click to select, or paste (Ctrl+V)
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports PNG, JPG, and JPEG formats
          </p>
          <button className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-full hover:from-red-500 hover:to-red-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50"
            disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Analyze Screenshot'}
          </button>
        </label>
      </div>
    </div>
  );
};

export default UploadZone;