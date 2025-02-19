import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from '@discordjs/builders';
import {
	InteractionResponseType,
	MessageFlags,
	TextInputStyle,
	type APIModalSubmitGuildInteraction,
} from '@discordjs/core/http-only';
import type { IRequest } from 'itty-router';
import { JsonResponse } from '../response.js';
import type { Env, LinkedAccount } from '../util.js';

export async function handle(
	_: IRequest,
	__: ExecutionContext,
	env: Env,
	interaction: APIModalSubmitGuildInteraction,
): Promise<JsonResponse> {
	const existing = await env.DB.prepare('SELECT * FROM linked_accounts WHERE discord_id = ?')
		.bind(interaction.member.user.id)
		.first<LinkedAccount>();

	if (existing?.bedrock_confirmed || existing?.java_confirmed) {
		return new JsonResponse({
			type: InteractionResponseType.Modal,
			data: new ModalBuilder()
				.setCustomId('submit-sibling')
				.setTitle("Add a sibling's Minecraft account(s)")
				.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId('username')
							.setLabel('Java/Bedrock Username')
							.setPlaceholder('Joe')
							.setStyle(TextInputStyle.Short)
							.setRequired(true),
					),
				)
				.toJSON(),
		});
	}

	return new JsonResponse({
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			content: 'You must link & confirm your own account before you can link a sibling account.',
			flags: MessageFlags.Ephemeral,
		},
	});
}
