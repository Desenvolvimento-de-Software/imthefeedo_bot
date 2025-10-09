# Feedo

This is a Telegram bot that can be used to manage feeds on the platform.
It was written to run on Bun/TypeScript, but can run on node.js as well.

## How to start

### Install dependences
`bun install`

### Run

`bun run ./src/index.ts`

## It can be transpiled and run with node.js as well.

### Install dependences
`npm install`

### Start in development mode
`npm run dev`

### Build
`npm run build`

### Start
`npm run node-start`


## Environment Variables

- PORT
- AUTH
- DATABASE_URL
- DEBUG
- TELEGRAM_BOT_TOKEN
- TELEGRAM_POLLING_TIMEOUT
- TELEGRAM_USER_ID
- TELEGRAM_USERNAME
- TELEGRAM_WEBHOOK_ACTIVE


## Database

The database used is MySQL.


## Telegram API

The Telegram API is used to interact with the platform. The bot is able to manage groups, users, and messages.
