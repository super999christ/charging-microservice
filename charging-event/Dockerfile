FROM --platform=linux/amd64 node:18-alpine

WORKDIR /apps/charging-event

COPY . .

RUN touch .env

RUN npm i

RUN npm install -g @nestjs/cli typescript

RUN npm run tsc

RUN npm run build

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

CMD npm run start