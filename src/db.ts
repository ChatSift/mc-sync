import postgres from 'postgres';
import { ENV, logger } from './util.js';

export const sql = postgres(ENV.DATABASE_URL, {
	debug(_, query, parameters, paramTypes) {
		logger.debug({ query, parameters, paramTypes }, 'executed query');
	},
});

export interface LinkedAccounts {
	confirmed: boolean;
	discord_id: string;
	id: string;
	minecraft_username: string;
}
