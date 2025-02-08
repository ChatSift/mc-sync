import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from '@discordjs/builders';
import { InteractionResponseType, TextInputStyle } from '@discordjs/core/http-only';
import { JsonResponse } from '../response.js';

export async function handle(): Promise<JsonResponse> {
	return new JsonResponse({
		type: InteractionResponseType.Modal,
		data: new ModalBuilder()
			.setCustomId('submit')
			.setTitle('Link your Minecraft account')
			.addComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId('minecraft-username')
						.setLabel('Minecraft Username')
						.setPlaceholder('Joe')
						.setStyle(TextInputStyle.Short)
						.setRequired(true),
				),
			)
			.toJSON(),
	});
}
