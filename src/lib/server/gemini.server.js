import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '$env/static/private';

// Initialize with the API key
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function generateResponse({ system, thread, userContext, tools = [] }) {
	if (!system || !thread?.length) throw new Error('System Prompt & Thread Messages are Required');

	// Build contents history
	const contents = [
		{
			role: 'user',
			parts: [{ text: `[ARCHIVAL LOGS FOR REFERENCE]:\n${userContext}` }]
		},
		{
			role: 'model',
			parts: [{ text: 'Acknowledged. I have reviewed the logs and am standing by.' }]
		},
		...thread.map((msg) => ({
			role: msg.role === 'assistant' ? 'model' : 'user',
			parts: [{ text: msg.content }]
		}))
	];

	try {
		const result = await ai.models.generateContent({
			model: GEMINI_MODEL,
			contents: contents,
			// tools and safetySettings are TOP-LEVEL siblings to 'model' and 'contents'
			tools: tools.length > 0 ? tools : undefined,
			safetySettings: [
				{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
				{ category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
				{ category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
				{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
			],
			config: {
				systemInstruction: system, // systemInstruction goes inside config in the JS SDK
				temperature: 0.9,
				topP: 0.9
			}
		});

		// In the Unified SDK, text and functionCalls are direct properties of the result
		return {
			text: result.text || '',
			functionCalls: result.functionCalls || null
		};
	} catch (error) {
		// Log the actual cause if fetch failed
		console.error('SDK Error Cause:', error.cause || error);
		handleApiError(error);
	}
}

function handleApiError(error) {
	if (error.message?.toLowerCase().includes('quota')) {
		throw new Error('Gemini API quota exceeded.');
	}

	throw error;
}
