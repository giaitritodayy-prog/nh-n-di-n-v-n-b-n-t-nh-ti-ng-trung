import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ImageGrid } from './components/ImageGrid';
import { OcrControlBar } from './components/OcrControlBar';
import { ResultViewer } from './components/ResultViewer';
import { ManualInstructionsModal } from './components/ManualInstructionsModal';
import { SettingsModal } from './components/SettingsModal';
import { ImageItem, BatchItem, OcrConfig, SessionStats } from './types';
import {
  MASTER_SYSTEM_PROMPT,
  sortImagesNaturally,
  generateSampleNovelImage,
  SAMPLE_CHAPTER_DATA,
} from './utils/helpers';
import { AlertCircle, CheckCircle2, Info, Sparkles } from 'lucide-react';

export default function App() {
  // Application State
  const [images, setImages] = useState<ImageItem[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [fullText, setFullText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentBatchInfo, setCurrentBatchInfo] = useState<{
    index: number;
    total: number;
    rangeText: string;
  } | null>(null);

  // Modals
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Toast notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(
    null
  );

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Cancellation ref for batch loop
  const stopRequestedRef = useRef<boolean>(false);

  // Config
  const [config, setConfig] = useState<OcrConfig>({
    batchSize: 10,
    temperature: 0.0,
    model: 'gemini-3.6-flash',
    autoSort: true,
    systemInstruction: MASTER_SYSTEM_PROMPT,
    chapterDivider: true,
  });

  // Calculate session stats
  const stats: SessionStats = useMemo(() => {
    const completedImages = images.filter((img) => img.status === 'completed').length;
    const totalBatches = Math.ceil(images.length / config.batchSize);
    const completedBatches = batches.filter((b) => b.status === 'completed').length;
    const chars = fullText.replace(/\s+/g, '').length;
    const lines = fullText ? fullText.split('\n').length : 0;

    return {
      totalImages: images.length,
      completedImages,
      totalBatches,
      completedBatches,
      totalCharacters: chars,
      totalLines: lines,
      startTime: null,
      endTime: null,
    };
  }, [images, batches, fullText, config.batchSize]);

  // Add images handler
  const handleAddImages = (newImages: ImageItem[]) => {
    setImages((prev) => {
      const combined = [...prev, ...newImages];
      return config.autoSort ? sortImagesNaturally(combined) : combined;
    });
    showToast(`Đã thêm ${newImages.length} ảnh trang tiểu thuyết.`, 'info');
  };

  // Remove single image
  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      return filtered.map((img, idx) => ({ ...img, order: idx + 1 }));
    });
  };

  // Move image up / down
  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    setImages((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next.map((img, idx) => ({ ...img, order: idx + 1 }));
    });
  };

  // Sort naturally
  const handleSortNaturally = () => {
    setImages((prev) => sortImagesNaturally(prev));
    showToast('Đã sắp xếp danh sách ảnh theo số đếm tự nhiên (01.jpg → 99.jpg).', 'success');
  };

  // Load sample demo novel images
  const handleLoadSample = async () => {
    try {
      showToast('Đang tạo và nạp 3 trang ảnh tiểu thuyết mẫu...', 'info');
      const sampleItems: ImageItem[] = [];
      for (const item of SAMPLE_CHAPTER_DATA) {
        const sampleImage = await generateSampleNovelImage(item.title, item.lines, item.filename);
        sampleItems.push(sampleImage);
      }
      setImages((prev) => {
        const combined = [...prev, ...sampleItems];
        return config.autoSort ? sortImagesNaturally(combined) : combined;
      });
      showToast('Đã nạp thành công 3 ảnh tiểu thuyết mẫu. Bạn có thể nhấn Bắt đầu OCR ngay!', 'success');
    } catch (err) {
      console.error('Error loading sample:', err);
      showToast('Không thể tạo ảnh mẫu.', 'error');
    }
  };

  // Reset all
  const handleReset = () => {
    if (isProcessing) return;
    setImages([]);
    setBatches([]);
    setFullText('');
    setCurrentBatchInfo(null);
    showToast('Đã làm mới toàn bộ danh sách và kết quả.', 'info');
  };

  // Stop processing
  const handleStopOcr = () => {
    stopRequestedRef.current = true;
    showToast('Đang dừng xử lý sau khi hoàn tất mẻ hiện tại...', 'info');
  };

  // Main Sequential Batch OCR Execution
  const handleStartOcr = async () => {
    if (images.length === 0) {
      showToast('Vui lòng tải lên ít nhất một ảnh tiểu thuyết để nhận diện.', 'error');
      return;
    }

    setIsProcessing(true);
    stopRequestedRef.current = false;

    // Split images into batches of config.batchSize
    const batchSize = config.batchSize;
    const totalBatches = Math.ceil(images.length / batchSize);
    let accumulatedText = fullText;

    // Find if there are already completed images
    const pendingBatchesCount = Array.from({ length: totalBatches }).filter((_, bIdx) => {
      const s = bIdx * batchSize;
      const e = Math.min(s + batchSize, images.length);
      return images.slice(s, e).some((img) => img.status !== 'completed');
    }).length;

    showToast(
      pendingBatchesCount < totalBatches && pendingBatchesCount > 0
        ? `Đang tiếp tục OCR ${pendingBatchesCount} mẻ còn lại...`
        : `Bắt đầu xử lý ${images.length} ảnh qua ${totalBatches} mẻ (${batchSize} ảnh/mẻ)...`,
      'info'
    );

    for (let bIndex = 0; bIndex < totalBatches; bIndex++) {
      if (stopRequestedRef.current) {
        showToast('Đã dừng xử lý theo yêu cầu của bạn.', 'info');
        break;
      }

      const startIdx = bIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, images.length);
      const batchImages = images.slice(startIdx, endIdx);

      // Check if all images in this batch are already completed
      const allCompleted = batchImages.every((img) => img.status === 'completed');
      if (allCompleted) {
        continue;
      }

      const rangeText = `Ảnh ${batchImages[0].filename} - ${batchImages[batchImages.length - 1].filename}`;

      setCurrentBatchInfo({
        index: bIndex + 1,
        total: totalBatches,
        rangeText,
      });

      // Update images state to processing
      setImages((prev) =>
        prev.map((img) =>
          batchImages.some((bi) => bi.id === img.id)
            ? { ...img, status: 'processing', errorMessage: undefined }
            : img
        )
      );

      try {
        const payload = {
          images: batchImages.map((img) => ({
            id: img.id,
            filename: img.filename,
            mimeType: img.mimeType,
            base64Data: img.base64Data,
          })),
          batchIndex: bIndex + 1,
          totalBatches,
          temperature: config.temperature,
          systemInstruction: config.systemInstruction,
          model: config.model,
        };

        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || `Lỗi HTTP ${res.status}`);
        }

        const batchExtracted = data.text?.trim() || '';

        // Append with natural separator
        if (accumulatedText) {
          accumulatedText = `${accumulatedText}\n\n${batchExtracted}`;
        } else {
          accumulatedText = batchExtracted;
        }

        setFullText(accumulatedText);

        // Mark images in this batch as completed
        setImages((prev) =>
          prev.map((img) =>
            batchImages.some((bi) => bi.id === img.id)
              ? { ...img, status: 'completed', errorMessage: undefined }
              : img
          )
        );

        // Record batch
        setBatches((prev) => {
          const existing = prev.filter((b) => b.batchIndex !== bIndex + 1);
          return [
            ...existing,
            {
              batchIndex: bIndex + 1,
              imageIds: batchImages.map((img) => img.id),
              status: 'completed',
              extractedText: batchExtracted,
              fullOutput: data.fullOutput,
            },
          ];
        });
      } catch (err: any) {
        console.error(`Error processing batch ${bIndex + 1}:`, err);
        const errMsg = err.message || 'Lỗi không xác định khi OCR';

        setImages((prev) =>
          prev.map((img) =>
            batchImages.some((bi) => bi.id === img.id)
              ? { ...img, status: 'error', errorMessage: errMsg }
              : img
          )
        );

        showToast(`Mẻ ${bIndex + 1}: ${errMsg}`, 'error');
        // Stop execution on error so user can review and retry without losing previous batches
        break;
      }
    }

    setIsProcessing(false);
    setCurrentBatchInfo(null);
    if (!stopRequestedRef.current) {
      const remainingUnfinished = images.filter((img) => img.status !== 'completed').length;
      if (remainingUnfinished === 0) {
        showToast('Hoàn thành toàn bộ quá trình OCR! Văn bản đã sẵn sàng trong khối mã.', 'success');
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        onOpenInstructions={() => setIsInstructionsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLoadSample={handleLoadSample}
        onReset={handleReset}
        imageCount={images.length}
        isProcessing={isProcessing}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-short">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-xs font-medium backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-700/80 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-700/80 text-red-200'
                : 'bg-stone-900/90 border-stone-700 text-stone-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Banner / Instructions Highlights */}
        <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-stone-300">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <span>
              <strong>Quy trình chuẩn:</strong> Đọc theo thứ tự số đếm file ảnh • Không thêm thắt • Giữ nguyên định dạng & ngắt dòng • Hiệu đính ký tự mờ • Xuất khối mã (Code block).
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsInstructionsOpen(true)}
            className="text-amber-400 hover:text-amber-300 hover:underline font-semibold whitespace-nowrap flex-shrink-0"
          >
            Xem hướng dẫn & Copy Master Prompt →
          </button>
        </div>

        {/* Upload Zone */}
        <UploadZone
          onAddImages={handleAddImages}
          isProcessing={isProcessing}
          totalImages={images.length}
          batchSize={config.batchSize}
        />

        {/* Image Grid / Queue Preview */}
        {images.length > 0 && (
          <ImageGrid
            images={images}
            onRemoveImage={handleRemoveImage}
            onMoveImage={handleMoveImage}
            onSortNaturally={handleSortNaturally}
            isProcessing={isProcessing}
          />
        )}

        {/* Action Control Bar */}
        {images.length > 0 && (
          <OcrControlBar
            totalImages={images.length}
            batchSize={config.batchSize}
            isProcessing={isProcessing}
            onStartOcr={handleStartOcr}
            onStopOcr={handleStopOcr}
            stats={stats}
            currentBatch={currentBatchInfo}
          />
        )}

        {/* Result Viewer (Code Block + Side-by-side + Translation) */}
        <ResultViewer
          fullText={fullText}
          batches={batches}
          images={images}
          isProcessing={isProcessing}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-950/80 py-4 text-center text-xs text-stone-400">
        <p>
          Chinese Novel OCR Studio • Powered by Gemini Vision API • Nhiệt độ chuẩn xác 0.0 • Tối ưu xử lý tiểu thuyết & truyện dài kỳ
        </p>
      </footer>

      {/* Modals */}
      <ManualInstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onChangeConfig={setConfig}
      />
    </div>
  );
}
