"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/*
  Busca clássica (submit no Enter) — protege as fontes upstream de uma
  enxurrada de requests. Para instant-search, dá pra debounce este input
  e disparar router.replace a cada tecla (ver README).
*/
export function SearchBox({
  initialQ,
  query,
}: {
  initialQ: string;
  query: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(query);
    const trimmed = q.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full gap-2" role="search">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busque por tema, título, autor…"
          aria-label="Termo de busca"
          className="pl-9"
        />
      </div>
      <Button type="submit" size="lg">
        Buscar
      </Button>
    </form>
  );
}
