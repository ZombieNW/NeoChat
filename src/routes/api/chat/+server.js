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

	handleAgentActions(response.functionCalls);

	await insertMessage(JSON.stringify(receiver), JSON.stringify(sender), response.text, null); // Store AI message
}

async function handleAgentActions(functionCalls) {
	for (const call of functionCalls) {
		const recipient = await getUserById(parseInt(call.args.to));
		const agent = await getUserById(5);
		await insertMessage(JSON.stringify(agent), JSON.stringify(recipient), call.args.content, null); // Store agent message
	}
}
