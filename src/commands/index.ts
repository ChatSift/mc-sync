import type { RESTPostAPIApplicationCommandsJSONBody } from '@discordjs/core';
import * as setup from './setup.js';

interface Command {
	handle(interaction: any): Promise<void>;
	interaction: RESTPostAPIApplicationCommandsJSONBody;
}

export const commands: Record<string, Command> = {
	setup,
};
