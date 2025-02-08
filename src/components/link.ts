import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from '@discordjs/builders';
import { TextInputStyle, type APIMessageComponentGuildInteraction } from '@discordjs/core';
import { InteractionResponseType } from 'discord-interactions';
import type { Response } from 'express';

export async function handle(res: Response, interaction: APIMessageComponentGuildInteraction) {
	return res.status(200).send({
		type: InteractionResponseType.MODAL,
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
