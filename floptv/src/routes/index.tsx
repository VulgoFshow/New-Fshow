import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Radio,
  Send,
  Users,
  Tv,
  LogIn,
  Shield,
  LogOut,
  Heart,
  Maximize,
  Minimize,
  PictureInPicture2,
  X,
  CalendarDays,
  Coffee,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { SyncPlayer } from "@/components/SyncPlayer";
import { GcOverlay } from "@/components/GcOverlay";
import { LikeLayer } from "@/components/LikeLayer";
import { LikeRanking } from "@/components/LikeRanking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlopTv — Assista ao vivo" },
      { name: "description", content: "FlopTv - A Tv online mais flopada da internet" },
    ],
  }),
  component: WatchPage,
});

type StreamConfig = {
  youtube_video_id: string | null;
  title: string;
  description: string;
  is_live: boolean;
  started_at: string | null;
  sync_mode: boolean;
  loop_stream: boolean;
  paused: boolean;
  pause_message: string;
  interlude_video_id: string | null;
  interlude_started_at: string | null;
};

type ChatMessage = {
  id: string;
  user_id: string;
  display_name: string;
  message: string;
  created_at: string;
};

function WatchPage() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin(user?.id);
  const [cfg, setCfg] = useState<StreamConfig | null>(null);
  const [viewers, setViewers] = useState(1);
  const [me, setMe] = useState<{ display_name: string; avatar_url: string | null }>({
    display_name: "Anônimo",
    avatar_url: null,
  });
  const [myLikes, setMyLikes] = useState(0);
  const playerBoxRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = playerBoxRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      toast.error("Tela cheia não disponível neste navegador");
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setMe({ display_name: "Anônimo", avatar_url: null });
      return;
    }
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) =>
        setMe({
          display_name:
            data?.display_name || user.email?.split("@")[0] || "Anônimo",
          avatar_url: data?.avatar_url ?? null,
        }),
      );
  }, [user]);

  useEffect(() => {
    supabase
      .from("stream_config")
      .select(
        "youtube_video_id, title, description, is_live, started_at, sync_mode, loop_stream, paused, pause_message, interlude_video_id, interlude_started_at",
      )
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => data && setCfg(data));

    const ch = supabase
      .channel("stream_config_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "stream_config" },
        (payload) => setCfg(payload.new as StreamConfig),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  // Viewer presence
  useEffect(() => {
    const key = user?.id ?? `anon-${Math.random().toString(36).slice(2)}`;
    const ch = supabase.channel("floptv-viewers", {
      config: { presence: { key } },
    });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      setViewers(Object.keys(state).length);
    }).subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ online_at: new Date().toISOString() });
      }
    });
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const mainVideoId = cfg?.youtube_video_id?.trim();
  const interludeId = cfg?.interlude_video_id?.trim() || null;
  const videoId = interludeId || mainVideoId;
  const isLive = !!cfg?.is_live && !!videoId;
  const paused = !!cfg?.paused;

  return (
    <div className="min-h-screen">
      <Header user={user} isAdmin={isAdmin} viewers={viewers} isLive={isLive} />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <div
              ref={playerBoxRef}
              className={
                isPip
                  ? "fixed bottom-4 right-4 z-50 w-[min(340px,80vw)] overflow-hidden rounded-2xl border border-border bg-black shadow-glow"
                  : "relative overflow-hidden rounded-2xl border border-border bg-black shadow-glow"
              }
            >
              <div
                className={
                  isFullscreen
                    ? "relative h-screen w-full"
                    : "relative aspect-video w-full"
                }
              >
                {isLive && videoId ? (
                  <SyncPlayer
                    key={`${videoId}-${(interludeId ? cfg?.interlude_started_at : cfg?.started_at) ?? ""}`}
                    videoId={videoId}
                    startedAt={
                      (interludeId ? cfg?.interlude_started_at : cfg?.started_at) ?? null
                    }
                    sync={cfg?.sync_mode ?? true}
                    loop={interludeId ? true : (cfg?.loop_stream ?? true)}
                    paused={paused}
                    title={cfg?.title ?? "FlopTv"}
                  />
                ) : (
                  <OfflinePlaceholder />
                )}
                {isLive && paused && (
                  <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-background/80 text-center backdrop-blur-sm">
                    <div className="px-6">
                      <Coffee className="mx-auto h-8 w-8 text-primary" />
                      <p className="mt-3 font-display text-xl uppercase tracking-widest sm:text-3xl">
                        Intervalo
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {cfg?.pause_message || "Já voltamos!"}
                      </p>
                    </div>
                  </div>
                )}
                <GcOverlay scale={isPip ? 0.5 : isFullscreen ? 1.4 : 1} />
                <LikeLayer
                  displayName={me.display_name}
                  avatarUrl={me.avatar_url}
                  canLike={!!user}
                  onBlocked={() => toast.error("Entre na sua conta para curtir 💗")}
                  onLocalLike={() => setMyLikes((n) => n + 1)}
                />
              </div>
            </div>
            {isPip && (
              <div className="grid aspect-video w-full place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                Assistindo em miniatura
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setIsPip((p) => !p)}
              >
                {isPip ? (
                  <>
                    <X className="h-4 w-4" /> Sair da miniatura
                  </>
                ) : (
                  <>
                    <PictureInPicture2 className="h-4 w-4" /> Miniatura
                  </>
                )}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <>
                    <Minimize className="h-4 w-4" /> Sair da tela cheia
                  </>
                ) : (
                  <>
                    <Maximize className="h-4 w-4" /> Tela cheia
                  </>
                )}
              </Button>
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-3xl font-display uppercase tracking-wide">
                  {cfg?.title ?? "FlopTv"}
                </h1>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" /> {viewers} assistindo
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 fill-primary text-primary" /> {myLikes} suas
                    curtidas
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {cfg?.description ?? ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {user
                  ? "Toque na tela do vídeo para mandar curtidas 💗"
                  : "Entre na sua conta para poder curtir 💗"}
              </p>
            </div>
          </section>

          <div className="space-y-6">
            <LikeRanking />
            <Chat user={user} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Header({
  user,
  isAdmin,
  viewers,
  isLive,
}: {
  user: { email?: string | null } | null;
  isAdmin: boolean;
  viewers: number;
  isLive: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow">
            <Tv className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl tracking-wider">FlopTv</span>
            {isLive && (
              <span className="rounded bg-live px-1.5 py-0.5 text-[10px] font-bold uppercase text-live-foreground">
                live
              </span>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link to="/programacao">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Programação</span>
            </Link>
          </Button>
          <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold sm:flex">
            <Users className="h-3.5 w-3.5 text-primary" />
            {viewers} online
          </div>
          {isAdmin && (
            <Button asChild size="sm" variant="secondary">
              <Link to="/admin">
                <Shield className="h-4 w-4" /> Painel
              </Link>
            </Button>
          )}
          {user ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await supabase.auth.signOut();
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button asChild size="sm" className="bg-gradient-brand text-primary-foreground">
              <Link to="/auth">
                <LogIn className="h-4 w-4" /> Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function OfflinePlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-background via-card to-background text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
        <Radio className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="font-display text-2xl tracking-wide text-foreground">Fora do ar</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Nenhuma transmissão no momento. Volte em breve!
      </p>
    </div>
  );
}

function Chat({ user }: { user: { id: string; email?: string | null } | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const missing = Array.from(new Set(messages.map((m) => m.user_id))).filter(
      (id) => !(id in avatars),
    );
    if (missing.length === 0) return;
    supabase
      .from("profiles")
      .select("id, avatar_url")
      .in("id", missing)
      .then(({ data }) => {
        setAvatars((prev) => {
          const next = { ...prev };
          missing.forEach((id) => (next[id] = null));
          (data ?? []).forEach((p) => (next[p.id] = p.avatar_url ?? null));
          return next;
        });
      });
  }, [messages, avatars]);

  useEffect(() => {
    supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages(data.reverse());
      });

    const ch = supabase
      .channel("chat_messages_stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage].slice(-100));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const oldId = (payload.old as { id: string }).id;
          setMessages((prev) => prev.filter((m) => m.id !== oldId));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const msg = text.trim();
    if (!msg || msg.length > 300) return;
    setSending(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    const display_name = profile?.display_name || user.email?.split("@")[0] || "Anônimo";
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      display_name,
      message: msg,
    });
    setSending(false);
    if (error) {
      toast.error("Não foi possível enviar");
      return;
    }
    setText("");
  };

  return (
    <aside className="flex h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-card lg:h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-lg tracking-wide">Chat ao vivo</h2>
        <span className="text-xs text-muted-foreground">{messages.length} msgs</span>
      </div>

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Seja o primeiro a enviar uma mensagem!
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-2 text-sm leading-snug">
            {avatars[m.user_id] ? (
              <img
                src={avatars[m.user_id] as string}
                alt=""
                className="mt-0.5 h-6 w-6 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold uppercase text-background"
                style={{ backgroundColor: `hsl(${hashHue(m.user_id)}, 70%, 70%)` }}
              >
                {m.display_name.slice(0, 2)}
              </span>
            )}
            <div className="min-w-0">
              <span
                className="mr-1.5 font-semibold"
                style={{ color: `hsl(${hashHue(m.user_id)}, 70%, 70%)` }}
              >
                {m.display_name}
              </span>
              <span className="break-words text-foreground/90">{m.message}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3">
        {user ? (
          <form onSubmit={send} className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Diga algo..."
              maxLength={300}
              className="bg-background"
            />
            <Button
              type="submit"
              disabled={sending || !text.trim()}
              className="bg-gradient-brand text-primary-foreground"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <Button asChild className="w-full bg-gradient-brand text-primary-foreground">
            <Link to="/auth">Entrar para conversar</Link>
          </Button>
        )}
      </div>
    </aside>
  );
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}
