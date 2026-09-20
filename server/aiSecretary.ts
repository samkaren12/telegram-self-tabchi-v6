import { GoogleGenAI } from "@google/genai";

export interface GenerateSecretaryOptions {
  incomingText: string;
  senderName?: string;
  accountName?: string;
  apiKey?: string;
  customPrompt?: string;
  model?: string;
}

const DEFAULT_SECRETARY_PROMPT = `شما یک منشی و دستیار هوشمند، متین و مودب در پیام‌رسان تلگرام هستید.
وظیفه شما این است که به عنوان منشی صاحب حساب کاربری، به پیام‌های خصوصی ارسال‌شده پاسخ دهید.
قوانین پاسخگویی:
۱. پاسخ شما باید کاملاً کوتاه (حداکثر ۱ تا ۳ جمله)، بسیار محترمانه، صمیمی و به زبان فارسی سلیس باشد.
۲. اعلام کنید که صاحب اکانت هم‌اکنون آنلاین یا در دسترس نیست و به محض مشاهده، شخصاً پاسخ خواهد داد.
۳. اگر مخاطب سلام یا احوالپرسی کرده بود، گرم پاسخ دهید. اگر سوال مشخصی پرسیده بود، در صورت امکان پاسخی کلی و مفید ارائه دهید یا بگویید پیام به صاحب اکانت منتقل خواهد شد.
۴. هیچ عبارت اضافه‌ای مانند «پاسخ منشی:»، «من هوش مصنوعی هستم» یا علامت‌های نقل‌قول اضافه نکنید و مستقیماً متن پیام پاسخ را ارسال کنید.`;

/**
 * Generates an intelligent auto-reply using Google Gemini API.
 */
export async function generateAiSecretaryReply(
  options: GenerateSecretaryOptions
): Promise<string> {
  const { incomingText, senderName, accountName, apiKey, customPrompt, model } = options;

  const resolvedApiKey = (apiKey || process.env.GEMINI_API_KEY || "").trim();
  if (!resolvedApiKey) {
    throw new Error("کلید هوش مصنوعی (API Key) یافت نشد.");
  }

  const ai = new GoogleGenAI({ apiKey: resolvedApiKey });

  const systemInstruction = customPrompt?.trim() || DEFAULT_SECRETARY_PROMPT;
  const promptText = `نام فرستنده: ${senderName || "کاربر ناشناس"}\nنام صاحب اکانت: ${accountName || "مدیر"}\nمتن پیام دریافتی:\n«${incomingText}»\n\nلطفاً به عنوان منشی یک پاسخ کوتاه و محترمانه برای ارسال به این پیام بنویسید:`;

  const candidateModels = [
    (model || "gemini-2.5-flash").trim(),
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];
  // Deduplicate
  const modelsToTry = Array.from(new Set(candidateModels));

  let lastError: any = null;
  for (const targetModel of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 300,
        },
      });

      const reply = response.text?.trim() || "";
      if (reply) {
        return reply.replace(/^["'«]+|["'»]+$/g, "").trim();
      }
    } catch (err: any) {
      lastError = err;
      // If error is about API key being invalid, don't keep retrying other models
      if (err?.message?.includes("API_KEY_INVALID") || err?.message?.includes("API key not valid")) {
        throw new Error("کلید API نامعتبر است. لطفاً کلید معتبر از Google AI Studio وارد کنید.");
      }
    }
  }

  throw lastError || new Error("خطا در تولید پاسخ توسط مدل هوش مصنوعی");
}

/**
 * Tests an API Key and returns a sample generated answer.
 */
export async function testAiApiKey(apiKey: string, customPrompt?: string): Promise<{
  success: boolean;
  reply?: string;
  model?: string;
  message?: string;
}> {
  const cleanKey = (apiKey || process.env.GEMINI_API_KEY || "").trim();
  if (!cleanKey) {
    return {
      success: false,
      message: "لطفاً کلید Gemini API Key را وارد کنید.",
    };
  }

  try {
    const testReply = await generateAiSecretaryReply({
      incomingText: "سلام وقت بخیر، حالتون چطوره؟ خواستم ببینم پیامم به دستتون رسید؟",
      accountName: "مدیر",
      apiKey: cleanKey,
      customPrompt,
      model: "gemini-2.5-flash",
    });

    return {
      success: true,
      model: "gemini-2.5-flash",
      reply: testReply,
      message: "کلید هوش مصنوعی با موفقیت تایید شد و پاسخ نمونه دریافت گردید ✅",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "خطا در برقراری ارتباط با سرویس هوش مصنوعی",
    };
  }
}
