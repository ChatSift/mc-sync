import { API } from '@discordjs/core';
import { REST } from '@discordjs/rest';
import { pino } from 'pino';
import { z } from 'zod';

const schema = z.object({
	DISCORD_TOKEN: z.string(),
	NDOE_ENV: z.enum(['development', 'production']).default('production'),
	DATABASE_URL: z.string(),
	PUBLIC_KEY: z.string(),
	CLIENT_ID: z.string(),
	REGISTER_PASS: z.string(),
});

export const ENV = schema.parse(process.env);

const rest = new REST({ version: '10' }).setToken(ENV.DISCORD_TOKEN);
export const api = new API(rest);

export const logger = pino({ level: 'debug' });
