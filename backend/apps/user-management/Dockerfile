FROM --platform=linux/amd64 node:18-alpine

WORKDIR /apps/user-management

COPY . .

RUN touch .env

RUN npm ci

RUN npm install -g @nestjs/cli

RUN npm run tsc

RUN npm run build:user-management

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

CMD npm run migration:run:user-management & npm run dev:user-management