import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
	type APIChatInputApplicationCommandGuildInteraction,
	type RESTPostAPIApplicationCommandsJSONBody,
} from '@discordjs/core';

export const interaction: RESTPostAPIApplicationCommandsJSONBody = {
	name: 'setup',
	description: 'Used for bot setup',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'webhook',
			description: 'Sets up the webhook used for prompting in the current channel',
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: 'prompt',
			description: 'Message URL to the prompt (message must belong to bot webhook)',
			type: ApplicationCommandOptionType.Subcommand,
		},
	],
	contexts: [InteractionContextType.Guild],
	default_member_permissions: '0',
	integration_types: [ApplicationIntegrationType.GuildInstall],
};

export async function handle(interaction: APIChatInputApplicationCommandGuildInteraction) {
	switch (interaction.data.name) {
		case 'webhook': {
			break;
		}

		case 'prompt': {
			break;
		}
	}
}
