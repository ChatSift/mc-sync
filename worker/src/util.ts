import { pino } from 'pino';

export interface Env {
	CLIENT_ID: string;
	DATABASE_URL: string;
	DB: D1Database;
	DISCORD_TOKEN: string;
	NDOE_ENV: 'development' | 'production';
	PUBLIC_KEY: string;
	REGISTER_PASS: string;
}

export const logger = pino({ level: 'debug' });

export interface LinkedAccount {
	confirmed: boolean;
	discord_id: string;
	id: number;
	minecraft_username: string;
}
