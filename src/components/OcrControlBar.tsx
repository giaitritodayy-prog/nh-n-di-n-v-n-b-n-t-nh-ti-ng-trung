import React from 'react';
import { Play, Pause, Square, Sparkles, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { SessionStats } from '../types';

interface Props {
  totalImages: number;
  batchSize: number;
  isProcessing: boolean;
  onStartOcr: () => void;
  onStopOcr: () => void;
  stats: SessionStats;
  currentBatch: { index: number; total: number; rangeText: string } | null;
}

export const OcrControlBar: React.FC<Props> = ({
  totalImages,
  batchSize,
  isProcessing,
  onStartOcr,
  onStopOcr,
  stats,
  currentBatch,
}) => {
  if (totalImages === 0) return null;

  const totalBatches = Math.ceil(totalImages / batchSize);
  const progressPercent =
    totalImages > 0 ? Math.round((stats.completedImages / totalImages) * 100) : 0;

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status / Message */}
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              {isProcessing ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {currentBatch
                      ? `Đang xử lý Mẻ ${currentBatch.index}/${currentBatch.total} (${currentBatch.rangeText})...`
                      : 'Đang chuẩn bị gửi ảnh đến Gemini...'}
                  </span>
                </div>
              ) : stats.completedImages === totalImages && totalImages > 0 ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã hoàn thành toàn bộ {totalImages} ảnh!</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-medium text-stone-300">
                  <Clock className="w-4 h-4 text-stone-400" />
                  <span>
                    Sẵn sàng xử lý {totalImages} ảnh qua {totalBatches} mẻ ({batchSize} ảnh/mẻ)
                  </span>
                </div>
              )}
            </div>

            <span className="text-xs font-mono font-semibold text-stone-400">
              {stats.completedImages} / {totalImages} ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800/80">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isProcessing ? (
            <button
              type="button"
              id="btn-stop-ocr"
              onClick={onStopOcr}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-950 text-red-300 hover:bg-red-900 border border-red-800/60 font-semibold text-xs transition shadow-lg w-full sm:w-auto"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Dừng xử lý</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-start-ocr"
              onClick={onStartOcr}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-400 font-bold text-xs transition shadow-lg shadow-amber-900/30 hover:shadow-amber-900/50 w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {stats.completedImages > 0 && stats.completedImages < totalImages
                  ? 'Tiếp tục OCR các ảnh còn lại'
                  : 'Bắt đầu trích xuất OCR'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
