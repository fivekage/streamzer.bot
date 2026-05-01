# Streamzer Discord Bot

## Getting Started

### Environment file

You will need to create a .env file in the root directory and add the following values:

```bash
NODE_ENV=''
API_KEY_JELLYFIN=''

DISCORD_TOKEN=''
CLIENT_ID=''
CLIENT_SECRET=''

API_KEY_JELLYFIN=''
REDIRECT_URI=''
DATABASE_URL=''
EXPRESS_PORT=''
```

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Contributing Guidelines

Thank you for contributing! Please follow these steps to ensure a smooth workflow:

### 1. Opening an Issue

- **Create an issue** to describe bugs, features, or improvements.
- **Provide clear details** and **tag** appropriately (e.g., `bug`, `enhancement`).

### 2. Creating a Pull Request

To ensure your PR passes our CI checks:

#### Branch Naming

- Name branches like `issue-123` or `ISSUE-123`, where `123` is the issue number.

#### Commit Requirements

- **Squash commits** so only one new commit exists relative to `dev`.
- Use this format for commit messages: `[fix|close|resolve #123] Message`. For example: `[fix #123] Correct typo`.

### PR Review Process

1. **Open a PR** targeting the `dev` branch.
2. CI will check for:
   - Correct branch name.
   - Single, squashed commit.
   - Proper commit message format.
3. **Resolve CI issues** if they arise, then request review.

Following these steps helps keep our project organized and consistent. Thanks for your help!

## Contact

For questions or feedback, open an issue on this projet or contact the administrators on the [Streamzer Discord server](https://discord.gg/2fsHHZnJe6).
