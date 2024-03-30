import { GeneralRecord } from "@/schemas/record";
import { atomWithStorage } from "jotai/utils";

export const recordsAtom = atomWithStorage<GeneralRecord[] | null>(
  "recordsAtom",
  null
);
