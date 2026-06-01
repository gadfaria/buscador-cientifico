"use client";

import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import type { FacetBucket, SearchFilters } from "@/lib/federation/types";

const FACET_LABELS: Record<string, string> = {
  institution: "Instituição",
  year: "Ano",
  type: "Tipo",
};

const FACET_ORDER = ["institution", "year", "type"];

export function Facets({
  facets,
  selected,
  query,
}: {
  facets: Record<string, FacetBucket[]>;
  selected: SearchFilters;
  query: string;
}) {
  const router = useRouter();
  const keys = FACET_ORDER.filter((k) => facets[k]?.length);

  if (keys.length === 0) return null;

  function isChecked(key: string, value: string) {
    return (selected[key as keyof SearchFilters] ?? []).includes(value);
  }

  function toggle(key: string, value: string) {
    const params = new URLSearchParams(query);
    const current = params.getAll(key);
    params.delete(key);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    for (const v of next) params.append(key, v);
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <aside aria-label="Filtros" className="text-sm">
      <h2 className="mb-2 font-serif text-lg">Filtrar</h2>
      <Accordion type="multiple" defaultValue={keys}>
        {keys.map((key) => (
          <AccordionItem key={key} value={key}>
            <AccordionTrigger>{FACET_LABELS[key] ?? key}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {facets[key].slice(0, 12).map((b) => (
                  <li key={b.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`${key}-${b.value}`}
                      checked={isChecked(key, b.value)}
                      onCheckedChange={() => toggle(key, b.value)}
                    />
                    <label
                      htmlFor={`${key}-${b.value}`}
                      className="flex flex-1 cursor-pointer items-center justify-between gap-2"
                    >
                      <span className="truncate">{b.label}</span>
                      <span className="tabular-nums text-xs text-muted-foreground">
                        {b.count.toLocaleString("pt-BR")}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </aside>
  );
}
