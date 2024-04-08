import { z } from "zod";

export const capesRecordSchema = z.object({
  id: z.string(),
  instituicao: z.string(),
  nomePrograma: z.string(),
  municipioPrograma: z.string(),
  titulo: z.string(),
  autor: z.string(),
  dataDefesa: z.string(),
  volumes: z.string(),
  paginas: z.string(),
  biblioteca: z.string(),
  grauAcademico: z.string(),
  link: z.string(),
});

export type CapesRecord = z.infer<typeof capesRecordSchema>;
