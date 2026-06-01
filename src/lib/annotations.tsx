"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/*
  Anotações do usuário sobre os resultados (curadoria), persistidas no
  localStorage do navegador. É dado do USUÁRIO sobre o corpus — não o corpus —,
  então não fere o "zero-banco". Chave canônica = id da tese (bdtd:.. / capes:..),
  logo a marcação sobrevive a novas buscas. Para sincronizar entre dispositivos,
  trocar este store por um backend de contas sem mexer na UI.
*/

export type LabelColor = "amber" | "green" | "blue" | "red" | "purple";

export interface Annotation {
  color?: LabelColor;
  hidden?: boolean;
}

export type AnnotationMap = Record<string, Annotation>;

export const LABEL_COLORS: LabelColor[] = [
  "amber",
  "green",
  "blue",
  "red",
  "purple",
];

/** Classes estáticas por cor (Tailwind precisa de nomes literais). */
export const COLOR_STYLES: Record<
  LabelColor,
  { border: string; dot: string; ring: string; label: string }
> = {
  amber: {
    border: "border-l-amber-500",
    dot: "bg-amber-500",
    ring: "ring-amber-500",
    label: "Âmbar",
  },
  green: {
    border: "border-l-emerald-600",
    dot: "bg-emerald-600",
    ring: "ring-emerald-600",
    label: "Verde",
  },
  blue: {
    border: "border-l-blue-600",
    dot: "bg-blue-600",
    ring: "ring-blue-600",
    label: "Azul",
  },
  red: {
    border: "border-l-rose-600",
    dot: "bg-rose-600",
    ring: "ring-rose-600",
    label: "Vermelho",
  },
  purple: {
    border: "border-l-violet-600",
    dot: "bg-violet-600",
    ring: "ring-violet-600",
    label: "Roxo",
  },
};

const STORAGE_KEY = "bc:annotations:v1";

interface AnnotationsContextValue {
  /** Mapa atual (vazio até hidratar do localStorage). */
  annotations: AnnotationMap;
  /** True após a hidratação client-side — use para evitar flash/mismatch. */
  loaded: boolean;
  get: (id: string) => Annotation | undefined;
  setColor: (id: string, color: LabelColor | null) => void;
  toggleHidden: (id: string) => void;
  restore: (id: string) => void;
  clearHidden: () => void;
  clearAll: () => void;
  hiddenCount: number;
}

const AnnotationsContext = createContext<AnnotationsContextValue | null>(null);

export function AnnotationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inicia vazio (igual ao SSR); hidrata no mount para não quebrar a hidratação.
  const [annotations, setAnnotations] = useState<AnnotationMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAnnotations(JSON.parse(raw) as AnnotationMap);
    } catch {
      /* ignora JSON corrompido */
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((next: AnnotationMap) => {
    setAnnotations(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota/indisponível: degrada para só-memória */
    }
  }, []);

  const update = useCallback(
    (id: string, patch: (a: Annotation) => Annotation | undefined) => {
      setAnnotations((prev) => {
        const nextItem = patch(prev[id] ?? {});
        const next = { ...prev };
        if (!nextItem || (!nextItem.color && !nextItem.hidden)) delete next[id];
        else next[id] = nextItem;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* noop */
        }
        return next;
      });
    },
    [],
  );

  const value = useMemo<AnnotationsContextValue>(
    () => ({
      annotations,
      loaded,
      get: (id) => annotations[id],
      setColor: (id, color) =>
        update(id, (a) => ({ ...a, color: color ?? undefined })),
      toggleHidden: (id) => update(id, (a) => ({ ...a, hidden: !a.hidden })),
      restore: (id) => update(id, (a) => ({ ...a, hidden: false })),
      clearHidden: () => {
        const next: AnnotationMap = {};
        for (const [id, a] of Object.entries(annotations)) {
          if (a.color) next[id] = { color: a.color };
        }
        persist(next);
      },
      clearAll: () => persist({}),
      hiddenCount: Object.values(annotations).filter((a) => a.hidden).length,
    }),
    [annotations, loaded, update, persist],
  );

  return (
    <AnnotationsContext.Provider value={value}>
      {children}
    </AnnotationsContext.Provider>
  );
}

export function useAnnotations(): AnnotationsContextValue {
  const ctx = useContext(AnnotationsContext);
  if (!ctx)
    throw new Error("useAnnotations precisa estar dentro de AnnotationsProvider");
  return ctx;
}
