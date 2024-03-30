import { bdtdAPI } from "@/apis/bdtd";
import { recordsAtom } from "@/atoms/recordsAtom";
import { BDTDRecord } from "@/schemas/bdtd";
import { GeneralRecord } from "@/schemas/record";
import { useAtom } from "jotai/react";
import { useState } from "react";

export default function useData() {
  const [records, setRecords] = useAtom(recordsAtom);

  const [count, setCount] = useState<number>();
  const [progress, setProgress] = useState<{
    type: "info" | "abstract";
    value: number;
  } | null>(null);

  async function getCount(lookFor: string) {
    const data = await bdtdAPI.getCount({ lookFor });
    setCount(data);
  }

  async function getData({ lookFor }: { lookFor: string }) {
    let total = 0;

    let bdtdRecord: BDTDRecord[] = [];

    let countTest = 0;

    while (true) {
      countTest++;

      setProgress({
        type: "info",
        value: total ? Math.round((countTest / (total / 100)) * 100) : 0,
      });

      const data = await bdtdAPI.getData({ lookFor, page: countTest });

      if (!total) {
        total = data.count;
        setCount(total);
      }

      if (!data?.records?.length) break;

      bdtdRecord = [...bdtdRecord, ...data.records];
    }

    const mappedRecords: GeneralRecord[] = bdtdRecord.map((record) => ({
      author: Object.keys(record.authors.primary)[0],
      publicationDate: record.publicationDates[0],
      title: record.title,
      url: record.urls[0].url,
    }));

    setRecords(mappedRecords);
    setProgress(null);
  }

  async function getAbstracts() {
    // const recordsWithAbstracts = [...records];
    // for (let i = 0; i < recordsWithAbstracts.length; i++) {
    //   setProgress({
    //     type: "abstract",
    //     value: Math.round(((i + 1) / recordsWithAbstracts.length) * 100),
    //   });
    //   const record = recordsWithAbstracts[i];
    //   const abstract = await bdtdAPI.getAbstracts(record.id);
    //   record.abstract = abstract;
    // }
    // setRecords(recordsWithAbstracts);
    // setProgress(null);
  }

  return {
    records,
    progress,
    getCount,
    count,
    getData,
    getAbstracts,
  };
}
