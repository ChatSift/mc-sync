package app.automoderator.mcSync.commands;

import app.automoderator.mcSync.MCSyncPlugin;
import org.bukkit.Bukkit;
import org.bukkit.command.CommandSender;
import org.bukkit.command.defaults.BukkitCommand;
import org.jspecify.annotations.NullMarked;

import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@NullMarked
public class VerifyCommand extends BukkitCommand {
    private final MCSyncPlugin plugin;

    public VerifyCommand(MCSyncPlugin plugin) {
        super("verify-discord", "Verify your Discord account", "/verify-discord <discord-id>", List.of());
        this.plugin = plugin;
    }

    @Override
    public boolean execute(CommandSender sender, String commandLabel, String[] args) {
        if (sender.hasPermission("mcsync.confirmed")) {
            sender.sendPlainMessage("You have already verified.");
            return false;
        }

        if (args.length == 0) {
            sender.sendPlainMessage("Please provide your Discord ID");
            return false;
        }

        String expectedDiscordId = plugin.whitelistedUsers.get(sender.getName());
        if (expectedDiscordId == null) {
            sender.sendMessage("Something seems off! Please tell an Admin to contact the plugin developer.");
            plugin.getLogger().warning("User not found in whitelistedUsers map");
            return false;
        }

        if (!expectedDiscordId.equals(args[0])) {
            sender.sendMessage("That's not the correct Discord ID.");
            return false;
        }

        String cmd = "lp user " + sender.getName() + " group add " + plugin.getConfig().getString("verified_group");
        Bukkit.dispatchCommand(Bukkit.getConsoleSender(), cmd);

        sender.sendMessage("Successfully verified your identity.");

        Bukkit.getScheduler().runTaskAsynchronously(this.plugin, () -> {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(plugin.getConfig().getString("api_base") + "/api/whitelist/verify/" + args[0]))
                    .header("Authorization", plugin.getConfig().getString("api_auth"))
                    .PUT(HttpRequest.BodyPublishers.noBody())
                    .build();

            plugin.httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString());
        });

        return true;
    }

    @Override
    public List<String> tabComplete(CommandSender sender, String alias, String[] args) {
        return List.of();
    }
}
