import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LowerThird, type GcData } from "./LowerThird";

type Row = GcData & {
  id: string;
  is_active: boolean;
  updated_at: string;
  air_since: string | null;
};

/** Busca a legenda ativa e a mantém sincronizada em tempo real. */
export function GcOverlay({ scale = 1 }: { scale?: number }) {
  const [active, setActive] = useState<Row | null>(null);
  const [expired, setExpired] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const [widthScale, setWidthScale] = useState(1);

  // O GC precisa encolher junto com o vídeo (celular, miniatura, etc).
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth || 640;
      setWidthScale(Math.min(1.15, Math.max(0.34, w / 780)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("lower_thirds")
        .select("*")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1);
      const row = (data?.[0] as Row) ?? null;
      setActive(row);
      setExpired(false);
    };
    load();

    const ch = supabase
      .channel("lower_thirds_stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lower_thirds" },
        () => load(),
      )
      .subscribe();

    // Rede de segurança: mantém todos sincronizados mesmo se um evento se perder.
    const poll = setInterval(load, 8000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(poll);
    };
  }, []);

  // Ocultar automaticamente (mesmo horário para todos, a partir de air_since).
  useEffect(() => {
    setExpired(false);
    const secs = active?.auto_hide_seconds ?? 0;
    if (!active || !secs || !active.air_since) return;
    const endsIn = new Date(active.air_since).getTime() + secs * 1000 - Date.now();
    if (endsIn <= 0) {
      setExpired(true);
      return;
    }
    const t = setTimeout(() => setExpired(true), endsIn);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div ref={boxRef} className="pointer-events-none absolute inset-0 z-10">
      <LowerThird data={active} show={!!active && !expired} scale={scale * widthScale} />
    </div>
  );
}