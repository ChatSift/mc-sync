package app.automoderator.mcSync;

public record UserConnectionAPIResponse(String discord_id, String java_username, String bedrock_username, String[] sibling_usernames) {
    public UserConnectionData toUserConnectionData() {
        return new UserConnectionData(discord_id, java_username, bedrock_username);
    }
}
