import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollectionList } from "@/components/collection-list";

export const metadata: Metadata = {
  title: "Minha coleção",
  // Workspace privado do usuário — não indexar.
  robots: { index: false, follow: false },
};

export default function ColecaoPage() {
  return (
    <div className="container py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" /> Voltar à busca
        </Link>
      </Button>

      <h1 className="font-serif text-2xl font-semibold text-primary">
        Minha coleção
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Gerencie os resultados guardados: marque com labels, anote, remova o que
        não interessa e exporte/importe para continuar depois.
      </p>

      <CollectionList />
    </div>
  );
}
