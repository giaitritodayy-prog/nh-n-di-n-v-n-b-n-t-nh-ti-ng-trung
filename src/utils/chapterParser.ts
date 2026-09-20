import { NovelChapter } from '../types';

/**
 * Regex matching standard Chinese novel chapter titles:
 * - 第1章, 第 1 章, 第01章, 第100章
 * - 第一章, 第二章, 第十章, 第一百二十章
 * - 第1回, 第一回, 第1节, 第1卷, 第1话
 * - 【第1章】, [第一章], Chapter 1
 */
export const CHAPTER_REGEX =
  /^(?:[-=*#]{2,}\s*)?(?:[【\[（(])?\s*(第\s*[0-9一二三四五六七八九十百千万零〇]+\s*[章回节卷话篇]|Chapter\s*[0-9]+)(?:[:：\s]+([^】\]）)\r\n]*))?(?:[】\]）)])?\s*$/i;

/**
 * Checks if a single line is a chapter heading.
 */
export function isChapterHeadingLine(line: string): { isHeading: boolean; chapterNumText?: string; titleSuffix?: string } {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 60) {
    return { isHeading: false };
  }

  const match = trimmed.match(CHAPTER_REGEX);
  if (match) {
    return {
      isHeading: true,
      chapterNumText: match[1].replace(/\s+/g, ''),
      titleSuffix: (match[2] || '').trim(),
    };
  }

  // Secondary fallback: lines like "第1章" or "第一章" embedded with subtle punctuation
  const looseMatch = trimmed.match(/^(第\s*[0-9一二三四五六七八九十百千万零〇]+\s*[章回节卷话篇])\s*(.*)$/);
  if (looseMatch && trimmed.length <= 40) {
    return {
      isHeading: true,
      chapterNumText: looseMatch[1].replace(/\s+/g, ''),
      titleSuffix: looseMatch[2].trim(),
    };
  }

  return { isHeading: false };
}

/**
 * Parses fullText into individual chapters with boundaries:
 * startLine, endLine, charCount, lineCount, content, and previews.
 */
export function parseNovelChapters(fullText: string): NovelChapter[] {
  if (!fullText || !fullText.trim()) {
    return [];
  }

  const lines = fullText.split('\n');
  const headings: { lineIndex: number; rawLine: string; chapterNumText: string; titleSuffix: string }[] = [];

  lines.forEach((line, idx) => {
    const { isHeading, chapterNumText, titleSuffix } = isChapterHeadingLine(line);
    if (isHeading && chapterNumText) {
      headings.push({
        lineIndex: idx,
        rawLine: line.trim(),
        chapterNumText,
        titleSuffix: titleSuffix || '',
      });
    }
  });

  // If no chapter headers were detected at all, treat whole text as 1 chapter
  if (headings.length === 0) {
    const trimmed = fullText.trim();
    const chars = trimmed.replace(/\s+/g, '').length;
    return [
      {
        id: 'chapter-single',
        index: 1,
        title: 'Toàn bộ nội dung',
        fullTitle: 'Toàn bộ nội dung (Chưa phát hiện tiêu đề 第X章)',
        startLine: 1,
        endLine: lines.length,
        charCount: chars,
        lineCount: lines.length,
        content: fullText,
        startPreview: trimmed.slice(0, 50),
        endPreview: trimmed.slice(-50),
      },
    ];
  }

  const result: NovelChapter[] = [];

  // Check if there is content before the first recognized chapter (e.g. Prologue / Giới thiệu / Mở đầu)
  const firstHeadingLine = headings[0].lineIndex;
  if (firstHeadingLine > 0) {
    const prologueLines = lines.slice(0, firstHeadingLine);
    const prologueContent = prologueLines.join('\n').trim();
    const prologueChars = prologueContent.replace(/\s+/g, '').length;

    if (prologueChars > 0) {
      result.push({
        id: 'chapter-prologue',
        index: 0,
        title: 'Mở đầu / Tiền truyện',
        fullTitle: 'Mở đầu (Phần trước Chương 1)',
        startLine: 1,
        endLine: firstHeadingLine,
        charCount: prologueChars,
        lineCount: firstHeadingLine,
        content: prologueContent,
        startPreview: prologueContent.slice(0, 45),
        endPreview: prologueContent.slice(-45),
      });
    }
  }

  // Iterate over each detected chapter
  for (let i = 0; i < headings.length; i++) {
    const current = headings[i];
    const next = headings[i + 1];

    const startLineIndex = current.lineIndex;
    const endLineIndex = next ? next.lineIndex - 1 : lines.length - 1;

    const chapterLines = lines.slice(startLineIndex, endLineIndex + 1);
    const chapterContent = chapterLines.join('\n');
    const trimmedContent = chapterContent.trim();
    const chars = trimmedContent.replace(/\s+/g, '').length;

    const cleanTitle = current.titleSuffix
      ? `${current.chapterNumText} ${current.titleSuffix}`
      : current.chapterNumText;

    // First line after title or first characters
    const bodyLines = chapterLines.slice(1).filter((l) => l.trim().length > 0);
    const firstBodyText = bodyLines.length > 0 ? bodyLines[0].trim() : trimmedContent;
    const lastBodyText = bodyLines.length > 0 ? bodyLines[bodyLines.length - 1].trim() : trimmedContent;

    result.push({
      id: `chapter-${i + 1}`,
      index: i + 1,
      title: current.chapterNumText,
      fullTitle: cleanTitle,
      startLine: startLineIndex + 1,
      endLine: endLineIndex + 1,
      charCount: chars,
      lineCount: endLineIndex - startLineIndex + 1,
      content: chapterContent,
      startPreview: firstBodyText.slice(0, 45),
      endPreview: lastBodyText.slice(-45),
    });
  }

  return result;
}

/**
 * Generates an enriched formatted text with explicit boundary markers
 * between chapters (e.g. --- BẮT ĐẦU 第1章 --- and --- KẾT THÚC 第1章 ---).
 */
export function formatTextWithChapterBoundaries(chapters: NovelChapter[]): string {
  if (chapters.length <= 1 && chapters[0]?.id === 'chapter-single') {
    return chapters[0].content;
  }

  return chapters
    .map((c) => {
      const boundaryHeader = `\n========================================\n【 ${c.fullTitle} 】 (Dòng ${c.startLine} - ${c.endLine} • ${c.charCount.toLocaleString()} chữ)\n========================================\n`;
      return `${boundaryHeader}\n${c.content.trim()}\n`;
    })
    .join('\n');
}

/**
 * Combines selected chapters into a single string.
 * Can optionally include separator dividers or keep pure raw text.
 */
export function combineChaptersText(chapters: NovelChapter[], includeDividers: boolean = false): string {
  if (chapters.length === 0) return '';
  if (chapters.length === 1) return chapters[0].content;

  if (includeDividers) {
    return chapters
      .map((c) => {
        const header = `\n---\n${c.fullTitle}\n---\n`;
        return `${header}\n${c.content.trim()}\n`;
      })
      .join('\n');
  }

  // Pure raw joined content
  return chapters.map((c) => c.content.trim()).join('\n\n');
}

/**
 * Returns a human-friendly range label for a list of chapters
 * e.g. "Chương 1 - Chương 5" or "Chương 3" or "3 chương đã chọn"
 */
export function getChapterRangeDescription(chapters: NovelChapter[]): string {
  if (chapters.length === 0) return 'Chưa chọn chương nào';
  if (chapters.length === 1) return chapters[0].title;

  const sorted = [...chapters].sort((a, b) => a.index - b.index);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  // Check if consecutive
  const isConsecutive = sorted.every((c, idx) => idx === 0 || c.index === sorted[idx - 1].index + 1);
  if (isConsecutive) {
    return `${first.title} → ${last.title} (${sorted.length} chương)`;
  }

  return `${sorted.length} chương (${first.title} ... ${last.title})`;
}

