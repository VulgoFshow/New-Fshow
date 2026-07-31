import { useEffect, useRef, useState } from "react";
import { Captions, ImagePlus, Play, Square, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fileToDataUrl } from "@/lib/image";
import { toast } from "sonner";
import {
  GC_ANIMATIONS,
  GC_IMAGE_SHAPES,
  GC_POSITIONS,
  GC_STYLES,
  LowerThird,
  type GcData,
} from "./LowerThird";

type Row = GcData & { id: string; is_active: boolean; updated_at: string };

const EMPTY: GcData = {
  title: "",
  subtitle: "",
  image_url: null,
  accent_color: "#ff2d6f",
  text_color: "#ffffff",
  bg_color: "#0b0b12",
  position: "bottom-left",
  style: "bar",
  animation: "slide",
  font_scale: 1,
  corner_radius: 6,
  accent_width: 8,
  opacity: 1,
  uppercase: true,
  shadow: true,
  subtitle_color: "",
  badge_text: "",
  image_shape: "square",
  ticker: false,
  auto_hide_seconds: 0,
};

/** Gerador de caracteres: editor, prévia e controle de no ar / fora do ar. */
export function GcManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<GcData>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewOn, setPreviewOn] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("lower_thirds")
      .select("*")
      .order("updated_at", { ascending: false });
    setRows((data as Row[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const set = <K extends keyof GcData>(k: K, v: GcData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const pickImage = async (file?: File) => {
    if (!file) return;
    try {
      set("image_url", await fileToDataUrl(file, 200, 0.8));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro na imagem");
    }
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Informe um título");
    setSaving(true);
    const payload = { ...form, title: form.title.trim().slice(0, 80), subtitle: form.subtitle.slice(0, 120) };
    const { error } = editingId
      ? await supabase.from("lower_thirds").update(payload).eq("id", editingId)
      : await supabase.from("lower_thirds").insert(payload);
    setSaving(false);
    if (error) return toast.error("Erro ao salvar legenda");
    toast.success(editingId ? "Legenda atualizada" : "Legenda criada");
    setEditingId(null);
    setForm(EMPTY);
    load();
  };

  const putOnAir = async (row: Row) => {
    await supabase.from("lower_thirds").update({ is_active: false }).eq("is_active", true);
    const { error } = await supabase
      .from("lower_thirds")
      .update({
        is_active: true,
        air_since: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (error) return toast.error("Erro ao colocar no ar");
    toast.success("Legenda no ar!");
    load();
  };

  const takeOffAir = async (row: Row) => {
    const { error } = await supabase.from("lower_thirds").update({ is_active: false }).eq("id", row.id);
    if (error) return toast.error("Erro ao tirar do ar");
    toast.success("Legenda fora do ar");
    load();
  };

  const remove = async (row: Row) => {
    const { error } = await supabase.from("lower_thirds").delete().eq("id", row.id);
    if (error) return toast.error("Erro ao apagar");
    if (editingId === row.id) {
      setEditingId(null);
      setForm(EMPTY);
    }
    load();
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Captions className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl tracking-wide">GC — Gerador de caracteres</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Crie legendas de TV, escolha aparência e animação, e coloque no ar em tempo real.
      </p>

      {/* Prévia */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <Label>Pré-visualização</Label>
          <Button type="button" size="sm" variant="secondary" onClick={() => setPreviewOn((p) => !p)}>
            {previewOn ? "Testar saída" : "Testar entrada"}
          </Button>
        </div>
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-gradient-to-br from-secondary via-background to-secondary">
          <LowerThird data={form} show={previewOn && !!form.title} scale={0.85} />
        </div>
      </div>

      {/* Editor */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="gc-title">Título</Label>
          <Input
            id="gc-title"
            value={form.title}
            maxLength={80}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Ex: João da Silva"
            className="bg-background"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="gc-sub">Subtítulo</Label>
          <Input
            id="gc-sub"
            value={form.subtitle}
            maxLength={120}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="Ex: Repórter — São Paulo"
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gc-pos">Posição</Label>
          <select
            id="gc-pos"
            value={form.position}
            onChange={(e) => set("position", e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            {GC_POSITIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gc-style">Estilo</Label>
          <select
            id="gc-style"
            value={form.style}
            onChange={(e) => set("style", e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            {GC_STYLES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="gc-anim">Animação de entrada/saída</Label>
          <select
            id="gc-anim"
            value={form.animation}
            onChange={(e) => set("animation", e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            {GC_ANIMATIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <ColorField label="Cor de destaque" value={form.accent_color} onChange={(v) => set("accent_color", v)} />
        <ColorField label="Cor do texto" value={form.text_color} onChange={(v) => set("text_color", v)} />
        <ColorField label="Cor do fundo" value={form.bg_color} onChange={(v) => set("bg_color", v)} />
        <ColorField
          label="Cor do subtítulo"
          value={form.subtitle_color || form.accent_color}
          onChange={(v) => set("subtitle_color", v)}
        />

        <div className="space-y-2">
          <Label htmlFor="gc-badge">Selo (ex: AO VIVO)</Label>
          <Input
            id="gc-badge"
            value={form.badge_text ?? ""}
            maxLength={20}
            onChange={(e) => set("badge_text", e.target.value)}
            placeholder="Opcional"
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gc-shape">Formato da imagem</Label>
          <select
            id="gc-shape"
            value={form.image_shape ?? "square"}
            onChange={(e) => set("image_shape", e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            {GC_IMAGE_SHAPES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <RangeField
          label="Tamanho do texto"
          value={form.font_scale ?? 1}
          min={0.6}
          max={2}
          step={0.05}
          suffix="x"
          onChange={(v) => set("font_scale", v)}
        />
        <RangeField
          label="Arredondamento"
          value={form.corner_radius ?? 6}
          min={0}
          max={40}
          step={1}
          suffix="px"
          onChange={(v) => set("corner_radius", v)}
        />
        <RangeField
          label="Largura do destaque"
          value={form.accent_width ?? 8}
          min={0}
          max={30}
          step={1}
          suffix="px"
          onChange={(v) => set("accent_width", v)}
        />
        <RangeField
          label="Opacidade"
          value={form.opacity ?? 1}
          min={0.2}
          max={1}
          step={0.05}
          onChange={(v) => set("opacity", v)}
        />
        <RangeField
          label="Sumir sozinho (0 = nunca)"
          value={form.auto_hide_seconds ?? 0}
          min={0}
          max={120}
          step={5}
          suffix="s"
          onChange={(v) => set("auto_hide_seconds", v)}
        />

        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <ToggleField
            label="Título em CAIXA ALTA"
            checked={form.uppercase ?? true}
            onChange={(v) => set("uppercase", v)}
          />
          <ToggleField
            label="Sombra"
            checked={form.shadow ?? true}
            onChange={(v) => set("shadow", v)}
          />
          <ToggleField
            label="Subtítulo rolando"
            checked={form.ticker ?? false}
            onChange={(v) => set("ticker", v)}
          />
        </div>

        <div className="space-y-2">
          <Label>Imagem ao lado</Label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Escolher
            </Button>
            {form.image_url && (
              <>
                <img src={form.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                <Button type="button" variant="ghost" size="icon" onClick={() => set("image_url", null)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickImage(e.target.files?.[0])}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button onClick={save} disabled={saving} className="flex-1 bg-gradient-brand text-primary-foreground">
          {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar legenda"}
        </Button>
        {editingId && (
          <Button
            variant="secondary"
            onClick={() => {
              setEditingId(null);
              setForm(EMPTY);
            }}
          >
            Cancelar
          </Button>
        )}
      </div>

      {/* Lista */}
      <div className="mt-6 space-y-2">
        <div className="text-sm font-semibold text-muted-foreground">Legendas salvas</div>
        {rows.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhuma legenda criada ainda.</p>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-2 rounded-xl border border-border bg-background p-2"
          >
            <span
              className="h-8 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: r.accent_color }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{r.title}</div>
              <div className="truncate text-xs text-muted-foreground">{r.subtitle}</div>
            </div>
            {r.is_active && (
              <span className="rounded bg-live px-1.5 py-0.5 text-[10px] font-bold uppercase text-live-foreground">
                no ar
              </span>
            )}
            <Button
              size="icon"
              variant={r.is_active ? "secondary" : "default"}
              onClick={() => (r.is_active ? takeOffAir(r) : putOnAir(r))}
              aria-label={r.is_active ? "Tirar do ar" : "Colocar no ar"}
            >
              {r.is_active ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingId(r.id);
                setForm({
                  title: r.title,
                  subtitle: r.subtitle,
                  image_url: r.image_url,
                  accent_color: r.accent_color,
                  text_color: r.text_color,
                  bg_color: r.bg_color,
                  position: r.position,
                  style: r.style,
                  animation: r.animation,
                  font_scale: r.font_scale ?? 1,
                  corner_radius: r.corner_radius ?? 6,
                  accent_width: r.accent_width ?? 8,
                  opacity: r.opacity ?? 1,
                  uppercase: r.uppercase ?? true,
                  shadow: r.shadow ?? true,
                  subtitle_color: r.subtitle_color ?? "",
                  badge_text: r.badge_text ?? "",
                  image_shape: r.image_shape ?? "square",
                  ticker: r.ticker ?? false,
                  auto_hide_seconds: r.auto_hide_seconds ?? 0,
                });
                setPreviewOn(true);
              }}
            >
              Editar
            </Button>
            <Button size="icon" variant="ghost" onClick={() => remove(r)} aria-label="Apagar">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-border bg-background"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="bg-background" />
      </div>
    </div>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label} <span className="text-muted-foreground">({value}{suffix})</span>
      </Label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
        aria-label={label}
      />
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-primary"
      />
      {label}
    </label>
  );
}