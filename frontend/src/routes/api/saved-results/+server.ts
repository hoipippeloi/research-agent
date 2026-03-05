import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/db';
import { savedResults } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, url }) => {
	const db = getDb();
	
	if (!db) {
		return json({ error: 'Database not available' }, { status: 503 });
	}
	
	try {
		const body = await request.json();
		const markdown = body.markdown;
		const title = body.title;
		const collectionId = body.collectionId;
		const sourceUrl = body.url;
		const userEmail = body.userEmail;
		
		if (!markdown || !collectionId || !sourceUrl || !userEmail) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}
		
		const now = new Date();
		
		const existingResult = await db.select()
			.from(savedResults)
			.where(and(
				eq(savedResults.url, sourceUrl),
				eq(savedResults.userEmail, userEmail)
			))
			.limit(1);
		
		if (existingResult.length > 0) {
			const result = await db.update(savedResults)
				.set({
					content: markdown,
					title: title || existingResult[0].title,
					collectionId: collectionId,
					updatedAt: now,
				})
				.where(eq(savedResults.id, existingResult[0].id))
				.returning();
			
			return json({ success: true, result: result[0] });
		}
		
		const result = await db.insert(savedResults).values({
			userEmail: userEmail,
			url: sourceUrl,
			title: title || new URL(sourceUrl).hostname,
			content: markdown,
			collectionId: collectionId,
			createdAt: now,
			updatedAt: now,
	 }).returning();
		
		return json({ success: true, result: result[0] });
	} catch (error) {
		console.error('Error saving markdown:', error);
		return json({ error: 'Failed to save markdown' }, { status: 500 });
	}
}
