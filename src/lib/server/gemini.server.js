import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '$env/static/private';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODEL_NAME = GEMINI_MODEL;

export async function generateResponse({ system, thread, userContext, tools = [] }) {
	if (!system || !thread?.length) throw new Error('System Prompt & Thread Messages are Required');

	const contents = [
		{
			role: 'user',
			parts: [{ text: `[ARCHIVAL LOGS FOR REFERENCE]:\n${userContext}` }]
		},
		{
			role: 'model',
			parts: [
				{ text: 'Acknowledged. I have reviewed the logs and am standing by for instructions.' }
			]
		},
		...thread.map((msg) => ({
			role: msg.role === 'assistant' ? 'model' : msg.role,
			parts: [{ text: msg.content }]
		}))
	];

	try {
		const result = await ai.models.generateContent({
			model: MODEL_NAME,
			contents,
			config: {
				temperature: 0.9,
				topP: 0.9,
				systemInstruction: system,
				tools,
				safetySettings: [
					{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
					{ category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
					{ category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
					{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
				]
			}
		});

		console.log(JSON.stringify(result));

		console.log('Finish Reason:', result.candidates[0].finishReason);
		console.log('Safety Ratings:', JSON.stringify(result.candidates[0].safetyRatings));

		if (result.candidates[0].finishReason === 'SAFETY') {
			console.error('The model refused to call the tool due to internal safety triggers.');
		}

		return {
			text: result.text || '',
			functionCalls: result.functionCalls || null
		};
	} catch (error) {
		handleApiError(error);
	}
}

function handleApiError(error) {
	if (error.message?.toLowerCase().includes('quota')) {
		throw new Error('Gemini API quota exceeded.');
	}

	throw error;
}
