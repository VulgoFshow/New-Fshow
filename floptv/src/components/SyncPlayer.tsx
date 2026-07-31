import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<any> | null = null;

function loadYouTubeApi(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return apiPromise;
}

type Props = {
  videoId: string;
  /** ISO date: momento em que a programação começou. */
  startedAt: string | null;
  /** Sincroniza todos no mesmo ponto e bloqueia controles. */
  sync: boolean;
  /** Recomeça do zero quando o vídeo acaba. */
  loop: boolean;
  /** Pausa a transmissão para todo mundo (intervalo). */
  paused?: boolean;
  title?: string;
};

/**
 * Player estilo canal de TV: todo mundo vê o mesmo instante,
 * sem poder pausar, avançar ou voltar.
 */
export function SyncPlayer({ videoId, startedAt, sync, loop, paused = false, title }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    const targetTime = (duration: number) => {
      if (!startedAt) return 0;
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
      if (elapsed <= 0) return 0;
      if (!duration || duration <= 0) return elapsed;
      return loop ? elapsed % duration : Math.min(elapsed, duration);
    };

    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;

      playerRef.current = new YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: sync ? 0 : 1,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          fs: sync ? 0 : 1,
        },
        events: {
          onReady: (e: any) => {
            e.target.mute();
            if (pausedRef.current) e.target.pauseVideo();
            else e.target.playVideo();
            if (sync) {
              const d = e.target.getDuration?.() ?? 0;
              e.target.seekTo(targetTime(d), true);
            }
            setNeedsTap(true);
          },
          onStateChange: (e: any) => {
            if (!sync || pausedRef.current) return;
            const YTS = window.YT?.PlayerState;
            if (e.data === YTS?.PAUSED) e.target.playVideo();
            if (e.data === YTS?.ENDED && loop) {
              e.target.seekTo(targetTime(e.target.getDuration?.() ?? 0), true);
              e.target.playVideo();
            }
          },
        },
      });

      if (sync) {
        interval = setInterval(() => {
          const p = playerRef.current;
          if (!p?.getCurrentTime) return;
          if (pausedRef.current) return;
          const d = p.getDuration?.() ?? 0;
          const target = targetTime(d);
          const drift = Math.abs(p.getCurrentTime() - target);
          if (drift > 2) p.seekTo(target, true);
        }, 4000);
      }
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* noop */
      }
      playerRef.current = null;
    };
  }, [videoId, startedAt, sync, loop]);

  // Pausa/retoma para todos quando o admin muda o estado.
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    if (paused) p.pauseVideo?.();
    else p.playVideo?.();
  }, [paused]);

  const unmute = () => {
    const p = playerRef.current;
    p?.unMute?.();
    p?.setVolume?.(100);
    if (!paused) p?.playVideo?.();
    setNeedsTap(false);
  };

  return (
    <div className="relative h-full w-full bg-black">
      <div ref={hostRef} className="h-full w-full" title={title} />
      {/* Bloqueia cliques no player para ninguém pausar/avançar */}
      {sync && <div className="absolute inset-0" aria-hidden />}
      {needsTap && (
        <button
          onClick={unmute}
          className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Clique para ativar o som
        </button>
      )}
    </div>
  );
}