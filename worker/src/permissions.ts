import { PermissionFlagsBits } from '@discordjs/core/http-only';
import type { ValueResolvable } from '@sapphire/bitfield';
import { BitField } from '@sapphire/bitfield';

export const PermissionsBitField = new BitField(PermissionFlagsBits);

export type PermissionsResolvable = ValueResolvable<typeof PermissionsBitField>;
