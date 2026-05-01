## [1.0.0] - 2026-05-01

### Added

- command list : list all users on jellyfin server and provide informations about them (admin only).
- command me : show informations about the user and his account.
- command sync_account : link the user's jellyfin account to his discord account by adding his discord ID in the AllowedTags of his jellyfin account.
- command register : create a new jellyfin account and link it to the user's discord account.
  - register command create a new account with a random password and send the credentials to the user in DM, and a random profile picture is fetched from giphy and set as the user's profile picture on jellyfin.
    > all commands are only available for users with the "Valide" discord role, except for the "list" command which is only available for users with the "Admin" role.
