import { z } from "zod";

export const bdtdRecordSchema = z.object({
  authors: z.object({
    primary: z.record(z.unknown()),
    secondary: z.array(z.unknown()),
    corporate: z.array(z.unknown()),
  }),
  formats: z.array(z.string()),
  id: z.string(),
  title: z.string(),
  urls: z.array(
    z.object({
      url: z.string(),
      desc: z.string(),
    })
  ),
  publicationDates: z.array(z.string()),
  abstract: z.string().optional(),
});

export type BDTDRecord = z.infer<typeof bdtdRecordSchema>;
