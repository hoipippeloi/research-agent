import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb, collections, searches, collectionSearches } from "$lib/db";
import { desc, eq, and } from "drizzle-orm";

/**
 * GET /api/collections?userEmail=xxx
 * List all collections for a user ordered by most recently updated
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    const db = getDb();
    const userEmail = url.searchParams.get("userEmail");

    if (!userEmail) {
      return json({ error: "userEmail is required" }, { status: 400 });
    }

    const allCollections = await db!
      .select()
      .from(collections)
      .where(eq(collections.userEmail, userEmail))
      .orderBy(desc(collections.updatedAt));

    return json(allCollections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return json({ error: "Failed to fetch collections" }, { status: 500 });
  }
};

/**
 * POST /api/collections
 * Create a new collection from a topic, optionally linking a search
 * Body: {
 *   topic: string,
 *   userEmail: string,
 *   searchMetadata?: {
 *     engine: string,
 *     resultsCount: number
 *   }
 * }
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();

    const { topic, userEmail, searchMetadata } = body;

    if (!topic || typeof topic !== "string" || topic.trim() === "") {
      return json({ error: "Topic is required" }, { status: 400 });
    }

    if (!userEmail) {
      return json({ error: "userEmail is required" }, { status: 400 });
    }

    // Check if collection with this topic already exists for this user
    const existing = await db!
      .select()
      .from(collections)
      .where(
        and(
          eq(collections.topic, topic.trim()),
          eq(collections.userEmail, userEmail),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // Collection already exists, just return it
      return json(existing[0]);
    }

    // If search metadata is provided, save the search and link it to the collection
    let searchId: number | null = null;

    if (
      searchMetadata &&
      searchMetadata.engine &&
      typeof searchMetadata.resultsCount === "number"
    ) {
      try {
        // Save the search to PostgreSQL
        const [savedSearch] = await db!
          .insert(searches)
          .values({
            userEmail: userEmail,
            query: topic.trim(),
            engine: searchMetadata.engine,
            resultsCount: searchMetadata.resultsCount,
          })
          .returning();

        searchId = savedSearch.id;
        console.log(
          `Saved search ${searchId} for collection "${topic.trim()}"`,
        );
      } catch (searchError) {
        // Log error but don't fail the collection creation
        console.error("Error saving search to PostgreSQL:", searchError);
      }
    }

    // Create new collection with the topic and userEmail
    const [newCollection] = await db!
      .insert(collections)
      .values({
        topic: topic.trim(),
        userEmail: userEmail,
      })
      .returning();

    // If we saved a search, create the link in collectionSearches
    if (searchId) {
      try {
        await db!.insert(collectionSearches).values({
          collectionId: newCollection.id,
          searchId: searchId,
        });

        console.log(
          `Linked search ${searchId} to collection ${newCollection.id}`,
        );
      } catch (linkError) {
        console.error("Error linking search to collection:", linkError);
        // Don't fail - the collection was created successfully
      }
    }

    return json(newCollection, { status: 201 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return json({ error: "Failed to create collection" }, { status: 500 });
  }
};

/**
 * DELETE /api/collections?id=xx&userEmail=xxx
 * Delete a collection by ID for a specific user
 */
export const DELETE: RequestHandler = async ({ url }) => {
  try {
    const db = getDb();
    const id = url.searchParams.get("id");
    const userEmail = url.searchParams.get("userEmail");

    if (!id) {
      return json({ error: "ID is required" }, { status: 400 });
    }

    if (!userEmail) {
      return json({ error: "userEmail is required" }, { status: 400 });
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return json({ error: "Invalid ID" }, { status: 400 });
    }

    // Delete the collection (cascade will handle collectionSearches)
    const deleted = await db!
      .delete(collections)
      .where(
        and(
          eq(collections.id, numericId),
          eq(collections.userEmail, userEmail),
        ),
      )
      .returning();

    if (deleted.length === 0) {
      return json({ error: "Collection not found" }, { status: 404 });
    }

    return json({ success: true, deleted: deleted[0] });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return json({ error: "Failed to delete collection" }, { status: 500 });
  }
};
