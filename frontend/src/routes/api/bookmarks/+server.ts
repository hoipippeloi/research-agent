import { json, type RequestHandler } from "@sveltejs/kit";
import { getDb } from "$lib/db";
import { savedResults } from "$lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/bookmarks?userEmail=email
 * List all bookmarks (saved_results with type='url') for a user
 */
export const GET: RequestHandler = async ({ url }) => {
  const db = getDb();

  if (!db) {
    return json({ error: "Database not available" }, { status: 503 });
  }

  const userEmail = url.searchParams.get("userEmail");

  if (!userEmail) {
    return json({ error: "userEmail is required" }, { status: 400 });
  }

  try {
    const bookmarks = await db
      .select()
      .from(savedResults)
      .where(
        and(
          eq(savedResults.userEmail, userEmail),
          eq(savedResults.type, "url"),
        ),
      )
      .orderBy(desc(savedResults.createdAt));

    return json({ bookmarks });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
};

/**
 * POST /api/bookmarks
 * Create a new bookmark (saved_result with type='url')
 * Body: { userEmail, title, url, excerpt, content?, collectionId?, searchId? }
 */
export const POST: RequestHandler = async ({ request }) => {
  const db = getDb();

  if (!db) {
    return json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { userEmail, title, url, excerpt, content, collectionId, searchId } =
      body;

    if (!userEmail || !title || !url) {
      return json(
        { error: "Missing required fields: userEmail, title, url" },
        { status: 400 },
      );
    }

    const now = new Date();

    // Check if bookmark already exists
    const existingBookmark = await db
      .select()
      .from(savedResults)
      .where(
        and(
          eq(savedResults.url, url),
          eq(savedResults.userEmail, userEmail),
          eq(savedResults.type, "url"),
        ),
      )
      .limit(1);

    if (existingBookmark.length > 0) {
      // Update existing bookmark
      const result = await db
        .update(savedResults)
        .set({
          title: title,
          excerpt: excerpt || null,
          content: content || null,
          collectionId: collectionId || null,
          searchId: searchId || null,
          updatedAt: now,
        })
        .where(eq(savedResults.id, existingBookmark[0].id))
        .returning();

      return json({ success: true, bookmark: result[0], updated: true });
    }

    // Create new bookmark
    const result = await db
      .insert(savedResults)
      .values({
        userEmail: userEmail,
        url: url,
        title: title,
        excerpt: excerpt || null,
        content: content || null,
        collectionId: collectionId || null,
        searchId: searchId || null,
        type: "url",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return json({ success: true, bookmark: result[0], created: true });
  } catch (error) {
    console.error("Error saving bookmark:", error);
    return json({ error: "Failed to save bookmark" }, { status: 500 });
  }
};

/**
 * PATCH /api/bookmarks
 * Update bookmark collection assignment
 * Body: { bookmarkId: number, collectionId: number | null, userEmail: string }
 */
export const PATCH: RequestHandler = async ({ request }) => {
  const db = getDb();

  if (!db) {
    return json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { bookmarkId, collectionId, userEmail } = body;

    if (!bookmarkId || !userEmail) {
      return json(
        { error: "Missing required fields: bookmarkId, userEmail" },
        { status: 400 },
      );
    }

    const numericId = parseInt(bookmarkId, 10);
    if (isNaN(numericId)) {
      return json({ error: "Invalid bookmark ID" }, { status: 400 });
    }

    // Update the bookmark's collection assignment
    const result = await db
      .update(savedResults)
      .set({
        collectionId: collectionId || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(savedResults.id, numericId),
          eq(savedResults.userEmail, userEmail),
          eq(savedResults.type, "url"),
        ),
      )
      .returning();

    if (result.length === 0) {
      return json({ error: "Bookmark not found" }, { status: 404 });
    }

    return json({ success: true, bookmark: result[0] });
  } catch (error) {
    console.error("Error updating bookmark collection:", error);
    return json({ error: "Failed to update bookmark" }, { status: 500 });
  }
};

/**
 * DELETE /api/bookmarks?url=...&userEmail=...
 * Delete a bookmark
 */
export const DELETE: RequestHandler = async ({ url }) => {
  const db = getDb();

  if (!db) {
    return json({ error: "Database not available" }, { status: 503 });
  }

  const bookmarkUrl = url.searchParams.get("url");
  const userEmail = url.searchParams.get("userEmail");

  if (!bookmarkUrl || !userEmail) {
    return json({ error: "url and userEmail are required" }, { status: 400 });
  }

  try {
    const result = await db
      .delete(savedResults)
      .where(
        and(
          eq(savedResults.url, bookmarkUrl),
          eq(savedResults.userEmail, userEmail),
          eq(savedResults.type, "url"),
        ),
      )
      .returning();

    if (result.length === 0) {
      return json({ error: "Bookmark not found" }, { status: 404 });
    }

    return json({ success: true, deleted: true });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return json({ error: "Failed to delete bookmark" }, { status: 500 });
  }
};
