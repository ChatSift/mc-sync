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
	const javaUsername = interaction.data.components[0]!.components[0]!.value;
	const bedrockUsername = interaction.data.components[1]!.components[0]!.value;

	if (!javaUsername && !bedrockUsername) {
		return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
			content: 'You must provide at least one username!',
			flags: MessageFlags.Ephemeral,
		});
	}

	const existing = await env.DB.prepare('SELECT * FROM linked_accounts WHERE discord_id = ?')
		.bind(interaction.member.user.id)
		.first<LinkedAccount>();

	logger.debug({ existing }, 'existing linked account based on discord id');

	if (javaUsername && existing?.java_confirmed) {
		return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
			content:
				'You have already linked your Java account! If you wish to link a different Java account, please contact the staff team.',
			flags: MessageFlags.Ephemeral,
		});
	}

	if (bedrockUsername && existing?.bedrock_confirmed) {
		return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
			content:
				'You have already linked your Java account! If you wish to link a different Java account, please contact the staff team.',
			flags: MessageFlags.Ephemeral,
		});
	}

	const existingJava = await env.DB.prepare('SELECT * FROM linked_accounts WHERE java_username = ?')
		.bind(javaUsername)
		.first<LinkedAccount>();

	logger.debug({ existingJava }, 'existing linked account based on java username');

	if (existingJava?.java_confirmed) {
		return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
			content:
				'This Java account is already linked to a Discord account! If you believe this is a mistake, please contact the staff team.',
			flags: MessageFlags.Ephemeral,
		});
	}

	const existingBedrock = await env.DB.prepare('SELECT * FROM linked_accounts WHERE bedrock_username = ?')
		.bind(javaUsername)
		.first<LinkedAccount>();

	logger.debug({ existingBedrock }, 'existing linked account based on bedrock username');

	if (existingBedrock?.bedrock_confirmed) {
		return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
			content:
				'This Bedrock account is already linked to a Discord account! If you believe this is a mistake, please contact the staff team.',
			flags: MessageFlags.Ephemeral,
		});
	}

	if (javaUsername) {
		await env.DB.prepare(
			'INSERT INTO linked_accounts (discord_id, java_username, bedrock_username) VALUES ($1, $2, null) ON CONFLICT (discord_id) DO UPDATE SET java_username = $2',
		)
			.bind(interaction.member.user.id, javaUsername)
			.run();
	}

	if (bedrockUsername) {
		await env.DB.prepare(
			'INSERT INTO linked_accounts (discord_id, java_username, bedrock_username) VALUES ($1, null, $2) ON CONFLICT (discord_id) DO UPDATE SET bedrock_username = $2',
		)
			.bind(interaction.member.user.id, bedrockUsername)
			.run();
	}

	return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
		content: `Your submission has been received! Please join the server and use \`/verify-discord ${interaction.member.user.id}\`. If you used the wrong username, please resubmit first.`,
		flags: MessageFlags.Ephemeral,
	});
}
