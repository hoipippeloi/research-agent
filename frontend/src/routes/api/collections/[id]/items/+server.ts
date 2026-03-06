import { json, type RequestHandler } from "@sveltejs/kit";
import { getDb } from "$lib/db";
import {
  savedResults,
  collections,
  collectionSearches,
  searches,
} from "$lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/collections/[id]/items?userEmail=email
 * Get all items (bookmarks, documents, saved results) for a collection
 */
export const GET: RequestHandler = async ({ params, url }) => {
  const db = getDb();

  if (!db) {
    return json({ error: "Database not available" }, { status: 503 });
  }

  const collectionId = params.id;
  const userEmail = url.searchParams.get("userEmail");

  if (!collectionId) {
    return json({ error: "Collection ID is required" }, { status: 400 });
  }

  if (!userEmail) {
    return json({ error: "userEmail is required" }, { status: 400 });
  }

  const id = parseInt(collectionId, 10);
  if (isNaN(id)) {
    return json({ error: "Invalid collection ID" }, { status: 400 });
  }

  try {
    // Verify collection exists and belongs to user
    const collection = await db
      .select()
      .from(collections)
      .where(and(eq(collections.id, id), eq(collections.userEmail, userEmail)))
      .limit(1);

    if (collection.length === 0) {
      return json({ error: "Collection not found" }, { status: 404 });
    }

    // Get all saved results (bookmarks, documents, web results) for this collection
    const items = await db
      .select()
      .from(savedResults)
      .where(
        and(
          eq(savedResults.collectionId, id),
          eq(savedResults.userEmail, userEmail),
        ),
      )
      .orderBy(desc(savedResults.createdAt));

    // Get all searches linked to this collection via collectionSearches junction table
    // Only select specific columns to avoid issues with schema mismatches
    let linkedSearches: Array<{
      id: number;
      query: string;
      engine: string;
      resultsCount: number | null;
      createdAt: Date;
      addedAt: Date;
    }> = [];

    try {
      const searchResults = await db
        .select({
          id: searches.id,
          query: searches.query,
          engine: searches.engine,
          resultsCount: searches.resultsCount,
          createdAt: searches.createdAt,
          addedAt: collectionSearches.addedAt,
        })
        .from(collectionSearches)
        .innerJoin(searches, eq(collectionSearches.searchId, searches.id))
        .where(eq(collectionSearches.collectionId, id))
        .orderBy(desc(collectionSearches.addedAt));

      linkedSearches = searchResults;
    } catch (searchError) {
      // If the searches query fails (e.g., schema mismatch), continue without searches
      console.error("Error fetching linked searches:", searchError);
      linkedSearches = [];
    }

    // Categorize items by type
    const bookmarks = items.filter((item) => item.type === "url");
    const documents = items.filter((item) => item.type === "document");
    const webResults = items.filter(
      (item) => item.type && !["url", "document"].includes(item.type),
    );
    const savedMarkdown = items.filter((item) => item.content && !item.type);

    return json({
      collection: collection[0],
      items: {
        all: items,
        bookmarks,
        documents,
        webResults,
        savedMarkdown,
      },
      searches: linkedSearches,
      stats: {
        totalItems: items.length,
        bookmarksCount: bookmarks.length,
        documentsCount: documents.length,
        webResultsCount: webResults.length,
        savedMarkdownCount: savedMarkdown.length,
        searchesCount: linkedSearches.length,
      },
    });
  } catch (error) {
    console.error("Error fetching collection items:", error);
    return json({ error: "Failed to fetch collection items" }, { status: 500 });
  }
};
