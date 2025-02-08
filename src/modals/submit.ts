import { MessageFlags, type APIModalSubmitGuildInteraction } from '@discordjs/core';
import { InteractionResponseType } from 'discord-interactions';
import type { Response } from 'express';
import { sql, type LinkedAccounts } from '../db.js';
import { api, ENV, logger } from '../util.js';

export async function handle(res: Response, interaction: APIModalSubmitGuildInteraction) {
	res.status(200).send({
		type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
		data: {
			flags: MessageFlags.Ephemeral,
		},
	});

	const username = interaction.data.components[0]!.components[0]!.value;

	const [existing] = await sql<[LinkedAccounts?]>`
        SELECT * FROM linked_accounts
        WHERE discord_id = ${interaction.member.user.id}
    `;

	logger.debug({ existing }, 'existing linked account based on discord id');

	if (existing?.confirmed) {
		return api.interactions.editReply(ENV.CLIENT_ID, interaction.token, {
			content:
				'You have already linked your account! If you wish to link a different Minecraft account, please contact the staff team.',
			flags: MessageFlags.Ephemeral,
		});
	}

	const [existingMc] = await sql<[LinkedAccounts?]>`
        SELECT * FROM linked_accounts
        WHERE minecraft_username = ${username}
    `;

	logger.debug({ existingMc }, 'existing linked account based on minecraft username');

	if (existingMc) {
		return api.interactions.editReply(ENV.CLIENT_ID, interaction.token, {
			content:
				'This Minecraft account is already linked to a Discord account! If you believe this is a mistake, please contact the staff team.',
			flags: MessageFlags.Ephemeral,
		});
	}

	const data: Omit<LinkedAccounts, 'id'> = {
		confirmed: false,
		discord_id: interaction.member.user.id,
		minecraft_username: username,
	};

	await sql`
        INSERT INTO linked_accounts (confirmed, discord_id, minecraft_username)
        VALUES (${data.confirmed}, ${data.discord_id}, ${data.minecraft_username})
        ON CONFLICT (discord_id) DO UPDATE SET minecraft_username = ${data.minecraft_username}
    `;

	return api.interactions.editReply(ENV.CLIENT_ID, interaction.token, {
		content:
			'Your submission has been received! Please join the server and use `/discord 223703707118731264`. If you used the wrong username, please resubmit.',
		flags: MessageFlags.Ephemeral,
	});
}
