import { z } from "zod";

export const generalRecordSchema = z.object({
  id: z.string(),
  author: z.string(),
  title: z.string(),
  publicationDate: z.string(),
  abstract: z.string().optional(),
  url: z.string(),
});

export type GeneralRecord = z.infer<typeof generalRecordSchema>;
