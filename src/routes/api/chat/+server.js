import {
	getAllMessages,
	getMessagesSinceId,
	insertMessage,
	getUserById
} from '$lib/server/chatdb.server.js';

import { getUserById } from '$lib/server/chatdb.server.js';
import { message as neoAIMessage } from '$lib/server/neoai.server.js';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	try {
		const since = url.searchParams.get('since');

		const messages =
			since && since !== 'null' ? await getMessagesSinceId(since) : await getAllMessages();

		return json(messages);
	} catch (error) {
		console.error('Error fetching messages:', error);
		return json({ error: 'Failed to fetch messages.' }, { status: 500 });
	}
}

export async function POST({ request }) {
	try {
		const { sender, receiver, text, image } = await request.json();

		if (!sender || !receiver) {
			throw new Error('Sender and receiver are required.');
		}

		if (!text?.trim()) {
			throw new Error('Message text cannot be empty.');
		}

		// Store user message
		await insertMessage(JSON.stringify(sender), JSON.stringify(receiver), text, image);

		// Handle AI response
		if (receiver.id === 5) {
			await handleAIResponse(sender, receiver, text, image);
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error inserting message:', error);
		return json({ error: 'Failed to insert message.' }, { status: 500 });
	}
}

// ====================
// AI Stuff
// ====================

async function handleAIResponse(sender, receiver, text, image) {
	let response = await neoAIMessage(sender, text, image);

	await decipherAgentAction(response); // Execute agent actions

	response = stripActionBlocks(response); // Remove actions from Message

	await insertMessage(JSON.stringify(receiver), JSON.stringify(sender), response, null); // Store AI message
}

async function decipherAgentAction(response) {
	try {
		const actions = safeParseActions(response);

		console.log(response);
		if (!actions.length) return false;

		const action = actions[0];

		console.log('Action Detected');

		if (action?.action === 'message') {
			const user = await getUserById(action.to);

			await insertMessage(
				JSON.stringify(getUserById(5)),
				JSON.stringify(user),
				action.content,
				null
			);

			console.log('Message sent from AI to ' + user.name + " that says '" + action.content + "'");

			return action;
		}

		return false;
	} catch (error) {
		console.error('Action parse error:', error);
		return false;
	}
}

// ====================
// Helper Functions
// ====================

function stripActionBlocks(text) {
	return text.replace(/(.*)\{([^}]*)\}/g, '$1');
}

function safeParseActions(response) {
	const matches = response.match(/{[\s\S]*?}/g);
	if (!matches) return [];

	return matches
		.map((raw) => {
			try {
				const normalized = raw
					.replace(/'/g, '"')
					.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

				return JSON.parse(normalized);
			} catch (error) {
				console.error('Action parse error:', error.message, '\nRaw:', raw);
				return null;
			}
		})
		.filter(Boolean); // Remove nulls
}
