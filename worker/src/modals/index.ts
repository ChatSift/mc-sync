import type { API } from '@discordjs/core/http-only';
import type { IRequest } from 'itty-router';
import type { JsonResponse } from '../response.js';
import type { Env } from '../util.js';
import * as submitSibling from './submit-sibling.js';
import * as submit from './submit.js';

interface Modal {
	handle(req: IRequest, ctx: ExecutionContext, env: Env, interaction: any, api: API): Promise<JsonResponse>;
}

export const modals: Record<string, Modal> = {
	submit,
	'submit-sibling': submitSibling,
};
