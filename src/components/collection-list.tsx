"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Download, FileUp, Plus, Tag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  COLOR_CLASSES,
  LABEL_PALETTE,
  useCollection,
  type LabelColor,
} from "@/lib/collection";
import { CollectionItemCard } from "@/components/collection-item";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CollectionList() {
  const {
    data,
    loaded,
    itemCount,
    createLabel,
    deleteLabel,
    clearAll,
    importJSON,
    toJSON,
    toCSV,
  } = useCollection();

  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState<LabelColor>("amber");
  const [filter, setFilter] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    const all = Object.values(data.items).sort((a, b) => b.addedAt - a.addedAt);
    if (!filter) return all;
    return all.filter((it) => it.labelIds.includes(filter));
  }, [data.items, filter]);

  if (!loaded) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-muted-foreground">
        <p className="text-sm">
          Sua coleção está vazia. Faça uma busca e use{" "}
          <span className="font-medium text-foreground">
            “Adicionar à coleção”
          </span>{" "}
          para trazer resultados para cá.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/">Ir para a busca</Link>
        </Button>
      </div>
    );
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      const res = importJSON(text);
      if (!res.ok) alert(`Falha ao importar: ${res.error}`);
      else alert(`Importado: ${res.added} novo(s) item(ns).`);
    });
    e.target.value = "";
  }

  return (
    <div>
      {/* Barra de ações */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <span className="text-sm text-muted-foreground">
          {itemCount.toLocaleString("pt-BR")} item(ns) na coleção
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => download("colecao.json", toJSON(), "application/json")}>
            <Download className="h-4 w-4" /> JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => download("colecao.csv", toCSV(), "text/csv;charset=utf-8")}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <FileUp className="h-4 w-4" /> Importar JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImportFile}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-rose-600"
            onClick={() => {
              if (confirm("Limpar toda a coleção? Esta ação não pode ser desfeita."))
                clearAll();
            }}
          >
            Limpar tudo
          </Button>
        </div>
      </div>

      {/* Gerenciador de labels */}
      <div className="mb-4 rounded-md border border-border bg-muted/30 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Tag className="h-4 w-4 text-muted-foreground" /> Labels
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.labels.map((l) => (
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
                onClick={() => deleteLabel(l.id)}
                aria-label={`Excluir label ${l.name}`}
                className="opacity-80 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {data.labels.length === 0 && (
            <span className="text-xs text-muted-foreground">
              Nenhuma label ainda — crie a primeira ao lado.
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nova label…"
            className="h-9 w-44"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newLabel.trim()) {
                createLabel(newLabel, newColor);
                setNewLabel("");
              }
            }}
          />
          <div className="flex items-center gap-1" role="group" aria-label="Cor da label">
            {LABEL_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                aria-label={`Cor ${c}`}
                aria-pressed={newColor === c}
                className={cn(
                  "h-5 w-5 rounded-full ring-offset-2 ring-offset-background transition",
                  COLOR_CLASSES[c].dot,
                  newColor === c ? "ring-2 ring-foreground/40" : "opacity-50 hover:opacity-100",
                )}
              />
            ))}
          </div>
          <Button
            size="sm"
            disabled={!newLabel.trim()}
            onClick={() => {
              createLabel(newLabel, newColor);
              setNewLabel("");
            }}
          >
            <Plus className="h-4 w-4" /> Criar
          </Button>
        </div>

        {/* Filtro por label */}
        {data.labels.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
            <span className="mr-1 text-xs text-muted-foreground">Filtrar:</span>
            <button
              type="button"
              onClick={() => setFilter(null)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs transition",
                filter === null ? "border-foreground/30 bg-secondary" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              Todas
            </button>
            {data.labels.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setFilter(filter === l.id ? null : l.id)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs transition",
                  filter === l.id ? COLOR_CLASSES[l.color].on : `bg-transparent ${COLOR_CLASSES[l.color].off} opacity-70 hover:opacity-100`,
                )}
              >
                {l.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista */}
      {items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Nenhum item com essa label.
        </p>
      ) : (
        <ol className="space-y-4">
          {items.map((it) => (
            <li key={it.thesis.id}>
              <CollectionItemCard item={it} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
