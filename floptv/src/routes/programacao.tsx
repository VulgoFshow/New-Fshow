import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/programacao")({
  head: () => ({
    meta: [
      { title: "Programação do dia — FlopTv" },
      {
        name: "description",
        content: "Veja a grade de programação da FlopTv: horários e o que vai passar hoje.",
      },
      { property: "og:title", content: "Programação do dia — FlopTv" },
      {
        property: "og:description",
        content: "Confira os horários e o que vai passar hoje na FlopTv.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedulePage,
});

type Item = {
  id: string;
  day: string;
  start_time: string;
  title: string;
  description: string;
};

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function SchedulePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () =>
      supabase
        .from("schedule_items")
        .select("id, day, start_time, title, description")
        .gte("day", todayIso())
        .order("day", { ascending: true })
        .order("start_time", { ascending: true })
        .then(({ data }) => {
          setItems((data as Item[]) ?? []);
          setLoading(false);
        });
    load();
    const ch = supabase
      .channel("schedule_stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "schedule_items" }, () =>
        load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const days = Array.from(new Set(items.map((i) => i.day)));

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate font-display text-xl tracking-wider">Programação</span>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-3xl uppercase tracking-wide">O que vai passar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Grade da FlopTv, atualizada em tempo real.
        </p>

        {loading && <p className="mt-8 text-sm text-muted-foreground">Carregando...</p>}
        {!loading && items.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">
            Nenhum programa marcado por enquanto. Volte mais tarde!
          </p>
        )}

        <div className="mt-8 space-y-8">
          {days.map((day) => (
            <section key={day}>
              <h2 className="font-display text-lg uppercase tracking-widest text-primary">
                {new Date(`${day}T00:00:00`).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </h2>
              <div className="mt-3 space-y-2">
                {items
                  .filter((i) => i.day === day)
                  .map((i) => (
                    <article
                      key={i.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-2xl border border-border bg-card p-4"
                    >
                      <div className="shrink-0 font-display text-2xl tracking-wide">
                        {i.start_time.slice(0, 5)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold">{i.title}</div>
                        {i.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{i.description}</p>
                        )}
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}