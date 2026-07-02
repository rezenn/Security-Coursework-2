"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
} from "lucide-react";
import clsx from "clsx";

// Loads the YouTube IFrame Player API script once, shared across every
// instance of this component on the page.
let ytApiPromise: Promise<void> | null = null;
function loadYoutubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const prevCallback = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      prevCallback?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

interface YoutubePlayerProps {
  videoId: string;
  title?: string;
}

export function YoutubePlayer({ videoId, title }: YoutubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPreview, setSeekPreview] = useState(0);

  // Create the player once per videoId
  useEffect(() => {
    let cancelled = false;
    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    loadYoutubeApi().then(() => {
      if (cancelled || !containerRef.current) return;
      const YT = (window as any).YT;

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          controls: 0, // we render our own controls
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          disablekb: 0,
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            setIsReady(true);
            setDuration(playerRef.current.getDuration() || 0);
          },
          onStateChange: (e: any) => {
            if (cancelled) return;
            const YTState = YT.PlayerState;
            if (e.data === YTState.PLAYING) setIsPlaying(true);
            if (e.data === YTState.PAUSED || e.data === YTState.ENDED)
              setIsPlaying(false);
            if (e.data === YTState.PLAYING) {
              setDuration(playerRef.current.getDuration() || 0);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId]);

  // Poll current time while playing (YouTube API has no timeupdate event)
  useEffect(() => {
    const tick = () => {
      if (playerRef.current?.getCurrentTime && !isSeeking) {
        setCurrentTime(playerRef.current.getCurrentTime() || 0);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isSeeking]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying]);

  const skip = useCallback((deltaSeconds: number) => {
    if (!playerRef.current) return;
    const current = playerRef.current.getCurrentTime() || 0;
    const dur = playerRef.current.getDuration() || 0;
    const next = Math.min(Math.max(current + deltaSeconds, 0), dur);
    playerRef.current.seekTo(next, true);
    setCurrentTime(next);
  }, []);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  const handleFullscreen = useCallback(() => {
    const iframe = containerRef.current?.querySelector("iframe");
    if (iframe?.requestFullscreen) iframe.requestFullscreen();
  }, []);

  const handleSeekStart = () => setIsSeeking(true);
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekPreview(Number(e.target.value));
  };
  const handleSeekCommit = (
    e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>
  ) => {
    const value = Number(e.currentTarget.value);
    playerRef.current?.seekTo(value, true);
    setCurrentTime(value);
    setIsSeeking(false);
  };

  const displayTime = isSeeking ? seekPreview : currentTime;
  const progressPct = duration > 0 ? (displayTime / duration) * 100 : 0;

  return (
    <div className="w-full h-full flex flex-col bg-black">
      <div className="relative flex-1 min-h-0">
        <div ref={containerRef} className="w-full h-full" />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <span className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Custom control bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-3 py-2">
        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={displayTime}
          onMouseDown={handleSeekStart}
          onTouchStart={handleSeekStart}
          onChange={handleSeekChange}
          onMouseUp={handleSeekCommit}
          onTouchEnd={handleSeekCommit}
          disabled={!isReady}
          className="w-full h-1.5 mb-2 accent-blue-500 cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, #3b82f6 ${progressPct}%, #334155 ${progressPct}%)`,
          }}
          aria-label={`Seek — ${formatTime(displayTime)} of ${formatTime(duration)}`}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => skip(-10)}
              disabled={!isReady}
              title="Back 10 seconds"
              aria-label="Rewind 10 seconds"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={togglePlay}
              disabled={!isReady}
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-40"
            >
              {isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button
              onClick={() => skip(10)}
              disabled={!isReady}
              title="Forward 10 seconds"
              aria-label="Forward 10 seconds"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
            >
              <RotateCw size={16} />
            </button>
            <span className="text-xs text-slate-400 font-mono ml-2 tabular-nums">
              {formatTime(displayTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              disabled={!isReady}
              title={isMuted ? "Unmute" : "Mute"}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              onClick={handleFullscreen}
              disabled={!isReady}
              title="Fullscreen"
              aria-label="Fullscreen"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
            >
              <Maximize size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
