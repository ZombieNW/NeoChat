import db from '$lib/server/chatdb.server.js';
import {
	getAllMessages,
	insertMessage,
	getMessagesSinceId,
	getUserById
} from '$lib/server/chatdb.server.js';
import { message as neoAIMessage } from '$lib/server/neoai.server.js';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	try {
		const since = url.searchParams.get('since');

		let messages;

		if (since !== null && since !== undefined && since !== '' && since !== 'null') {
			// Get all messages since the specified ID
			messages = await getMessagesSinceId(since);
		} else {
			messages = await getAllMessages();
		}

		return new Response(JSON.stringify(messages), {
			headers: { 'Content-Type': 'application/json' }
		});
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

		// Insert user message
		await insertMessage(JSON.stringify(sender), JSON.stringify(receiver), text, image);

		// Handle AI Message
		if (receiver.id === 5) {
			// Add to database
			let response = await neoAIMessage(sender, text, image);

			console.log(sender);
			let receivedAction = await decipherAgentAction(response, sender);

			response = response.replace(/(.*)\{([^}]*)\}/g, '$1');

			await insertMessage(JSON.stringify(receiver), JSON.stringify(sender), response, null); // Swap sender and receiver for chatbot
		}

		return new Response(JSON.stringify({ success: true }));
	} catch (error) {
		console.error('Error inserting message:', error);
		return new Response(JSON.stringify({ error: 'Failed to insert message.' }), { status: 500 });
	}
}

async function decipherAgentAction(response, sender) {
	try {
		const actions = safeParseActions(response);

		if (actions.length === 0) return false;

		const action = actions[0];
		if (action?.action === 'message') {
			// Add to database
			const user = getUserById(action?.to);
			await insertMessage(JSON.stringify(sender), JSON.stringify(user), action?.content, null);
			return action;
		}

		return false;
	} catch (error) {
		console.log('Action parse error: ', error);
		return false;
	}
}

function safeParseActions(response) {
	const regex = /{[\s\S]*?}/g; // non-greedy, match each object
	const matches = response.match(regex);
	if (!matches) return [];

	return matches
		.map((raw) => {
			try {
				// Convert single quotes → double quotes
				raw = raw.replace(/'/g, '"');
				// Fix unquoted keys → "key":
				raw = raw.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
				return JSON.parse(raw);
			} catch (err) {
				console.error('Action parse error:', err.message, '\nRaw:', raw);
				return null;
			}
		})
		.filter(Boolean); // remove nulls
}
