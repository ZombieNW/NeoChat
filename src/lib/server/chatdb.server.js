import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'db', 'chat.db');
const dbExists = fs.existsSync(dbPath);

const db = new Database(dbPath);

export const users = {
	users: [
		{
			id: 1,
			name: 'ZombieNW',
			image: '/znwpfp.png'
		},
		{
			id: 2,
			name: 'Michael',
			image: '/michaelpfp.jpg'
		},
		{
			id: 3,
			name: 'Mom',
			image: '/mompfp.jpg'
		},
		{
			id: 4,
			name: 'Boss',
			image: '/bosspfp.jpg'
		},
		{
			id: 5,
			name: 'Neo',
			image: '/neopfp.png'
		}
	]
};

export function initializeDatabase() {
	console.log('Initializing database...');

	if (!db) return;

	const createTableStatement = db.prepare(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT NOT NULL,
            receiver TEXT NOT NULL,
            text TEXT NOT NULL,
            image TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

	createTableStatement.run();
	console.log('Database initialized.');
}

export function getAllMessages() {
	return db.prepare(`SELECT * FROM messages ORDER BY timestamp ASC`).all();
}

export function getMessagesSinceId(id) {
	return db.prepare(`SELECT * FROM messages WHERE id > ? ORDER BY timestamp ASC`).all(id);
}

export function insertMessage(sender, receiver, text, image) {
	const stmt = db.prepare(
		`INSERT INTO messages (sender, receiver, text, image) VALUES (?, ?, ?, ?)`
	);
	stmt.run(sender, receiver, text, image);
}

export function getUserById(id) {
	return users.users.find((user) => user.id == id);
}

export function lastNBetween(n, userA, userB) {
	const messages = db
		.prepare(
			`SELECT * FROM messages WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?) ORDER BY timestamp DESC LIMIT ?`
		)
		.all(
			JSON.stringify(userA),
			JSON.stringify(userB),
			JSON.stringify(userB),
			JSON.stringify(userA),
			n
		);
	return messages;
}

export function getMessagesFromNeoBetweenMessages(messageA, messageB) {
	const neoId = users.users[4].id;
	const messages = db
		.prepare(
			`SELECT * FROM messages WHERE sender = ? AND timestamp > ? AND timestamp < ? ORDER BY timestamp ASC`
		)
		.all(neoId, messageA.timestamp, messageB.timestamp);
	return messages;
}

export function lastNtoReferenceUser(n, user) {
	const messages = db
		.prepare(
			`SELECT * FROM messages WHERE sender = ? OR receiver = ? ORDER BY timestamp DESC LIMIT ?`
		)
		.all(JSON.stringify(user), JSON.stringify(user), n);
	return messages;
}

export function getUsers() {
	return users.users;
}

initializeDatabase();
