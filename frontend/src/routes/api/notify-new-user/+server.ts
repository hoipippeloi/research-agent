import { json, type RequestHandler } from '@sveltejs/kit';

interface RequestBody {
	newUserEmail: string;
}

const NOTIFUSE_API_URL = 'https://hoi-email.up.railway.app';
const NOTIFUSE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNWFmMWY3M2UtNWJjZC00NmI2LTllZmQtYjA0YTBlOTYxNmU3IiwidHlwZSI6ImFwaV9rZXkiLCJlbWFpbCI6InJlc2VhcmNoQGhvaS1lbWFpbC51cC5yYWlsd2F5LmFwcCIsImV4cCI6MjA4ODEwNjI4MiwibmJmIjoxNzcyNzQ2MjgyLCJpYXQiOjE3NzI3NDYyODJ9.DquT1QAZ1luSi0wKEpzPLdv15G6xP0jK8eW05MDu8ko';
const NOTIFUSE_WORKSPACE_ID = 'hoi';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { newUserEmail } = (await request.json()) as RequestBody;

		if (!newUserEmail) {
			return json({ error: 'newUserEmail is required' }, { status: 400 });
		}

		const response = await fetch(`${NOTIFUSE_API_URL}/api/transactional.send`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${NOTIFUSE_API_KEY}`
			},
			body: JSON.stringify({
				workspace_id: NOTIFUSE_WORKSPACE_ID,
				notification: {
					id: 'new-user-research-agent',
					channels: ['email'],
					contact: {
						email: 'patrick@hoipippeloi.nl'
					},
					data: {
						new_user_email: newUserEmail,
						timestamp: new Date().toISOString()
					}
				}
			})
		});

		if (!response.ok) {
			console.error('Notifuse API error:', response.status);
			return json({ success: false }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error sending notification:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
