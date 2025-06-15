import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';

if (!GEMINI_API_KEY) {
	throw new Error('GEMINI_API_KEY is not defined');
}

const client = new GoogleGenerativeAI(GEMINI_API_KEY);

const modelName = 'gemini-2.0-flash';
const generationConfig = {};

// Settings to control restrictions on generated content
// I've set them all to none because we want to have a little fun, don't we?
const safetySettings = [
	{
		category: HarmCategory.HARM_CATEGORY_HARASSMENT,
		threshold: HarmBlockThreshold.BLOCK_NONE
	},
	{
		category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
		threshold: HarmBlockThreshold.BLOCK_NONE
	},
	{
		category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
		threshold: HarmBlockThreshold.BLOCK_NONE
	},
	{
		category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
		threshold: HarmBlockThreshold.BLOCK_NONE
	}
];

// Generic function to get a response from Gemini
export async function generateResponse(prompt) {
	if (!prompt) {
		throw new Error('Invalid prompt provided.');
	}

	try {
		const model = client.getGenerativeModel({
			model: modelName,
			generationConfig,
			safetySettings
		});

		const result = await model.generateContent(prompt);
		const response = result.response;

		if (
			!response ||
			!response.candidates ||
			response.candidates.length === 0 ||
			!response.candidates[0].content
		) {
			const blockReason = response?.promptFeedback?.blockReason;

			console.warn(`Gemini response blocked. Reason: ${blockReason || 'Unknown'}.`);

			if (blockReason) {
				throw new Error(`Gemini response blocked. Reason: ${blockReason}`);
			} else {
				throw new Error(
					'Content generation failed or was blocked. Please try again or change your prompt.'
				);
			}
		}

		const text = response.text();
		return text;
	} catch (error) {
		console.error('Error calling Gemini API:', error);

		if (error.message && error.message.includes('quota')) {
			throw new Error('Gemini API quota exceeded. Please try again later.');
		}

		throw new Error(`Failed to generate content: ${error.message}`);
	}
}
