import React, { useRef, useState } from 'react';
import { UploadCloud, FolderUp, FileImage, AlertCircle } from 'lucide-react';
import { fileToBase64, naturalCompare } from '../utils/helpers';
import { ImageItem } from '../types';

interface Props {
  onAddImages: (images: ImageItem[]) => void;
  isProcessing: boolean;
  totalImages: number;
  batchSize: number;
}

export const UploadZone: React.FC<Props> = ({
  onAddImages,
  isProcessing,
  totalImages,
  batchSize,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsReadingFiles(true);

    const imageFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|tif|tiff)$/i.test(file.name)) {
        imageFiles.push(file);
      }
    }

    if (imageFiles.length === 0) {
      setIsReadingFiles(false);
      return;
    }

    // Sort naturally right away
    imageFiles.sort((a, b) => naturalCompare(a.name, b.name));

    const newItems: ImageItem[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const f = imageFiles[i];
      try {
        const base64 = await fileToBase64(f);
        newItems.push({
          id: `img-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          filename: f.name,
          file: f,
          previewUrl: base64,
          base64Data: base64,
          mimeType: f.type || 'image/jpeg',
          size: f.size,
          order: i + 1,
          status: 'idle',
        });
      } catch (err) {
        console.error('Error reading file:', f.name, err);
      }
    }

    onAddImages(newItems);
    setIsReadingFiles(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;

    if (e.dataTransfer.files) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const calculatedBatches = Math.ceil(totalImages / batchSize);

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl">
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore - webkitdirectory is standard in all modern browsers
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />

      {/* Drag Drop Area */}
      <div
        id="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10 scale-[0.99]'
            : 'border-stone-700/80 hover:border-amber-500/50 hover:bg-stone-850/50 bg-stone-950/40'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3.5 group-hover:scale-105 transition">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-base font-semibold text-stone-200 mb-1">
          Kéo & thả ảnh chương tiểu thuyết vào đây
        </h3>
        <p className="text-xs text-stone-400 max-w-md mb-4">
          Hỗ trợ chọn nhiều file hoặc thả cả thư mục chương (JPG, PNG, WEBP). Tự động sắp xếp theo thứ tự số đếm <span className="font-mono text-amber-300">01.jpg, 02.jpg...</span>
        </p>

        {/* Buttons inside drop area */}
        <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            id="btn-select-files"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-md shadow-amber-900/20 transition disabled:opacity-50"
          >
            <FileImage className="w-4 h-4" />
            <span>Chọn tệp ảnh</span>
          </button>

          <button
            type="button"
            id="btn-select-folder"
            disabled={isProcessing}
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700 transition disabled:opacity-50"
          >
            <FolderUp className="w-4 h-4 text-stone-400" />
            <span>Tải cả thư mục</span>
          </button>
        </div>

        {isReadingFiles && (
          <div className="mt-4 text-xs text-amber-300 animate-pulse">
            Đang tải và chuẩn bị dữ liệu ảnh...
          </div>
        )}
      </div>

      {/* Batching Strategy Notice */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs px-1 text-stone-400">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>
            {totalImages > 0 ? (
              <>
                Đã nạp <strong className="text-stone-200">{totalImages}</strong> ảnh • Chia thành{' '}
                <strong className="text-amber-300">{calculatedBatches} mẻ</strong> ({batchSize} ảnh/mẻ)
              </>
            ) : (
              'Khuyên dùng: gom 10 - 20 ảnh/mẻ để Gemini OCR đọc chuẩn xác và không gây đầy RAM.'
            )}
          </span>
        </div>

        {totalImages > 0 && (
          <span className="text-stone-500 font-mono">
            Thứ tự mặc định: 01 → 99
          </span>
        )}
      </div>
    </div>
  );
};
