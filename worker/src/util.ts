import { pino } from 'pino';

export interface Env {
	AUTH_PASS: string;
	CLIENT_ID: string;
	DB: D1Database;
	DISCORD_TOKEN: string;
	PUBLIC_KEY: string;
}

export const logger = pino({ level: 'debug' });

export interface LinkedAccount {
	bedrock_confirmed: boolean;
	bedrock_username: string | null;
	discord_id: string;
	id: number;
	java_confirmed: boolean;
	java_username: string | null;
}

export interface LinkedSibling {
	discord_id: string;
	id: number;
	sibling_username: string;
}
