import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Terminal, Sliders, ShieldCheck } from 'lucide-react';
import { MASTER_SYSTEM_PROMPT } from '../utils/helpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualInstructionsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(MASTER_SYSTEM_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div>
            <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              Hướng Dẫn Thiết Lập Google AI Studio & Master Prompt
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Áp dụng trực tiếp trong ứng dụng này hoặc sao chép vào Google AI Studio thủ công
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-stone-300">
          {/* Step 1 */}
          <section className="bg-stone-950/50 rounded-xl p-4 border border-stone-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                BƯỚC 1: Cài đặt "System Instructions" (Lệnh hệ thống)
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép Master Prompt'}</span>
              </button>
            </div>
            <p className="text-xs text-stone-400 mb-3">
              Trong Google AI Studio, tạo một Chat Prompt mới. Tìm mục <strong>System Instructions</strong> ở bên trái màn hình và dán toàn bộ đoạn văn bản dưới đây vào:
            </p>
            <div className="relative">
              <pre className="bg-stone-900 border border-stone-800 rounded-lg p-3.5 font-mono text-xs text-stone-200 overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed">
                {MASTER_SYSTEM_PROMPT}
              </pre>
            </div>
          </section>

          {/* Step 2 */}
          <section className="bg-stone-950/50 rounded-xl p-4 border border-stone-800/80 space-y-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              BƯỚC 2: Cài đặt Model
            </span>
            <p className="text-xs text-stone-400">
              Ở cột bên phải của Google AI Studio (hoặc trong ứng dụng này):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-stone-900 p-3 rounded-lg border border-stone-800">
                <div className="text-xs font-medium text-stone-300 flex items-center gap-1.5 mb-1">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  Model Gemini Vision
                </div>
                <p className="text-xs text-stone-400">
                  Chọn <strong>Gemini 3.8 Flash / 1.5 Pro</strong> (khả năng đọc ảnh, nhận diện chữ nhỏ xuất sắc, xử lý nhanh chóng).
                </p>
              </div>
              <div className="bg-stone-900 p-3 rounded-lg border border-stone-800">
                <div className="text-xs font-medium text-stone-300 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Temperature = 0 hoặc 0.1
                </div>
                <p className="text-xs text-stone-400">
                  <strong>Cực kỳ quan trọng:</strong> Nhiệt độ thấp giúp AI không "sáng tạo" hay bịa chữ, chỉ tập trung trích xuất chính xác 100%.
                </p>
              </div>
            </div>
          </section>

          {/* Step 3 */}
          <section className="bg-stone-950/50 rounded-xl p-4 border border-stone-800/80 space-y-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              BƯỚC 3: Cách thao tác hằng ngày & Mẹo chia mẻ (Batch)
            </span>
            <div className="text-xs text-stone-300 space-y-2 leading-relaxed">
              <div className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-lg text-amber-200">
                <strong>💡 Mẹo vàng chia nhỏ theo mẻ (Batch):</strong>
                <p className="mt-1 text-stone-300">
                  Đừng tải lên hàng trăm ảnh cùng lúc trong 1 lần gọi vì sẽ làm trình duyệt quá tải bộ nhớ (hết RAM). Thay vào đó, <strong>chia thành từng mẻ 5 - 15 ảnh</strong> (tương đương 1-3 chương).
                </p>
                <p className="mt-1 text-stone-300">
                  Ứng dụng này đã <strong>tự động hóa 100% quy trình này</strong>: bạn có thể thả 50-100 ảnh, công cụ sẽ tự động sắp xếp tên file và tuần tự gửi từng mẻ theo đúng số lượng bạn chọn!
                </p>
              </div>

              <p>
                Câu lệnh ngắn gọn khi gửi ảnh: <code className="bg-stone-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">Hãy trích xuất chữ từ loạt ảnh này.</code>
              </p>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-950/60 flex items-center justify-between">
          <span className="text-xs text-stone-400">
            Ứng dụng hiện tại đã tích hợp sẵn toàn bộ cấu hình trên vào hệ thống server.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
