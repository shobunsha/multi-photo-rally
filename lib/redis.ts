import { createClient } from "redis";

declare global {
  // eslint-disable-next-line no-var
  var __redisClient__: ReturnType<typeof createClient> | undefined;
  // eslint-disable-next-line no-var
  var __redisConnectPromise__:
    | Promise<ReturnType<typeof createClient>>
    | undefined;
}

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not set");
}

export const redis =
  global.__redisClient__ ??
  createClient({
    url: redisUrl,
  });

if (!global.__redisClient__) {
  global.__redisClient__ = redis;

  redis.on("error", (err) => {
    console.error("Redis error:", err);
  });
}

export async function ensureRedis() {
  if (redis.isOpen) return;

  if (!global.__redisConnectPromise__) {
    global.__redisConnectPromise__ = redis.connect().finally(() => {
      global.__redisConnectPromise__ = undefined;
    });
  }

  await global.__redisConnectPromise__;
}