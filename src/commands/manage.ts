import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
	type APIChatInputApplicationCommandGuildInteraction,
	type RESTPostAPIApplicationCommandsJSONBody,
} from '@discordjs/core/http-only';
import type { API } from '@discordjs/core/http-only';
import { InteractionOptionResolver } from '@sapphire/discord-utilities';
import type { Env, LinkedAccount } from '../util.js';

export const interaction: RESTPostAPIApplicationCommandsJSONBody = {
	name: 'manage',
	description: 'Used for admin management',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'revoke',
			description: 'Revoke a connection',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'user',
					description: 'User to revoke the connection from',
					type: ApplicationCommandOptionType.User,
					required: true,
				},
			],
		},
		{
			name: 'view',
			description: 'View all connections that exist on the server',
			type: ApplicationCommandOptionType.Subcommand,
			options: [],
		},
	],
	contexts: [InteractionContextType.Guild],
	default_member_permissions: '0',
	integration_types: [ApplicationIntegrationType.GuildInstall],
};

export async function handle(interaction: APIChatInputApplicationCommandGuildInteraction, env: Env, api: API) {
	const options = new InteractionOptionResolver(interaction);

	switch (options.getSubcommand(true)) {
		case 'revoke': {
			const user = options.getUser('user', true);
			const connection = await env.DB.prepare('SELECT * FROM linked_accounts WHERE discord_id = ?')
				.bind(user.id)
				.first<LinkedAccount>();

			if (!connection) {
				return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
					content: 'Connection not found for that user',
				});
			}

			await env.DB.prepare('DELETE FROM linked_accounts WHERE discord_id = ?').bind(user.id).run();

			return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
				content: 'Successfully revoked the connection',
			});
		}

		case 'view': {
			const connections = await env.DB.prepare('SELECT * FROM linked_accounts').all<LinkedAccount>();

			if (!connections.results.length) {
				return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
					content: 'No connections found',
				});
			}

			const users = await Promise.all(connections.results.map(async (conn) => api.users.get(conn.discord_id)));
			const lines = connections.results.map(
				(conn, index) =>
					`${users[index]!.username} (${conn.discord_id}) - ${conn.minecraft_username} (confirmed: ${conn.confirmed ? 'Yes' : 'No'})`,
			);

			return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
				content: "Here's the full list",
				files: [
					{
						name: 'connections.txt',
						data: lines.join('\n'),
					},
				],
			});
		}
	}
}
