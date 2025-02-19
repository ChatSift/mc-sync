import type { IRequest } from 'itty-router';
import type { JsonResponse } from '../response.js';
import type { Env } from '../util.js';
import * as linkSibling from './link-sibling.js';
import * as link from './link.js';

interface Component {
	handle(req: IRequest, ctx: ExecutionContext, env: Env, interaction: any): Promise<JsonResponse>;
}

export const components: Record<string, Component> = {
	link,
	'link-sibling': linkSibling,
};
