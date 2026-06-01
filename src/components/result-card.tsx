"use client";

import Link from "next/link";
import { ExternalLink, EyeOff, RotateCcw, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  COLOR_STYLES,
  LABEL_COLORS,
  useAnnotations,
  type LabelColor,
} from "@/lib/annotations";
import type { Thesis } from "@/lib/federation/types";

const TYPE_LABEL: Record<string, string> = {
  tese: "Tese",
  dissertacao: "Dissertação",
  outro: "Outro",
};

export function ResultCard({
  thesis,
  hiddenView = false,
}: {
  thesis: Thesis;
  hiddenView?: boolean;
}) {
  const { get, setColor, toggleHidden, restore } = useAnnotations();
  const ann = get(thesis.id);
  const color = ann?.color;

  const meta = [
    thesis.authors[0],
    thesis.institution,
    thesis.year?.toString(),
  ].filter(Boolean);

  return (
    <Card
      className={cn(
        "transition-colors hover:border-primary/40",
        color && `border-l-4 ${COLOR_STYLES[color].border}`,
        hiddenView && "opacity-60",
      )}
    >
      <CardContent className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {thesis.type && (
              <Badge variant="primary">
                {TYPE_LABEL[thesis.type] ?? thesis.type}
              </Badge>
            )}
            {thesis.sources.map((s) => (
              <Badge key={s} variant="outline">
                {s.toUpperCase()}
              </Badge>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <ColorPicker
              value={color}
              onPick={(c) => setColor(thesis.id, color === c ? null : c)}
            />
            {hiddenView ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Restaurar"
                aria-label="Restaurar resultado"
                onClick={() => restore(thesis.id)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Ocultar"
                aria-label="Ocultar resultado"
                onClick={() => toggleHidden(thesis.id)}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <h3 className="font-serif text-lg leading-snug">
          <Link
            href={`/tese/${encodeURIComponent(thesis.id)}`}
            className="hover:text-primary hover:underline"
          >
            {thesis.title}
          </Link>
        </h3>

        {meta.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">{meta.join(" · ")}</p>
        )}

        {thesis.abstract && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-foreground/80">
            {thesis.abstract}
          </p>
        )}

        {thesis.documentUrl && (
          <a
            href={thesis.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Acessar documento na instituição
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function ColorPicker({
  value,
  onPick,
}: {
  value?: LabelColor;
  onPick: (c: LabelColor) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Marcar com cor">
      {LABEL_COLORS.map((c) => {
        const selected = value === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            title={selected ? `Remover marca ${COLOR_STYLES[c].label}` : `Marcar: ${COLOR_STYLES[c].label}`}
            aria-label={`Marcar com ${COLOR_STYLES[c].label}`}
            aria-pressed={selected}
            className={cn(
              "h-4 w-4 rounded-full ring-offset-2 ring-offset-background transition",
              COLOR_STYLES[c].dot,
              selected ? `ring-2 ${COLOR_STYLES[c].ring}` : "opacity-50 hover:opacity-100",
            )}
          />
        );
      })}
    </div>
  );
}
