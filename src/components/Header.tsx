import React from 'react';
import { BookOpen, Sparkles, HelpCircle, Settings, RotateCcw, Image as ImageIcon } from 'lucide-react';

interface HeaderProps {
  onOpenInstructions: () => void;
  onOpenSettings: () => void;
  onLoadSample: () => void;
  onReset: () => void;
  imageCount: number;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenInstructions,
  onOpenSettings,
  onLoadSample,
  onReset,
  imageCount,
  isProcessing,
}) => {
  return (
    <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-900/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-stone-100 tracking-tight">
                Chinese Novel OCR Studio
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20">
                Gemini OCR
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Trích xuất chữ tiếng Trung từ ảnh tiểu thuyết chuẩn xác 100% • Xử lý theo mẻ (Batch)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            id="btn-sample-images"
            onClick={onLoadSample}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-800/80 text-stone-300 hover:bg-stone-800 hover:text-amber-300 border border-stone-700/60 transition disabled:opacity-50"
            title="Tải 3 trang ảnh tiểu thuyết mẫu để thử nghiệm nhanh"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Nạp ảnh mẫu</span>
          </button>

          <button
            type="button"
            id="btn-instructions"
            onClick={onOpenInstructions}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-800/80 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-700/60 transition"
            title="Xem 3 bước cài đặt AI Studio & Copy Master Prompt"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>3 Bước AI Studio</span>
          </button>

          <button
            type="button"
            id="btn-settings"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-800/80 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-700/60 transition"
            title="Tùy chỉnh nhiệt độ, kích thước mẻ và lệnh hệ thống"
          >
            <Settings className="w-3.5 h-3.5 text-stone-400" />
            <span>Cấu hình</span>
          </button>

          {imageCount > 0 && (
            <button
              type="button"
              id="btn-reset"
              onClick={onReset}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-950/40 text-red-300 hover:bg-red-900/50 border border-red-900/40 transition disabled:opacity-50"
              title="Xóa danh sách ảnh hiện tại"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
