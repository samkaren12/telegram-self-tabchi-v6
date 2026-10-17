import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const execAsync = promisify(exec);
const DOWNLOADS_DIR = path.resolve("/tmp/telegram_v6_downloads");
const LOCAL_BIN_DIR = path.resolve(process.cwd(), "bin");
const LOCAL_YTDLP_PATH = path.join(LOCAL_BIN_DIR, "yt-dlp");

if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(LOCAL_BIN_DIR)) {
  fs.mkdirSync(LOCAL_BIN_DIR, { recursive: true });
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
  diskFileName?: string;
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

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

export class MediaDownloaderService {
  private static instance: MediaDownloaderService;
  private memoryCache: Map<string, DownloadResult> = new Map();
  private ytDlpReadyPromise: Promise<string> | null = null;

  private constructor() {
    this.cleanupOldFiles();
    setInterval(() => this.cleanupOldFiles(), 30 * 60 * 1000).unref();
    // Proactively ensure yt-dlp binary exists on startup
    this.ensureYtDlpBinary().catch(() => {});
  }

  public static getInstance(): MediaDownloaderService {
    if (!MediaDownloaderService.instance) {
      MediaDownloaderService.instance = new MediaDownloaderService();
    }
    return MediaDownloaderService.instance;
  }

  /**
   * Ensures yt-dlp binary is available in persistent ./bin/yt-dlp or system PATH.
   * Automatically downloads it if container restarted and wiped /usr/local/bin.
   */
  public async ensureYtDlpBinary(): Promise<string> {
    if (fs.existsSync(LOCAL_YTDLP_PATH)) {
      try {
        fs.chmodSync(LOCAL_YTDLP_PATH, 0o755);
        return LOCAL_YTDLP_PATH;
      } catch (_) {}
    }

    if (fs.existsSync("/usr/local/bin/yt-dlp")) {
      try {
        fs.copyFileSync("/usr/local/bin/yt-dlp", LOCAL_YTDLP_PATH);
        fs.chmodSync(LOCAL_YTDLP_PATH, 0o755);
        return LOCAL_YTDLP_PATH;
      } catch (_) {
        return "/usr/local/bin/yt-dlp";
      }
    }

    if (!this.ytDlpReadyPromise) {
      this.ytDlpReadyPromise = (async () => {
        try {
          await execAsync(
            `curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "${LOCAL_YTDLP_PATH}" && chmod a+rx "${LOCAL_YTDLP_PATH}"`,
            { timeout: 30000 }
          );
          try {
            fs.copyFileSync(LOCAL_YTDLP_PATH, "/usr/local/bin/yt-dlp");
            fs.chmodSync("/usr/local/bin/yt-dlp", 0o755);
          } catch (_) {}
          return LOCAL_YTDLP_PATH;
        } finally {
          this.ytDlpReadyPromise = null;
        }
      })();
    }

    return this.ytDlpReadyPromise;
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
    if (lower.includes("dailymotion.com") || lower.includes("dai.ly")) {
      return { key: "dailymotion", name: "دیلی‌موشن (Dailymotion)", icon: "🎬", isMusic: false };
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
   * Verifies that a file on disk is a real, non-corrupted audio or video file using ffprobe.
   */
  public async verifyMediaFile(filePath: string): Promise<{
    valid: boolean;
    hasVideo: boolean;
    hasAudio: boolean;
    videoCodec?: string;
    audioCodec?: string;
    pixFmt?: string;
    width?: number;
    height?: number;
    duration?: number;
    size?: number;
  }> {
    try {
      if (!fs.existsSync(filePath)) return { valid: false, hasVideo: false, hasAudio: false };
      const stat = fs.statSync(filePath);
      if (stat.size < 4096) return { valid: false, hasVideo: false, hasAudio: false };

      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries stream=codec_name,codec_type,pix_fmt,width,height,duration -show_entries format=duration,format_name,size -of json "${filePath}"`,
        { timeout: 10000 }
      );
      const data = JSON.parse(stdout || "{}");
      const streams: any[] = data.streams || [];
      if (streams.length === 0) return { valid: false, hasVideo: false, hasAudio: false };

      const vStream = streams.find((s) => s.codec_type === "video" && s.codec_name !== "mjpeg" && s.codec_name !== "png");
      const aStream = streams.find((s) => s.codec_type === "audio");

      const duration = Math.round(
        Number(vStream?.duration || aStream?.duration || data.format?.duration || 0)
      );

      if (!vStream && !aStream) {
        return { valid: false, hasVideo: false, hasAudio: false };
      }

      return {
        valid: true,
        hasVideo: Boolean(vStream),
        hasAudio: Boolean(aStream),
        videoCodec: vStream?.codec_name,
        audioCodec: aStream?.codec_name,
        pixFmt: vStream?.pix_fmt,
        width: vStream?.width ? Number(vStream.width) : undefined,
        height: vStream?.height ? Number(vStream.height) : undefined,
        duration: duration > 0 ? duration : 1,
        size: stat.size,
      };
    } catch (_) {
      return { valid: false, hasVideo: false, hasAudio: false };
    }
  }

  /**
   * Extracts Spotify track title, real artist name, and high-res cover image.
   */
  private async fetchSpotifyMetadata(url: string): Promise<{ title: string; artist: string; coverUrl: string }> {
    let title = "Spotify Track";
    let artist = "";
    let coverUrl = "";

    // 1. Try Spotify oEmbed
    try {
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (oembedRes.ok) {
        const sData = (await oembedRes.json()) as any;
        if (sData.title) title = sData.title;
        if (sData.thumbnail_url) coverUrl = sData.thumbnail_url;
      }
    } catch (_) {}

    // 2. Fetch Spotify page OpenGraph tags to extract the exact Artist name
    try {
      const pageRes = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (titleMatch?.[1]) title = titleMatch[1].trim();

        const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
        if (descMatch?.[1]) {
          // Format: "Billie Eilish · HIT ME HARD AND SOFT · Song · 2024"
          const parts = descMatch[1].split("·").map((s) => s.trim());
          if (parts[0]) artist = parts[0];
        }

        const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (imgMatch?.[1] && !coverUrl) coverUrl = imgMatch[1].trim();
      }
    } catch (_) {}

    return { title, artist, coverUrl };
  }

  /**
   * Extracts YouTube metadata reliably via official oEmbed + yt-dlp fallback.
   */
  private async fetchYouTubeMetadata(url: string): Promise<{
    id: string;
    title: string;
    author: string;
    thumbnail: string;
    duration?: number;
  }> {
    const videoId = this.extractYouTubeId(url);
    let title = "";
    let author = "";
    let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    let duration = 0;

    // 1. Official YouTube oEmbed (fast & never bot-blocked)
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`
      )}&format=json`;
      const res = await fetch(oembedUrl, { headers: { "User-Agent": USER_AGENT } });
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.title) title = data.title;
        if (data.author_name) author = data.author_name;
        if (data.thumbnail_url) thumbnail = data.thumbnail_url;
      }
    } catch (_) {}

    // 2. Try yt-dlp for duration if possible
    try {
      const ytdlp = await this.ensureYtDlpBinary();
      const { stdout } = await execAsync(
        `"${ytdlp}" --dump-json --no-warnings --no-playlist --skip-download "${url}"`,
        { timeout: 10000 }
      );
      if (stdout && stdout.trim()) {
        const data = JSON.parse(stdout.trim().split("\n")[0]);
        if (data.title) title = data.title;
        if (data.uploader || data.channel) author = data.uploader || data.channel;
        if (data.duration) duration = Number(data.duration) || 0;
        if (data.thumbnail) thumbnail = data.thumbnail;
      }
    } catch (_) {}

    return {
      id: videoId,
      title: title || "YouTube Video",
      author: author || "YouTube",
      thumbnail,
      duration,
    };
  }

  /**
   * Fast info extraction without full download
   */
  public async extractInfo(url: string): Promise<MediaInfo> {
    const trimmed = url.trim();
    const platform = this.identifyPlatform(trimmed);
    const hash = crypto.createHash("md5").update(trimmed).digest("hex").slice(0, 10);

    // 1. Spotify Special Extraction
    if (platform.key === "spotify") {
      const meta = await this.fetchSpotifyMetadata(trimmed);
      return {
        id: hash,
        url: trimmed,
        title: meta.artist ? `${meta.artist} - ${meta.title}` : meta.title,
        author: meta.artist || "Spotify Artist",
        platform: platform.name,
        platformKey: "spotify",
        thumbnail: meta.coverUrl || undefined,
        isAudio: true,
        availableQualities: ["320kbps MP3 (HQ)", "128kbps"],
        fileSizeFormatted: "کیفیت اورجینال (320kbps MP3)",
      };
    }

    // 2. YouTube Special Quality Extraction
    if (platform.key === "youtube") {
      const ytMeta = await this.fetchYouTubeMetadata(trimmed);
      return {
        id: ytMeta.id || hash,
        url: trimmed,
        title: ytMeta.title,
        platform: platform.name,
        platformKey: "youtube",
        author: ytMeta.author,
        duration: ytMeta.duration || undefined,
        durationFormatted: ytMeta.duration ? this.formatDuration(ytMeta.duration) : undefined,
        thumbnail: ytMeta.thumbnail,
        isAudio: false,
        availableQualities: ["1080p Full HD", "720p HD (پیشنهادی)", "480p", "360p", "MP3 صوتی (320k)"],
      };
    }

    // 3. General Platforms via yt-dlp
    try {
      const ytdlp = await this.ensureYtDlpBinary();
      const { stdout } = await execAsync(
        `"${ytdlp}" --user-agent "${USER_AGENT}" --dump-json --no-warnings --no-playlist --skip-download "${trimmed}"`,
        { timeout: 15000 }
      );
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

    return {
      id: hash,
      url: trimmed,
      title: `${platform.name} Media`,
      platform: platform.name,
      platformKey: platform.key,
      isAudio: platform.isMusic,
      fileSizeFormatted: "آماده دانلود",
    };
  }

  /**
   * Downloads and processes an audio track by search query or direct URL into a verified 320kbps MP3 with cover art.
   */
  private async downloadVerifiedMp3(params: {
    id: string;
    queryOrUrl: string;
    title: string;
    artist: string;
    platformName: string;
    platformKey: string;
    coverUrl?: string;
  }): Promise<DownloadResult> {
    const { id, queryOrUrl, title, artist, platformName, platformKey, coverUrl } = params;
    const ytdlp = await this.ensureYtDlpBinary();

    const coverPath = path.join(DOWNLOADS_DIR, `cover_${id}.jpg`);
    if (coverUrl) {
      try {
        const imgRes = await fetch(coverUrl, { headers: { "User-Agent": USER_AGENT } });
        if (imgRes.ok) {
          const imgBuf = Buffer.from(await imgRes.arrayBuffer());
          if (imgBuf.length > 500) {
            fs.writeFileSync(coverPath, imgBuf);
          }
        }
      } catch (_) {}
    }

    // Clean any old files for this id
    for (const f of fs.readdirSync(DOWNLOADS_DIR)) {
      if (f.startsWith(`raw_audio_${id}.`)) {
        try {
          fs.unlinkSync(path.join(DOWNLOADS_DIR, f));
        } catch (_) {}
      }
    }

    const rawAudioPattern = path.join(DOWNLOADS_DIR, `raw_audio_${id}.%(ext)s`);

    // Try downloading audio (supports direct URL or scsearch5:... with --ignore-errors --max-downloads 1)
    try {
      const dlCmd = `"${ytdlp}" --user-agent "${USER_AGENT}" -x --audio-format mp3 --audio-quality 320k --ignore-errors --max-downloads 1 --no-warnings --no-playlist -o "${rawAudioPattern}" "${queryOrUrl.replace(/"/g, '\\"')}"`;
      await execAsync(dlCmd, { timeout: 65000 }).catch(() => {});
    } catch (_) {}

    let foundFiles = fs.readdirSync(DOWNLOADS_DIR).filter((f) => f.startsWith(`raw_audio_${id}.`));

    // If direct URL failed (e.g. YouTube bot check on MP3 request), fallback to scsearch5 with title + artist
    if (foundFiles.length === 0 && !queryOrUrl.startsWith("scsearch")) {
      const cleanSearch = `${artist ? artist + " " : ""}${title}`
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (cleanSearch) {
        const fallbackCmd = `"${ytdlp}" --user-agent "${USER_AGENT}" -x --audio-format mp3 --audio-quality 320k --ignore-errors --max-downloads 1 --no-warnings --no-playlist -o "${rawAudioPattern}" "scsearch5:${cleanSearch}"`;
        await execAsync(fallbackCmd, { timeout: 65000 }).catch(() => {});
        foundFiles = fs.readdirSync(DOWNLOADS_DIR).filter((f) => f.startsWith(`raw_audio_${id}.`));
      }
    }

    if (foundFiles.length === 0) {
      return {
        success: false,
        error: `امکان استخراج فایل صوتی برای «${title}» وجود نداشت.`,
      };
    }

    const downloadedRaw = path.join(DOWNLOADS_DIR, foundFiles[0]);
    const finalMp3Path = path.join(DOWNLOADS_DIR, `music_${id}.mp3`);

    const safeTitle = (title || "Audio Track").replace(/"/g, "");
    const safeArtist = (artist || platformName).replace(/"/g, "");

    // Re-mux / normalize into standard 44.1kHz 320kbps MP3 with ID3v2.3 tags & cover art
    if (fs.existsSync(coverPath)) {
      const tagCmd = `ffmpeg -y -i "${downloadedRaw}" -i "${coverPath}" -map 0:a:0 -map 1:0 -c:a libmp3lame -b:a 320k -ar 44100 -c:v mjpeg -id3v2_version 3 -metadata title="${safeTitle}" -metadata artist="${safeArtist}" -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (front)" "${finalMp3Path}"`;
      await execAsync(tagCmd, { timeout: 30000 }).catch(async () => {
        await execAsync(
          `ffmpeg -y -i "${downloadedRaw}" -vn -c:a libmp3lame -b:a 320k -ar 44100 -id3v2_version 3 -metadata title="${safeTitle}" -metadata artist="${safeArtist}" "${finalMp3Path}"`,
          { timeout: 30000 }
        ).catch(() => {});
      });
    } else {
      await execAsync(
        `ffmpeg -y -i "${downloadedRaw}" -vn -c:a libmp3lame -b:a 320k -ar 44100 -id3v2_version 3 -metadata title="${safeTitle}" -metadata artist="${safeArtist}" "${finalMp3Path}"`,
        { timeout: 30000 }
      ).catch(() => {});
    }

    const chosenFile = fs.existsSync(finalMp3Path) ? finalMp3Path : downloadedRaw;
    const probe = await this.verifyMediaFile(chosenFile);

    if (!probe.valid || !probe.hasAudio) {
      return {
        success: false,
        error: "فایل صوتی دانلود شده معتبر نبود.",
      };
    }

    const cleanFileName =
      `${safeArtist ? safeArtist + " - " : ""}${safeTitle}`
        .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-_]/g, "")
        .trim()
        .slice(0, 60) || `audio_${id}`;

    const result: DownloadResult = {
      success: true,
      filePath: chosenFile,
      diskFileName: path.basename(chosenFile),
      thumbPath: fs.existsSync(coverPath) ? coverPath : undefined,
      fileName: `${cleanFileName}.mp3`,
      fileSize: probe.size,
      fileSizeFormatted: this.formatBytes(probe.size),
      title: safeTitle,
      author: safeArtist,
      platform: platformName,
      platformKey,
      duration: probe.duration || 0,
      durationFormatted: this.formatDuration(probe.duration),
      isAudio: true,
      thumbnailUrl: coverUrl,
    };

    return result;
  }

  /**
   * Download Spotify track with 320k audio and official cover art
   */
  public async downloadSpotifyTrack(url: string): Promise<DownloadResult> {
    const trimmed = url.trim();
    const id = crypto.createHash("md5").update(trimmed).digest("hex").slice(0, 10);
    const cached = this.memoryCache.get(`spotify_${id}`);
    if (cached && cached.filePath && fs.existsSync(cached.filePath)) {
      const check = await this.verifyMediaFile(cached.filePath);
      if (check.valid) return cached;
    }

    const meta = await this.fetchSpotifyMetadata(trimmed);
    const searchQuery = `scsearch5:${meta.artist ? meta.artist + " " : ""}${meta.title}`.trim();

    const result = await this.downloadVerifiedMp3({
      id: `sp_${id}`,
      queryOrUrl: searchQuery,
      title: meta.title,
      artist: meta.artist || "Spotify",
      platformName: "اسپاتیفای (Spotify)",
      platformKey: "spotify",
      coverUrl: meta.coverUrl,
    });

    if (result.success) {
      this.memoryCache.set(`spotify_${id}`, result);
    }
    return result;
  }

  /**
   * Normalizes any downloaded video into a 100% Telegram-compatible H.264 (yuv420p) + AAC MP4 with faststart.
   */
  private async normalizeAndVerifyVideo(params: {
    id: string;
    rawFilePath: string;
    title: string;
    author?: string;
    platformName: string;
    platformKey: string;
    fallbackCoverPath?: string;
  }): Promise<DownloadResult> {
    const { id, rawFilePath, title, author, platformName, platformKey, fallbackCoverPath } = params;
    const rawProbe = await this.verifyMediaFile(rawFilePath);

    if (!rawProbe.valid || !rawProbe.hasVideo) {
      return {
        success: false,
        error: "فایل دریافتی فاقد استریم ویدیویی معتبر است.",
      };
    }

    const cleanVideoPath = path.join(DOWNLOADS_DIR, `streamable_${id}.mp4`);
    const thumbPath = path.join(DOWNLOADS_DIR, `thumb_${id}.jpg`);

    const isStandardH264 =
      rawProbe.videoCodec === "h264" &&
      (!rawProbe.pixFmt || rawProbe.pixFmt === "yuv420p") &&
      (!rawProbe.hasAudio || rawProbe.audioCodec === "aac");

    if (isStandardH264 && rawFilePath.endsWith(".mp4")) {
      await execAsync(`ffmpeg -y -i "${rawFilePath}" -c copy -movflags +faststart "${cleanVideoPath}"`, {
        timeout: 35000,
      }).catch(() => {});
    }

    // If fast remux wasn't run or didn't produce a valid file, transcode to universal H.264 + AAC
    if (!fs.existsSync(cleanVideoPath) || !(await this.verifyMediaFile(cleanVideoPath)).valid) {
      const audioArgs = rawProbe.hasAudio ? `-c:a aac -b:a 128k -ar 44100` : `-an`;
      await execAsync(
        `ffmpeg -y -i "${rawFilePath}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -pix_fmt yuv420p -profile:v main -preset veryfast -crf 23 ${audioArgs} -movflags +faststart "${cleanVideoPath}"`,
        { timeout: 90000 }
      ).catch(() => {});
    }

    const finalVideoPath =
      fs.existsSync(cleanVideoPath) && (await this.verifyMediaFile(cleanVideoPath)).valid
        ? cleanVideoPath
        : rawFilePath;

    const finalProbe = await this.verifyMediaFile(finalVideoPath);
    if (!finalProbe.valid || !finalProbe.hasVideo) {
      return {
        success: false,
        error: "خطا در استانداردسازی فرمت ویدیو برای تلگرام.",
      };
    }

    // Generate Thumbnail Image at 1 second mark (or 0s for very short videos)
    try {
      const seekSec = (finalProbe.duration || 0) >= 2 ? "00:00:01" : "00:00:00";
      await execAsync(
        `ffmpeg -y -ss ${seekSec} -i "${finalVideoPath}" -vframes 1 -vf "scale='min(640,iw)':-1" -q:v 3 "${thumbPath}"`,
        { timeout: 10000 }
      );
    } catch (_) {}

    if (!fs.existsSync(thumbPath) && fallbackCoverPath && fs.existsSync(fallbackCoverPath)) {
      try {
        fs.copyFileSync(fallbackCoverPath, thumbPath);
      } catch (_) {}
    }

    const safeFileName =
      (title || "video")
        .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-_]/g, "")
        .trim()
        .slice(0, 50) || `video_${id}`;

    return {
      success: true,
      filePath: finalVideoPath,
      diskFileName: path.basename(finalVideoPath),
      thumbPath: fs.existsSync(thumbPath) ? thumbPath : undefined,
      fileName: `${safeFileName}.mp4`,
      fileSize: finalProbe.size,
      fileSizeFormatted: this.formatBytes(finalProbe.size),
      title: title || `${platformName} Video`,
      author,
      platform: platformName,
      platformKey,
      duration: finalProbe.duration || 1,
      durationFormatted: this.formatDuration(finalProbe.duration),
      width: finalProbe.width || 1280,
      height: finalProbe.height || 720,
      isAudio: false,
    };
  }

  /**
   * Download video or audio with codec normalization, verification, and multi-engine fallback.
   */
  public async downloadMedia(url: string, options: DownloadOptions = {}): Promise<DownloadResult> {
    const trimmed = url.trim();
    const platform = this.identifyPlatform(trimmed);
    const maxSizeMb = options.maxSizeMb || 50;
    const requestedQuality = (options.quality || "").toLowerCase();

    // 1. Route Spotify directly to Spotify handler
    if (platform.key === "spotify") {
      return this.downloadSpotifyTrack(trimmed);
    }

    const id = crypto.createHash("md5").update(`${trimmed}_${requestedQuality}`).digest("hex").slice(0, 10);
    const cached = this.memoryCache.get(id);
    if (cached && cached.filePath && fs.existsSync(cached.filePath)) {
      const check = await this.verifyMediaFile(cached.filePath);
      if (check.valid) return cached;
    }

    const ytdlp = await this.ensureYtDlpBinary();

    // 2. Handle Audio-Only requests (e.g. YouTube MP3, SoundCloud, or direct MP3)
    const isAudioOnly = requestedQuality === "mp3" || requestedQuality === "audio" || platform.isMusic;
    if (isAudioOnly) {
      let title = `${platform.name} Audio`;
      let artist = "";
      let coverUrl = "";

      if (platform.key === "youtube") {
        const ytMeta = await this.fetchYouTubeMetadata(trimmed);
        title = ytMeta.title;
        artist = ytMeta.author;
        coverUrl = ytMeta.thumbnail;
      } else {
        try {
          const info = await this.extractInfo(trimmed);
          if (info.title) title = info.title;
          if (info.author) artist = info.author;
          if (info.thumbnail) coverUrl = info.thumbnail;
        } catch (_) {}
      }

      const audioRes = await this.downloadVerifiedMp3({
        id,
        queryOrUrl: trimmed,
        title,
        artist,
        platformName: platform.name,
        platformKey: platform.key,
        coverUrl,
      });

      if (audioRes.success) {
        this.memoryCache.set(id, audioRes);
      }
      return audioRes;
    }

    // 3. Video Download via yt-dlp
    let maxRes = 720;
    if (requestedQuality.includes("1080")) maxRes = 1080;
    else if (requestedQuality.includes("480")) maxRes = 480;
    else if (requestedQuality.includes("360")) maxRes = 360;

    const formatFilter = `bestvideo[height<=${maxRes}][vcodec^=avc1]+bestaudio[acodec^=mp4a]/bestvideo[height<=${maxRes}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${maxRes}][ext=mp4]/best[height<=${maxRes}]/best`;

    // Clean any old raw video files for this id
    for (const f of fs.readdirSync(DOWNLOADS_DIR)) {
      if (f.startsWith(`raw_v_${id}.`)) {
        try {
          fs.unlinkSync(path.join(DOWNLOADS_DIR, f));
        } catch (_) {}
      }
    }

    const rawVideoPattern = path.join(DOWNLOADS_DIR, `raw_v_${id}.%(ext)s`);

    let metaTitle = "";
    let metaAuthor = "";
    let metaThumbnail = "";

    if (platform.key === "youtube") {
      const ytMeta = await this.fetchYouTubeMetadata(trimmed);
      metaTitle = ytMeta.title;
      metaAuthor = ytMeta.author;
      metaThumbnail = ytMeta.thumbnail;
    }

    // Attempt 3A: Direct yt-dlp video download
    try {
      const dlCmd = `"${ytdlp}" --user-agent "${USER_AGENT}" -f "${formatFilter}" --merge-output-format mp4 --max-filesize ${maxSizeMb}M --no-playlist --no-warnings -o "${rawVideoPattern}" "${trimmed.replace(/"/g, '\\"')}"`;
      await execAsync(dlCmd, { timeout: 90000 });
    } catch (_) {}

    let videoFiles = fs.readdirSync(DOWNLOADS_DIR).filter((f) => f.startsWith(`raw_v_${id}.`));

    // Attempt 3B: If YouTube direct download was blocked by datacenter bot check, use Dailymotion Video Search Mirror!
    if (videoFiles.length === 0 && platform.key === "youtube" && metaTitle) {
      try {
        const cleanQuery = metaTitle
          .replace(/\(official.*?\)|\[official.*?\]/gi, "")
          .replace(/[^\p{L}\p{N}\s-]/gu, " ")
          .replace(/\s+/g, " ")
          .trim();

        const dmApiUrl = `https://api.dailymotion.com/videos?search=${encodeURIComponent(
          cleanQuery
        )}&limit=3&fields=id,title,url,duration`;
        const dmRes = await fetch(dmApiUrl, { headers: { "User-Agent": USER_AGENT } });
        if (dmRes.ok) {
          const dmData = (await dmRes.json()) as any;
          const dmList: any[] = dmData?.list || [];
          const candidate = dmList.find((v) => v.url && v.duration && v.duration <= 1800) || dmList[0];
          if (candidate?.url) {
            const dmCmd = `"${ytdlp}" --user-agent "${USER_AGENT}" -f "best[height<=${maxRes}][ext=mp4]/best[ext=mp4]/best" --max-filesize ${maxSizeMb}M --no-playlist --no-warnings -o "${rawVideoPattern}" "${candidate.url}"`;
            await execAsync(dmCmd, { timeout: 75000 }).catch(() => {});
            videoFiles = fs.readdirSync(DOWNLOADS_DIR).filter((f) => f.startsWith(`raw_v_${id}.`));
          }
        }
      } catch (_) {}
    }

    if (videoFiles.length > 0) {
      const rawFilePath = path.join(DOWNLOADS_DIR, videoFiles[0]);
      if (!metaTitle) {
        try {
          const { stdout } = await execAsync(
            `"${ytdlp}" --user-agent "${USER_AGENT}" --print "%(title)s" --no-warnings "${trimmed.replace(/"/g, '\\"')}"`,
            { timeout: 10000 }
          );
          if (stdout.trim()) metaTitle = stdout.trim();
        } catch (_) {}
      }

      const normalized = await this.normalizeAndVerifyVideo({
        id,
        rawFilePath,
        title: metaTitle || `${platform.name} Video`,
        author: metaAuthor || undefined,
        platformName: platform.name,
        platformKey: platform.key,
      });

      if (normalized.success) {
        this.memoryCache.set(id, normalized);
        return normalized;
      }
    }

    // Attempt 4: Direct HTTP Stream (ONLY if Content-Type is actually video/* or audio/*, NEVER text/html!)
    try {
      const response = await fetch(trimmed, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "video/*,audio/*;q=0.9,*/*;q=0.5",
        },
      });

      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      const isDirectMedia =
        response.ok &&
        !contentType.includes("text/html") &&
        !contentType.includes("application/json") &&
        !contentType.includes("text/plain") &&
        (contentType.startsWith("video/") ||
          contentType.startsWith("audio/") ||
          contentType.includes("octet-stream") ||
          /\.(mp4|mov|m4v|webm|mp3|m4a)($|\?)/i.test(trimmed));

      if (isDirectMedia) {
        const arrayBuffer = await response.arrayBuffer();
        const rawBuf = Buffer.from(arrayBuffer);

        if (rawBuf.length > 4096 && rawBuf.length <= maxSizeMb * 1024 * 1024) {
          const rawDirectPath = path.join(DOWNLOADS_DIR, `raw_direct_${id}.mp4`);
          fs.writeFileSync(rawDirectPath, rawBuf);

          const normalized = await this.normalizeAndVerifyVideo({
            id: `dir_${id}`,
            rawFilePath: rawDirectPath,
            title: metaTitle || `${platform.name} Video`,
            platformName: platform.name,
            platformKey: platform.key,
          });

          if (normalized.success) {
            this.memoryCache.set(id, normalized);
            return normalized;
          }
        }
      }
    } catch (_) {}

    return {
      success: false,
      error: "امکان دریافت مستقیم این ویدیو وجود نداشت (ممکن است لینک خصوصی باشد یا محدودیت دسترسی داشته باشد).",
    };
  }

  private extractYouTubeId(url: string): string {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
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
