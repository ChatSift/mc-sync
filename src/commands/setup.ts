import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ApplicationIntegrationType,
	ButtonStyle,
	ComponentType,
	InteractionContextType,
	PermissionFlagsBits,
	type APIChatInputApplicationCommandGuildInteraction,
	type RESTPostAPIApplicationCommandsJSONBody,
} from '@discordjs/core';
import { InteractionOptionResolver } from '@sapphire/discord-utilities';
import { PermissionsBitField } from '../permissions.js';
import { api, ENV, logger } from '../util.js';

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
			options: [
				{
					name: 'message',
					description: 'URL to the message to prompt',
					type: ApplicationCommandOptionType.String,
					required: true,
				},
			],
		},
	],
	contexts: [InteractionContextType.Guild],
	default_member_permissions: '0',
	integration_types: [ApplicationIntegrationType.GuildInstall],
};

export async function handle(interaction: APIChatInputApplicationCommandGuildInteraction) {
	if (!PermissionsBitField.has(BigInt(interaction.app_permissions), PermissionFlagsBits.ManageWebhooks)) {
		return api.interactions.editReply(ENV.CLIENT_ID, interaction.token, {
			content: 'The bot does not have the required permissions to set up the webhook.',
		});
	}

	const options = new InteractionOptionResolver(interaction);

	switch (options.getSubcommand(true)) {
		case 'webhook': {
			const webhooks = await api.channels.getWebhooks(interaction.channel.id);
			const webhook = webhooks.find((webhook) => webhook.user!.id === ENV.CLIENT_ID);
			if (webhook) {
				logger.debug('found existing webhook');
				const fullWebhook = await api.webhooks.get(webhook.id);
				return api.interactions.editReply(ENV.CLIENT_ID, interaction.token, {
					content: `Here's the webhook url: https://discord.com/api/webhooks/${fullWebhook.id}/${fullWebhook.token!}`,
				});
			}

			logger.debug('creating webhook');
			const newWebhook = await api.channels.createWebhook(interaction.channel.id, {
				name: 'Prompt',
			});

			return api.interactions.editReply(ENV.CLIENT_ID, interaction.token, {
				content: `Here's the webhook url: https://discord.com/api/webhooks/${newWebhook.id}/${newWebhook.token!}`,
			});
		}

		case 'prompt': {
			const messageURL = options.getString('message', true);
			const [channelId, messageId] = messageURL.split('/').slice(-2) as [string, string];
			if (!channelId || !messageId) {
				return api.interactions.editReply(ENV.CLIENT_ID, interaction.token, {
					content: 'Invalid message URL',
				});
			}

			const message = await api.channels.getMessage(channelId, messageId).catch(() => null);
			if (!message) {
				return api.interactions.editReply(ENV.CLIENT_ID, interaction.token, {
					content: 'Message not found',
				});
			}

			const webhook = message.webhook_id ? await api.webhooks.get(message.webhook_id).catch(() => null) : null;
			if (!webhook || webhook.user!.id !== ENV.CLIENT_ID) {
				return api.interactions.editReply(ENV.CLIENT_ID, interaction.token, {
					content: 'Message does not belong to bot webhook',
				});
			}

			await api.webhooks.editMessage(webhook.id, webhook.token!, messageId, {
				components: [
					{
						type: ComponentType.ActionRow,
						components: [
							{
								type: ComponentType.Button,
								style: ButtonStyle.Primary,
								label: 'Link my account',
								custom_id: 'link',
							},
						],
					},
				],
			});
			await api.interactions.editReply(ENV.CLIENT_ID, interaction.token, {
				content: 'Prompt added to the message',
			});

			break;
		}
	}
}
