import { getUsers } from '$lib/server/chatdb.server.js';

export async function GET() {
	try {
		const users = getUsers();
		return new Response(JSON.stringify(users), { headers: { 'Content-Type': 'application/json' } });
	} catch (error) {
		console.error('Error fetching users:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch messages.' }), { status: 500 });
	}
}
