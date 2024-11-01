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


## Prisma:

Run prisma commands to generate your schema from your database
```bash
npx prisma db pull
npx prisma generate
```

Or create your database from the existing schema :
```bash
npx prisma migrate dev
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

## Ask a feature or report a bug

If you have encountered a problem or you want to ask a new feature on streamzer.bot you can open an issue on github describing your need. We will analyze the ticket, then develop the task.

## Contact

For questions or feedback, open an issue on this projet or contact the administrators on the [Streamzer Discord server](https://discord.gg/2fsHHZnJe6).