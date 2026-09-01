"use client";

import { useEffect, useRef, useState } from "react";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoPlayer({
  contentId,
  src,
  token,
  completionThreshold,
  initialPercent,
  onCompleted,
}: {
  contentId: string;
  src: string;
  token: string;
  completionThreshold: number;
  initialPercent: number;
  onCompleted?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxPercentRef = useRef(initialPercent);
  const lastReportRef = useRef(0);
  const completedRef = useRef(initialPercent >= completionThreshold);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  async function reportProgress(force = false) {
    const video = videoRef.current;
    if (!video || !duration) return;
    const now = Date.now();
    if (!force && now - lastReportRef.current < 4000) return;
    lastReportRef.current = now;

    try {
      const res = await fetch(`/api/content/${contentId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          watchedSeconds: Math.floor(video.currentTime),
          watchedPercent: maxPercentRef.current,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "COMPLETED" && !completedRef.current) {
          completedRef.current = true;
          onCompleted?.();
        }
      }
    } catch {
      // Falla silenciosa: se reintenta en el próximo evento de progreso.
    }
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setCurrent(video.currentTime);
    const pct = (video.currentTime / video.duration) * 100;
    if (pct > maxPercentRef.current) maxPercentRef.current = pct;
    reportProgress();
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(e.target.value);
    setCurrent(video.currentTime);
  }

  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const value = Number(e.target.value);
    video.volume = value;
    setVolume(value);
    setMuted(value === 0);
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function changeSpeed(value: number) {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = value;
    setSpeed(value);
    setShowSpeedMenu(false);
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  }

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full"
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          reportProgress(true);
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => reportProgress(true)}
        controlsList="nodownload"
        disablePictureInPicture
        playsInline
        onClick={togglePlay}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 opacity-100 transition-opacity sm:p-4">
        <div className="pointer-events-auto flex flex-col gap-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={handleSeek}
            className="h-1.5 w-full cursor-pointer accent-white"
            aria-label="Progreso del video"
          />
          <div className="flex items-center justify-between gap-2 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <button type="button" onClick={togglePlay} aria-label={playing ? "Pausar" : "Reproducir"} className="p-1">
                {playing ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button type="button" onClick={toggleMute} aria-label={muted ? "Activar sonido" : "Silenciar"} className="p-1">
                {muted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolume}
                className="hidden h-1 w-16 cursor-pointer accent-white sm:block"
                aria-label="Volumen"
              />
              <span className="whitespace-nowrap text-xs tabular-nums text-white/85">
                {formatTime(current)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSpeedMenu((v) => !v)}
                  className="rounded px-2 py-1 text-xs font-semibold hover:bg-white/15"
                >
                  {speed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 rounded-lg bg-black/90 p-1 text-xs">
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => changeSpeed(s)}
                        className={`block w-full rounded px-3 py-1.5 text-left hover:bg-white/15 ${s === speed ? "text-brand-300" : "text-white"}`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={toggleFullscreen} aria-label="Pantalla completa" className="p-1">
                {fullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {!playing && current === 0 && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Reproducir"
          className="absolute inset-0 flex items-center justify-center bg-black/20"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-lg">
            <PlayIcon size={26} />
          </span>
        </button>
      )}
    </div>
  );
}

function PlayIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}
function VolumeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 10v4h4l5 5V5L7 10H3zM16 8.5a4.5 4.5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function MuteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 10v4h4l5 5V5L7 10H3z" fill="currentColor" stroke="none" />
      <path d="M16 9l5 6M21 9l-5 6" />
    </svg>
  );
}
function FullscreenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
function ExitFullscreenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3v3a2 2 0 0 1-2 2H4M15 3v3a2 2 0 0 0 2 2h3M9 21v-3a2 2 0 0 0-2-2H4M15 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}
