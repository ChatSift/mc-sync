DROP TABLE IF EXISTS linked_accounts;
CREATE TABLE linked_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    discord_id TEXT NOT NULL UNIQUE,
    java_username TEXT UNIQUE,
    java_confirmed BOOLEAN NOT NULL DEFAULT 0,
    bedrock_username TEXT UNIQUE,
    bedrock_confirmed BOOLEAN NOT NULL DEFAULT 0
);

DROP TABLE IF EXISTS linked_siblings;
CREATE TABLE linked_siblings (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    discord_id TEXT NOT NULL,
    sibling_username TEXT NOT NULL UNIQUE
);
