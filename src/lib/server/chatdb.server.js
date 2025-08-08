import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'db', 'chat.db');
const dbExists = fs.existsSync(dbPath);

const db = new Database(dbPath);

const users = {
	users: [
		{
			id: 1,
			name: 'ZombieNW',
			image: 'https://zombienw.com/assets/logo.png'
		},
		{
			id: 2,
			name: 'Michael',
			image: 'https://cdn.pixabay.com/photo/2017/08/12/18/31/male-2634974_640.jpg'
		},
		{
			id: 3,
			name: 'Mom',
			image: 'https://cdn.pixabay.com/photo/2015/06/04/12/05/woman-797394_1280.jpg'
		},
		{
			id: 4,
			name: 'Boss',
			image: 'https://cdn.pixabay.com/photo/2019/10/22/13/43/portrait-4568762_1280.jpg'
		},
		{
			id: 5,
			name: 'Neo AI',
			image: 'https://cdn.pixabay.com/photo/2022/07/28/13/53/logo-7349896_1280.png'
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

export function insertMessage(sender, receiver, text, image) {
	const stmt = db.prepare(
		`INSERT INTO messages (sender, receiver, text, image) VALUES (?, ?, ?, ?)`
	);
	stmt.run(sender, receiver, text, image);
}

export function getUsers() {
	return users.users;
}

initializeDatabase();
