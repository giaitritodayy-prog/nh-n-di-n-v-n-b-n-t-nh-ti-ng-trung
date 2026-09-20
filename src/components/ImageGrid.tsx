import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Eye, CheckCircle2, Loader2, AlertCircle, ArrowDownAZ, X } from 'lucide-react';
import { ImageItem } from '../types';

interface Props {
  images: ImageItem[];
  onRemoveImage: (id: string) => void;
  onMoveImage: (index: number, direction: 'up' | 'down') => void;
  onSortNaturally: () => void;
  isProcessing: boolean;
}

export const ImageGrid: React.FC<Props> = ({
  images,
  onRemoveImage,
  onMoveImage,
  onSortNaturally,
  isProcessing,
}) => {
  const [previewModalImg, setPreviewModalImg] = useState<ImageItem | null>(null);

  if (images.length === 0) return null;

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-stone-200">
            Danh sách trang truyện đã nạp ({images.length})
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-400 font-mono">
            Theo thứ tự xử lý
          </span>
        </div>

        <button
          type="button"
          onClick={onSortNaturally}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition disabled:opacity-50"
          title="Sắp xếp tự động lại theo số đếm tên tệp (01, 02...)"
        >
          <ArrowDownAZ className="w-3.5 h-3.5 text-amber-400" />
          <span>Sắp xếp chuẩn (01 → 99)</span>
        </button>
      </div>

      {/* Grid of items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[420px] overflow-y-auto pr-1">
        {images.map((img, index) => {
          return (
            <div
              key={img.id}
              className={`group relative bg-stone-950/60 rounded-xl border p-2 flex flex-col transition-all ${
                img.status === 'processing'
                  ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-950/10'
                  : img.status === 'completed'
                  ? 'border-emerald-600/50 bg-emerald-950/10'
                  : img.status === 'error'
                  ? 'border-red-600/50 bg-red-950/10'
                  : 'border-stone-800 hover:border-stone-700'
              }`}
            >
              {/* Image thumbnail */}
              <div
                onClick={() => setPreviewModalImg(img)}
                className="relative aspect-[3/4] rounded-lg overflow-hidden bg-stone-900 cursor-pointer mb-2 flex items-center justify-center"
              >
                <img
                  src={img.previewUrl}
                  alt={img.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />

                {/* Status Overlay */}
                {img.status === 'processing' && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1 text-amber-300">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-[10px] font-semibold">Đang đọc...</span>
                  </div>
                )}

                {img.status === 'completed' && (
                  <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-emerald-500/90 text-stone-950 shadow">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}

                {img.status === 'error' && (
                  <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-500/90 text-white shadow">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Order Tag */}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono font-bold text-amber-300">
                  #{index + 1}
                </div>

                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <span className="p-1.5 rounded-lg bg-black/60 text-white">
                    <Eye className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Filename & size */}
              <div className="mt-auto">
                <div
                  className="text-xs font-mono font-medium text-stone-300 truncate"
                  title={img.filename}
                >
                  {img.filename}
                </div>
                <div className="text-[10px] text-stone-500">
                  {(img.size / 1024).toFixed(0)} KB
                </div>
              </div>

              {/* Controls */}
              {!isProcessing && (
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-800/80">
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveImage(index, 'up')}
                      className="p-1 rounded text-stone-400 hover:text-stone-200 hover:bg-stone-800 disabled:opacity-20 transition"
                      title="Lên trước"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => onMoveImage(index, 'down')}
                      className="p-1 rounded text-stone-400 hover:text-stone-200 hover:bg-stone-800 disabled:opacity-20 transition"
                      title="Xuống sau"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveImage(img.id)}
                    className="p-1 rounded text-stone-400 hover:text-red-400 hover:bg-red-950/30 transition"
                    title="Xóa ảnh này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Enlarged Image Preview Modal */}
      {previewModalImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
              <span className="text-xs font-mono text-stone-300 font-semibold truncate">
                {previewModalImg.filename} (Trang #{previewModalImg.order})
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-stone-950">
              <img
                src={previewModalImg.previewUrl}
                alt={previewModalImg.filename}
                className="max-h-[75vh] object-contain rounded border border-stone-800 shadow"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
