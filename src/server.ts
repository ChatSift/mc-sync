import { InteractionType, MessageFlags, type APIInteraction } from '@discordjs/core';
import { InteractionResponseType, verifyKeyMiddleware } from 'discord-interactions';
import express from 'express';
import { commands } from './commands/index.js';
import { components } from './components/index.js';
import { api, ENV, logger } from './util.js';

export const server = express();

server.use((req, _, next) => {
	logger.debug({ method: req.method, url: req.url }, 'incoming request');
	next();
});

server.post('/api/interactions/handle', verifyKeyMiddleware(ENV.PUBLIC_KEY), async (req, res) => {
	const message = req.body as APIInteraction;
	logger.debug({ message }, 'received interaction');
	switch (message.type) {
		case InteractionType.Ping: {
			return res.status(200).send({
				type: InteractionResponseType.PONG,
			});
		}

		case InteractionType.ApplicationCommand: {
			const command = message.data.name in commands ? commands[message.data.name as keyof typeof commands] : null;
			if (!command) {
				logger.error({ command: message.data.name }, 'command not found');
				return res.status(200).send({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						content: 'Command not found. This is a bug.',
					},
				});
			}

			res.status(200).send({
				type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					flags: MessageFlags.Ephemeral,
				},
			});

			await command.handle(message);
			break;
		}

		case InteractionType.MessageComponent: {
			const component =
				message.data.custom_id in components ? components[message.data.custom_id as keyof typeof components] : null;
			if (!component) {
				logger.error({ component: message.data.custom_id }, 'component not found');
				return res.status(200).send({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						content: 'Component not found. This is a bug.',
					},
				});
			}

			await component.handle(res, message);

			break;
		}

		case InteractionType.ApplicationCommandAutocomplete: {
			logger.warn('getting autocomplete requests. something is off');
			break;
		}

		case InteractionType.ModalSubmit: {
			break;
		}
	}
});

server.post('/api/interactions/register', async (req, res) => {
	// We do a little plain-text security
	if (req.headers.authorization !== ENV.REGISTER_PASS) {
		return res.status(401).end('Unauthorized');
	}

	const interactions = Object.values(commands).map((command) => command.interaction);
	logger.debug('registering commands');
	await api.applicationCommands.bulkOverwriteGlobalCommands(ENV.CLIENT_ID, interactions);
	res.status(200).end();
});

server.use((_, res) => {
	res.status(404).end('Not found');
});
