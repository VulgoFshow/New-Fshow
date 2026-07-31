import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Tv, ImagePlus } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fileToDataUrl } from "@/lib/image";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — FlopTv" },
      { name: "description", content: "Faça login no FlopTv para conversar no chat ou acessar o painel de administração." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickAvatar = async (file?: File) => {
    if (!file) return;
    try {
      setAvatar(await fileToDataUrl(file, 192, 0.8));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro na imagem");
    }
  };

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: displayName.trim() ? { display_name: displayName.trim().slice(0, 40) } : undefined,
        },
      });
      if (error) {
        setBusy(false);
        return toast.error(error.message);
      }
      const { data: sess } = await supabase.auth.getUser();
      if (sess.user) {
        const update: { avatar_url?: string; display_name?: string } = {};
        if (avatar) update.avatar_url = avatar;
        if (displayName.trim()) update.display_name = displayName.trim().slice(0, 40);
        if (Object.keys(update).length) {
          await supabase.from("profiles").update(update).eq("id", sess.user.id);
        }
      }
      setBusy(false);
      toast.success("Conta criada! Você já está conectado.");
      navigate({ to: "/" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      setBusy(false);
      if (error) return toast.error("E-mail ou senha incorretos");
      navigate({ to: "/" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand shadow-glow">
            <Tv className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-3xl tracking-wider">FlopTv</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-glow">
          <h1 className="font-display text-2xl tracking-wide">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Acesse para conversar no chat ou administrar."
              : "O primeiro cadastro vira administrador automaticamente."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="Escolher foto de perfil"
                >
                  {avatar ? (
                    <img src={avatar} alt="Prévia da foto de perfil" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-5 w-5" />
                  )}
                </button>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="name">Nome no chat</Label>
                  <Input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={40}
                    placeholder="Como quer aparecer"
                    className="bg-background"
                  />
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickAvatar(e.target.files?.[0])}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                className="bg-background"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-brand text-primary-foreground"
            >
              {busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary"
          >
            {mode === "login"
              ? "Não tem conta? Criar uma"
              : "Já tem conta? Entrar"}
          </button>
        </div>

        <Link
          to="/"
          className="mt-4 block text-center text-sm text-muted-foreground hover:text-primary"
        >
          ← Voltar para o player
        </Link>
      </div>
    </div>
  );
}