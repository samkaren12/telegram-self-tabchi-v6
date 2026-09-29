import { useState, useEffect, useRef, useCallback } from "react";

export type NotificationSoundType = "store_order" | "broadcast_completed" | "ticket_created" | "test";

const SOUND_STORAGE_KEY = "hacker_v6_sound_notifications_enabled";
const VOLUME_STORAGE_KEY = "hacker_v6_sound_notifications_volume";

export interface SoundNotificationSettings {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
  playOrderSound: boolean;
  playBroadcastSound: boolean;
}

export function useSoundNotification() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SOUND_STORAGE_KEY);
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const [volume, setVolume] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
      return stored !== null ? parseFloat(stored) : 0.45;
    } catch {
      return 0.45;
    }
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const toggleSound = useCallback((val?: boolean) => {
    setEnabled((prev) => {
      const next = typeof val === "boolean" ? val : !prev;
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const updateVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolume(clamped);
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
    } catch {}
  }, []);

  /**
   * Play elegant, harmonic synthesized non-intrusive chime tones
   */
  const playSound = useCallback(
    (type: NotificationSoundType) => {
      if (!enabled) return;

      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        gainNode.gain.setValueAtTime(volume * 0.35, now);

        if (type === "store_order") {
          // Play a delightful ascending chime for new store orders (G5 -> C6 -> E6)
          const notes = [783.99, 1046.5, 1318.51];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            noteGain.gain.setValueAtTime(0, now + idx * 0.08);
            noteGain.gain.linearRampToValueAtTime(volume * 0.3, now + idx * 0.08 + 0.02);
            noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

            osc.connect(noteGain);
            noteGain.connect(gainNode);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.5);
          });
        } else if (type === "broadcast_completed") {
          // Play a smooth, calming completion double-tone (E5 -> A5)
          const notes = [659.25, 880.0];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);

            noteGain.gain.setValueAtTime(0, now + idx * 0.12);
            noteGain.gain.linearRampToValueAtTime(volume * 0.25, now + idx * 0.12 + 0.03);
            noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.5);

            osc.connect(noteGain);
            noteGain.connect(gainNode);

            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.55);
          });
        } else {
          // Gentle single ping for test or general notification
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(987.77, now); // B5

          noteGain.gain.setValueAtTime(0, now);
          noteGain.gain.linearRampToValueAtTime(volume * 0.25, now + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

          osc.connect(noteGain);
          noteGain.connect(gainNode);

          osc.start(now);
          osc.stop(now + 0.4);
        }
      } catch (err) {
        console.warn("Unable to play notification audio:", err);
      }
    },
    [enabled, volume, getAudioContext]
  );

  return {
    soundEnabled: enabled,
    volume,
    toggleSound,
    updateVolume,
    playSound,
  };
}
