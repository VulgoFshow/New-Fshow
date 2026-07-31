import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  Tv,
  Users,
  MessageSquare,
  Radio,
  ArrowLeft,
  Trash2,
  Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { GcManager } from "@/components/GcManager";
import { LikeRanking } from "@/components/LikeRanking";
import { BreakControl } from "@/components/BreakControl";
import { ScheduleManager } from "@/components/ScheduleManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel — FlopTv" },
      { name: "description", content: "Painel de administração do FlopTv: configurar transmissão e ver estatísticas." },
    ],
  }),
  component: AdminPage,
});

const schema = z.object({
  videoInput: z.string().trim().max(200).optional(),
  title: z.string().trim().min(1, "Informe um título").max(100),
  description: z.string().trim().max(500),
  is_live: z.boolean(),
});

/**
 * Aceita ID do YouTube ou URL (watch, youtu.be, live, embed).
 */
function extractYouTubeId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const v = u.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && /^[a-zA-Z0-9_-]{11}$/.test(last)) return last;
  } catch {
    /* not a URL */
  }
  return null;
}

function AdminPage() {
  const { user, loading } = useAuth();
  const { isAdmin, checking } = useIsAdmin(user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || checking) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [user, isAdmin, loading, checking, navigate]);

  if (loading || checking || !user || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        Carregando painel...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow">
              <Tv className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display text-xl tracking-wider">FlopTv</div>
              <div className="-mt-1 flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary">
                <Shield className="h-3 w-3" /> Admin
              </div>
            </div>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Ver player
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <StreamForm />
          <BreakControl />
          <ScheduleManager />
          <GcManager />
        </div>
        <div className="space-y-6">
          <Stats />
          <LikeRanking canReset />
          <HowTo />
        </div>
      </main>
    </div>
  );
}

function StreamForm() {
  const [videoInput, setVideoInput] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [syncMode, setSyncMode] = useState(true);
  const [loopStream, setLoopStream] = useState(true);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("stream_config")
      .select("youtube_video_id, title, description, is_live, started_at, sync_mode, loop_stream")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setVideoInput(data.youtube_video_id ?? "");
          setTitle(data.title ?? "");
          setDescription(data.description ?? "");
          setIsLive(!!data.is_live);
          setSyncMode(data.sync_mode ?? true);
          setLoopStream(data.loop_stream ?? true);
          setStartedAt(data.started_at ?? null);
        }
        setLoaded(true);
      });
  }, []);

  const restart = async () => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("stream_config")
      .update({ started_at: now, updated_at: now })
      .eq("id", 1);
    if (error) return toast.error("Erro ao iniciar");
    setStartedAt(now);
    toast.success("Programação iniciada do começo para todos!");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ videoInput, title, description, is_live: isLive });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const videoId = videoInput.trim() ? extractYouTubeId(videoInput) : null;
    if (videoInput.trim() && !videoId) {
      toast.error("ID/URL do YouTube inválido");
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    const nextStartedAt = startedAt ?? now;
    const { error } = await supabase
      .from("stream_config")
      .update({
        youtube_video_id: videoId,
        title: parsed.data.title,
        description: parsed.data.description,
        is_live: parsed.data.is_live,
        sync_mode: syncMode,
        loop_stream: loopStream,
        started_at: nextStartedAt,
        updated_at: now,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) return toast.error("Erro ao salvar");
    setStartedAt(nextStartedAt);
    toast.success("Transmissão atualizada!");
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Radio className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl tracking-wide">Transmissão</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure o vídeo do YouTube Live que aparece na home.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="v">ID ou URL do YouTube</Label>
          <Input
            id="v"
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            placeholder="ex: dQw4w9WgXcQ ou https://youtube.com/watch?v=..."
            className="bg-background"
            disabled={!loaded}
          />
          <p className="text-xs text-muted-foreground">
            Cole o link da sua live do YouTube. Aceita youtube.com/watch, youtu.be, /live/ e /embed/.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="t">Título</Label>
          <Input
            id="t"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="bg-background"
            disabled={!loaded}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="d">Descrição</Label>
          <Textarea
            id="d"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="bg-background"
            disabled={!loaded}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
          <div>
            <div className="font-semibold">Ao vivo agora</div>
            <div className="text-xs text-muted-foreground">
              Quando ligado, o player aparece para todos os visitantes.
            </div>
          </div>
          <Switch checked={isLive} onCheckedChange={setIsLive} disabled={!loaded} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
          <div>
            <div className="font-semibold">Modo TV (sincronizado)</div>
            <div className="text-xs text-muted-foreground">
              Todos assistem exatamente no mesmo ponto. Ninguém pode pausar, avançar ou voltar.
            </div>
          </div>
          <Switch checked={syncMode} onCheckedChange={setSyncMode} disabled={!loaded} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
          <div>
            <div className="font-semibold">Repetir automaticamente</div>
            <div className="text-xs text-muted-foreground">
              Quando o vídeo termina, a programação recomeça do zero.
            </div>
          </div>
          <Switch checked={loopStream} onCheckedChange={setLoopStream} disabled={!loaded} />
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <div className="font-semibold">Início da programação</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {startedAt
              ? `Começou em ${new Date(startedAt).toLocaleString("pt-BR")}`
              : "Ainda não iniciada."}
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-3 w-full"
            onClick={restart}
            disabled={!loaded}
          >
            Começar do início agora (para todos)
          </Button>
        </div>

        <Button
          type="submit"
          disabled={saving || !loaded}
          className="w-full bg-gradient-brand text-primary-foreground"
        >
          {saving ? "Salvando..." : "Salvar transmissão"}
        </Button>
      </form>
    </section>
  );
}

type ChatRow = {
  id: string;
  display_name: string;
  message: string;
  created_at: string;
};

function Stats() {
  const [viewers, setViewers] = useState(0);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [msgTotal, setMsgTotal] = useState<number | null>(null);
  const [recent, setRecent] = useState<ChatRow[]>([]);

  useEffect(() => {
    const ch = supabase.channel("floptv-viewers", {
      config: { presence: { key: `admin-${Math.random().toString(36).slice(2)}` } },
    });
    ch.on("presence", { event: "sync" }, () => {
      setViewers(Object.keys(ch.presenceState()).length);
    }).subscribe(async (s) => {
      if (s === "SUBSCRIBED") await ch.track({ role: "admin" });
    });
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const load = () => {
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setUserCount(count ?? 0));
    supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setMsgTotal(count ?? 0));
    supabase
      .from("chat_messages")
      .select("id, display_name, message, created_at")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setRecent(data ?? []));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const cards = useMemo(
    () => [
      { label: "Assistindo agora", value: viewers, icon: Users, color: "text-primary" },
      { label: "Usuários cadastrados", value: userCount ?? "—", icon: Shield, color: "text-accent" },
      { label: "Mensagens no chat", value: msgTotal ?? "—", icon: MessageSquare, color: "text-primary" },
    ],
    [viewers, userCount, msgTotal],
  );

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-xl tracking-wide">Estatísticas</h2>
      <div className="mt-4 grid gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="flex items-center justify-between rounded-xl border border-border bg-background p-3"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <c.icon className={`h-4 w-4 ${c.color}`} />
              {c.label}
            </div>
            <div className="font-display text-2xl tracking-wide">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="mb-2 text-sm font-semibold text-muted-foreground">
          Últimas mensagens
        </div>
        <div className="space-y-2">
          {recent.length === 0 && (
            <p className="text-xs text-muted-foreground">Nada por aqui ainda.</p>
          )}
          {recent.map((m) => (
            <div
              key={m.id}
              className="group flex items-start justify-between gap-2 rounded-lg border border-border bg-background p-2 text-xs"
            >
              <div className="min-w-0">
                <div className="font-semibold text-primary">{m.display_name}</div>
                <div className="truncate text-foreground/90">{m.message}</div>
              </div>
              <button
                onClick={async () => {
                  const { error } = await supabase
                    .from("chat_messages")
                    .delete()
                    .eq("id", m.id);
                  if (error) toast.error("Erro ao apagar");
                  else {
                    toast.success("Apagada");
                    load();
                  }
                }}
                className="opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Apagar"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowTo() {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 text-sm">
      <h2 className="font-display text-xl tracking-wide">Como transmitir do OBS</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted-foreground">
        <li>
          Abra{" "}
          <a
            className="text-primary underline"
            href="https://studio.youtube.com/channel/UC/livestreaming"
            target="_blank"
            rel="noreferrer"
          >
            YouTube Studio → Ao vivo
          </a>{" "}
          e crie uma transmissão.
        </li>
        <li>
          Copie a <b>chave da transmissão</b> do YouTube.
        </li>
        <li>
          No OBS: <b>Configurações → Transmissão</b> → serviço <b>YouTube - RTMPS</b> → cole a chave.
        </li>
        <li>
          Clique em <b>Iniciar transmissão</b> no OBS. Aguarde a pré-visualização no YouTube.
        </li>
        <li>
          Volte aqui, cole o <b>link ou ID</b> do vídeo do YouTube, ative <b>Ao vivo agora</b> e salve.
        </li>
      </ol>
      <p className="mt-4 text-xs text-muted-foreground">
        <b>Modo TV:</b> com vídeos gravados, todos entram no mesmo minuto da programação — quem chegar
        depois pega no meio, igual TV. Use "Começar do início agora" para reiniciar a grade.
      </p>
    </section>
  );
}