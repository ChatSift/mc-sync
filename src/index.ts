import { API } from '@discordjs/core/http-only';
import { InteractionResponseType, type APIInteraction, InteractionType, MessageFlags } from '@discordjs/core/http-only';
import { REST } from '@discordjs/rest';
import { verifyKey } from 'discord-interactions';
import { Router, type IRequest } from 'itty-router';
import type { Headers } from 'undici-types';
import { commands } from './commands/index.js';
import { components } from './components/index.js';
import { modals } from './modals/index.js';
import { JsonResponse } from './response.js';
import { logger, type Env } from './util.js';

const router = Router<IRequest, [Env, ExecutionContext, API]>();

async function verifyDiscordRequest(request: IRequest, env: Env) {
	const headers = request.headers as Headers;

	const signature = headers.get('x-signature-ed25519');
	const timestamp = headers.get('x-signature-timestamp');

	const body = await request.text();
	const isValidRequest = signature && timestamp && (await verifyKey(body, signature, timestamp, env.PUBLIC_KEY));
	if (!isValidRequest) {
		return { isValid: false };
	}

	return { interaction: JSON.parse(body) as APIInteraction, isValid: true };
}

const server = {
	verifyDiscordRequest,
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const rest = new REST({ version: '10' });
		rest.setToken(env.DISCORD_TOKEN);

		const api = new API(rest);

		logger.debug({ method: request.method, url: request.url }, 'incoming request');
		return router.fetch(request, env, ctx, api);
	},
};

router.post('/api/interactions/handle', async (req, env, ctx, api) => {
	const { isValid, interaction: message } = await server.verifyDiscordRequest(req, env);
	if (!isValid || !message) {
		return new Response('Bad request signature.', { status: 401 });
	}

	logger.debug({ message }, 'received interaction');
	switch (message.type) {
		case InteractionType.Ping: {
			return new JsonResponse({
				type: InteractionResponseType.Pong,
			});
		}

		case InteractionType.ApplicationCommand: {
			const command = message.data.name in commands ? commands[message.data.name as keyof typeof commands] : null;
			if (!command) {
				logger.error({ command: message.data.name }, 'command not found');
				return new JsonResponse({
					type: InteractionResponseType.ChannelMessageWithSource,
					data: {
						content: 'Command not found. This is a bug.',
					},
				});
			}

			const response = new JsonResponse({
				type: InteractionResponseType.DeferredChannelMessageWithSource,
				data: {
					flags: MessageFlags.Ephemeral,
				},
			});

			ctx.waitUntil(command.handle(message, env, api));
			return response;
		}

		case InteractionType.MessageComponent: {
			const component =
				message.data.custom_id in components ? components[message.data.custom_id as keyof typeof components] : null;
			if (!component) {
				logger.error({ component: message.data.custom_id }, 'component not found');
				return new JsonResponse({
					type: InteractionResponseType.ChannelMessageWithSource,
					data: {
						content: 'Component not found. This is a bug.',
					},
				});
			}

			return component.handle(req, ctx, message);
		}

		case InteractionType.ApplicationCommandAutocomplete: {
			logger.warn('getting autocomplete requests. something is off');
			return new Response('Bad request.', { status: 401 });
		}

		case InteractionType.ModalSubmit: {
			const modal = message.data.custom_id in modals ? modals[message.data.custom_id as keyof typeof modals] : null;
			if (!modal) {
				logger.error({ modal: message.data.custom_id }, 'modal not found');
				return new JsonResponse({
					type: InteractionResponseType.ChannelMessageWithSource,
					data: {
						content: 'Modal not found. This is a bug.',
					},
				});
			}

			return modal.handle(req, ctx, env, message, api);
		}
	}
});

router.post('/api/interactions/register', async (req, env, _, api) => {
	const headers = req.headers as Headers;
	// We do a little plain-text security
	if (headers.get('authorization') !== env.REGISTER_PASS) {
		return new Response('Unauthorized', { status: 401 });
	}

	const interactions = Object.values(commands).map((command) => command.interaction);
	logger.debug('registering commands');
	await api.applicationCommands.bulkOverwriteGlobalCommands(env.CLIENT_ID, interactions);
	return new Response('OK', { status: 200 });
});

router.all('*', () => {
	return new Response('Not found', { status: 404 });
});

export default server;
