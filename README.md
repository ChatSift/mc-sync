# mc-sync

Simple Discord bot + Minecraft plugin to create associations between Discord and Minecraft accounts.

This is extremely specialized to a specific community, and relies on LuckPerms being used on the server. It's also
on a one-instance one-server basis, but we might consider expanding it to be a proper public service
that doesn't require self-hosting in the future.

The bot is implemented as a CloudFlare worker. Refer to [this file](./worker/src/util.ts) to see what env vars are required.

## Setting up the plugin

The plugin is made for Paper and uses Gradle. The output `.jar` will be found in `build/libs/`. Once you have installed it,
run the server once for the default config to be generated, after which stop it, and immediately fill it out.

Most notably for the server administrator is `verified_group`, which is the LuckPerms group that verified users will be
added to (which MUST have the `mcsync.confirmed` permission set to true); the other fields should be requested from the
developer.

## Setting up the bot

Invite the bot to your server, ensure it can manage webhooks, then use `/setup webhook`. Post the message you want
to display using the given webhook token (I recommend [discohook](https://discohook.org/)), then use `/setup prompt`
with the message link for your prompt.

At this point, users can use the newly added button to link their accounts. They should now also be able to join the
server, after which they are expected to use the `/verify-discord` command in-game.

## Caveat worth mentioning

The plugin could cause major issues if the API (i.e. Cloudflare) is experiencing trouble. If this proves to be a problem,
we might consider addressing this better.
