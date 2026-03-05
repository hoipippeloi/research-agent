import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb, collections } from "$lib/db";
import { desc, eq } from "drizzle-orm";

/**
 * GET /api/collections
 * List all collections ordered by most recently updated
 */
export const GET: RequestHandler = async () => {
  try {
    const db = getDb();

    const allCollections = await db!
      .select()
      .from(collections)
      .orderBy(desc(collections.updatedAt));

    return json(allCollections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return json({ error: "Failed to fetch collections" }, { status: 500 });
  }
};

/**
 * POST /api/collections
 * Create a new collection from a topic
 * Body: { topic: string }
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();

    const { topic } = body;

    if (!topic || typeof topic !== "string" || topic.trim() === "") {
      return json({ error: "Topic is required" }, { status: 400 });
    }

    // Check if collection with this topic already exists
    const existing = await db!
      .select()
      .from(collections)
      .where(eq(collections.topic, topic.trim()))
      .limit(1);

    if (existing.length > 0) {
      // Collection already exists, just return it
      return json(existing[0]);
    }

    // Create new collection with just the topic
    const newCollection = await db!
      .insert(collections)
      .values({
        topic: topic.trim(),
      })
      .returning();

    return json(newCollection[0], { status: 201 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return json({ error: "Failed to create collection" }, { status: 500 });
  }
};

/**
 * DELETE /api/collections?id=xx
 * Delete a collection by ID
 */
export const DELETE: RequestHandler = async ({ url }) => {
  try {
    const db = getDb();
    const id = url.searchParams.get("id");

    if (!id) {
      return json({ error: "ID is required" }, { status: 400 });
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return json({ error: "Invalid ID" }, { status: 400 });
    }

    // Delete the collection (cascade will handle collectionSearches)
    const deleted = await db!
      .delete(collections)
      .where(eq(collections.id, numericId))
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
