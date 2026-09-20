import React from 'react';
import { X, Sliders, RotateCcw, Check } from 'lucide-react';
import { OcrConfig } from '../types';
import { MASTER_SYSTEM_PROMPT } from '../utils/helpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: OcrConfig;
  onChangeConfig: (newConfig: OcrConfig) => void;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
}) => {
  if (!isOpen) return null;

  const handleResetPrompt = () => {
    onChangeConfig({
      ...config,
      systemInstruction: MASTER_SYSTEM_PROMPT,
      temperature: 0.0,
      batchSize: 10,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-stone-100">Cấu Hình OCR & Xử Lý Mẻ</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-stone-300">
          {/* Batch Size */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              Số lượng ảnh mỗi mẻ (Batch Size)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, batchSize: size })}
                  className={`py-2 px-3 rounded-lg text-center font-medium border text-xs transition ${
                    config.batchSize === size
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-stone-800/60 text-stone-300 border-stone-700/60 hover:bg-stone-800'
                  }`}
                >
                  {size} ảnh / mẻ
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-500 mt-1.5">
              Khuyên dùng <strong>10 ảnh</strong>: Tối ưu bộ nhớ RAM, tránh treo trình duyệt và đạt độ chính xác cao nhất theo lời khuyên của chuyên gia.
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              Mô hình Vision AI (Model)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'gemini-flash-latest',
                  name: 'Gemini Flash Latest',
                  desc: 'Khuyên dùng: Tự động điều phối tải, tránh lỗi 503 cao điểm',
                },
                {
                  id: 'gemini-3.8-flash',
                  name: 'Gemini 3.8 Flash',
                  desc: 'Mô hình thế hệ mới (tư duy sâu & nhận diện chính xác)',
                },
                {
                  id: 'gemini-3.6-flash',
                  name: 'Gemini 3.6 Flash',
                  desc: 'Bản Flash tiêu chuẩn chất lượng cao',
                },
                {
                  id: 'gemini-3.1-flash-lite',
                  name: 'Gemini 3.1 Flash Lite',
                  desc: 'Siêu nhẹ & tốc độ phản hồi tức thì',
                },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, model: m.id })}
                  className={`p-2.5 rounded-lg text-left border text-xs transition ${
                    config.model === m.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-stone-800/60 text-stone-300 border-stone-700/60 hover:bg-stone-800'
                  }`}
                >
                  <div className="font-semibold text-stone-200">{m.name}</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-500 mt-1.5">
              * Tích hợp cơ chế tự động chuyển đổi dự phòng & thử lại khi máy chủ Google gặp lưu lượng cao (503).
            </p>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              Nhiệt độ sáng tạo (Temperature)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 0.0, label: '0.0 (Tuyệt đối chuẩn xác - Khuyên dùng)' },
                { val: 0.1, label: '0.1 (Hiệu đính ngữ cảnh chữ mờ)' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, temperature: item.val })}
                  className={`py-2 px-3 rounded-lg text-left font-medium border text-xs transition ${
                    config.temperature === item.val
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-stone-800/60 text-stone-300 border-stone-700/60 hover:bg-stone-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-500 mt-1.5">
              Giữ nhiệt độ ở mức 0.0 - 0.1 để AI không tự ý thêm thắt từ ngữ ngoài văn bản gốc.
            </p>
          </div>

          {/* Natural Sorting */}
          <div className="flex items-center justify-between p-3.5 bg-stone-950/40 rounded-xl border border-stone-800">
            <div>
              <div className="text-xs font-semibold text-stone-200">
                Tự động sắp xếp ảnh theo số đếm tự nhiên
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Đảm bảo thứ tự đọc chính xác (01.jpg, 02.jpg, ... 10.jpg thay vì 1, 10, 2).
              </p>
            </div>
            <input
              type="checkbox"
              id="sort-toggle"
              checked={config.autoSort}
              onChange={(e) => onChangeConfig({ ...config, autoSort: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 bg-stone-800 border-stone-700 focus:ring-amber-500/20"
            />
          </div>

          {/* Master Prompt Customization */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Lệnh hệ thống (System Instruction)
              </label>
              <button
                type="button"
                onClick={handleResetPrompt}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Khôi phục mặc định</span>
              </button>
            </div>
            <textarea
              value={config.systemInstruction}
              onChange={(e) => onChangeConfig({ ...config, systemInstruction: e.target.value })}
              rows={8}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 font-mono text-xs text-stone-200 focus:outline-none focus:border-amber-500/50 resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-950/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Lưu & Đóng</span>
          </button>
        </div>
      </div>
    </div>
  );
};
