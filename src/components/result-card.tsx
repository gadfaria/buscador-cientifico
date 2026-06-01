import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Thesis } from "@/lib/federation/types";

const TYPE_LABEL: Record<string, string> = {
  tese: "Tese",
  dissertacao: "Dissertação",
  outro: "Outro",
};

export function ResultCard({ thesis }: { thesis: Thesis }) {
  const meta = [
    thesis.authors[0],
    thesis.institution,
    thesis.year?.toString(),
  ].filter(Boolean);

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardContent className="p-5">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          {thesis.type && (
            <Badge variant="primary">{TYPE_LABEL[thesis.type] ?? thesis.type}</Badge>
          )}
          {thesis.sources.map((s) => (
            <Badge key={s} variant="outline">
              {s.toUpperCase()}
            </Badge>
          ))}
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
