import { useEffect, useState } from "react";
import { Coffee, Pause, Play, SkipForward, Plus, Trash2, ListVideo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { extractYouTubeId } from "@/lib/youtube";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type PlaylistItem = {
  id: string;
  title: string;
  youtube_video_id: string;
  sort_order: number;
};

/** Controle de intervalo (pausar para todos / entrar com outro vídeo) + playlist salva. */
export function BreakControl() {
  const [paused, setPaused] = useState(false);
  const [pauseMessage, setPauseMessage] = useState("Já voltamos!");
  const [interlude, setInterlude] = useState<string | null>(null);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [loaded, setLoaded] = useState(false);

  const loadConfig = async () => {
    const { data } = await supabase
      .from("stream_config")
      .select("paused, pause_message, interlude_video_id")
      .eq("id", 1)
      .maybeSingle();
    if (data) {
      setPaused(!!data.paused);
      setPauseMessage(data.pause_message ?? "Já voltamos!");
      setInterlude(data.interlude_video_id ?? null);
    }
    setLoaded(true);
  };

  const loadItems = async () => {
    const { data } = await supabase
      .from("playlist_items")
      .select("id, title, youtube_video_id, sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setItems(data ?? []);
  };

  useEffect(() => {
    loadConfig();
    loadItems();
  }, []);

  const patch = async (values: Record<string, unknown>) => {
    const { error } = await supabase
      .from("stream_config")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) toast.error("Erro ao atualizar");
    return !error;
  };

  const togglePause = async () => {
    const next = !paused;
    if (await patch({ paused: next, pause_message: pauseMessage })) {
      setPaused(next);
      toast.success(next ? "Transmissão pausada para todos" : "Transmissão retomada");
    }
  };

  const playNow = async (videoId: string, name: string) => {
    const now = new Date().toISOString();
    if (
      await patch({
        interlude_video_id: videoId,
        interlude_started_at: now,
        paused: false,
      })
    ) {
      setInterlude(videoId);
      setPaused(false);
      toast.success(`Entrou no ar: ${name}`);
    }
  };

  const endInterlude = async () => {
    if (await patch({ interlude_video_id: null, interlude_started_at: null })) {
      setInterlude(null);
      toast.success("Voltamos à programação normal");
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYouTubeId(link);
    if (!title.trim()) return toast.error("Informe um nome");
    if (!id) return toast.error("Link ou ID do YouTube inválido");
    const { error } = await supabase.from("playlist_items").insert({
      title: title.trim().slice(0, 120),
      youtube_video_id: id,
      sort_order: items.length,
    });
    if (error) return toast.error("Erro ao salvar na playlist");
    setTitle("");
    setLink("");
    loadItems();
    toast.success("Salvo na playlist");
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from("playlist_items").delete().eq("id", id);
    if (error) return toast.error("Erro ao apagar");
    loadItems();
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Coffee className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl tracking-wide">Intervalo & Playlist</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Pause a transmissão para todo mundo ou entre com outro vídeo no meio da programação.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant={paused ? "default" : "secondary"}
          className={paused ? "bg-gradient-brand text-primary-foreground" : ""}
          onClick={togglePause}
          disabled={!loaded}
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {paused ? "Voltar do intervalo" : "Pausar para todos"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={endInterlude}
          disabled={!loaded || !interlude}
        >
          <SkipForward className="h-4 w-4" /> Encerrar vídeo de intervalo
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        <Label htmlFor="pausemsg">Mensagem do intervalo</Label>
        <div className="flex gap-2">
          <Input
            id="pausemsg"
            value={pauseMessage}
            onChange={(e) => setPauseMessage(e.target.value)}
            maxLength={80}
            className="bg-background"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              if (await patch({ pause_message: pauseMessage })) toast.success("Mensagem salva");
            }}
          >
            Salvar
          </Button>
        </div>
        {interlude && (
          <p className="text-xs text-primary">No ar agora: vídeo de intervalo ({interlude})</p>
        )}
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <div className="flex items-center gap-2">
          <ListVideo className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg tracking-wide">Playlist salva</h3>
        </div>

        <form onSubmit={addItem} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome (ex: Vinheta FlopTv)"
            className="bg-background"
          />
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link ou ID do YouTube"
            className="bg-background"
          />
          <Button type="submit" variant="secondary">
            <Plus className="h-4 w-4" /> Salvar
          </Button>
        </form>

        <div className="mt-4 space-y-2">
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum vídeo salvo ainda.</p>
          )}
          {items.map((it) => (
            <div
              key={it.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-background p-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{it.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {it.youtube_video_id}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => playNow(it.youtube_video_id, it.title)}
                >
                  <Play className="h-3.5 w-3.5" /> Passar agora
                </Button>
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  aria-label="Apagar da playlist"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}