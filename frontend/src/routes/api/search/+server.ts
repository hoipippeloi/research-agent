import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { searxng } from "$lib/searxng-client";
import {
  saveSearch,
  cacheSearchResults,
  getCachedSearchResults,
  deduplicateResults,
} from "$lib/redis-client";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const query = url.searchParams.get("query");
    const engine = url.searchParams.get("engine") || "general";
    const cacheOnly = url.searchParams.get("cacheOnly") === "true";
    const userEmail = url.searchParams.get("userEmail");

    if (!query) {
      return json({ error: "Query is required" }, { status: 400 });
    }

    if (!userEmail) {
      return json({ error: "userEmail is required" }, { status: 400 });
    }

    // Check cache
    const cached = await getCachedSearchResults(query, engine);

    if (cached) {
      return json({
        query,
        number_of_results: cached.count,
        results: cached.results,
        cached: true,
        cachedAt: cached.timestamp,
      });
    }

    // If cacheOnly is true, return empty results
    if (cacheOnly) {
      return json({
        query,
        number_of_results: 0,
        results: [],
        cached: false,
      });
    }

    // Otherwise, perform search (same as POST)
    let results;
    let engines: string[];

    switch (engine) {
      case "code":
        results = await searxng.searchCode(query);
        engines = ["github", "stackoverflow"];
        break;
      case "academic":
        results = await searxng.searchAcademic(query);
        engines = ["arxiv", "semantic scholar"];
        break;
      default:
        results = await searxng.searchGeneral(query);
        engines = ["brave", "duckduckgo", "startpage"];
    }

    // Deduplicate results
    const dedupedResults = deduplicateResults(results.results);

    // Cache the results
    await cacheSearchResults(query, engine, dedupedResults);

    // Save to search history
    await saveSearch({
      userEmail,
      query,
      engine: engines.join(","),
      resultsCount: dedupedResults.length,
    });

    return json({
      query: results.query,
      number_of_results: dedupedResults.length,
      results: dedupedResults,
      cached: false,
    });
  } catch (error) {
    console.error("Search error:", error);
    return json({ error: "Failed to perform search" }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { query, engine = "general", userEmail } = await request.json();

    if (!query || typeof query !== "string") {
      return json({ error: "Query is required" }, { status: 400 });
    }

    if (!userEmail) {
      return json({ error: "userEmail is required" }, { status: 400 });
    }

    // Check cache first
    const cached = await getCachedSearchResults(query, engine);
    if (cached) {
      console.log(`Cache hit for query: "${query}" (${engine})`);

      // Still save to search history
      const engines = getEnginesForType(engine);
      await saveSearch({
        userEmail,
        query,
        engine: engines.join(","),
        resultsCount: cached.count,
      });

      return json({
        query,
        number_of_results: cached.count,
        results: cached.results,
        cached: true,
        cachedAt: cached.timestamp,
      });
    }

    // No cache, perform search
    console.log(`Cache miss for query: "${query}" (${engine}), searching...`);

    let results;
    let engines: string[];

    switch (engine) {
      case "code":
        results = await searxng.searchCode(query);
        engines = ["github", "stackoverflow"];
        break;
      case "academic":
        results = await searxng.searchAcademic(query);
        engines = ["arxiv", "semantic scholar"];
        break;
      default:
        results = await searxng.searchGeneral(query);
        engines = ["brave", "duckduckgo", "startpage"];
    }

    // Deduplicate results
    const dedupedResults = deduplicateResults(results.results);

    // Cache the results
    await cacheSearchResults(query, engine, dedupedResults);

    // Save to search history
    await saveSearch({
      userEmail,
      query,
      engine: engines.join(","),
      resultsCount: dedupedResults.length,
    });

    return json({
      query: results.query,
      number_of_results: dedupedResults.length,
      results: dedupedResults,
      cached: false,
    });
  } catch (error) {
    console.error("Search error:", error);
    return json({ error: "Failed to perform search" }, { status: 500 });
  }
};

function getEnginesForType(engine: string): string[] {
  switch (engine) {
    case "code":
      return ["github", "stackoverflow"];
    case "academic":
      return ["arxiv", "semantic scholar"];
    default:
      return ["brave", "duckduckgo", "startpage"];
  }
}
