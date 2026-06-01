"use client";

import localforage from "localforage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Thesis } from "./federation/types";

/*
  Coleção de trabalho (acumulativa) persistida em IndexedDB via localForage.

  Por quê localForage e não localStorage: aqui guardamos os REGISTROS de verdade
  (resumos inclusos) de centenas de itens — pesado e estruturado. localStorage é
  síncrono, ~5 MB e só string; IndexedDB é assíncrono, com cota grande.

  Modelo acumulativo: uma coleção única; cada busca SOMA resultados (dedup por
  id canônico). Curadoria (labels, nota) nunca se perde ao buscar de novo.
  Export/import JSON faz round-trip fiel; CSV é saída para planilha.
*/

export type LabelColor = "amber" | "green" | "blue" | "red" | "purple" | "slate";

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export interface CollectionItem {
  thesis: Thesis;
  labelIds: string[];
  note?: string;
  addedAt: number;
}

export interface CollectionData {
  version: 1;
  items: Record<string, CollectionItem>;
  labels: Label[];
  updatedAt: number;
}

export const LABEL_PALETTE: LabelColor[] = [
  "amber",
  "green",
  "blue",
  "red",
  "purple",
  "slate",
];

/** Classes literais (Tailwind JIT precisa vê-las). */
export const COLOR_CLASSES: Record<
  LabelColor,
  { on: string; off: string; dot: string }
> = {
  amber: { on: "bg-amber-500 text-white border-amber-500", off: "text-amber-700 border-amber-400", dot: "bg-amber-500" },
  green: { on: "bg-emerald-600 text-white border-emerald-600", off: "text-emerald-700 border-emerald-500", dot: "bg-emerald-600" },
  blue: { on: "bg-blue-600 text-white border-blue-600", off: "text-blue-700 border-blue-500", dot: "bg-blue-600" },
  red: { on: "bg-rose-600 text-white border-rose-600", off: "text-rose-700 border-rose-500", dot: "bg-rose-600" },
  purple: { on: "bg-violet-600 text-white border-violet-600", off: "text-violet-700 border-violet-500", dot: "bg-violet-600" },
  slate: { on: "bg-slate-600 text-white border-slate-600", off: "text-slate-700 border-slate-500", dot: "bg-slate-600" },
};

const STORE_KEY = "data";

let store: LocalForage | null = null;
function getStore(): LocalForage {
  if (!store) {
    store = localforage.createInstance({
      name: "buscador-cientifico",
      storeName: "collection",
    });
  }
  return store;
}

function emptyData(): CollectionData {
  return { version: 1, items: {}, labels: [], updatedAt: Date.now() };
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface CollectionContextValue {
  data: CollectionData;
  loaded: boolean;
  itemCount: number;
  /** Adiciona itens (dedup por id); preserva labels/nota de itens já existentes. Retorna quantos eram novos. */
  addItems: (theses: Thesis[]) => number;
  removeItem: (id: string) => void;
  createLabel: (name: string, color: LabelColor) => string;
  deleteLabel: (labelId: string) => void;
  toggleLabel: (itemId: string, labelId: string) => void;
  setNote: (itemId: string, note: string) => void;
  clearAll: () => void;
  importJSON: (raw: string) => { ok: boolean; error?: string; added?: number };
  toJSON: () => string;
  toCSV: () => string;
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CollectionData>(emptyData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getStore()
      .getItem<CollectionData>(STORE_KEY)
      .then((stored) => {
        if (active && stored) setData(stored);
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  const commit = useCallback((next: CollectionData) => {
    next.updatedAt = Date.now();
    setData(next);
    getStore()
      .setItem(STORE_KEY, next)
      .catch(() => {});
  }, []);

  const addItems = useCallback(
    (theses: Thesis[]) => {
      let added = 0;
      setData((prev) => {
        const items = { ...prev.items };
        for (const t of theses) {
          if (!items[t.id]) {
            items[t.id] = { thesis: t, labelIds: [], addedAt: Date.now() };
            added++;
          } else {
            // mantém curadoria; atualiza metadados do registro.
            items[t.id] = { ...items[t.id], thesis: t };
          }
        }
        const next = { ...prev, items, updatedAt: Date.now() };
        getStore().setItem(STORE_KEY, next).catch(() => {});
        return next;
      });
      return added;
    },
    [],
  );

  const removeItem = useCallback(
    (id: string) => {
      setData((prev) => {
        const items = { ...prev.items };
        delete items[id];
        const next = { ...prev, items, updatedAt: Date.now() };
        getStore().setItem(STORE_KEY, next).catch(() => {});
        return next;
      });
    },
    [],
  );

  const createLabel = useCallback(
    (name: string, color: LabelColor) => {
      const id = uid();
      setData((prev) => {
        const next = {
          ...prev,
          labels: [...prev.labels, { id, name: name.trim() || "Label", color }],
          updatedAt: Date.now(),
        };
        getStore().setItem(STORE_KEY, next).catch(() => {});
        return next;
      });
      return id;
    },
    [],
  );

  const deleteLabel = useCallback((labelId: string) => {
    setData((prev) => {
      const items = { ...prev.items };
      for (const [id, it] of Object.entries(items)) {
        if (it.labelIds.includes(labelId)) {
          items[id] = { ...it, labelIds: it.labelIds.filter((l) => l !== labelId) };
        }
      }
      const next = {
        ...prev,
        items,
        labels: prev.labels.filter((l) => l.id !== labelId),
        updatedAt: Date.now(),
      };
      getStore().setItem(STORE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const toggleLabel = useCallback((itemId: string, labelId: string) => {
    setData((prev) => {
      const it = prev.items[itemId];
      if (!it) return prev;
      const has = it.labelIds.includes(labelId);
      const labelIds = has
        ? it.labelIds.filter((l) => l !== labelId)
        : [...it.labelIds, labelId];
      const next = {
        ...prev,
        items: { ...prev.items, [itemId]: { ...it, labelIds } },
        updatedAt: Date.now(),
      };
      getStore().setItem(STORE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const setNote = useCallback((itemId: string, note: string) => {
    setData((prev) => {
      const it = prev.items[itemId];
      if (!it) return prev;
      const next = {
        ...prev,
        items: { ...prev.items, [itemId]: { ...it, note } },
        updatedAt: Date.now(),
      };
      getStore().setItem(STORE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const clearAll = useCallback(() => commit(emptyData()), [commit]);

  const importJSON = useCallback(
    (raw: string) => {
      try {
        const parsed = JSON.parse(raw) as Partial<CollectionData>;
        if (!parsed || typeof parsed !== "object" || !parsed.items) {
          return { ok: false, error: "Arquivo inválido (sem 'items')." };
        }
        let added = 0;
        setData((prev) => {
          // merge de labels por nome (case-insensitive); mapeia ids importados.
          const labels = [...prev.labels];
          const idMap = new Map<string, string>();
          for (const l of parsed.labels ?? []) {
            const existing = labels.find(
              (x) => x.name.toLowerCase() === l.name.toLowerCase(),
            );
            if (existing) idMap.set(l.id, existing.id);
            else {
              const nid = uid();
              labels.push({ id: nid, name: l.name, color: l.color });
              idMap.set(l.id, nid);
            }
          }
          const items = { ...prev.items };
          for (const it of Object.values(parsed.items ?? {})) {
            const mapped = (it.labelIds ?? []).map((x) => idMap.get(x) ?? x);
            if (!items[it.thesis.id]) {
              items[it.thesis.id] = {
                thesis: it.thesis,
                labelIds: mapped,
                note: it.note,
                addedAt: it.addedAt ?? Date.now(),
              };
              added++;
            } else {
              const cur = items[it.thesis.id];
              items[it.thesis.id] = {
                ...cur,
                labelIds: Array.from(new Set([...cur.labelIds, ...mapped])),
                note: cur.note || it.note,
              };
            }
          }
          const next = { ...prev, items, labels, updatedAt: Date.now() };
          getStore().setItem(STORE_KEY, next).catch(() => {});
          return next;
        });
        return { ok: true, added };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Erro ao ler JSON." };
      }
    },
    [],
  );

  const toJSON = useCallback(() => JSON.stringify(data, null, 2), [data]);

  const toCSV = useCallback(() => {
    const labelName = new Map(data.labels.map((l) => [l.id, l.name]));
    const cols = [
      "id", "titulo", "autores", "ano", "instituicao", "programa", "tipo",
      "area_conhecimento", "area_avaliacao", "regiao", "paginas", "idioma",
      "fontes", "labels", "nota", "url_documento", "resumo",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = Object.values(data.items).map((it) => {
      const t = it.thesis;
      return [
        t.id, t.title, t.authors.join("; "), t.year ?? "", t.institution ?? "",
        t.program ?? "", t.type ?? "", t.knowledgeArea ?? "", t.evaluationArea ?? "",
        t.region ?? "", t.pages ?? "", t.language ?? "", t.sources.join("; "),
        it.labelIds.map((l) => labelName.get(l) ?? "").filter(Boolean).join("; "),
        it.note ?? "", t.documentUrl ?? "", t.abstract ?? "",
      ].map(esc).join(",");
    });
    return [cols.join(","), ...rows].join("\n");
  }, [data]);

  const value = useMemo<CollectionContextValue>(
    () => ({
      data,
      loaded,
      itemCount: Object.keys(data.items).length,
      addItems,
      removeItem,
      createLabel,
      deleteLabel,
      toggleLabel,
      setNote,
      clearAll,
      importJSON,
      toJSON,
      toCSV,
    }),
    [data, loaded, addItems, removeItem, createLabel, deleteLabel, toggleLabel, setNote, clearAll, importJSON, toJSON, toCSV],
  );

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection(): CollectionContextValue {
  const ctx = useContext(CollectionContext);
  if (!ctx)
    throw new Error("useCollection precisa estar dentro de CollectionProvider");
  return ctx;
}
