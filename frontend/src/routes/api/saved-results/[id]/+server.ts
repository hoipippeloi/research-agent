import { json, type RequestHandler } from "@sveltejs/kit";
import { getDb } from "$lib/db";
import { savedResults } from "$lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/saved-results/[id]?userEmail=email
 * Get a single saved result by ID
 */
export const GET: RequestHandler = async ({ params, url }) => {
  const db = getDb();

  if (!db) {
    return json({ error: "Database not available" }, { status: 503 });
  }

  const resultId = params.id;
  const userEmail = url.searchParams.get("userEmail");

  if (!resultId) {
    return json({ error: "Result ID is required" }, { status: 400 });
  }

  if (!userEmail) {
    return json({ error: "userEmail is required" }, { status: 400 });
  }

  const id = parseInt(resultId, 10);
  if (isNaN(id)) {
    return json({ error: "Invalid result ID" }, { status: 400 });
  }

  try {
    const result = await db
      .select()
      .from(savedResults)
      .where(and(eq(savedResults.id, id), eq(savedResults.userEmail, userEmail)))
      .limit(1);

    if (result.length === 0) {
      return json({ error: "Saved result not found" }, { status: 404 });
    }

    return json(result[0]);
  } catch (error) {
    console.error("Error fetching saved result:", error);
    return json({ error: "Failed to fetch saved result" }, { status: 500 });
  }
};

/**
 * DELETE /api/saved-results/[id]?userEmail=email
 * Delete a saved result by ID
 */
export const DELETE: RequestHandler = async ({ params, url }) => {
  const db = getDb();

  if (!db) {
    return json({ error: "Database not available" }, { status: 503 });
  }

  const resultId = params.id;
  const userEmail = url.searchParams.get("userEmail");

  if (!resultId) {
    return json({ error: "Result ID is required" }, { status: 400 });
  }

  if (!userEmail) {
    return json({ error: "userEmail is required" }, { status: 400 });
  }

  const id = parseInt(resultId, 10);
  if (isNaN(id)) {
    return json({ error: "Invalid result ID" }, { status: 400 });
  }

  try {
    // Verify the result exists and belongs to the user
    const existing = await db
      .select()
      .from(savedResults)
      .where(and(eq(savedResults.id, id), eq(savedResults.userEmail, userEmail)))
      .limit(1);

    if (existing.length === 0) {
      return json({ error: "Saved result not found" }, { status: 404 });
    }

    // Delete the result
    await db.delete(savedResults).where(eq(savedResults.id, id));

    return json({ success: true, message: "Saved result deleted" });
  } catch (error) {
    console.error("Error deleting saved result:", error);
    return json({ error: "Failed to delete saved result" }, { status: 500 });
  }
};

/**
 * PUT /api/saved-results/[id]
 * Update a saved result by ID
 */
export const PUT: RequestHandler = async ({ params, request }) => {
  const db = getDb();

  if (!db) {
    return json({ error: "Database not available" }, { status: 503 });
  }

  const resultId = params.id;
  if (!resultId) {
    return json({ error: "Result ID is required" }, { status: 400 });
  }

  const id = parseInt(resultId, 10);
  if (isNaN(id)) {
    return json({ error: "Invalid result ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { userEmail, title, content, excerpt, notes, tags, isRead, isArchived, collectionId } = body;

    if (!userEmail) {
      return json({ error: "userEmail is required" }, { status: 400 });
    }

    // Verify the result exists and belongs to the user
    const existing = await db
      .select()
      .from(savedResults)
      .where(and(eq(savedResults.id, id), eq(savedResults.userEmail, userEmail)))
      .limit(1);

    if (existing.length === 0) {
      return json({ error: "Saved result not found" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (notes !== undefined) updateData.notes = notes;
    if (tags !== undefined) updateData.tags = tags;
    if (isRead !== undefined) updateData.isRead = isRead;
    if (isArchived !== undefined) updateData.isArchived = isArchived;
    if (collectionId !== undefined) updateData.collectionId = collectionId;

    const result = await db
      .update(savedResults)
      .set(updateData)
      .where(eq(savedResults.id, id))
      .returning();

    return json(result[0]);
  } catch (error) {
    console.error("Error updating saved result:", error);
    return json({ error: "Failed to update saved result" }, { status: 500 });
  }
};
