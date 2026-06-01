"use client";

import { useMemo, useState } from "react";
import { ResultCard } from "@/components/result-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  COLOR_STYLES,
  LABEL_COLORS,
  useAnnotations,
  type LabelColor,
} from "@/lib/annotations";
import type { Thesis } from "@/lib/federation/types";

export function ResultsList({ hits }: { hits: Thesis[] }) {
  const { get, hiddenCount, clearHidden } = useAnnotations();
  const [colorFilter, setColorFilter] = useState<LabelColor | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  const { visible, hidden } = useMemo(() => {
    const visible: Thesis[] = [];
    const hidden: Thesis[] = [];
    for (const h of hits) {
      const a = get(h.id);
      if (a?.hidden) {
        hidden.push(h);
        continue;
      }
      if (colorFilter && a?.color !== colorFilter) continue;
      visible.push(h);
    }
    return { visible, hidden };
  }, [hits, get, colorFilter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5" role="group" aria-label="Filtrar por cor">
          <FilterChip
            active={colorFilter === null}
            onClick={() => setColorFilter(null)}
          >
            Todas
          </FilterChip>
          {LABEL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColorFilter(colorFilter === c ? null : c)}
              aria-label={`Filtrar por ${COLOR_STYLES[c].label}`}
              aria-pressed={colorFilter === c}
              title={COLOR_STYLES[c].label}
              className={cn(
                "h-5 w-5 rounded-full ring-offset-2 ring-offset-background transition",
                COLOR_STYLES[c].dot,
                colorFilter === c
                  ? `ring-2 ${COLOR_STYLES[c].ring}`
                  : "opacity-50 hover:opacity-100",
              )}
            />
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          {hiddenCount > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowHidden((v) => !v)}
                className="hover:text-foreground hover:underline"
              >
                {showHidden ? "Esconder ocultados" : `Ocultados (${hiddenCount})`}
              </button>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={clearHidden}
                className="hover:text-foreground hover:underline"
              >
                Limpar ocultos
              </button>
            </>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {colorFilter
            ? "Nenhum resultado com essa cor nesta página."
            : "Nenhum resultado para exibir."}
        </p>
      ) : (
        <ol className="space-y-4">
          {visible.map((thesis) => (
            <li key={thesis.id}>
              <ResultCard thesis={thesis} />
            </li>
          ))}
        </ol>
      )}

      {showHidden && hidden.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg text-muted-foreground">
            Ocultados nesta página
          </h2>
          <ol className="space-y-4">
            {hidden.map((thesis) => (
              <li key={thesis.id}>
                <ResultCard thesis={thesis} hiddenView />
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className="h-7 px-2.5 text-xs"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
