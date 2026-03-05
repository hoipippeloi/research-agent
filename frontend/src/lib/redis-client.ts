import Redis from "ioredis";
import { env } from "$env/dynamic/private";
import type { SearchResult } from "./searxng-client";

const REDIS_URL = env.REDIS_URL || "redis://localhost:6379";
const CACHE_TTL = 3600; // 1 hour in seconds

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL);
  }
  return redis;
}

export interface SearchHistory {
  id: string;
  userEmail: string;
  query: string;
  timestamp: number;
  engine: string;
  resultsCount: number;
}

export async function saveSearch(
  search: Omit<SearchHistory, "id" | "timestamp">,
): Promise<string> {
  const client = getRedis();
  const id = `search:${search.userEmail}:${Date.now()}:${Math.random().toString(36).substring(7)}`;

  await client.hset(id, {
    userEmail: search.userEmail,
    query: search.query,
    timestamp: Date.now().toString(),
    engine: search.engine,
    resultsCount: search.resultsCount.toString(),
  });

  // Use user-specific sorted set and list
  await client.zadd(`search:history:${search.userEmail}`, Date.now(), id);
  await client.lpush(`search:recent:${search.userEmail}`, id);
  await client.ltrim(`search:recent:${search.userEmail}`, 0, 99);

  return id;
}

export async function getRecentSearches(
  userEmail: string,
  limit: number = 6,
): Promise<SearchHistory[]> {
  const client = getRedis();
  const ids = await client.lrange(`search:recent:${userEmail}`, 0, limit - 1);

  const searches: SearchHistory[] = [];

  for (const id of ids) {
    const data = await client.hgetall(id);
    if (data && data.query) {
      searches.push({
        id,
        userEmail: data.userEmail,
        query: data.query,
        timestamp: parseInt(data.timestamp),
        engine: data.engine,
        resultsCount: parseInt(data.resultsCount),
      });
    }
  }

  return searches;
}

export async function deleteSearch(userEmail: string, id: string): Promise<void> {
  const client = getRedis();
  await client.del(id);
  await client.lrem(`search:recent:${userEmail}`, 0, id);
  await client.zrem(`search:history:${userEmail}`, id);
}

/**
 * Deduplicate search results by URL, keeping the result with the highest score
 */
export function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();

  for (const result of results) {
    const existing = seen.get(result.url);
    if (!existing || result.score > existing.score) {
      seen.set(result.url, result);
    }
  }

  return Array.from(seen.values()).sort((a, b) => b.score - a.score);
}

/**
 * Cache search results for a query
 */
export async function cacheSearchResults(
  query: string,
  engine: string,
  results: SearchResult[],
): Promise<void> {
  const client = getRedis();
  const cacheKey = `cache:${engine}:${query.toLowerCase().trim()}`;

  // Deduplicate before caching
  const dedupedResults = deduplicateResults(results);

  await client.setex(
    cacheKey,
    CACHE_TTL,
    JSON.stringify({
      results: dedupedResults,
      timestamp: Date.now(),
      count: dedupedResults.length,
    }),
  );
}

/**
 * Get cached search results if they exist and haven't expired
 */
export async function getCachedSearchResults(
  query: string,
  engine: string,
): Promise<{
  results: SearchResult[];
  timestamp: number;
  count: number;
} | null> {
  const client = getRedis();
  const cacheKey = `cache:${engine}:${query.toLowerCase().trim()}`;

  const cached = await client.get(cacheKey);

  if (cached) {
    try {
      const data = JSON.parse(cached);
      return {
        results: data.results,
        timestamp: data.timestamp,
        count: data.count,
      };
    } catch (err) {
      console.error("Error parsing cached results:", err);
      return null;
    }
  }

  return null;
}
