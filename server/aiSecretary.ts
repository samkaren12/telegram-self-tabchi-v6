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
  const { incomingText, accountName, apiKey, customPrompt, model } = options;

  const resolvedApiKey = (apiKey || process.env.GEMINI_API_KEY || "").trim();
  if (!resolvedApiKey) {
    throw new Error("کلید هوش مصنوعی (API Key) یافت نشد.");
  }

  const selectedModel = (model || "gemini-3.8-flash").trim();

  const systemInstruction = customPrompt?.trim()
    ? `${customPrompt.trim()}\n\nنام صاحب اکانت: ${accountName || "کاربر"}. لطفاً پاسخ نهایی را کوتاه و مستقیم بنویسید.`
    : DEFAULT_SECRETARY_PROMPT.replace("{accountName}", accountName || "صاحب حساب");

  const ai = new GoogleGenAI({ apiKey: resolvedApiKey });

  const promptText = `پیام جدید دریافت شده در پی‌وی تلگرام از مخاطب:\n"${incomingText.slice(0, 1000)}"\n\nلطفاً پاسخ مناسب بنویسید:`;

  const response = await ai.models.generateContent({
    model: selectedModel,
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
  // Strip enclosing quotes if any
  return reply.replace(/^["'«]+|["'»]+$/g, "").trim();
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
      model: "gemini-3.8-flash",
    });

    return {
      success: true,
      model: "gemini-3.8-flash",
      reply: testReply,
      message: "کلید هوش مصنوعی با موفقیت تایید شد و پاسخ نمونه دریافت گردید.",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "خطا در برقراری ارتباط با سرویس هوش مصنوعی",
    };
  }
}
