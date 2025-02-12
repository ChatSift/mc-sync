import type { API, APIModalSubmitGuildInteraction } from '@discordjs/core/http-only';
import { InteractionResponseType, MessageFlags } from '@discordjs/core/http-only';
import type { IRequest } from 'itty-router';
import { JsonResponse } from '../response.js';
import { logger, type Env, type LinkedAccount } from '../util.js';

export async function handle(
	_: IRequest,
	ctx: ExecutionContext,
	env: Env,
	interaction: APIModalSubmitGuildInteraction,
	api: API,
): Promise<JsonResponse> {
	const response = new JsonResponse({
		type: InteractionResponseType.DeferredChannelMessageWithSource,
		data: {
			flags: MessageFlags.Ephemeral,
		},
	});

	ctx.waitUntil(handleSubmit(interaction, env, api));
	return response;
}

async function handleSubmit(interaction: APIModalSubmitGuildInteraction, env: Env, api: API) {
	const username = interaction.data.components[0]!.components[0]!.value;

	const existing = await env.DB.prepare('SELECT * FROM linked_accounts WHERE discord_id = ?')
		.bind(interaction.member.user.id)
		.first<LinkedAccount>();

	logger.debug({ existing }, 'existing linked account based on discord id');

	if (existing?.confirmed) {
		return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
			content:
				'You have already linked your account! If you wish to link a different Minecraft account, please contact the staff team.',
			flags: MessageFlags.Ephemeral,
		});
	}

	const existingMc = await env.DB.prepare('SELECT * FROM linked_accounts WHERE minecraft_username = ?')
		.bind(username)
		.first<LinkedAccount>();

	logger.debug({ existingMc }, 'existing linked account based on minecraft username');

	if (existingMc?.confirmed) {
		return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
			content:
				'This Minecraft account is already linked to a Discord account! If you believe this is a mistake, please contact the staff team.',
			flags: MessageFlags.Ephemeral,
		});
	}

	const data: Omit<LinkedAccount, 'id'> = {
		confirmed: false,
		discord_id: interaction.member.user.id,
		minecraft_username: username,
	};

	await env.DB.prepare(
		'INSERT INTO linked_accounts (confirmed, discord_id, minecraft_username) VALUES ($1, $2, $3) ON CONFLICT (discord_id) DO UPDATE SET minecraft_username = $3',
	)
		.bind(data.confirmed, data.discord_id, data.minecraft_username)
		.run();

	return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
		content: `Your submission has been received! Please join the server and use \`/verify-discord ${interaction.member.user.id}\`. If you used the wrong username, please resubmit first.`,
		flags: MessageFlags.Ephemeral,
	});
}
