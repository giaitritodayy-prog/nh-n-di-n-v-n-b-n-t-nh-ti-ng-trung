import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Download,
  FileText,
  Search,
  Maximize2,
  Minimize2,
  Languages,
  BookMarked,
  Sparkles,
  Layers,
  Eye,
  Loader2,
} from 'lucide-react';
import { BatchItem, ImageItem } from '../types';

interface Props {
  fullText: string;
  batches: BatchItem[];
  images: ImageItem[];
  isProcessing: boolean;
}

export const ResultViewer: React.FC<Props> = ({
  fullText,
  batches,
  images,
  isProcessing,
}) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontFamily, setFontFamily] = useState<'serif' | 'mono'>('serif');
  const [activeTab, setActiveTab] = useState<'code' | 'sideBySide' | 'translation'>('code');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Quick translation state
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Copy to clipboard
  const handleCopy = () => {
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .txt file
  const handleDownloadTxt = () => {
    if (!fullText) return;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tieu_thuyet_trich_xuat_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Trigger quick translation
  const handleTranslate = async () => {
    if (!fullText) return;
    setIsTranslating(true);
    setTranslationError(null);
    try {
      const res = await fetch('/api/quick-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText.slice(0, 4000), type: 'translate' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTranslatedText(data.result);
    } catch (err: any) {
      setTranslationError(err.message || 'Không thể dịch thử.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const chars = fullText.replace(/\s+/g, '').length;
    const lines = fullText ? fullText.split('\n').length : 0;
    const chapterMarks = (fullText.match(/---|第[0-9一二三四五六七八九十百千]+章/g) || []).length;
    return { chars, lines, chapterMarks };
  }, [fullText]);

  if (!fullText && batches.length === 0) {
    return null;
  }

  const selectedImage = images.find((img) => img.id === selectedImageId) || images[0];

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header Bar with Tabs & Stats */}
      <div className="p-4 border-b border-stone-800 bg-stone-950/80 flex flex-wrap items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center space-x-1 bg-stone-900 p-1 rounded-xl border border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'code'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Raw Text (Khối mã)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sideBySide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'sideBySide'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>So sánh Ảnh / Chữ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('translation');
              if (!translatedText && !isTranslating) handleTranslate();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'translation'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Bản dịch mẫu (AI)</span>
          </button>
        </div>

        {/* Action Buttons: 1-Click Copy & Download .txt */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            id="btn-copy-all"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-md shadow-amber-900/20 transition active:scale-95"
            title="Sao chép toàn bộ văn bản thô vào bộ nhớ tạm chỉ với 1 cú nhấp"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép 100%!' : 'Sao chép toàn bộ (1-Click)'}</span>
          </button>

          <button
            type="button"
            id="btn-download-txt"
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition"
            title="Tải văn bản thô về máy dưới dạng tệp .txt"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Tải .txt</span>
          </button>
        </div>
      </div>

      {/* Sub-toolbar: Search, Font Controls, Stats */}
      <div className="px-4 py-2.5 bg-stone-950/40 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Tìm kiếm ký tự trong truyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-900 border border-stone-800 rounded-lg pl-8 pr-3 py-1 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Font & Display Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="text-stone-500">Cỡ chữ:</span>
            {[14, 16, 18, 20].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setFontSize(sz)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                  fontSize === sz
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 border-l border-stone-800 pl-3">
            <span className="text-stone-500">Phông:</span>
            <button
              type="button"
              onClick={() => setFontFamily('serif')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                fontFamily === 'serif'
                  ? 'bg-amber-500/20 text-amber-300 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Noto Serif (Mincho)
            </button>
            <button
              type="button"
              onClick={() => setFontFamily('mono')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                fontFamily === 'mono'
                  ? 'bg-amber-500/20 text-amber-300 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Code Mono
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-3 text-stone-400 font-mono text-[11px]">
          <span>
            Ký tự: <strong className="text-amber-300">{stats.chars.toLocaleString()}</strong>
          </span>
          <span>•</span>
          <span>
            Dòng: <strong className="text-stone-200">{stats.lines}</strong>
          </span>
          {stats.chapterMarks > 0 && (
            <>
              <span>•</span>
              <span className="text-amber-400">
                Chương: <strong>{stats.chapterMarks}</strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 bg-stone-950">
        {/* Tab 1: Code Block View (Strict Master Prompt Requirement) */}
        {activeTab === 'code' && (
          <div className="relative group">
            <div className="absolute top-3 right-3 opacity-75 group-hover:opacity-100 transition z-10">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 shadow"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Đã sao chép' : 'Copy'}</span>
              </button>
            </div>

            <pre
              id="raw-text-output"
              className={`w-full max-h-[550px] overflow-auto p-5 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-100 leading-relaxed select-text ${
                fontFamily === 'serif' ? 'font-serif' : 'font-mono'
              }`}
              style={{
                fontSize: `${fontSize}px`,
                fontFamily:
                  fontFamily === 'serif'
                    ? '"Noto Serif SC", STSong, Georgia, serif'
                    : '"Fira Code", monospace',
              }}
            >
              <code>{fullText}</code>
            </pre>
          </div>
        )}

        {/* Tab 2: Side-by-Side Inspector */}
        {activeTab === 'sideBySide' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Image selector & zoom preview */}
            <div className="bg-stone-900/60 rounded-xl border border-stone-800 p-3 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-300">
                  Ảnh gốc: {selectedImage?.filename || 'Chưa chọn'}
                </span>
                <div className="flex items-center space-x-1">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImageId(img.id)}
                      className={`w-6 h-6 rounded text-[10px] font-mono font-bold transition ${
                        selectedImage?.id === img.id
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-stone-800 text-stone-400 hover:text-white'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-h-[380px] max-h-[500px] overflow-auto rounded-lg bg-stone-950 flex items-center justify-center p-2 border border-stone-800">
                {selectedImage ? (
                  <img
                    src={selectedImage.previewUrl}
                    alt={selectedImage.filename}
                    className="max-h-[460px] object-contain rounded"
                  />
                ) : (
                  <span className="text-xs text-stone-500">Chưa có ảnh</span>
                )}
              </div>
            </div>

            {/* Right: Text of this batch / full text */}
            <div className="bg-stone-900/60 rounded-xl border border-stone-800 p-3 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-300">
                  Chữ Hán OCR tương ứng
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Copy toàn bộ
                </button>
              </div>

              <div
                className="flex-1 max-h-[500px] overflow-auto p-4 rounded-lg bg-stone-950 border border-stone-800 text-stone-200 leading-relaxed font-serif whitespace-pre-wrap select-text"
                style={{
                  fontSize: `${fontSize}px`,
                  fontFamily: '"Noto Serif SC", STSong, Georgia, serif',
                }}
              >
                {fullText}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Quick AI Translation Preview */}
        {activeTab === 'translation' && (
          <div className="bg-stone-900/60 rounded-xl border border-stone-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-stone-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Bản dịch thử tiếng Việt (Xem trước nội dung chương)
                </h4>
                <p className="text-xs text-stone-400">
                  Dịch ngữ cảnh tự động bằng Gemini để kiểm tra nội dung truyện
                </p>
              </div>

              <button
                type="button"
                onClick={handleTranslate}
                disabled={isTranslating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 transition disabled:opacity-50"
              >
                {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
                <span>{isTranslating ? 'Đang dịch...' : 'Dịch lại'}</span>
              </button>
            </div>

            {isTranslating ? (
              <div className="p-8 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                <span>Đang kết nối Gemini để dịch đoạn trích tiểu thuyết...</span>
              </div>
            ) : translationError ? (
              <div className="p-4 rounded-lg bg-red-950/40 border border-red-900/40 text-xs text-red-300">
                {translationError}
              </div>
            ) : translatedText ? (
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-sm leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-auto select-text font-sans">
                {translatedText}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-stone-500">
                Nhấn "Dịch lại" để dịch thử đoạn văn bản này sang tiếng Việt.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 bg-stone-950/90 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
        <span>Đã tuân thủ quy tắc giữ nguyên dấu câu, ngắt dòng và dấu ngắt chương `---` của Master Prompt.</span>
        <span>Nhấp đúp chuột để bôi đen hoặc dùng nút Copy (1-Click) ở trên.</span>
      </div>
    </div>
  );
};
