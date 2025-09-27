import { generateResponse } from '$lib/server/gemini.server.js';
import { insertMessage, lastNtoReferenceUser } from './chatdb.server';

export async function message(user, text, image) {
	// Get recent interactions
	const messageLog = await generateRelevantMessageLog(user);

	// Generate response
	const prompt = `You are Neo, an advanced AI assistant designed to help users with their inquiries.
        To help give context to what's going on in the user's life, here are some of their recent interactions with others:
        ${messageLog}

        This information is provided to help you understand the user's current situation better, responses don't necessarily need to use or reference this information unless relevant.
        Do NOT use markdown in your response, instead use plain text. Feel free to use linebreaks and short sentences to keep it easy to read.
        Keep your messages short and to the point.

        Provide a thoughtful and relevant response to the following message:
        ${text}`;
	const responseText = await generateResponse(prompt);

	return responseText;
}

// Generate relevant message log
async function generateRelevantMessageLog(user) {
	const relevantMessages = await lastNtoReferenceUser(100, user);
	const messageDictionary = {};
	for (const message of relevantMessages) {
		const sender = JSON.parse(message.sender);
		const receiver = JSON.parse(message.receiver);
		const contactName = sender.id === user.id ? receiver.name : sender.name;
		if (!messageDictionary[contactName]) {
			messageDictionary[contactName] = [];
		}
		messageDictionary[contactName].push(
			sender.name + ' to ' + receiver.name + ': ' + message.text.replace(/\n/g, '\\n')
		);
	}

	// Reverse messages to more closely resemble a conversation
	for (const [contact, messages] of Object.entries(messageDictionary)) {
		messageDictionary[contact] = messages.reverse();
	}

	const longMessage = Object.entries(messageDictionary)
		.map(([contact, messages]) => `${contact} Messages:\n\n${messages.join('\n')}`)
		.join('\n\n\n');

	return longMessage;
}
