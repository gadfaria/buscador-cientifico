import { BDTDRecord } from "../schemas/bdtd";

const BDTD_URL = "https://bdtd.ibict.br/vufind/api/v1";

async function getCount(query: any) {
  try {
    const response = await fetch(
      `${BDTD_URL}/search?lookfor=${query.lookFor}&limit=0`
    );

    const data = await response.json();
    if (data.status === "OK") return data.resultCount;
    else return null;
  } catch (error) {
    console.error("[getCount] error", error);
    return null;
  }
}

async function getData({ page = 1, lookFor = "" }) {
  try {
    const response = await fetch(
      `${BDTD_URL}/search?lookfor=${lookFor}&field%5B%5D=authors&field%5B%5D=formats&field%5B%5D=id&field%5B%5D=publicationDates&field%5B%5D=title&field%5B%5D=urls&limit=100&page=${page}`
    );

    const data: {
      resultCount: number;
      records: BDTDRecord[];
      status: string;
    } = await response.json();

    if (data.status !== "OK")
      return {
        records: [],
        count: 0,
      };

    // return data?.records || [];
    return {
      records: data?.records || [],
      count: data.resultCount,
    };
  } catch (error) {
    console.error("[getData] error", error);
    return {
      records: [],
      count: 0,
    };
  }
}

async function getAbstracts(id: string) {
  try {
    const response = await fetch(`/abstract/${id}`, {
      headers: {
        authority: "bdtd.ibict.br",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        dnt: "1",
        referer:
          "https://bdtd.ibict.br/vufind/Search/Results?lookfor=estat%C3%ADstica+AND+professor+AND+ensino&type=AllFields",
        "sec-ch-ua": '"Not(A:Brand";v="24", "Chromium";v="122"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Cookie: "VUFIND_SESSION=025g6obhqg33ff9ct3h6vl7nu4; ui=standard",
      },
    });

    const data = await response.text();

    const abstract = `${data}`
      .split("<th>Resumo:</th>")[1]
      .split("<td>")[1]
      .split("</td>")[0];

    return abstract;
  } catch (error) {
    console.error("[getResume] error", error);
    return "";
  }
}

export const bdtdAPI = {
  getCount,
  getData,
  getAbstracts,
};
