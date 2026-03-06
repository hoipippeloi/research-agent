import { json, type RequestHandler } from "@sveltejs/kit";
import { getDb } from "$lib/db";
import { savedResults } from "$lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/documents/[id]?userEmail=email
 * Get a single document by ID
 */
export const GET: RequestHandler = async ({ params, url }) => {
  const db = getDb();

  if (!db) {
    return json({ error: "Database not available" }, { status: 503 });
  }

  try {
    if (!params.id) {
      return json({ error: "Document ID is required" }, { status: 400 });
    }

    const documentId = parseInt(params.id);
    const userEmail = url.searchParams.get("userEmail");

    if (!userEmail) {
      return json({ error: "userEmail is required" }, { status: 400 });
    }

    if (isNaN(documentId)) {
      return json({ error: "Invalid document ID" }, { status: 400 });
    }

    const document = await db
      .select()
      .from(savedResults)
      .where(
        and(
          eq(savedResults.id, documentId),
          eq(savedResults.userEmail, userEmail),
          eq(savedResults.type, "document"),
        ),
      )
      .limit(1);

    if (document.length === 0) {
      return json({ error: "Document not found" }, { status: 404 });
    }

    return json(document[0]);
  } catch (error) {
    console.error("Error fetching document:", error);
    return json({ error: "Failed to fetch document" }, { status: 500 });
  }
};

/**
 * PUT /api/documents/[id]
 * Update a document by ID
 */
export const PUT: RequestHandler = async ({ params, request }) => {
  const db = getDb();

  if (!db) {
    return json({ error: "Database not available" }, { status: 503 });
  }

  try {
    if (!params.id) {
      return json({ error: "Document ID is required" }, { status: 400 });
    }

    const documentId = parseInt(params.id);
    const body = await request.json();
    const { title, content, userEmail, collectionId, tags } = body;

    if (!userEmail) {
      return json({ error: "userEmail is required" }, { status: 400 });
    }

    if (isNaN(documentId)) {
      return json({ error: "Invalid document ID" }, { status: 400 });
    }

    // Check if document exists and belongs to user
    const existing = await db
      .select()
      .from(savedResults)
      .where(
        and(
          eq(savedResults.id, documentId),
          eq(savedResults.userEmail, userEmail),
          eq(savedResults.type, "document"),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      return json({ error: "Document not found" }, { status: 404 });
    }

    const now = new Date();
    const updateData: Record<string, any> = {
      updatedAt: now,
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (collectionId !== undefined) updateData.collectionId = collectionId;
    if (tags !== undefined) updateData.tags = tags;

    const result = await db
      .update(savedResults)
      .set(updateData)
      .where(eq(savedResults.id, documentId))
      .returning();

    return json({ success: true, document: result[0] });
  } catch (error) {
    console.error("Error updating document:", error);
    return json({ error: "Failed to update document" }, { status: 500 });
  }
};

/**
 * DELETE /api/documents/[id]?userEmail=email
 * Delete a document by ID
 */
export const DELETE: RequestHandler = async ({ params, url }) => {
  const db = getDb();

  if (!db) {
    return json({ error: "Database not available" }, { status: 503 });
  }

  try {
    if (!params.id) {
      return json({ error: "Document ID is required" }, { status: 400 });
    }

    const documentId = parseInt(params.id);
    const userEmail = url.searchParams.get("userEmail");

    if (!userEmail) {
      return json({ error: "userEmail is required" }, { status: 400 });
    }

    if (isNaN(documentId)) {
      return json({ error: "Invalid document ID" }, { status: 400 });
    }

    // Check if document exists and belongs to user
    const existing = await db
      .select()
      .from(savedResults)
      .where(
        and(
          eq(savedResults.id, documentId),
          eq(savedResults.userEmail, userEmail),
          eq(savedResults.type, "document"),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      return json({ error: "Document not found" }, { status: 404 });
    }

    await db.delete(savedResults).where(eq(savedResults.id, documentId));

    return json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return json({ error: "Failed to delete document" }, { status: 500 });
  }
};
