import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  BookmarkCheck,
  Check,
  Copy,
  Download,
  FileDown,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
  ArrowRight,
  ListFilter,
  Eye,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { NovelChapter } from '../types';
import { combineChaptersText, getChapterRangeDescription } from '../utils/chapterParser';

interface Props {
  chapters: NovelChapter[];
  selectedChapterIds: string[];
  onSelectChapters: (ids: string[]) => void;
  focusedChapterId: string | null;
  onSetFocusedChapter: (id: string | null) => void;
  totalCharacters: number;
}

export const ChapterNavigator: React.FC<Props> = ({
  chapters,
  selectedChapterIds,
  onSelectChapters,
  focusedChapterId,
  onSetFocusedChapter,
  totalCharacters,
}) => {
  const [copiedSuccess, setCopiedSuccess] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'chips' | 'table'>('chips');
  const [includeDividersOnCopy, setIncludeDividersOnCopy] = useState<boolean>(true);

  // Range inputs ("Từ chương X đến chương Y")
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(chapters.length || 1);

  // Drag / Sweep selection state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartIndexRef = useRef<number | null>(null);
  const lastClickedIndexRef = useRef<number | null>(null);

  // Sync range numbers when chapters count changes
  useEffect(() => {
    if (chapters.length > 0) {
      setRangeEnd(chapters.length);
    }
  }, [chapters.length]);

  if (!chapters || chapters.length === 0) return null;

  const hasMultipleChapters = chapters.length > 1;

  // Selected chapters array
  const selectedChapters = useMemo(() => {
    return chapters.filter((c) => selectedChapterIds.includes(c.id));
  }, [chapters, selectedChapterIds]);

  const selectedCount = selectedChapters.length;
  const isAllSelected = chapters.length > 0 && selectedCount === chapters.length;
  const isNoneSelected = selectedCount === 0;

  // Total characters of selected chapters
  const selectedCharsCount = useMemo(() => {
    return selectedChapters.reduce((acc, c) => acc + c.charCount, 0);
  }, [selectedChapters]);

  // Total lines of selected chapters
  const selectedLinesCount = useMemo(() => {
    return selectedChapters.reduce((acc, c) => acc + c.lineCount, 0);
  }, [selectedChapters]);

  // Apply Range from start to end
  const handleApplyRange = (start: number, end: number) => {
    const min = Math.max(1, Math.min(start, end));
    const max = Math.min(chapters.length, Math.max(start, end));
    setRangeStart(min);
    setRangeEnd(max);

    const idsToSelect: string[] = [];
    for (let i = min; i <= max; i++) {
      const ch = chapters[i - 1];
      if (ch) idsToSelect.push(ch.id);
    }
    onSelectChapters(idsToSelect);
  };

  // Select all chapters
  const handleSelectAll = () => {
    onSelectChapters(chapters.map((c) => c.id));
    setRangeStart(1);
    setRangeEnd(chapters.length);
  };

  // Deselect all
  const handleDeselectAll = () => {
    onSelectChapters([]);
  };

  // Invert selection
  const handleInvertSelection = () => {
    const inverted = chapters
      .filter((c) => !selectedChapterIds.includes(c.id))
      .map((c) => c.id);
    onSelectChapters(inverted);
  };

  // Toggle single chapter checkbox
  const handleToggleChapter = (chapter: NovelChapter, e?: React.MouseEvent) => {
    if (e && e.shiftKey && lastClickedIndexRef.current !== null) {
      // Shift + Click range selection
      const from = Math.min(lastClickedIndexRef.current, chapter.index);
      const to = Math.max(lastClickedIndexRef.current, chapter.index);
      handleApplyRange(from, to);
      lastClickedIndexRef.current = chapter.index;
      return;
    }

    lastClickedIndexRef.current = chapter.index;
    if (selectedChapterIds.includes(chapter.id)) {
      onSelectChapters(selectedChapterIds.filter((id) => id !== chapter.id));
    } else {
      onSelectChapters([...selectedChapterIds, chapter.id]);
    }
  };

  // Mouse Drag / Sweep selection handlers
  const handleMouseDown = (index: number) => {
    setIsDragging(true);
    dragStartIndexRef.current = index;
    lastClickedIndexRef.current = index;
  };

  const handleMouseEnter = (index: number) => {
    if (isDragging && dragStartIndexRef.current !== null) {
      const from = Math.min(dragStartIndexRef.current, index);
      const to = Math.max(dragStartIndexRef.current, index);
      handleApplyRange(from, to);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartIndexRef.current = null;
  };

  // Copy selected chapters
  const handleCopySelected = () => {
    const chaptersToCopy = selectedCount > 0 ? selectedChapters : chapters;
    const text = combineChaptersText(chaptersToCopy, includeDividersOnCopy);
    if (!text) return;

    navigator.clipboard.writeText(text);
    setCopiedSuccess('selected');
    setTimeout(() => setCopiedSuccess(null), 2500);
  };

  // Download merged .txt file of selected chapters
  const handleDownloadMerged = () => {
    const chaptersToDownload = selectedCount > 0 ? selectedChapters : chapters;
    const text = combineChaptersText(chaptersToDownload, true);
    if (!text) return;

    const rangeLabel = getChapterRangeDescription(chaptersToDownload)
      .replace(/[\\/:*?"<>| \t]/g, '_')
      .slice(0, 35);
    const filename = `TieuThuyet_${rangeLabel}_${new Date().toISOString().slice(0, 10)}.txt`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download each selected chapter as an individual file
  const handleDownloadIndividualFiles = () => {
    const chaptersToDownload = selectedCount > 0 ? selectedChapters : chapters;
    chaptersToDownload.forEach((chapter, idx) => {
      setTimeout(() => {
        const safeTitle = chapter.fullTitle.replace(/[\\/:*?"<>|]/g, '_');
        const filename = `${chapter.index.toString().padStart(2, '0')}_${safeTitle}.txt`;
        const blob = new Blob([chapter.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, idx * 160);
    });
  };

  // Single chapter copy
  const handleCopySingle = (chapter: NovelChapter, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(chapter.content);
    setCopiedSuccess(chapter.id);
    setTimeout(() => setCopiedSuccess(null), 2000);
  };

  // Single chapter download
  const handleDownloadSingle = (chapter: NovelChapter, e: React.MouseEvent) => {
    e.stopPropagation();
    const safeTitle = chapter.fullTitle.replace(/[\\/:*?"<>|]/g, '_');
    const filename = `${chapter.index.toString().padStart(2, '0')}_${safeTitle}.txt`;
    const blob = new Blob([chapter.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onMouseUp={handleMouseUp}
      className="bg-stone-900/90 border border-stone-800/90 rounded-xl overflow-hidden mb-4 shadow-xl select-none"
    >
      {/* 1. Header Bar: Title, Total chapters & Collapsible toggle */}
      <div className="px-4 py-3 bg-stone-950/80 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                Chọn & Tải Theo Khoảng Chương
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {chapters.length} chương phát hiện
              </span>
              {selectedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Đã chọn {selectedCount}/{chapters.length} chương
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Quét chọn hoặc tích chọn để sao chép hoặc tải xuống từ chương bất kỳ đến chương bất kỳ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle (chips vs table) */}
          <div className="flex items-center bg-stone-900 rounded-lg p-0.5 border border-stone-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('chips')}
              className={`px-2 py-1 rounded transition text-[11px] ${
                viewMode === 'chips'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Thẻ nhanh
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 rounded transition text-[11px] ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Bảng chi tiết
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-stone-400 hover:text-stone-200 px-2 py-1"
          >
            {isExpanded ? 'Thu gọn' : 'Mở rộng'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3.5 space-y-3.5">
          {/* 2. Interactive Range Selector ("Từ chương ... Đến chương ...") */}
          <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-semibold text-stone-300 flex items-center gap-1.5 text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>Chọn theo khoảng:</span>
              </span>

              {/* Start Chapter Dropdown */}
              <div className="flex items-center gap-1 bg-stone-900 px-2 py-1 rounded-lg border border-stone-800">
                <span className="text-stone-500 text-[11px]">Từ:</span>
                <select
                  aria-label="Chọn chương bắt đầu"
                  value={rangeStart}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRangeStart(val);
                    handleApplyRange(val, rangeEnd);
                  }}
                  className="bg-transparent text-amber-300 font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {chapters.map((c) => (
                    <option key={`start-${c.id}`} value={c.index} className="bg-stone-900 text-stone-200">
                      Chương {c.index} ({c.title})
                    </option>
                  ))}
                </select>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-stone-600" />

              {/* End Chapter Dropdown */}
              <div className="flex items-center gap-1 bg-stone-900 px-2 py-1 rounded-lg border border-stone-800">
                <span className="text-stone-500 text-[11px]">Đến:</span>
                <select
                  aria-label="Chọn chương kết thúc"
                  value={rangeEnd}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRangeEnd(val);
                    handleApplyRange(rangeStart, val);
                  }}
                  className="bg-transparent text-amber-300 font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {chapters.map((c) => (
                    <option key={`end-${c.id}`} value={c.index} className="bg-stone-900 text-stone-200">
                      Chương {c.index} ({c.title})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 border-l border-stone-800 pl-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition border ${
                    isAllSelected
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200 border-stone-800'
                  }`}
                >
                  Tất cả (1-{chapters.length})
                </button>

                {chapters.length >= 3 && (
                  <button
                    type="button"
                    onClick={() => handleApplyRange(1, Math.min(3, chapters.length))}
                    className="px-2 py-1 rounded text-[11px] bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition"
                  >
                    Chương 1-3
                  </button>
                )}

                {chapters.length >= 5 && (
                  <button
                    type="button"
                    onClick={() => handleApplyRange(1, Math.min(5, chapters.length))}
                    className="px-2 py-1 rounded text-[11px] bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition"
                  >
                    Chương 1-5
                  </button>
                )}

                {chapters.length >= 10 && (
                  <button
                    type="button"
                    onClick={() => handleApplyRange(1, 10)}
                    className="px-2 py-1 rounded text-[11px] bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition"
                  >
                    Chương 1-10
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDeselectAll}
                  disabled={isNoneSelected}
                  className="px-2 py-1 rounded text-[11px] text-stone-500 hover:text-stone-300 transition disabled:opacity-40"
                  title="Bỏ chọn tất cả"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            {/* Sweep hint */}
            <div className="text-[11px] text-stone-500 italic hidden sm:block">
              Mẹo: Nhấn giữ chuột và kéo để quét chọn hoặc giữ Shift + Click
            </div>
          </div>

          {/* 3. Action Toolbar for Selected Chapters (Always visible and prominent) */}
          <div className="p-3 rounded-xl bg-stone-950 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-md">
            {/* Selection metrics */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-300">
                <BookmarkCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-200 text-xs">
                    {selectedCount === 0
                      ? 'Chưa chọn chương nào'
                      : selectedCount === chapters.length
                      ? `Toàn bộ ${chapters.length} chương`
                      : getChapterRangeDescription(selectedChapters)}
                  </span>
                  {selectedCount > 0 && (
                    <span className="text-[11px] text-amber-400 font-mono">
                      ({selectedCharsCount.toLocaleString()} chữ • {selectedLinesCount} dòng)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  {selectedCount === 0
                    ? 'Tích chọn các chương bên dưới hoặc chọn khoảng để Copy / Tải'
                    : `Sẵn sàng sao chép hoặc tải ${selectedCount} chương đã đánh dấu`}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Option to include chapter delimiter */}
              <label
                className="flex items-center gap-1.5 text-[11px] text-stone-400 cursor-pointer mr-1"
                title="Thêm dấu ngắt dòng tiêu đề chương khi gộp"
              >
                <input
                  type="checkbox"
                  checked={includeDividersOnCopy}
                  onChange={(e) => setIncludeDividersOnCopy(e.target.checked)}
                  className="rounded border-stone-700 bg-stone-800 text-amber-500 focus:ring-0 focus:ring-offset-0"
                />
                <span>Có dấu phân cách chương</span>
              </label>

              {/* 1-Click Copy Selected */}
              <button
                type="button"
                onClick={handleCopySelected}
                disabled={selectedCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md transition disabled:opacity-40 disabled:pointer-events-none"
              >
                {copiedSuccess === 'selected' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã sao chép {selectedCount} chương!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép {selectedCount > 0 ? `${selectedCount} chương` : ''} (1-Click)</span>
                  </>
                )}
              </button>

              {/* Download Merged .txt */}
              <button
                type="button"
                onClick={handleDownloadMerged}
                disabled={selectedCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition disabled:opacity-40 disabled:pointer-events-none"
                title="Tải gộp toàn bộ các chương đã chọn vào một file .txt duy nhất"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Tải gộp 1 file .txt</span>
              </button>

              {/* Download Individual .txt files */}
              {selectedCount > 1 && (
                <button
                  type="button"
                  onClick={handleDownloadIndividualFiles}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition"
                  title="Tải riêng từng chương thành các file .txt độc lập"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tải rời {selectedCount} file</span>
                </button>
              )}
            </div>
          </div>

          {/* 4. View Mode: Chips / Pills with Drag & Sweep selection */}
          {viewMode === 'chips' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400 px-1">
                <span>Danh sách chương (Nhấp hoặc quét chuột qua các thẻ để chọn):</span>
                <span className="text-[11px] text-stone-500">
                  {selectedCount}/{chapters.length} chương được chọn
                </span>
              </div>

              <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
                onMouseLeave={handleMouseUp}
              >
                {chapters.map((chapter) => {
                  const isChecked = selectedChapterIds.includes(chapter.id);
                  const isFocused = focusedChapterId === chapter.id;

                  return (
                    <div
                      key={chapter.id}
                      onMouseDown={() => handleMouseDown(chapter.index)}
                      onMouseEnter={() => handleMouseEnter(chapter.index)}
                      onClick={(e) => handleToggleChapter(chapter, e)}
                      className={`group relative p-2.5 rounded-xl border text-xs cursor-pointer transition-all duration-150 select-none ${
                        isChecked
                          ? 'bg-stone-900/95 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-stone-900/40 border-stone-800/80 hover:bg-stone-900 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Checkbox */}
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition ${
                              isChecked
                                ? 'bg-amber-500 text-stone-950 font-bold'
                                : 'border border-stone-700 bg-stone-950 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>

                          <div className="min-w-0">
                            <span
                              className={`font-semibold truncate block ${
                                isChecked ? 'text-amber-300' : 'text-stone-300'
                              }`}
                            >
                              {chapter.fullTitle}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono mt-0.5">
                              <span>Dòng {chapter.startLine}-{chapter.endLine}</span>
                              <span>•</span>
                              <span>{chapter.charCount} chữ</span>
                            </div>
                          </div>
                        </div>

                        {/* Individual mini action buttons on hover */}
                        <div
                          className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleCopySingle(chapter, e)}
                            className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-amber-400 transition"
                            title="Sao chép chương này"
                          >
                            {copiedSuccess === chapter.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDownloadSingle(chapter, e)}
                            className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-amber-400 transition"
                            title="Tải riêng chương này (.txt)"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Small snippet preview */}
                      <p className="text-[10px] text-stone-500 italic mt-1.5 line-clamp-1 font-serif">
                        "{chapter.startPreview}..."
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 5. View Mode: Detailed Table with Checkboxes */
            <div className="overflow-x-auto rounded-lg border border-stone-800">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950/90 text-stone-400 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="px-3 py-2 w-10 text-center">
                      <button
                        type="button"
                        onClick={isAllSelected ? handleDeselectAll : handleSelectAll}
                        className="p-0.5 hover:text-amber-300 transition"
                        title={isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-3 py-2">STT</th>
                    <th className="px-3 py-2">Tiêu đề chương</th>
                    <th className="px-3 py-2">Vị trí (Từ đâu đến đâu)</th>
                    <th className="px-3 py-2">Đoạn đầu</th>
                    <th className="px-3 py-2 text-right">Số chữ</th>
                    <th className="px-3 py-2 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 bg-stone-900/40">
                  {chapters.map((ch) => {
                    const isChecked = selectedChapterIds.includes(ch.id);

                    return (
                      <tr
                        key={ch.id}
                        onClick={(e) => handleToggleChapter(ch, e)}
                        className={`transition cursor-pointer ${
                          isChecked
                            ? 'bg-amber-500/10 hover:bg-amber-500/15'
                            : 'hover:bg-stone-800/60'
                        }`}
                      >
                        <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleChapter(ch)}
                            className="rounded border-stone-700 bg-stone-800 text-amber-500 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-stone-500 font-bold">
                          {ch.index.toString().padStart(2, '0')}
                        </td>
                        <td className="px-3 py-2 font-bold">
                          <span className={isChecked ? 'text-amber-300' : 'text-stone-200'}>
                            {ch.fullTitle}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-amber-300/90 text-[11px]">
                          Dòng {ch.startLine} → Dòng {ch.endLine} ({ch.lineCount} dòng)
                        </td>
                        <td className="px-3 py-2 font-serif text-[11px] text-stone-400 max-w-[200px] truncate">
                          "{ch.startPreview}..."
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-300">
                          {ch.charCount.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleCopySingle(ch, e)}
                              className="p-1 rounded hover:bg-stone-700 text-stone-300 hover:text-amber-400 transition"
                              title="Sao chép chương này"
                            >
                              {copiedSuccess === ch.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDownloadSingle(ch, e)}
                              className="p-1 rounded hover:bg-stone-700 text-stone-300 hover:text-amber-400 transition"
                              title="Tải riêng chương này (.txt)"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
