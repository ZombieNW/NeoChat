import { generateResponse } from '$lib/server/gemini.server.js';
import { insertMessage } from './chatdb.server';

export async function message(chatHistory, user, text, image) {
	user = JSON.parse(user);
	const recentInteractions = await summarizeRecentInteractions(chatHistory, user);
	console.log('Recent Interactions Summary:', recentInteractions);

	const prompt = `You are Neo, an advanced AI assistant designed to help users with their inquiries.
        To help give context to what's going on in the user's life, here are some of their recent interactions with others:
        ${recentInteractions}

        This information is provided to help you understand the user's current situation better, responses don't necessarily need to use or reference this information unless relevant.

        Provide a thoughtful and relevant response to the following message:
        ${text}`;
	const responseText = await generateResponse(prompt);

	insertMessage(
		JSON.stringify({
			id: 5,
			name: 'Neo AI',
			image: 'https://cdn.pixabay.com/photo/2022/07/28/13/53/logo-7349896_1280.png'
		}),
		JSON.stringify(user),
		responseText,
		null
	);

	return responseText;
}

async function summarizeRecentInteractions(chatHistory, user) {
	const userMessageHistory = processChatDictionary(chatHistory, user);

	let userSummaryDictionary = {};
	for (const [contact, messages] of Object.entries(userMessageHistory)) {
		userSummaryDictionary[contact] = await processChatSummary(contact, user, messages);
	}

	const response =
		'Here are the summaries of recent interactions:\n' +
		Object.entries(userSummaryDictionary)
			.map(([contact, summary]) => `Conversation with ${contact}:\n${summary}`)
			.join('\n\n');
	return response;
}

async function processChatSummary(contact, user, messages) {
	return await generateResponse(
		`Summarize ${user.name}'s following conversation with ${contact} in a concise manner:\n\n${messages.join('\n')}`
	);
}

function processChatDictionary(chatHistory, user) {
	const messageDict = {};
	for (const message of chatHistory) {
		const sender = JSON.parse(message.sender);
		const receiver = JSON.parse(message.receiver);

		if (sender.id === user.id) {
			// messages sent by the user
			messageDict[receiver.name] = [
				...(messageDict[receiver.name] || []),
				`${sender.name}: ${message.text}`
			];
		} else if (receiver.id === user.id) {
			// messages received by the user
			messageDict[sender.name] = [
				...(messageDict[sender.name] || []),
				`${sender.name}: ${message.text}`
			];
		}
	}
	return messageDict;
}
