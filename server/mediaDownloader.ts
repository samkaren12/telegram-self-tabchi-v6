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
  platformKey: string;
  author?: string;
  duration?: number;
  durationFormatted?: string;
  thumbnail?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  isAudio?: boolean;
  availableQualities?: string[];
  directUrl?: string;
}

export interface DownloadOptions {
  quality?: "1080" | "720" | "480" | "360" | "mp3" | string;
  maxSizeMb?: number;
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  thumbPath?: string;
  fileName?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  title?: string;
  platform?: string;
  platformKey?: string;
  author?: string;
  duration?: number;
  durationFormatted?: string;
  width?: number;
  height?: number;
  isAudio?: boolean;
  thumbnailUrl?: string;
  error?: string;
}

export class MediaDownloaderService {
  private static instance: MediaDownloaderService;
  private memoryCache: Map<string, DownloadResult> = new Map();

  private constructor() {
    this.cleanupOldFiles();
    setInterval(() => this.cleanupOldFiles(), 30 * 60 * 1000);
  }

  public static getInstance(): MediaDownloaderService {
    if (!MediaDownloaderService.instance) {
      MediaDownloaderService.instance = new MediaDownloaderService();
    }
    return MediaDownloaderService.instance;
  }

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

  public identifyPlatform(url: string): { key: string; name: string; icon: string; isMusic: boolean } {
    const lower = url.toLowerCase();
    if (lower.includes("spotify.com") || lower.includes("spotify.link")) {
      return { key: "spotify", name: "اسپاتیفای (Spotify)", icon: "🟢", isMusic: true };
    }
    if (lower.includes("soundcloud.com")) {
      return { key: "soundcloud", name: "ساندکلاد (SoundCloud)", icon: "🎧", isMusic: true };
    }
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      return { key: "youtube", name: "یوتیوب (YouTube)", icon: "▶️", isMusic: false };
    }
    if (lower.includes("instagram.com") || lower.includes("instagr.am")) {
      return { key: "instagram", name: "اینستاگرام (Instagram)", icon: "📸", isMusic: false };
    }
    if (lower.includes("tiktok.com") || lower.includes("douyin.com")) {
      return { key: "tiktok", name: "تیک‌تاک (TikTok)", icon: "🎵", isMusic: false };
    }
    if (lower.includes("twitter.com") || lower.includes("x.com") || lower.includes("t.co")) {
      return { key: "twitter", name: "توییتر / X", icon: "🐦", isMusic: false };
    }
    if (lower.includes("aparat.com")) {
      return { key: "aparat", name: "آپارات (Aparat)", icon: "📺", isMusic: false };
    }
    if (lower.includes("pinterest.com") || lower.includes("pin.it")) {
      return { key: "pinterest", name: "پینترست (Pinterest)", icon: "📌", isMusic: false };
    }
    if (lower.includes("facebook.com") || lower.includes("fb.watch")) {
      return { key: "facebook", name: "فیسبوک (Facebook)", icon: "👥", isMusic: false };
    }
    if (/\.(mp3|m4a|aac|flac|wav|ogg)($|\?)/i.test(lower)) {
      return { key: "direct_audio", name: "لینک مستقیم صوتی (Audio MP3)", icon: "🎼", isMusic: true };
    }
    if (/\.(mp4|mov|avi|mkv|webm|flv|m4v)($|\?)/i.test(lower)) {
      return { key: "direct_video", name: "لینک مستقیم ویدیو (Direct MP4)", icon: "🎬", isMusic: false };
    }
    return { key: "generic", name: "رسانه آنلاین (Media Link)", icon: "🌐", isMusic: false };
  }

  /**
   * Fast info extraction without full download
   */
  public async extractInfo(url: string): Promise<MediaInfo> {
    const trimmed = url.trim();
    const platform = this.identifyPlatform(trimmed);
    const hash = crypto.createHash("md5").update(trimmed).digest("hex").slice(0, 10);

    // 1. Spotify Special oEmbed Extraction
    if (platform.key === "spotify") {
      try {
        const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(trimmed)}`);
        if (oembedRes.ok) {
          const sData = (await oembedRes.json()) as any;
          return {
            id: hash,
            url: trimmed,
            title: sData.title || "موزیک اسپاتیفای",
            platform: platform.name,
            platformKey: "spotify",
            thumbnail: sData.thumbnail_url || undefined,
            isAudio: true,
            availableQualities: ["320kbps MP3 (HQ)", "128kbps"],
            fileSizeFormatted: "کیفیت اصلی (HQ 320k)",
          };
        }
      } catch (_) {}
    }

    // 2. YouTube Special Quality Extraction
    if (platform.key === "youtube") {
      try {
        const { stdout } = await execAsync(`yt-dlp --dump-json --no-warnings --no-playlist --skip-download "${trimmed}"`, { timeout: 15000 });
        if (stdout && stdout.trim()) {
          const data = JSON.parse(stdout.trim().split("\n")[0]);
          const duration = Number(data.duration) || 0;
          return {
            id: data.id || hash,
            url: trimmed,
            title: data.title || "ویدیوی یوتیوب",
            platform: platform.name,
            platformKey: "youtube",
            author: data.uploader || data.channel,
            duration,
            durationFormatted: this.formatDuration(duration),
            thumbnail: data.thumbnail || (data.thumbnails && data.thumbnails[data.thumbnails.length - 1]?.url),
            isAudio: false,
            availableQualities: ["1080p Full HD", "720p HD (پیشنهادی)", "480p", "360p", "MP3 صوتی (320k)"],
          };
        }
      } catch (_) {
        // Fallback for YouTube when dump-json needs no-warnings or fails
        return {
          id: hash,
          url: trimmed,
          title: "ویدیوی یوتیوب",
          platform: platform.name,
          platformKey: "youtube",
          thumbnail: `https://i.ytimg.com/vi/${this.extractYouTubeId(trimmed)}/hqdefault.jpg`,
          isAudio: false,
          availableQualities: ["1080p Full HD", "720p HD (پیشنهادی)", "480p", "360p", "MP3 صوتی (320k)"],
        };
      }
    }

    // 3. General Platforms via yt-dlp
    try {
      const { stdout } = await execAsync(`yt-dlp --dump-json --no-warnings --no-playlist --skip-download "${trimmed}"`, { timeout: 15000 });
      if (stdout && stdout.trim()) {
        const data = JSON.parse(stdout.trim().split("\n")[0]);
        const duration = Number(data.duration) || 0;
        const fileSize = Number(data.filesize || data.filesize_approx) || 0;
        return {
          id: data.id || hash,
          url: trimmed,
          title: data.title || `${platform.name} Media`,
          platform: platform.name,
          platformKey: platform.key,
          author: data.uploader || data.channel || data.artist,
          duration,
          durationFormatted: this.formatDuration(duration),
          thumbnail: data.thumbnail || (data.thumbnails && data.thumbnails[0]?.url),
          fileSize,
          fileSizeFormatted: this.formatBytes(fileSize),
          isAudio: platform.isMusic,
        };
      }
    } catch (_) {}

    // Fallback Info
    return {
      id: hash,
      url: trimmed,
      title: `${platform.name} Media`,
      platform: platform.name,
      platformKey: platform.key,
      isAudio: platform.isMusic,
      fileSizeFormatted: "در حال پردازش...",
    };
  }

  /**
   * Download Spotify track with 320k audio and cover art
   */
  public async downloadSpotifyTrack(url: string): Promise<DownloadResult> {
    const trimmed = url.trim();
    const id = crypto.createHash("md5").update(trimmed).digest("hex").slice(0, 10);
    const cached = this.memoryCache.get(`spotify_${id}`);
    if (cached && cached.filePath && fs.existsSync(cached.filePath)) {
      return cached;
    }

    let trackTitle = "موزیک اسپاتیفای";
    let artistName = "هنرمند اسپاتیفای";
    let coverUrl = "";

    try {
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(trimmed)}`);
      if (oembedRes.ok) {
        const sData = (await oembedRes.json()) as any;
        if (sData.title) {
          trackTitle = sData.title;
        }
        coverUrl = sData.thumbnail_url || "";
      }
    } catch (_) {}

    // Download cover thumbnail if available
    const coverPath = path.join(DOWNLOADS_DIR, `cover_spotify_${id}.jpg`);
    if (coverUrl) {
      try {
        const imgRes = await fetch(coverUrl);
        if (imgRes.ok) {
          const imgBuf = Buffer.from(await imgRes.arrayBuffer());
          fs.writeFileSync(coverPath, imgBuf);
        }
      } catch (_) {}
    }

    // Search and download highest quality audio via SoundCloud search (scsearch1)
    const rawAudioPath = path.join(DOWNLOADS_DIR, `raw_audio_${id}.%(ext)s`);
    const searchQuery = `scsearch1:${trackTitle} ${artistName}`.trim();

    try {
      const dlCmd = `yt-dlp -x --audio-format mp3 --audio-quality 320k --no-warnings --no-playlist -o "${rawAudioPath}" "${searchQuery}"`;
      await execAsync(dlCmd, { timeout: 60000 });

      // Find downloaded mp3
      const foundFiles = fs.readdirSync(DOWNLOADS_DIR).filter((f) => f.startsWith(`raw_audio_${id}.`));
      if (foundFiles.length > 0) {
        const downloadedRaw = path.join(DOWNLOADS_DIR, foundFiles[0]);
        const finalMp3Path = path.join(DOWNLOADS_DIR, `music_${id}.mp3`);

        // Embed ID3 tags and cover art using ffmpeg
        if (fs.existsSync(coverPath)) {
          const tagCmd = `ffmpeg -y -i "${downloadedRaw}" -i "${coverPath}" -map 0:a -map 1:0 -c:a copy -c:v mjpeg -id3v2_version 3 -metadata title="${trackTitle.replace(/"/g, "")}" -metadata artist="${artistName.replace(/"/g, "")}" -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (front)" "${finalMp3Path}"`;
          await execAsync(tagCmd, { timeout: 20000 });
        } else {
          const tagCmd = `ffmpeg -y -i "${downloadedRaw}" -c copy -id3v2_version 3 -metadata title="${trackTitle.replace(/"/g, "")}" -metadata artist="${artistName.replace(/"/g, "")}" "${finalMp3Path}"`;
          await execAsync(tagCmd, { timeout: 20000 });
        }

        const chosenFile = fs.existsSync(finalMp3Path) ? finalMp3Path : downloadedRaw;
        const stat = fs.statSync(chosenFile);

        // Get duration with ffprobe
        let duration = 0;
        try {
          const { stdout: probeOut } = await execAsync(`ffprobe -v error -show_entries format=duration -of json "${chosenFile}"`);
          const p = JSON.parse(probeOut);
          duration = Math.round(Number(p.format?.duration || 0));
        } catch (_) {}

        const result: DownloadResult = {
          success: true,
          filePath: chosenFile,
          thumbPath: fs.existsSync(coverPath) ? coverPath : undefined,
          fileName: `${trackTitle.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-_]/g, "").slice(0, 40)}.mp3`,
          fileSize: stat.size,
          fileSizeFormatted: this.formatBytes(stat.size),
          title: trackTitle,
          author: artistName,
          platform: "اسپاتیفای (Spotify)",
          platformKey: "spotify",
          duration,
          durationFormatted: this.formatDuration(duration),
          isAudio: true,
          thumbnailUrl: coverUrl,
        };

        this.memoryCache.set(`spotify_${id}`, result);
        return result;
      }
    } catch (err: any) {
      console.warn("Spotify download error:", err.message);
    }

    return {
      success: false,
      error: `امکان دریافت آهنگ از اسپاتیفای وجود نداشت. عنوان ترک: ${trackTitle}`,
    };
  }

  /**
   * Download video or audio with codec normalization and streaming preparation
   */
  public async downloadMedia(url: string, options: DownloadOptions = {}): Promise<DownloadResult> {
    const trimmed = url.trim();
    const platform = this.identifyPlatform(trimmed);
    const maxSizeMb = options.maxSizeMb || 50;
    const requestedQuality = (options.quality || "").toLowerCase();

    // Route to Spotify handler if Spotify
    if (platform.key === "spotify") {
      return this.downloadSpotifyTrack(trimmed);
    }

    const id = crypto.createHash("md5").update(trimmed + requestedQuality).digest("hex").slice(0, 10);
    const cached = this.memoryCache.get(id);
    if (cached && cached.filePath && fs.existsSync(cached.filePath)) {
      return cached;
    }

    // 1. Handle Audio-Only request (e.g. YouTube MP3 or SoundCloud)
    const isAudioOnly = requestedQuality === "mp3" || requestedQuality === "audio" || platform.isMusic;
    if (isAudioOnly) {
      const audioOutPattern = path.join(DOWNLOADS_DIR, `raw_audio_${id}.%(ext)s`);
      try {
        const cmd = `yt-dlp -x --audio-format mp3 --audio-quality 320k --no-playlist --no-warnings -o "${audioOutPattern}" "${trimmed}"`;
        await execAsync(cmd, { timeout: 60000 });

        const files = fs.readdirSync(DOWNLOADS_DIR).filter((f) => f.startsWith(`raw_audio_${id}.`));
        if (files.length > 0) {
          const rawAudioPath = path.join(DOWNLOADS_DIR, files[0]);
          const finalMp3 = path.join(DOWNLOADS_DIR, `audio_${id}.mp3`);
          
          let title = `${platform.name} Audio`;
          try {
            const { stdout } = await execAsync(`yt-dlp --print "%(title)s" --no-warnings "${trimmed}"`, { timeout: 10000 });
            if (stdout.trim()) title = stdout.trim();
          } catch (_) {}

          // Get duration
          let duration = 0;
          try {
            const { stdout: probeOut } = await execAsync(`ffprobe -v error -show_entries format=duration -of json "${rawAudioPath}"`);
            const p = JSON.parse(probeOut);
            duration = Math.round(Number(p.format?.duration || 0));
          } catch (_) {}

          // Extract thumbnail if available
          const thumbPath = path.join(DOWNLOADS_DIR, `thumb_${id}.jpg`);
          try {
            await execAsync(`yt-dlp --write-thumbnail --skip-download --convert-thumbnails jpg -o "${thumbPath}" "${trimmed}"`, { timeout: 15000 });
          } catch (_) {}

          // Tag with ffmpeg
          if (fs.existsSync(thumbPath)) {
            await execAsync(`ffmpeg -y -i "${rawAudioPath}" -i "${thumbPath}" -map 0:a -map 1:0 -c:a copy -c:v mjpeg -id3v2_version 3 -metadata title="${title.replace(/"/g, "")}" "${finalMp3}"`).catch(() => {});
          } else {
            await execAsync(`ffmpeg -y -i "${rawAudioPath}" -c copy -id3v2_version 3 -metadata title="${title.replace(/"/g, "")}" "${finalMp3}"`).catch(() => {});
          }

          const targetFile = fs.existsSync(finalMp3) ? finalMp3 : rawAudioPath;
          const stat = fs.statSync(targetFile);

          const result: DownloadResult = {
            success: true,
            filePath: targetFile,
            thumbPath: fs.existsSync(thumbPath) ? thumbPath : undefined,
            fileName: `${title.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-_]/g, "").slice(0, 40)}.mp3`,
            fileSize: stat.size,
            fileSizeFormatted: this.formatBytes(stat.size),
            title,
            platform: platform.name,
            platformKey: platform.key,
            duration,
            durationFormatted: this.formatDuration(duration),
            isAudio: true,
          };
          this.memoryCache.set(id, result);
          return result;
        }
      } catch (audioErr: any) {
        console.warn("Audio extraction attempt failed:", audioErr.message);
      }
    }

    // 2. Video Download with Format Selector
    let formatFilter = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best";
    if (requestedQuality.includes("1080")) {
      formatFilter = `bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best[height<=1080]/best`;
    } else if (requestedQuality.includes("720")) {
      formatFilter = `bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]/best`;
    } else if (requestedQuality.includes("480")) {
      formatFilter = `bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best[height<=480]/best`;
    } else if (requestedQuality.includes("360")) {
      formatFilter = `bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]/best[height<=360]/best`;
    }

    const rawVideoPattern = path.join(DOWNLOADS_DIR, `raw_v_${id}.%(ext)s`);

    try {
      const dlCmd = `yt-dlp -f "${formatFilter}" --max-filesize ${maxSizeMb}M --no-playlist --no-warnings -o "${rawVideoPattern}" "${trimmed}"`;
      await execAsync(dlCmd, { timeout: 90000 });

      const files = fs.readdirSync(DOWNLOADS_DIR).filter((f) => f.startsWith(`raw_v_${id}.`));
      if (files.length > 0) {
        const rawFilePath = path.join(DOWNLOADS_DIR, files[0]);

        // =========================================================================
        // CRITICAL FIX FOR TELEGRAM VIDEO COMPATIBILITY (CORRUPTED VIDEO FIX):
        // 1. Inspect codecs using ffprobe
        // 2. Remux/transcode with H.264 + AAC + yuv420p + faststart
        // 3. Extract exact dimensions (width, height, duration)
        // 4. Generate sharp thumbnail
        // =========================================================================
        const cleanVideoPath = path.join(DOWNLOADS_DIR, `streamable_${id}.mp4`);
        const thumbPath = path.join(DOWNLOADS_DIR, `thumb_${id}.jpg`);

        let probeMeta: any = {};
        try {
          const { stdout: probeOut } = await execAsync(
            `ffprobe -v error -show_entries stream=codec_name,codec_type,width,height,duration -show_entries format=duration -of json "${rawFilePath}"`
          );
          probeMeta = JSON.parse(probeOut);
        } catch (_) {}

        const streams = probeMeta.streams || [];
        const vStream = streams.find((s: any) => s.codec_type === "video") || {};
        const aStream = streams.find((s: any) => s.codec_type === "audio") || {};

        const isH264 = vStream.codec_name === "h264";
        const isAac = aStream.codec_name === "aac";

        // If already H.264 & AAC, fast remux with faststart. Otherwise transcode to H.264/AAC.
        if (isH264 && isAac) {
          await execAsync(`ffmpeg -y -i "${rawFilePath}" -c copy -movflags +faststart "${cleanVideoPath}"`, { timeout: 30000 }).catch(
            () => fs.copyFileSync(rawFilePath, cleanVideoPath)
          );
        } else {
          // Transcode video to universal Telegram-friendly format
          await execAsync(
            `ffmpeg -y -i "${rawFilePath}" -c:v libx264 -pix_fmt yuv420p -profile:v main -preset veryfast -crf 23 -c:a aac -b:a 128k -ar 44100 -movflags +faststart "${cleanVideoPath}"`,
            { timeout: 60000 }
          ).catch(() => fs.copyFileSync(rawFilePath, cleanVideoPath));
        }

        const finalVideoPath = fs.existsSync(cleanVideoPath) ? cleanVideoPath : rawFilePath;
        const stat = fs.statSync(finalVideoPath);

        // Generate Thumbnail Image at 1 second mark
        try {
          await execAsync(`ffmpeg -y -ss 00:00:01 -i "${finalVideoPath}" -vframes 1 -q:v 2 "${thumbPath}"`, { timeout: 10000 });
        } catch (_) {}

        // Inspect clean video for exact attributes
        let finalWidth = vStream.width || 1280;
        let finalHeight = vStream.height || 720;
        let finalDuration = Math.round(Number(vStream.duration || probeMeta.format?.duration || 0));

        try {
          const { stdout: finalProbe } = await execAsync(
            `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -show_entries format=duration -of json "${finalVideoPath}"`
          );
          const fp = JSON.parse(finalProbe);
          const fv = fp.streams?.[0];
          if (fv?.width) finalWidth = fv.width;
          if (fv?.height) finalHeight = fv.height;
          if (fv?.duration || fp.format?.duration) {
            finalDuration = Math.round(Number(fv?.duration || fp.format?.duration));
          }
        } catch (_) {}

        let title = `${platform.name} Video`;
        try {
          const { stdout } = await execAsync(`yt-dlp --print "%(title)s" --no-warnings "${trimmed}"`, { timeout: 10000 });
          if (stdout.trim()) title = stdout.trim();
        } catch (_) {}

        const result: DownloadResult = {
          success: true,
          filePath: finalVideoPath,
          thumbPath: fs.existsSync(thumbPath) ? thumbPath : undefined,
          fileName: `${title.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-_]/g, "").slice(0, 40) || "video"}.mp4`,
          fileSize: stat.size,
          fileSizeFormatted: this.formatBytes(stat.size),
          title,
          platform: platform.name,
          platformKey: platform.key,
          duration: finalDuration,
          durationFormatted: this.formatDuration(finalDuration),
          width: finalWidth,
          height: finalHeight,
          isAudio: false,
        };

        this.memoryCache.set(id, result);
        return result;
      }
    } catch (dlErr: any) {
      console.warn("yt-dlp download failed:", dlErr.message);
    }

    // Direct HTTP Stream fallback (for direct mp4 links)
    try {
      const response = await fetch(trimmed, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "*/*",
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const rawBuf = Buffer.from(arrayBuffer);

      if (rawBuf.length > maxSizeMb * 1024 * 1024) {
        throw new Error(`حجم ویدیو بیشتر از ${maxSizeMb} مگابایت است.`);
      }

      const rawDirectPath = path.join(DOWNLOADS_DIR, `raw_direct_${id}.mp4`);
      const cleanDirectPath = path.join(DOWNLOADS_DIR, `streamable_direct_${id}.mp4`);
      const thumbPath = path.join(DOWNLOADS_DIR, `thumb_direct_${id}.jpg`);

      fs.writeFileSync(rawDirectPath, rawBuf);

      // Fast remux to faststart
      await execAsync(`ffmpeg -y -i "${rawDirectPath}" -c copy -movflags +faststart "${cleanDirectPath}"`, { timeout: 20000 }).catch(
        () => fs.copyFileSync(rawDirectPath, cleanDirectPath)
      );

      // Thumbnail
      await execAsync(`ffmpeg -y -ss 00:00:01 -i "${cleanDirectPath}" -vframes 1 -q:v 2 "${thumbPath}"`, { timeout: 10000 }).catch(() => {});

      const finalPath = fs.existsSync(cleanDirectPath) ? cleanDirectPath : rawDirectPath;
      const stat = fs.statSync(finalPath);

      const result: DownloadResult = {
        success: true,
        filePath: finalPath,
        thumbPath: fs.existsSync(thumbPath) ? thumbPath : undefined,
        fileName: `video_${id}.mp4`,
        fileSize: stat.size,
        fileSizeFormatted: this.formatBytes(stat.size),
        title: `${platform.name} Video`,
        platform: platform.name,
        platformKey: platform.key,
        width: 1280,
        height: 720,
        isAudio: false,
      };

      this.memoryCache.set(id, result);
      return result;
    } catch (err: any) {
      return {
        success: false,
        error: `خطا در دریافت ویدیو: ${err.message || "لینک نامعتبر است یا ویدیو در دسترس نمی‌باشد."}`,
      };
    }
  }

  private extractYouTubeId(url: string): string {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
    return match ? match[1] : "aqz-KE-bpKQ";
  }

  private cleanupOldFiles() {
    try {
      if (!fs.existsSync(DOWNLOADS_DIR)) return;
      const now = Date.now();
      const files = fs.readdirSync(DOWNLOADS_DIR);
      for (const file of files) {
        const fullPath = path.join(DOWNLOADS_DIR, file);
        try {
          const stat = fs.statSync(fullPath);
          if (now - stat.mtimeMs > 60 * 60 * 1000) {
            fs.unlinkSync(fullPath);
          }
        } catch (_) {}
      }
    } catch (_) {}
  }
}

export const mediaDownloader = MediaDownloaderService.getInstance();
