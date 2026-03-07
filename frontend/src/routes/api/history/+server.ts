import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb, searches } from "$lib/db";
import { desc, eq, and } from "drizzle-orm";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const db = getDb();
    const userEmail = url.searchParams.get("userEmail");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    if (!userEmail) {
      return json({ error: "userEmail is required" }, { status: 400 });
    }

    const searchHistory = await db
      .select()
      .from(searches)
      .where(eq(searches.userEmail, userEmail))
      .orderBy(desc(searches.createdAt))
      .limit(limit);

    // Transform to match the expected format
    const formattedHistory = searchHistory.map((search) => ({
      id: search.id.toString(),
      userEmail: search.userEmail,
      query: search.query,
      timestamp: search.createdAt
        ? new Date(search.createdAt).getTime()
        : Date.now(),
      engine: search.engine,
      resultsCount: search.resultsCount || 0,
    }));

    return json(formattedHistory);
  } catch (error) {
    console.error("Error fetching search history:", error);
    return json({ error: "Failed to fetch search history" }, { status: 500 });
  }
};

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

    // Delete the search from PostgreSQL
    const result = await db
      .delete(searches)
      .where(and(eq(searches.id, numericId), eq(searches.userEmail, userEmail)))
      .returning();

    if (result.length === 0) {
      return json({ error: "Search not found" }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    console.error("Error deleting search history:", error);
    return json({ error: "Failed to delete search history" }, { status: 500 });
  }
};
