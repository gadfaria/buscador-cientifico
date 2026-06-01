import Redis from "ioredis";
import { config } from "./config";

/*
  Cache de respostas por query. No modo federação pura ele não é otimização —
  é parte da arquitetura: absorve repetição e protege as fontes upstream
  (BDTD/CAPES) de carga. TTL curto; é descartável e reconstruível.

  Sem REDIS_URL, vira no-op (pass-through) para rodar em dev sem Redis.
*/

let client: Redis | null = null;

function getClient(): Redis | null {
  if (!config.redisUrl) return null;
  if (!client) {
    client = new Redis(config.redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      // Falha de cache nunca deve derrubar a busca.
      enableOfflineQueue: false,
    });
    client.on("error", () => {
      /* silencioso: degrada para sem-cache */
    });
  }
  return client;
}

export async function getOrSet<T>(
  key: string,
  ttlSeconds: number,
  producer: () => Promise<T>,
): Promise<T> {
  const redis = getClient();
  if (!redis) return producer();

  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch {
    /* ignora erro de leitura, segue para o producer */
  }

  const value = await producer();

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* ignora erro de escrita */
  }
  return value;
}
