import db from '$lib/server/chatdb.server.js';
import { getAllMessages, insertMessage } from '$lib/server/chatdb.server.js';
import { message as neoAIMessage } from '$lib/server/neoai.server.js';
import { json } from '@sveltejs/kit';

export async function GET() {
	try {
		const rows = getAllMessages();
		return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
	} catch (error) {
		console.error('Error fetching messages:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch messages.' }), { status: 500 });
	}
}

export async function POST({ request }) {
	try {
		const { sender, receiver, text, image } = await request.json();
		if (!sender || !receiver) {
			throw new Error('Sender and receiver are required.');
		}
		if (!text || text.trim() === '') {
			throw new Error('Message text cannot be empty.');
		}
		if (JSON.parse(receiver).id === 5) {
			const rows = getAllMessages();
			neoAIMessage(rows, sender, text, image);
		}
		insertMessage(sender, receiver, text, image);
		return new Response(JSON.stringify({ success: true }));
	} catch (error) {
		console.error('Error inserting message:', error);
		return new Response(JSON.stringify({ error: 'Failed to insert message.' }), { status: 500 });
	}
}
