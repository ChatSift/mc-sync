import { pino } from 'pino';

export interface Env {
	AUTH_PASS: string;
	CLIENT_ID: string;
	DATABASE_URL: string;
	DB: D1Database;
	DISCORD_TOKEN: string;
	PUBLIC_KEY: string;
}

export const logger = pino({ level: 'debug' });

export interface LinkedAccount {
	confirmed: boolean;
	discord_id: string;
	id: number;
	minecraft_username: string;
}
