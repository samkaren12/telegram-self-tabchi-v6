import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const execAsync = promisify(exec);
const DOWNLOADS_DIR = path.resolve("/tmp/telegram_v6_downloads");

if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

export interface MediaInfo {
  id: string;
  url: string;
  title: string;
  platform: string;
  author?: string;
  duration?: number;
  durationFormatted?: string;
  thumbnail?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  directUrl?: string;
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  title?: string;
  platform?: string;
  duration?: number;
  durationFormatted?: string;
  thumbnail?: string;
  error?: string;
}

export class MediaDownloaderService {
  private static instance: MediaDownloaderService;
  private memoryCache: Map<string, DownloadResult> = new Map();

  private constructor() {
    this.cleanupOldFiles();
    // Periodically clean up old temporary files every 30 minutes
    setInterval(() => this.cleanupOldFiles(), 30 * 60 * 1000);
  }

  public static getInstance(): MediaDownloaderService {
    if (!MediaDownloaderService.instance) {
      MediaDownloaderService.instance = new MediaDownloaderService();
    }
    return MediaDownloaderService.instance;
  }

  /**
   * Format seconds into MM:SS or HH:MM:SS
   */
  public formatDuration(seconds?: number): string {
    if (!seconds || isNaN(seconds) || seconds <= 0) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  /**
   * Format bytes to KB, MB, GB
   */
  public formatBytes(bytes?: number): string {
    if (!bytes || isNaN(bytes) || bytes <= 0) return "نامشخص";
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  /**
   * Identify platform based on URL
   */
  public identifyPlatform(url: string): { key: string; name: string; icon: string } {
    const lower = url.toLowerCase();
    if (lower.includes("instagram.com") || lower.includes("instagr.am")) {
      return { key: "instagram", name: "اینستاگرام (Instagram)", icon: "📸" };
    }
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      return { key: "youtube", name: "یوتیوب (YouTube)", icon: "▶️" };
    }
    if (lower.includes("tiktok.com") || lower.includes("douyin.com")) {
      return { key: "tiktok", name: "تیک‌تاک (TikTok)", icon: "🎵" };
    }
    if (lower.includes("twitter.com") || lower.includes("x.com") || lower.includes("t.co")) {
      return { key: "twitter", name: "توییتر / X", icon: "🐦" };
    }
    if (lower.includes("aparat.com")) {
      return { key: "aparat", name: "آپارات (Aparat)", icon: "📺" };
    }
    if (lower.includes("pinterest.com") || lower.includes("pin.it")) {
      return { key: "pinterest", name: "پینترست (Pinterest)", icon: "📌" };
    }
    if (lower.includes("facebook.com") || lower.includes("fb.watch")) {
      return { key: "facebook", name: "فیسبوک (Facebook)", icon: "👥" };
    }
    if (lower.includes("soundcloud.com")) {
      return { key: "soundcloud", name: "ساندکلاد (SoundCloud)", icon: "🎧" };
    }
    if (/\.(mp4|mov|avi|mkv|webm|flv|m4v)($|\?)/i.test(lower)) {
      return { key: "direct", name: "لینک مستقیم ویدیو (Direct MP4)", icon: "🎬" };
    }
    return { key: "generic", name: "پلتفرم وب / رسانه آنلاین", icon: "🌐" };
  }

  /**
   * Extract video info without full download
   */
  public async extractInfo(url: string): Promise<MediaInfo> {
    const trimmed = url.trim();
    const platform = this.identifyPlatform(trimmed);
    const hash = crypto.createHash("md5").update(trimmed).digest("hex").slice(0, 10);

    // 1. Try yt-dlp metadata dump
    try {
      const cmd = `yt-dlp --dump-json --no-warnings --no-playlist --skip-download "${trimmed}"`;
      const { stdout } = await execAsync(cmd, { timeout: 15000 });
      if (stdout && stdout.trim()) {
        const data = JSON.parse(stdout.trim().split("\n")[0]);
        const duration = Number(data.duration) || 0;
        const fileSize = Number(data.filesize || data.filesize_approx) || 0;
        return {
          id: data.id || hash,
          url: trimmed,
          title: data.title || `${platform.name} Video`,
          platform: platform.name,
          author: data.uploader || data.channel || data.artist || undefined,
          duration,
          durationFormatted: this.formatDuration(duration),
          thumbnail: data.thumbnail || (data.thumbnails && data.thumbnails[0]?.url) || undefined,
          fileSize,
          fileSizeFormatted: this.formatBytes(fileSize),
          directUrl: data.url || undefined,
        };
      }
    } catch (_) {}

    // 2. Direct MP4 or video file fallback: fetch headers for content-length
    try {
      const headRes = await fetch(trimmed, {
        method: "HEAD",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      const len = headRes.headers.get("content-length");
      const ctype = headRes.headers.get("content-type") || "";
      const size = len ? parseInt(len, 10) : 0;
      const pathname = new URL(trimmed).pathname;
      const basename = path.basename(pathname) || "video.mp4";

      return {
        id: hash,
        url: trimmed,
        title: basename.replace(/\.[^/.]+$/, "") || `${platform.name} Video`,
        platform: platform.name,
        fileSize: size,
        fileSizeFormatted: this.formatBytes(size),
      };
    } catch (_) {}

    // 3. Fallback info
    return {
      id: hash,
      url: trimmed,
      title: `${platform.name} Media (${hash})`,
      platform: platform.name,
      fileSize: 0,
      fileSizeFormatted: "در حال پردازش...",
    };
  }

  /**
   * Download the media file to local disk (up to 50MB for Telegram)
   */
  public async downloadVideo(url: string, maxSizeMb = 50): Promise<DownloadResult> {
    const trimmed = url.trim();
    const platform = this.identifyPlatform(trimmed);
    const id = crypto.createHash("md5").update(trimmed).digest("hex").slice(0, 12);
    const outputPattern = path.join(DOWNLOADS_DIR, `dl_${id}.%(ext)s`);

    // Check if already cached in memory and file still exists
    const cached = this.memoryCache.get(id);
    if (cached && cached.filePath && fs.existsSync(cached.filePath)) {
      return cached;
    }

    // 1. Try yt-dlp first
    try {
      // Limit to 50MB by default to ensure Telegram can send it smoothly
      const cmd = `yt-dlp -f "bestvideo[filesize<=${maxSizeMb}M][ext=mp4]+bestaudio[ext=m4a]/best[filesize<=${maxSizeMb}M][ext=mp4]/best[filesize<=${maxSizeMb}M]/best" --max-filesize ${maxSizeMb}M --no-playlist --no-warnings -o "${outputPattern}" "${trimmed}"`;
      await execAsync(cmd, { timeout: 60000 });

      // Find created file
      const files = fs.readdirSync(DOWNLOADS_DIR).filter((f) => f.startsWith(`dl_${id}.`));
      if (files.length > 0) {
        const finalPath = path.join(DOWNLOADS_DIR, files[0]);
        const stat = fs.statSync(finalPath);
        
        // Extract title using yt-dlp print
        let title = `${platform.name} Media`;
        try {
          const { stdout } = await execAsync(`yt-dlp --print "%(title)s" --no-warnings "${trimmed}"`, { timeout: 10000 });
          if (stdout.trim()) title = stdout.trim();
        } catch (_) {}

        const result: DownloadResult = {
          success: true,
          filePath: finalPath,
          fileName: files[0],
          fileSize: stat.size,
          fileSizeFormatted: this.formatBytes(stat.size),
          title,
          platform: platform.name,
        };
        this.memoryCache.set(id, result);
        return result;
      }
    } catch (err: any) {
      console.warn("yt-dlp attempt failed, trying fallback downloader:", err.message);
    }

    // 2. Direct HTTP Stream Download for direct video URLs or raw links
    try {
      const response = await fetch(trimmed, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "*/*",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      let ext = "mp4";
      if (contentType.includes("webm")) ext = "webm";
      else if (contentType.includes("mkv")) ext = "mkv";
      else if (contentType.includes("quicktime")) ext = "mov";

      const targetPath = path.join(DOWNLOADS_DIR, `dl_${id}.${ext}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > maxSizeMb * 1024 * 1024) {
        throw new Error(`حجم فایل بیشتر از ${maxSizeMb} مگابایت است.`);
      }

      fs.writeFileSync(targetPath, buffer);
      const stat = fs.statSync(targetPath);

      const result: DownloadResult = {
        success: true,
        filePath: targetPath,
        fileName: `dl_${id}.${ext}`,
        fileSize: stat.size,
        fileSizeFormatted: this.formatBytes(stat.size),
        title: `${platform.name} Media`,
        platform: platform.name,
      };
      this.memoryCache.set(id, result);
      return result;
    } catch (err: any) {
      return {
        success: false,
        error: `خطا در دریافت ویدیو: ${err.message || "لینک نامعتبر است یا دسترسی به ویدیو مسدود می‌باشد."}`,
      };
    }
  }

  /**
   * Delete downloaded files older than 1 hour to prevent disk fill-up
   */
  private cleanupOldFiles() {
    try {
      if (!fs.existsSync(DOWNLOADS_DIR)) return;
      const now = Date.now();
      const files = fs.readdirSync(DOWNLOADS_DIR);
      for (const file of files) {
        const fullPath = path.join(DOWNLOADS_DIR, file);
        try {
          const stat = fs.statSync(fullPath);
          // 1 hour
          if (now - stat.mtimeMs > 60 * 60 * 1000) {
            fs.unlinkSync(fullPath);
          }
        } catch (_) {}
      }
    } catch (_) {}
  }
}

export const mediaDownloader = MediaDownloaderService.getInstance();
