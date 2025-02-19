import type { API, APIModalSubmitGuildInteraction } from '@discordjs/core/http-only';
import { InteractionResponseType, MessageFlags } from '@discordjs/core/http-only';
import type { IRequest } from 'itty-router';
import { JsonResponse } from '../response.js';
import type { Env } from '../util.js';

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
	const siblingUsername = interaction.data.components[0]!.components[0]!.value;

	await env.DB.prepare(
		'INSERT INTO linked_siblings (discord_id, sibling_username) VALUES ($1, $2) ON CONFLICT DO NOTHING',
	)
		.bind(interaction.member.user.id, siblingUsername)
		.all();

	return api.interactions.editReply(env.CLIENT_ID, interaction.token, {
		content: 'Successfully added sibling account!',
		flags: MessageFlags.Ephemeral,
	});
}
