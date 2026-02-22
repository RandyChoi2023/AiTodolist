"use client";

import { cn } from "~/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  delay = 0,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  borderWidth = 1.5,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--delay": `-${delay}s`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--border-width": borderWidth,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        "[border:calc(var(--border-width)*1px)_solid_transparent]",
        "[background:linear-gradient(transparent,transparent),linear-gradient(to_right,var(--color-from),var(--color-to))]",
        "[background-clip:padding-box,border-box] [background-origin:padding-box,border-box]",
        "[mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "[mask-clip:padding-box,border-box] [mask-composite:intersect]",
        "animate-border-beam",
        className
      )}
    />
  );
}