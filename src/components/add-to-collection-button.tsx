"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollection } from "@/lib/collection";
import type { Thesis } from "@/lib/federation/types";

/*
  Materializa o top-N da busca atual (via /api/collect), soma à coleção
  acumulativa (dedup por id no store) e leva para a tela de gerência.
*/
export function AddToCollectionButton({
  query,
  cap = 100,
}: {
  query: string;
  cap?: number;
}) {
  const router = useRouter();
  const { addItems } = useCollection();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/collect?${query}&cap=${cap}`);
      const data = (await res.json()) as { hits: Thesis[] };
      addItems(data.hits ?? []);
      router.push("/colecao");
    } catch {
      setLoading(false);
      alert("Não foi possível coletar os resultados agora. Tente novamente.");
    }
  }

  return (
    <Button size="lg" onClick={handle} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Layers className="h-4 w-4" />
      )}
      Adicionar à coleção e gerenciar
    </Button>
  );
}
