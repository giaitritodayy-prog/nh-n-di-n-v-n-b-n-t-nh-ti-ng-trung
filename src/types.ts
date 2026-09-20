export interface ImageItem {
  id: string;
  filename: string;
  file?: File;
  previewUrl: string;
  base64Data: string;
  mimeType: string;
  size: number;
  order: number;
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export interface BatchItem {
  batchIndex: number;
  imageIds: string[];
  status: 'idle' | 'processing' | 'completed' | 'error';
  extractedText: string;
  fullOutput?: string;
  errorMessage?: string;
}

export interface OcrConfig {
  batchSize: number;
  temperature: number;
  model: string;
  autoSort: boolean;
  systemInstruction: string;
  chapterDivider: boolean;
}

export interface SessionStats {
  totalImages: number;
  completedImages: number;
  totalBatches: number;
  completedBatches: number;
  totalCharacters: number;
  totalLines: number;
  startTime: number | null;
  endTime: number | null;
}

export interface NovelChapter {
  id: string;
  index: number;
  title: string;
  fullTitle: string;
  startLine: number;
  endLine: number;
  charCount: number;
  lineCount: number;
  content: string;
  startPreview: string;
  endPreview: string;
}
