import { json, type RequestHandler } from "@sveltejs/kit";
import { getDb } from "$lib/db";
import { collections } from "$lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/collections/[id]?userEmail=email
 * Get a single collection by ID
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
    const result = await db
      .select()
      .from(collections)
      .where(and(eq(collections.id, id), eq(collections.userEmail, userEmail)))
      .limit(1);

    if (result.length === 0) {
      return json({ error: "Collection not found" }, { status: 404 });
    }

    return json(result[0]);
  } catch (error) {
    console.error("Error fetching collection:", error);
    return json({ error: "Failed to fetch collection" }, { status: 500 });
  }
};

/**
 * PUT /api/collections/[id]
 * Update a collection by ID
 * Body: { userEmail, topic?, description? }
 */
export const PUT: RequestHandler = async ({ params, request }) => {
  const db = getDb();

  if (!db) {
    return json({ error: "Database not available" }, { status: 503 });
  }

  const collectionId = params.id;
  if (!collectionId) {
    return json({ error: "Collection ID is required" }, { status: 400 });
  }

  const id = parseInt(collectionId, 10);
  if (isNaN(id)) {
    return json({ error: "Invalid collection ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { userEmail, topic, description } = body;

    if (!userEmail) {
      return json({ error: "userEmail is required" }, { status: 400 });
    }

    // Check if collection exists and belongs to user
    const existing = await db
      .select()
      .from(collections)
      .where(and(eq(collections.id, id), eq(collections.userEmail, userEmail)))
      .limit(1);

    if (existing.length === 0) {
      return json({ error: "Collection not found" }, { status: 404 });
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (topic !== undefined) {
      updateData.topic = topic;
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    const result = await db
      .update(collections)
      .set(updateData)
      .where(eq(collections.id, id))
      .returning();

    return json(result[0]);
  } catch (error) {
    console.error("Error updating collection:", error);
    return json({ error: "Failed to update collection" }, { status: 500 });
  }
};
