import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getRecord } from "@/lib/federation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  tese: "Tese",
  dissertacao: "Dissertação",
  outro: "Documento",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getRecord(decodeURIComponent(id));
  if (!t) return { title: "Registro não encontrado" };
  return {
    title: t.title,
    description: t.abstract?.slice(0, 160),
  };
}

export default async function TesePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getRecord(decodeURIComponent(id));
  if (!t) notFound();

  const meta: Array<[string, string | undefined]> = [
    ["Autor(es)", t.authors.join("; ") || undefined],
    ["Orientador(es)", t.advisors?.join("; ")],
    ["Instituição", t.institution],
    ["Programa", t.program],
    ["Ano", t.year?.toString()],
    ["Área de conhecimento", t.knowledgeArea],
    ["Área de avaliação (CAPES)", t.evaluationArea],
    ["Região", t.region],
    ["Páginas", t.pages?.toString()],
    ["Idioma", t.language],
  ];

  return (
    <div className="container py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" /> Voltar à busca
        </Link>
      </Button>

      <article className="mx-auto max-w-3xl">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {t.type && <Badge variant="primary">{TYPE_LABEL[t.type] ?? t.type}</Badge>}
          {t.sources.map((s) => (
            <Badge key={s} variant="outline">
              {s.toUpperCase()}
            </Badge>
          ))}
        </div>

        <h1 className="font-serif text-2xl font-semibold leading-tight">
          {t.title}
        </h1>

        {t.documentUrl && (
          <a
            href={t.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Acessar documento na instituição
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

        {t.abstract && (
          <section className="mt-6">
            <h2 className="mb-2 font-serif text-lg">Resumo</h2>
            <p className="text-[15px] leading-relaxed text-foreground/90">
              {t.abstract}
            </p>
          </section>
        )}

        <section className="mt-6">
          <h2 className="mb-2 font-serif text-lg">Detalhes</h2>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {meta
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label} className="border-b border-border/60 py-1.5">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="text-sm">{value}</dd>
                </div>
              ))}
          </dl>
        </section>
      </article>
    </div>
  );
}
