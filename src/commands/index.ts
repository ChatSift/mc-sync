import type { API } from '@discordjs/core/http-only';
import type { RESTPostAPIApplicationCommandsJSONBody } from '@discordjs/core/http-only';
import type { Env } from '../util.js';
import * as manage from './manage.js';
import * as setup from './setup.js';

interface Command {
	handle(interaction: any, env: Env, api: API): Promise<unknown>;
	interaction: RESTPostAPIApplicationCommandsJSONBody;
}

export const commands: Record<string, Command> = {
	manage,
	setup,
};
