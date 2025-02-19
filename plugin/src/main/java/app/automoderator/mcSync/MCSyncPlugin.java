package app.automoderator.mcSync;

import app.automoderator.mcSync.commands.VerifyCommand;
import com.google.common.reflect.TypeToken;
import com.google.gson.Gson;
import net.kyori.adventure.text.Component;
import org.bukkit.Bukkit;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerLoginEvent;
import org.bukkit.plugin.java.JavaPlugin;

import java.lang.reflect.Type;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

public final class MCSyncPlugin extends JavaPlugin implements Listener {
    private boolean isFetching = false;
    public final Map<String, UserConnectionData> whitelistedUsers = new HashMap<>();
    public final Set<String> whitelistExtension = new HashSet<>();
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
        if (event.getPlayer().isOp()) {
            return;
        }

        fetchAndUpdateWhitelist();
        if (whitelistedUsers.containsKey(event.getPlayer().getName()) || whitelistExtension.contains(event.getPlayer().getName())) {
            event.allow();
            return;
        }

        getLogger().info("User tried to join, but they haven't associated a Discord account yet");
        event.disallow(PlayerLoginEvent.Result.KICK_OTHER, Component.text("This Minecraft account is not linked to any MC account!"));
    }

    private void fetchAndUpdateWhitelist() {
        if (isFetching) {
            getLogger().info("Skipping whitelist fetch; one is already queued");
            return;
        }

        isFetching = true;
        getLogger().info("Fetching whitelist...");

        try {
            fetchWhitelist().get();
            getLogger().info("Successfully updated whitelist");
        } catch (InterruptedException | ExecutionException e) {
            getLogger().warning("Error while fetching whitelist: " + e.getMessage());
        }

        isFetching = false;
    }

    private CompletableFuture<Void> fetchWhitelist() {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getConfig().getString("api_base") + "/api/whitelist"))
                .header("Authorization", getConfig().getString("api_auth"))
                .GET()
                .build();

        return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
            .thenApply(HttpResponse::body)
            .thenAccept(this::handleBody)
            .exceptionally(ex -> {
                getLogger().warning("Something went wrong fetching the whitelist: " + ex);
                return null;
            });
    }

    private void handleBody(String json) {
        try {
            Gson gson = new Gson();
            Type listType = new TypeToken<List<UserConnectionAPIResponse>>(){}.getType();
            List<UserConnectionAPIResponse> parsed = gson.fromJson(json, listType);

            whitelistedUsers.clear();
            whitelistExtension.clear();

            for (UserConnectionAPIResponse element : parsed) {
                whitelistedUsers.put(element.java_username(), element.toUserConnectionData());
                whitelistedUsers.put("." + element.bedrock_username(), element.toUserConnectionData());

                whitelistExtension.addAll(Arrays.asList(element.sibling_usernames()));
            }
        } catch (Exception e) {
            getLogger().warning("Error parsing JSON: " + e.getMessage());
        }
    }
}
