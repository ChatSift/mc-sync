import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from '@discordjs/builders';
import { InteractionResponseType, TextInputStyle } from '@discordjs/core/http-only';
import { JsonResponse } from '../response.js';

export async function handle(): Promise<JsonResponse> {
	return new JsonResponse({
		type: InteractionResponseType.Modal,
		data: new ModalBuilder()
			.setCustomId('submit')
			.setTitle('Link your Minecraft account(s)')
			.addComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId('java-username')
						.setLabel('Java Username')
						.setPlaceholder('Joe')
						.setStyle(TextInputStyle.Short)
						.setRequired(false),
				),
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId('bedrock-username')
						.setLabel('Bedrock Username')
						.setPlaceholder('JoeBedrock')
						.setStyle(TextInputStyle.Short)
						.setRequired(false),
				),
			)
			.toJSON(),
	});
}
