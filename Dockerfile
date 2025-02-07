FROM node:22-alpine

WORKDIR /usr/mc-sync

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

RUN yarn install --immutable

COPY . .

RUN yarn build

RUN yarn workspaces focus --production

FROM node:22-alpine

LABEL version="0.0.0"
LABEL maintainer="didinele <https://github.com/didinele>"

WORKDIR /usr/mc-sync
COPY package.json yarn.lock .yarnrc.yml ./
COPY --from=0 /usr/mc-sync/dist ./dist
COPY --from=0 /usr/mc-sync/node_modules ./node_modules

CMD ["node", "--enable-source-maps", "./dist/index.js"]
