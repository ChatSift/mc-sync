package app.automoderator.mcSync;

import app.automoderator.mcSync.commands.VerifyCommand;
import com.google.common.reflect.TypeToken;
import com.google.gson.Gson;
import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerLoginEvent;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

import java.lang.reflect.Type;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

record JSONResponseElement(String discord_id, String minecraft_username) {
}

public final class MCSyncPlugin extends JavaPlugin implements Listener {
    private boolean isFetching = false;
    // mc_username -> discord_id
    public final Map<String, String> whitelistedUsers = new HashMap<>();
    public final HttpClient httpClient = HttpClient.newHttpClient();

    @Override
    public void onEnable() {
        saveResource("config.yml", false);
        saveDefaultConfig();

        Bukkit.getPluginManager().registerEvents(this, this);
        this.getServer().getCommandMap().register(
                getName().toLowerCase(),
                new VerifyCommand(this)
        );

        fetchAndUpdateWhitelist();
    }

    @EventHandler
    public void onPlayerLogin(PlayerLoginEvent event) {
        if (event.getPlayer().hasPermission("mcsync.confirmed")) {
            event.allow();
            return;
        }

        if (event.getPlayer().isWhitelisted()) {
            return;
        }

        fetchAndUpdateWhitelist();
        if (whitelistedUsers.containsKey(event.getPlayer().getName())) {
            event.allow();
        }
    }

    private void fetchAndUpdateWhitelist() {
        if (isFetching) {
            getLogger().info("Skipping whitelist fetch; one is already queued");
            return;
        }

        isFetching = true;
        getLogger().info("Fetching whitelist...");

        try {
            Map<String, String> list = fetchWhitelist().get();
            updateWhitelist(list);
        } catch (InterruptedException | ExecutionException e) {
            getLogger().warning("Error while fetching whitelist: " + e.getMessage());
        }

        isFetching = false;
    }

    private CompletableFuture<Map<String, String>> fetchWhitelist() {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getConfig().getString("api_base") + "/api/whitelist"))
                .header("Authorization", getConfig().getString("api_auth"))
                .GET()
                .build();

        return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
            .thenApply(HttpResponse::body)
            .thenApply(this::parseJSON)
            .exceptionally(ex -> {
                getLogger().warning("Something went wrong fetching the whitelist: " + ex);
                return whitelistedUsers;
            });
    }

    private void updateWhitelist(Map<String, String> newWhitelist) {
        getLogger().info("Received whitelist data, going through the entries");

        whitelistedUsers.clear();
        whitelistedUsers.putAll(newWhitelist);

        for (Map.Entry<String, String> entry : newWhitelist.entrySet()) {
            String username = entry.getKey();
            OfflinePlayer player = Bukkit.getOfflinePlayer(username);
            if (!player.isWhitelisted()) {
                player.setWhitelisted(true);
                getLogger().info("Added: " + player.getName());
            }
        }

        getLogger().info("Successfully updated whitelist");
    }

    private Map<String, String> parseJSON(String json) {
        Map<String, String> data = new HashMap<>();
        try {
            Gson gson = new Gson();
            Type listType = new TypeToken<List<JSONResponseElement>>(){}.getType();
            List<JSONResponseElement> parsed = gson.fromJson(json, listType);
            for (JSONResponseElement element : parsed) {
                data.put(element.minecraft_username(), element.discord_id());
            }
        } catch (Exception e) {
            getLogger().warning("Error parsing JSON: " + e.getMessage());
        }

        return data;
    }
}
