import { useEffect, useState } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export type ScheduleItem = {
  id: string;
  day: string;
  start_time: string;
  title: string;
  description: string;
};

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Editor da grade de programação exibida na página /programacao. */
export function ScheduleManager() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [day, setDay] = useState(today());
  const [time, setTime] = useState("20:00");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("schedule_items")
      .select("id, day, start_time, title, description")
      .gte("day", today())
      .order("day", { ascending: true })
      .order("start_time", { ascending: true });
    setItems((data as ScheduleItem[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Informe o título do programa");
    const { error } = await supabase.from("schedule_items").insert({
      day,
      start_time: time,
      title: title.trim().slice(0, 120),
      description: description.trim().slice(0, 300),
    });
    if (error) return toast.error("Erro ao salvar");
    setTitle("");
    setDescription("");
    load();
    toast.success("Programa adicionado");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("schedule_items").delete().eq("id", id);
    if (error) return toast.error("Erro ao apagar");
    load();
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl tracking-wide">Programação</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        O que aparece para o público no botão "Programação" do topo.
      </p>

      <form onSubmit={add} className="mt-5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sday">Dia</Label>
            <Input
              id="sday"
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stime">Horário</Label>
            <Input
              id="stime"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="stitle">Título</Label>
          <Input
            id="stitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sdesc">Descrição</Label>
          <Textarea
            id="sdesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={2}
            className="bg-background"
          />
        </div>
        <Button type="submit" variant="secondary" className="w-full">
          <Plus className="h-4 w-4" /> Adicionar à grade
        </Button>
      </form>

      <div className="mt-5 space-y-2">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhum programa cadastrado.</p>
        )}
        {items.map((it) => (
          <div
            key={it.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-background p-3"
          >
            <div className="min-w-0">
              <div className="text-xs text-primary">
                {new Date(`${it.day}T00:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                {it.start_time.slice(0, 5)}
              </div>
              <div className="truncate text-sm font-semibold">{it.title}</div>
              {it.description && (
                <div className="truncate text-xs text-muted-foreground">{it.description}</div>
              )}
            </div>
            <button type="button" onClick={() => remove(it.id)} aria-label="Apagar programa">
              <Trash2 className="h-4 w-4 shrink-0 text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}