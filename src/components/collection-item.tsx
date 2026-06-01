"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Plus, StickyNote, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COLOR_CLASSES, useCollection, type CollectionItem } from "@/lib/collection";

const TYPE_LABEL: Record<string, string> = {
  tese: "Tese",
  dissertacao: "Dissertação",
  outro: "Outro",
};

export function CollectionItemCard({ item }: { item: CollectionItem }) {
  const { data, toggleLabel, removeItem, setNote } = useCollection();
  const t = item.thesis;
  const [noteOpen, setNoteOpen] = useState(!!item.note);
  const [pickerOpen, setPickerOpen] = useState(false);

  const assigned = data.labels.filter((l) => item.labelIds.includes(l.id));
  const available = data.labels.filter((l) => !item.labelIds.includes(l.id));

  const meta = [t.authors[0], t.institution, t.year?.toString()].filter(Boolean);

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardContent className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {t.type && <Badge variant="primary">{TYPE_LABEL[t.type] ?? t.type}</Badge>}
            {t.sources.map((s) => (
              <Badge key={s} variant="outline">
                {s.toUpperCase()}
              </Badge>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Anotar"
              aria-label="Anotar"
              onClick={() => setNoteOpen((v) => !v)}
            >
              <StickyNote className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-rose-600"
              title="Remover da coleção"
              aria-label="Remover da coleção"
              onClick={() => removeItem(t.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <h3 className="font-serif text-lg leading-snug">
          <Link
            href={`/tese/${encodeURIComponent(t.id)}`}
            className="hover:text-primary hover:underline"
          >
            {t.title}
          </Link>
        </h3>

        {meta.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">{meta.join(" · ")}</p>
        )}

        {t.abstract && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/80">
            {t.abstract}
          </p>
        )}

        {/* Labels aplicadas NESTE card + botão para aplicar mais. */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {assigned.map((l) => (
            <span
              key={l.id}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                COLOR_CLASSES[l.color].on,
              )}
            >
              {l.name}
              <button
                type="button"
                onClick={() => toggleLabel(t.id, l.id)}
                aria-label={`Remover label ${l.name}`}
                className="opacity-80 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            aria-expanded={pickerOpen}
            className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
          >
            <Plus className="h-3 w-3" /> Label
          </button>
        </div>

        {/* Seletor: aplica uma label existente só neste card. */}
        {pickerOpen && (
          <div className="mt-2 rounded-md border border-border bg-muted/30 p-2">
            {data.labels.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma label criada ainda — crie na barra acima da lista.
              </p>
            ) : available.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Todas as labels já estão aplicadas neste item.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {available.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggleLabel(t.id, l.id)}
                    className={cn(
                      "rounded-full border bg-transparent px-2 py-0.5 text-xs opacity-80 transition hover:opacity-100",
                      COLOR_CLASSES[l.color].off,
                    )}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {noteOpen && (
          <textarea
            value={item.note ?? ""}
            onChange={(e) => setNote(t.id, e.target.value)}
            placeholder="Sua anotação…"
            rows={2}
            className="mt-3 w-full rounded-md border border-input bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        )}

        {t.documentUrl && (
          <a
            href={t.documentUrl}
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
