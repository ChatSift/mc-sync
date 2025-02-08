import type { IRequest } from 'itty-router';
import type { JsonResponse } from '../response.js';
import * as link from './link.js';

interface Component {
	handle(req: IRequest, ctx: ExecutionContext, interaction: any): Promise<JsonResponse>;
}

export const components: Record<string, Component> = {
	link,
};
