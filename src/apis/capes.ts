import { CapesRecord } from "@/schemas/capes";

const CAPES_URL = "https://catalogodeteses.capes.gov.br/catalogo-teses/rest";

async function getCount(query: any) {
  try {
    const response = await fetch(`${CAPES_URL}/busca`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) throw new Error("Error fetching data");

    const data = await response.json();
    return data.total;
  } catch (error) {
    console.error("[getCount] error", error);
    return null;
  }
}

async function getData({ page = 1, lookFor = "" }) {
  try {
    const response = await fetch(
      `${CAPES_URL}/search?lookfor=${lookFor}&field%5B%5D=authors&field%5B%5D=formats&field%5B%5D=id&field%5B%5D=publicationDates&field%5B%5D=title&field%5B%5D=urls&limit=100&page=${page}`
    );

    if (!response.ok) throw new Error("Error fetching data");

    const data: {
      total: number;
      tesesDissertacoes: CapesRecord[];
    } = await response.json();

    return {
      records: data.tesesDissertacoes || [],
      count: data.total,
    };
  } catch (error) {
    console.error("[getData] error", error);
    return {
      records: [],
      count: 0,
    };
  }
}

export const capesAPI = {
  getCount,
  getData,
};
