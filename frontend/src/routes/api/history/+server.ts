import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getRecentSearches, deleteSearch } from "$lib/redis-client";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const userEmail = url.searchParams.get("userEmail");
    const limit = parseInt(url.searchParams.get("limit") || "6");

    if (!userEmail) {
      return json({ error: "userEmail is required" }, { status: 400 });
    }

    const searches = await getRecentSearches(userEmail, limit);
    return json(searches);
  } catch (error) {
    console.error("Error fetching search history:", error);
    return json({ error: "Failed to fetch search history" }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ url }) => {
  try {
    const id = url.searchParams.get("id");
    const userEmail = url.searchParams.get("userEmail");

    if (!id) {
      return json({ error: "ID is required" }, { status: 400 });
    }

    if (!userEmail) {
      return json({ error: "userEmail is required" }, { status: 400 });
    }

    await deleteSearch(userEmail, id);
    return json({ success: true });
  } catch (error) {
    console.error("Error deleting search history:", error);
    return json({ error: "Failed to delete search history" }, { status: 500 });
  }
};
