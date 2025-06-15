import { json } from '@sveltejs/kit';
import { generateContent } from '$lib/server/gemini.server';

export async function POST({ request }) {
	try {
		const body = await request.json();
		const prompt = body.prompt;

		if (!prompt || prompt.trim().length === 0) {
			return json({ error: 'Prompt is required or invalid.' }, { status: 400 });
		}

		const answer = await generateContent(prompt);
		return json({ answer });
	} catch (error) {
		if (error instanceof SyntaxError) {
			return json({ error: 'Invalid JSON in request body.' }, { status: 400 });
		}

		console.error('Error in /api/generate endpoint:', error);

		if (error.message?.includes('quota')) {
			return json({ error: error.message }, { status: 429 });
		} else if (error.message?.includes('blocked due to safety')) {
			return json({ error: error.message }, { status: 400 });
		}

		return json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
	}
}
