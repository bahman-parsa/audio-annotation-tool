FROM node:22-alpine
RUN apk add --no-cache ffmpeg
RUN corepack enable && corepack prepare yarn@4.12.0 --activate
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install
COPY prisma ./prisma/
RUN yarn prisma generate
COPY . .
EXPOSE 3000
CMD ["yarn", "dev"]
