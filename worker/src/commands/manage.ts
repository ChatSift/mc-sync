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
import type { LinkedSibling } from '../util.js';
import { type Env, type LinkedAccount } from '../util.js';

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
			await env.DB.prepare('DELETE FROM linked_siblings WHERE discord_id = ?').bind(user.id).run();

			return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
				content: 'Successfully revoked the connection',
			});
		}

		case 'view': {
			const { results: connectionsRaw } = await env.DB.prepare('SELECT * FROM linked_accounts').all<LinkedAccount>();
			const { results: siblingConnections } = await env.DB.prepare(
				'SELECT * FROM linked_siblings',
			).all<LinkedSibling>();

			const connections = connectionsRaw.map((connection) => {
				const siblings = siblingConnections
					.filter((sibling) => sibling.discord_id === connection.discord_id)
					.map((sibling) => sibling.sibling_username);

				return {
					...connection,
					siblings,
				};
			});

			if (!connections.length) {
				return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
					content: 'No connections found',
				});
			}

			const users = await Promise.all(connections.map(async (conn) => api.users.get(conn.discord_id)));

			const lines: string[] = [];
			for (const [index, conn] of connections.entries()) {
				const user = users[index]!;
				lines.push(`${user.username} (${user.id}):`);
				lines.push(`  Java: ${conn.java_username} (confirmed: ${conn.java_confirmed ? 'Yes' : 'No'})`);
				lines.push(`  Bedrock: ${conn.bedrock_username} (confirmed: ${conn.bedrock_confirmed ? 'Yes' : 'No'})`);

				lines.push('  Added siblings:');
				for (const sibling of conn.siblings) {
					lines.push(`    - ${sibling}`);
				}

				// for extra newline on join
				lines.push('');
			}

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
