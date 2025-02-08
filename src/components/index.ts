import type { Response } from 'express';
import * as link from './link.js';

interface Component {
	handle(res: Response, interaction: any): Promise<unknown>;
}

export const components: Record<string, Component> = {
	link,
};
