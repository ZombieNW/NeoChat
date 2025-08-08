import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST({ request }) {
	const data = await request.formData();
	const file = data.get('file');

	if (!file) {
		return new Response(JSON.stringify({ error: 'No file uploaded.' }), { status: 400 });
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const fileName = `${Date.now()}-${file.name}`;
	const path = join(process.cwd(), 'static', 'uploads', fileName);

	await writeFile(path, buffer);

	return new Response(JSON.stringify({ path: `/uploads/${filename}` }), {
		headers: { 'Content-Type': 'application/json' }
	});
}
