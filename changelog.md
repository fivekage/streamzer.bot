## [1.0.0] - 2026-05-01

### Added

- command list : list all users on jellyfin server and provide informations about them (admin only).
- command me : show informations about the user and his account.
- command sync_account : link the user's jellyfin account to his discord account by adding his discord ID in the AllowedTags of his jellyfin account.
- command register : create a new jellyfin account and link it to the user's discord account.
  - register command create a new account with a random password and send the credentials to the user in DM, and a random profile picture is fetched from giphy and set as the user's profile picture on jellyfin.
    > all commands are only available for users with the "Valide" discord role, except for the "list" command which is only available for users with the "Admin" role.

---

## [1.0.1] - 2026-05-02

### Added

- command random_pic: fetch a random gif from giphy and set it as the user's profile picture on jellyfin.

### Changed

- fixed some commands descriptions , set it in french and added more details about what the command does.
- removed "public" option from "me" command
- changed the way the discord id is stored in the jellyfin account, now it's stored in the BlockedTags instead of the AllowedTags bc AllowedTags is used to filter medias the user can see.
- added more logs in the random_pic command to help debugging and see the fetched gif url.

---

## [1.0.2] - 2026-05-08

### Changed

- fixed `me` command (var undefined lol)

---

## [1.0.3] - 2026-05-14

### Added

- added a GUILD_ID variable in the .env file to specify the guild where the commands will be registered, this way we can test the commands without having to wait for them to be registered globally (which can take up to an hour) and also avoid having the commands registered in other guilds where the bot is present but not used.

---

## [1.0.4] - 2026-05-14

### Changed

- Fixed /register command (bug when the sync between the new jellyfin account and the discord account begins)
- Fixed the error handle when the user doesn't have the "Valide" role and try to use a command, now it will show an error message instead of just doing nothing.
