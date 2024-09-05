FROM node:20-alpine

RUN npm install -g pnpm dotenv-cli

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY prisma ./prisma/

RUN pnpm prisma generate

COPY . .

RUN pnpm run build

EXPOSE 3000

CMD ["sh", "-c", "pnpm run migrate:test && pnpm run migrate:dev && pnpm run start:dev"]