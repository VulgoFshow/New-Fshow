import { useEffect, useState } from "react";

export type GcData = {
  title: string;
  subtitle: string;
  image_url?: string | null;
  accent_color: string;
  text_color: string;
  bg_color: string;
  position: string;
  style: string;
  animation: string;
  font_scale?: number;
  corner_radius?: number;
  accent_width?: number;
  opacity?: number;
  uppercase?: boolean;
  shadow?: boolean;
  subtitle_color?: string;
  badge_text?: string;
  image_shape?: string;
  ticker?: boolean;
  auto_hide_seconds?: number;
};

export const GC_POSITIONS = [
  { value: "bottom-left", label: "Inferior esquerda" },
  { value: "bottom-center", label: "Inferior centro" },
  { value: "bottom-right", label: "Inferior direita" },
  { value: "top-left", label: "Superior esquerda" },
  { value: "top-right", label: "Superior direita" },
];

export const GC_STYLES = [
  { value: "bar", label: "Barra clássica" },
  { value: "minimal", label: "Minimalista" },
  { value: "box", label: "Bloco sólido" },
  { value: "glass", label: "Vidro" },
];

export const GC_ANIMATIONS = [
  { value: "slide", label: "Deslizar da esquerda" },
  { value: "up", label: "Subir de baixo" },
  { value: "fade", label: "Fade" },
  { value: "zoom", label: "Zoom" },
  { value: "wipe", label: "Wipe" },
];

export const GC_IMAGE_SHAPES = [
  { value: "square", label: "Quadrada" },
  { value: "rounded", label: "Cantos arredondados" },
  { value: "circle", label: "Círculo" },
];

function positionClass(position: string) {
  switch (position) {
    case "bottom-center":
      return "bottom-[8%] left-1/2 -translate-x-1/2";
    case "bottom-right":
      return "bottom-[8%] right-[4%]";
    case "top-left":
      return "top-[6%] left-[4%]";
    case "top-right":
      return "top-[6%] right-[4%]";
    default:
      return "bottom-[8%] left-[4%]";
  }
}

/** Renderiza a legenda (GC) com animações de entrada e saída. */
export function LowerThird({
  data,
  show,
  scale = 1,
}: {
  data: GcData | null;
  show: boolean;
  scale?: number;
}) {
  const [rendered, setRendered] = useState<GcData | null>(show ? data : null);
  const [phase, setPhase] = useState<"in" | "out">(show ? "in" : "out");

  useEffect(() => {
    if (show && data) {
      setRendered(data);
      setPhase("in");
      return;
    }
    if (!rendered) return;
    setPhase("out");
    const t = setTimeout(() => setRendered(null), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, data]);

  if (!rendered) return null;

  const anim = `gc-anim-${rendered.animation || "slide"}-${phase}`;
  const isMinimal = rendered.style === "minimal";
  const isGlass = rendered.style === "glass";
  const fontScale = rendered.font_scale ?? 1;
  const radius = rendered.corner_radius ?? 6;
  const accentWidth = rendered.accent_width ?? 8;
  const opacity = rendered.opacity ?? 1;
  const upper = rendered.uppercase ?? true;
  const shadow = rendered.shadow ?? true;
  const subColor = rendered.subtitle_color || rendered.accent_color;
  const shape = rendered.image_shape || "square";
  const imgClass =
    shape === "circle" ? "rounded-full" : shape === "rounded" ? "rounded-[0.5em]" : "";

  return (
    <div
      className={`pointer-events-none absolute z-10 max-w-[80%] ${positionClass(rendered.position)} ${anim}`}
      style={{
        transformOrigin: "left center",
        fontSize: `${scale * fontScale}rem`,
        opacity,
      }}
    >
      <div
        className={`flex items-stretch overflow-hidden ${shadow ? "shadow-2xl" : ""}`}
        style={{ borderRadius: `${radius}px` }}
      >
        <div style={{ width: `${accentWidth}px`, backgroundColor: rendered.accent_color }} />
        {rendered.image_url && (
          <img
            src={rendered.image_url}
            alt=""
            className={`h-auto w-[3.2em] shrink-0 self-center object-cover ${imgClass}`}
            style={{ backgroundColor: rendered.bg_color }}
          />
        )}
        <div
          className="flex flex-col justify-center px-[1em] py-[0.6em]"
          style={{
            backgroundColor: isMinimal
              ? "transparent"
              : isGlass
                ? `${rendered.bg_color}cc`
                : rendered.bg_color,
            backdropFilter: isGlass ? "blur(10px)" : undefined,
            color: rendered.text_color,
            textShadow: isMinimal ? "0 2px 8px rgba(0,0,0,.9)" : undefined,
          }}
        >
          {rendered.badge_text ? (
            <span
              className="mb-[0.35em] w-fit rounded-[0.25em] px-[0.5em] py-[0.15em] font-display uppercase tracking-widest"
              style={{
                fontSize: "0.6em",
                backgroundColor: rendered.accent_color,
                color: rendered.bg_color,
              }}
            >
              {rendered.badge_text}
            </span>
          ) : null}
          <div
            className={`font-display leading-none tracking-wide ${upper ? "uppercase" : ""}`}
            style={{ fontSize: "1.5em" }}
          >
            {rendered.title}
          </div>
          {rendered.subtitle && (
            <div
              className={`mt-[0.25em] font-semibold leading-tight ${
                rendered.ticker ? "gc-ticker overflow-hidden whitespace-nowrap" : ""
              }`}
              style={{ fontSize: "0.85em", color: subColor }}
            >
              <span className={rendered.ticker ? "inline-block animate-gc-ticker" : undefined}>
                {rendered.subtitle}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
