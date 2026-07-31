import { useEffect, useState } from "react";
import { Heart, RotateCcw, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Row = {
  id: string;
  client_id: string;
  display_name: string;
  avatar_url: string | null;
  total: number;
};

/** Ranking de curtidas em tempo real. */
export function LikeRanking({
  limit = 10,
  canReset = false,
}: {
  limit?: number;
  canReset?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [resetting, setResetting] = useState(false);
  const me = typeof window !== "undefined" ? getClientId() : "";

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("like_totals")
        .select("id, client_id, display_name, avatar_url, total")
        .order("total", { ascending: false })
        .limit(limit);
      setRows((data as Row[]) ?? []);
    };
    load();
    const ch = supabase
      .channel("like_totals_stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "like_totals" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [limit]);

  const totalAll = rows.reduce((a, r) => a + r.total, 0);

  const reset = async () => {
    if (!window.confirm("Zerar o ranking de curtidas para todo mundo?")) return;
    setResetting(true);
    const { error } = await supabase
      .from("like_totals")
      .delete()
      .not("id", "is", null);
    setResetting(false);
    if (error) return toast.error("Não foi possível zerar o ranking");
    setRows([]);
    toast.success("Ranking zerado!");
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg tracking-wide">
          <Trophy className="h-4 w-4 text-primary" /> Ranking de curtidas
        </h2>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="h-3.5 w-3.5 fill-primary text-primary" /> {totalAll}
          </span>
          {canReset && (
            <Button
              size="sm"
              variant="ghost"
              onClick={reset}
              disabled={resetting}
              aria-label="Zerar ranking"
            >
              <RotateCcw className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          Toque na tela do vídeo para mandar curtidas!
        </p>
      ) : (
        <ol className="mt-3 space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.id}
              className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 text-sm ${
                r.client_id === me
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-background"
              }`}
            >
              <span className="w-5 text-center font-display text-lg text-muted-foreground">
                {i + 1}
              </span>
              {r.avatar_url ? (
                <img src={r.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-[10px] font-bold uppercase">
                  {r.display_name.slice(0, 2)}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate font-medium">{r.display_name}</span>
              <span className="flex items-center gap-1 font-semibold text-primary">
                <Heart className="h-3.5 w-3.5 fill-primary" />
                {r.total}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}