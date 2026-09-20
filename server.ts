import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for batch base64 images
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

const DEFAULT_MASTER_PROMPT = `Bạn là một chuyên gia nhận diện quang học (OCR) và xử lý ngôn ngữ tiếng Trung, đặc biệt chuyên về các văn bản tiểu thuyết, truyện dài kỳ.

Nhiệm vụ duy nhất của bạn là: Nhận diện, đọc và trích xuất toàn bộ chữ tiếng Trung từ các bức ảnh do người dùng tải lên, sau đó gộp chúng lại và trả về dưới dạng văn bản thô (Raw text) với độ chính xác 100%.

Hãy tuân thủ nghiêm ngặt các quy tắc sau:

Xử lý theo thứ tự: Người dùng sẽ tải lên nhiều ảnh có đánh số thứ tự (ví dụ: 01.jpg, 02.jpg, 03.jpg...). Bạn MẶC ĐỊNH phải đọc và ghép nối văn bản theo đúng trình tự số đếm của tên file ảnh.

Không thêm thắt: Chỉ trích xuất ĐÚNG VÀ ĐỦ những gì có trong ảnh. Tuyệt đối KHÔNG tự ý tóm tắt, KHÔNG bình luận, KHÔNG dịch thuật (trừ khi có yêu cầu riêng), KHÔNG thêm lời chào hỏi hay kết luận của AI.

Hiệu đính thông minh: Nếu ảnh bị mờ, lóa khiến một số chữ bị nhòe, hãy dựa vào ngữ cảnh của câu tiểu thuyết tiếng Trung để tự động sửa lỗi ký tự OCR cho đúng chính tả và ngữ pháp.

Giữ nguyên định dạng: Giữ nguyên các dấu câu (dấu ngoặc kép, dấu phẩy, dấu chấm...), khoảng cách, và ngắt dòng (xuống dòng) hệt như trong ảnh gốc để đoạn văn mạch lạc.

Định dạng Đầu ra (Output format):

Đặt toàn bộ văn bản kết quả vào trong một khối mã (Code block) để người dùng có thể sao chép dễ dàng chỉ bằng 1 cú click.

Giữa nội dung của các ảnh khác nhau, nối tiếp nhau một cách tự nhiên. Nếu hết 1 chương, có thể đánh dấu bằng ký hiệu ---.`;

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chưa cấu hình GEMINI_API_KEY trong hệ thống.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Master prompt information
app.get("/api/prompt-info", (req, res) => {
  res.json({
    masterPrompt: DEFAULT_MASTER_PROMPT,
    recommendedModel: "gemini-3.6-flash",
    recommendedTemperature: 0.0,
  });
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableError(error: any): boolean {
  const errMsg = String(error?.message || error || "").toLowerCase();
  const status = String(error?.status || "").toUpperCase();
  const code = error?.code || error?.status;
  return (
    code === 503 ||
    code === 429 ||
    code === 500 ||
    status === "UNAVAILABLE" ||
    status === "RESOURCE_EXHAUSTED" ||
    errMsg.includes("503") ||
    errMsg.includes("high demand") ||
    errMsg.includes("spikes in demand") ||
    errMsg.includes("unavailable") ||
    errMsg.includes("temporarily") ||
    errMsg.includes("overloaded") ||
    errMsg.includes("resource_exhausted") ||
    errMsg.includes("rate limit")
  );
}

function isModelNotFoundError(error: any): boolean {
  const errMsg = String(error?.message || error || "").toLowerCase();
  const status = String(error?.status || "").toUpperCase();
  const code = error?.code || error?.status;
  return (
    code === 404 ||
    status === "NOT_FOUND" ||
    errMsg.includes("404") ||
    errMsg.includes("not found") ||
    errMsg.includes("no longer available") ||
    errMsg.includes("is not found")
  );
}

// Fallback model list if the requested model experiences 503 high demand or 404 deprecation
const FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
];

async function generateContentWithRetryAndFallback(
  ai: any,
  preferredModel: string,
  generateParams: { contents: any; config: any }
) {
  // Filter out known discontinued models like gemini-2.5-flash
  const cleanPreferred =
    preferredModel === "gemini-2.5-flash" ? "gemini-3.6-flash" : preferredModel;

  // Build unique model candidate chain
  const modelsToTry = Array.from(
    new Set([cleanPreferred, ...FALLBACK_MODELS].filter(Boolean))
  );

  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini OCR] Trying model '${currentModel}' (attempt ${attempt}/${maxAttempts})...`);
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: generateParams.contents,
          config: generateParams.config,
        });

        return {
          response,
          modelUsed: currentModel,
        };
      } catch (error: any) {
        lastError = error;
        console.warn(
          `[Gemini OCR] Warning on model '${currentModel}' (attempt ${attempt}): ${error?.message || error}`
        );

        if (isModelNotFoundError(error)) {
          console.warn(
            `[Gemini OCR] Model '${currentModel}' is not found or no longer available (404). Falling back to next model immediately...`
          );
          // Break the attempt loop for this model so we try the next fallback model
          break;
        }

        if (isRetryableError(error)) {
          if (attempt < maxAttempts) {
            const delayMs = attempt * 1200 + Math.floor(Math.random() * 600);
            console.log(`[Gemini OCR] Retrying '${currentModel}' in ${delayMs}ms due to high demand/503 spike...`);
            await sleep(delayMs);
            continue;
          } else {
            console.log(`[Gemini OCR] Model '${currentModel}' hit repeated high demand. Switching to alternative model...`);
            break;
          }
        } else {
          // If non-retryable and not 404, throw immediately
          throw error;
        }
      }
    }
  }

  throw (
    lastError ||
    new Error(
      "Máy chủ Gemini hiện đang trong thời gian cao điểm đột xuất. Vui lòng thử lại sau giây lát."
    )
  );
}

// Batch OCR Endpoint
app.post("/api/ocr", async (req, res) => {
  try {
    const {
      images,
      systemInstruction = DEFAULT_MASTER_PROMPT,
      temperature = 0.0,
      model = "gemini-3.6-flash",
    } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "Không tìm thấy danh sách ảnh để OCR." });
    }

    const ai = getAiClient();

    // Prepare contents parts in order
    const parts: any[] = [];

    images.forEach((img: { filename: string; mimeType: string; base64Data: string }, index: number) => {
      // Clean base64 prefix cleanly
      const cleanBase64 = img.base64Data.includes(";base64,")
        ? img.base64Data.split(";base64,")[1]
        : img.base64Data.replace(/^data:[^;]+;base64,/, "");

      parts.push({
        inlineData: {
          mimeType: img.mimeType || "image/jpeg",
          data: cleanBase64,
        },
      });
      parts.push({
        text: `[File ảnh: ${img.filename} (Thứ tự: ${index + 1}/${images.length})]`,
      });
    });

    parts.push({
      text: "Hãy trích xuất chữ từ loạt ảnh này.",
    });

    const { response, modelUsed } = await generateContentWithRetryAndFallback(
      ai,
      model || "gemini-3.6-flash",
      {
        contents: { parts },
        config: {
          systemInstruction: systemInstruction || DEFAULT_MASTER_PROMPT,
          temperature: typeof temperature === "number" ? temperature : 0.0,
        },
      }
    );

    const rawOutput = response.text || "";

    // Extract content inside code blocks if present: ```...```
    let cleanText = rawOutput;
    const codeBlockMatch = rawOutput.match(/```(?:[a-zA-Z]*\n)?([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      cleanText = codeBlockMatch[1].trim();
    } else {
      cleanText = rawOutput.trim();
    }

    res.json({
      success: true,
      text: cleanText,
      fullOutput: rawOutput,
      processedCount: images.length,
      modelUsed,
    });
  } catch (error: any) {
    console.error("Error in /api/ocr:", error);
    const rawMsg = error?.message || String(error);
    const friendlyMsg = isRetryableError(error)
      ? "Máy chủ Gemini đang gặp tình trạng lượng truy cập cao đột xuất (503 High Demand). Hệ thống đã tự động thử lại nhiều lần nhưng chưa thành công. Vui lòng bấm 'Tiếp tục OCR' để thử lại sau vài giây."
      : rawMsg;

    res.status(500).json({
      error: friendlyMsg,
    });
  }
});

// Optional: Quick preview translation / summary tool
app.post("/api/quick-preview", async (req, res) => {
  try {
    const { text, type = "translate", model = "gemini-3.6-flash" } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Thiếu văn bản tiếng Trung." });
    }

    const ai = getAiClient();
    const prompt =
      type === "translate"
        ? `Hãy dịch đoạn trích tiểu thuyết tiếng Trung sau sang tiếng Việt tự nhiên, giữ phong cách truyện tranh/tiểu thuyết chữ:\n\n${text.slice(0, 3000)}`
        : `Hãy tóm tắt ngắn gọn 2-3 câu ý chính của đoạn tiểu thuyết tiếng Trung sau:\n\n${text.slice(0, 3000)}`;

    const { response, modelUsed } = await generateContentWithRetryAndFallback(
      ai,
      model || "gemini-3.6-flash",
      {
        contents: prompt,
        config: {
          temperature: 0.2,
        },
      }
    );

    res.json({ result: response.text || "", modelUsed });
  } catch (err: any) {
    console.error("Error in /api/quick-preview:", err);
    const friendlyMsg = isRetryableError(err)
      ? "Máy chủ Gemini đang quá tải tạm thời (503). Vui lòng thử bấm 'Dịch lại' sau vài giây."
      : err?.message || "Không thể thực hiện bản xem trước.";
    res.status(500).json({ error: friendlyMsg });
  }
});

// Setup Vite or Static File Serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
