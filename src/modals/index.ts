import type { Response } from 'express';
import * as submit from './submit.js';

interface Modal {
	handle(res: Response, interaction: any): Promise<unknown>;
}

export const modals: Record<string, Modal> = {
	submit,
};
