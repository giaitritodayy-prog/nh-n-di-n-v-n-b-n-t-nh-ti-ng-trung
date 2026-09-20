import React, { useState, useEffect, useMemo } from 'react';
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
  BookOpen,
  SplitSquareVertical,
} from 'lucide-react';
import { BatchItem, ImageItem, NovelChapter } from '../types';
import {
  parseNovelChapters,
  formatTextWithChapterBoundaries,
  combineChaptersText,
  getChapterRangeDescription,
} from '../utils/helpers';
import { ChapterNavigator } from './ChapterNavigator';

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
  const [activeTab, setActiveTab] = useState<'code' | 'chapters' | 'sideBySide' | 'translation'>('code');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Chapter state
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [focusedChapterId, setFocusedChapterId] = useState<string | null>(null);
  const [showBoundaryMarkers, setShowBoundaryMarkers] = useState<boolean>(false);

  // Quick translation state
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Parse chapters automatically from fullText
  const chapters: NovelChapter[] = useMemo(() => {
    return parseNovelChapters(fullText);
  }, [fullText]);

  // Synchronize selection when chapters change
  useEffect(() => {
    if (chapters.length > 0) {
      setSelectedChapterIds((prev) => {
        const validIds = prev.filter((id) => chapters.some((c) => c.id === id));
        return validIds.length > 0 ? validIds : chapters.map((c) => c.id);
      });
    } else {
      setSelectedChapterIds([]);
    }
  }, [chapters]);

  const focusedChapter = useMemo(() => {
    return chapters.find((c) => c.id === focusedChapterId) || null;
  }, [chapters, focusedChapterId]);

  const selectedChapters = useMemo(() => {
    return chapters.filter((c) => selectedChapterIds.includes(c.id));
  }, [chapters, selectedChapterIds]);

  const isSubsetSelected =
    chapters.length > 0 &&
    selectedChapters.length > 0 &&
    selectedChapters.length < chapters.length;

  // Current text to display in Code Block
  const displayedText = useMemo(() => {
    if (focusedChapter) {
      return focusedChapter.content;
    }
    if (isSubsetSelected) {
      return showBoundaryMarkers
        ? formatTextWithChapterBoundaries(selectedChapters)
        : combineChaptersText(selectedChapters, false);
    }
    if (showBoundaryMarkers) {
      return formatTextWithChapterBoundaries(chapters);
    }
    return fullText;
  }, [focusedChapter, isSubsetSelected, selectedChapters, showBoundaryMarkers, chapters, fullText]);

  // Copy to clipboard
  const handleCopy = () => {
    const textToCopy = displayedText;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .txt file
  const handleDownloadTxt = () => {
    const textToDownload = displayedText;
    if (!textToDownload) return;
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    let namePrefix = 'tieu_thuyet_trich_xuat';
    if (focusedChapter) {
      namePrefix = `${focusedChapter.index.toString().padStart(2, '0')}_${focusedChapter.fullTitle.replace(/[\\/:*?"<>|]/g, '_')}`;
    } else if (isSubsetSelected) {
      const rangeLabel = getChapterRangeDescription(selectedChapters)
        .replace(/[\\/:*?"<>| \t]/g, '_')
        .slice(0, 30);
      namePrefix = `TieuThuyet_${rangeLabel}`;
    }

    a.download = `${namePrefix}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Trigger quick translation
  const handleTranslate = async () => {
    const textToTranslate = focusedChapter
      ? focusedChapter.content
      : isSubsetSelected
      ? combineChaptersText(selectedChapters, false)
      : fullText;
    if (!textToTranslate) return;
    setIsTranslating(true);
    setTranslationError(null);
    try {
      const res = await fetch('/api/quick-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate.slice(0, 4000),
          type: 'translate',
          model: 'gemini-flash-latest',
        }),
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
    return { chars, lines, chapterCount: chapters.length };
  }, [fullText, chapters]);

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
            onClick={() => setActiveTab('chapters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'chapters'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Mục lục & Tách chương ({chapters.length})</span>
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
          {/* Chapter view filter indicator */}
          {focusedChapter ? (
            <button
              type="button"
              onClick={() => setFocusedChapterId(null)}
              className="text-[11px] px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-400 border border-amber-500/30 font-medium"
              title="Nhấn để thoát chế độ xem riêng chương này"
            >
              Đang xem riêng: {focusedChapter.title} (Bấm xem tất cả)
            </button>
          ) : isSubsetSelected ? (
            <button
              type="button"
              onClick={() => setSelectedChapterIds(chapters.map((c) => c.id))}
              className="text-[11px] px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-400 border border-amber-500/30 font-medium"
              title="Nhấn để chọn lại toàn bộ các chương"
            >
              Đang lọc: {selectedChapters.length}/{chapters.length} chương (Bấm xem tất cả)
            </button>
          ) : null}

          <button
            type="button"
            id="btn-copy-all"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-md shadow-amber-900/20 transition active:scale-95"
            title={
              focusedChapter
                ? 'Sao chép nội dung chương này'
                : isSubsetSelected
                ? `Sao chép ${selectedChapters.length} chương đã chọn`
                : 'Sao chép toàn bộ văn bản thô'
            }
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>
              {copied
                ? 'Đã sao chép 100%!'
                : focusedChapter
                ? `Copy ${focusedChapter.title}`
                : isSubsetSelected
                ? `Copy ${selectedChapters.length} chương`
                : 'Sao chép toàn bộ (1-Click)'}
            </span>
          </button>

          <button
            type="button"
            id="btn-download-txt"
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition"
            title="Tải văn bản thô về máy dưới dạng tệp .txt"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>
              {focusedChapter
                ? `Tải ${focusedChapter.title} .txt`
                : isSubsetSelected
                ? `Tải ${selectedChapters.length} chương .txt`
                : 'Tải .txt'}
            </span>
          </button>
        </div>
      </div>

      {/* Sub-toolbar: Search, Font Controls, Chapter Boundary Toggles, Stats */}
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

        {/* Boundary delimiter toggle for Code tab */}
        {activeTab === 'code' && chapters.length > 1 && !focusedChapter && (
          <button
            type="button"
            onClick={() => setShowBoundaryMarkers(!showBoundaryMarkers)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition border ${
              showBoundaryMarkers
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border-stone-800'
            }`}
            title="Bật/tắt khung phân cách ranh giới chương trực quan trong khối mã"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>
              {showBoundaryMarkers ? 'Khung ranh giới: BẬT' : 'Khung ranh giới: TẮT'}
            </span>
          </button>
        )}

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
              Noto Serif
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
              Mono
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
          {stats.chapterCount > 0 && (
            <>
              <span>•</span>
              <span className="text-amber-400 font-semibold">
                {stats.chapterCount} chương nhận diện
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 bg-stone-950">
        {/* Chapter Navigator with Range Picker & Multi-selection (Available for all tabs) */}
        {chapters.length > 0 && (
          <ChapterNavigator
            chapters={chapters}
            selectedChapterIds={selectedChapterIds}
            onSelectChapters={setSelectedChapterIds}
            focusedChapterId={focusedChapterId}
            onSetFocusedChapter={setFocusedChapterId}
            totalCharacters={stats.chars}
          />
        )}

        {/* Tab 1: Code Block View (Strict Master Prompt Requirement) */}
        {activeTab === 'code' && (
          <div className="relative group">
            {/* Header info badge if viewing a single focused chapter or subset */}
            {focusedChapter ? (
              <div className="mb-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                <span className="text-amber-300 font-medium">
                  Đang hiển thị riêng: <strong>{focusedChapter.fullTitle}</strong> (Từ Dòng {focusedChapter.startLine} đến Dòng {focusedChapter.endLine} • {focusedChapter.charCount} ký tự)
                </span>
                <button
                  type="button"
                  onClick={() => setFocusedChapterId(null)}
                  className="text-amber-400 hover:text-amber-200 underline text-[11px]"
                >
                  Xem lại toàn bộ truyện
                </button>
              </div>
            ) : isSubsetSelected ? (
              <div className="mb-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                <span className="text-amber-300 font-medium">
                  Đang lọc hiển thị {selectedChapters.length} chương đã chọn: <strong>{getChapterRangeDescription(selectedChapters)}</strong> ({selectedChapters.reduce((acc, c) => acc + c.charCount, 0).toLocaleString()} chữ Hán)
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedChapterIds(chapters.map((c) => c.id))}
                  className="text-amber-400 hover:text-amber-200 underline text-[11px]"
                >
                  Hiện lại tất cả {chapters.length} chương
                </button>
              </div>
            ) : null}

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
              <code>{displayedText}</code>
            </pre>
          </div>
        )}

        {/* Tab 2: Dedicated Chapters Inspector View */}
        {activeTab === 'chapters' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {chapters.map((ch) => {
                const isSelected = selectedChapterIds.includes(ch.id);

                return (
                  <div
                    key={ch.id}
                    onClick={() => {
                      if (selectedChapterIds.includes(ch.id)) {
                        setSelectedChapterIds(selectedChapterIds.filter((id) => id !== ch.id));
                      } else {
                        setSelectedChapterIds([...selectedChapterIds, ch.id]);
                      }
                    }}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 shadow-lg ring-1 ring-amber-500/40'
                        : 'bg-stone-900/70 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-stone-700 bg-stone-800 text-amber-500 focus:ring-0 cursor-pointer"
                          />
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-800 text-amber-400">
                            Chương #{ch.index}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-stone-400">
                          Dòng {ch.startLine} → {ch.endLine}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-stone-100 line-clamp-1 mb-1 font-serif">
                        {ch.fullTitle}
                      </h4>

                      <p className="text-xs text-stone-400 line-clamp-2 font-serif italic mb-3">
                        "{ch.startPreview}..."
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
                      <span className="text-stone-400 font-mono text-[11px]">
                        {ch.charCount.toLocaleString()} ký tự • {ch.lineCount} dòng
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFocusedChapterId(ch.id);
                          setActiveTab('code');
                        }}
                        className="text-amber-400 hover:text-amber-300 font-semibold"
                      >
                        Đọc chương này →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Side-by-Side Inspector */}
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
                {displayedText}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Quick AI Translation Preview */}
        {activeTab === 'translation' && (
          <div className="bg-stone-900/60 rounded-xl border border-stone-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-stone-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Bản dịch thử tiếng Việt{' '}
                  {focusedChapter
                    ? `(${focusedChapter.title})`
                    : isSubsetSelected
                    ? `(${selectedChapters.length} chương)`
                    : '(Xem trước)'}
                </h4>
                <p className="text-xs text-stone-400">
                  {focusedChapter
                    ? `Đang dịch riêng ${focusedChapter.fullTitle} bằng Gemini`
                    : isSubsetSelected
                    ? `Đang dịch ${selectedChapters.length} chương đã chọn bằng Gemini`
                    : 'Dịch ngữ cảnh tự động bằng Gemini để kiểm tra nội dung truyện'}
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
        <span>Đã tích hợp bộ nhận diện ranh giới chương (第X章, 第一章...).</span>
        <span>Nhấp đúp chuột để bôi đen hoặc dùng nút Copy (1-Click) ở trên.</span>
      </div>
    </div>
  );
};
