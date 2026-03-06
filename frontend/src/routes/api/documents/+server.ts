import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/db';
import { savedResults } from '$lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/documents?userEmail=email
 * List all documents (saved_results with type='document') for a user
 */
export const GET: RequestHandler = async ({ url }) => {
	const db = getDb();

	if (!db) {
		return json({ error: 'Database not available' }, { status: 503 });
	}

	try {
		const userEmail = url.searchParams.get('userEmail');

		if (!userEmail) {
			return json({ error: 'userEmail is required' }, { status: 400 });
		}

		const documents = await db.select()
			.from(savedResults)
			.where(and(
				eq(savedResults.userEmail, userEmail),
				eq(savedResults.type, 'document')
			))
			.orderBy(desc(savedResults.createdAt));

		return json(documents);
	} catch (error) {
		console.error('Error fetching documents:', error);
		return json({ error: 'Failed to fetch documents' }, { status: 500 });
	}
};

/**
 * POST /api/documents
 * Create a new document (saved_result with type='document')
 */
export const POST: RequestHandler = async ({ request }) => {
	const db = getDb();

	if (!db) {
		return json({ error: 'Database not available' }, { status: 503 });
	}

	try {
		const body = await request.json();
		const { title, content, userEmail, collectionId, tags } = body;

		if (!title || !content || !userEmail) {
			return json({ error: 'Missing required fields: title, content, userEmail' }, { status: 400 });
		}

		const now = new Date();

		// Generate a unique URL for the document (using a document-specific prefix)
		const documentUrl = `document://${Date.now()}-${Math.random().toString(36).substring(7)}`;

		const result = await db.insert(savedResults).values({
			userEmail,
			url: documentUrl,
			title,
			content,
			type: 'document',
			collectionId: collectionId || null,
			tags: tags || [],
			createdAt: now,
			updatedAt: now,
		}).returning();

		return json({ success: true, document: result[0] });
	} catch (error) {
		console.error('Error creating document:', error);
		return json({ error: 'Failed to create document' }, { status: 500 });
	}
};
