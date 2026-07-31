import { useCallback, useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/image";

type Burst = { id: number; x: number; y: number; drift: number; rot: number; color: string };

const COLORS = ["#ff2d6f", "#ff7ab8", "#ffd166", "#4cc9f0", "#b388ff"];

/**
 * Camada de curtidas estilo TikTok: cada toque solta um coração
 * e soma no ranking em tempo real (com envio agrupado).
 */
export function LikeLayer({
  displayName,
  avatarUrl,
  onLocalLike,
  canLike = true,
  onBlocked,
}: {
  displayName: string;
  avatarUrl: string | null;
  onLocalLike?: () => void;
  /** Somente pessoas logadas podem curtir. */
  canLike?: boolean;
  onBlocked?: () => void;
}) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const pending = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  const flush = useCallback(async () => {
    const amount = pending.current;
    pending.current = 0;
    if (amount <= 0) return;
    await (supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown>;
    }).rpc("add_likes", {
      _client_id: getClientId(),
      _display_name: displayName,
      _avatar_url: avatarUrl,
      _amount: amount,
    });
  }, [displayName, avatarUrl]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      void flush();
    };
  }, [flush]);

  const tap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canLike) {
      onBlocked?.();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const id = ++seq.current;
    setBursts((prev) => [
      ...prev.slice(-24),
      {
        id,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        drift: Math.round((Math.random() - 0.5) * 80),
        rot: Math.round((Math.random() - 0.5) * 40),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      },
    ]);
    setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 1200);

    pending.current += 1;
    onLocalLike?.();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 700);
  };

  return (
    <div className="absolute inset-0 z-20" onPointerDown={tap}>
      {bursts.map((b) => (
        <Heart
          key={b.id}
          className="pointer-events-none absolute h-10 w-10 animate-like-float drop-shadow-lg"
          style={
            {
              left: b.x,
              top: b.y,
              color: b.color,
              fill: b.color,
              ["--like-drift" as string]: `${b.drift}px`,
              ["--like-rot" as string]: `${b.rot}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}