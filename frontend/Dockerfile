FROM node:22-alpine
RUN corepack enable && corepack prepare yarn@4.12.0 --activate
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install
EXPOSE 5173
CMD ["yarn", "dev", "--host", "0.0.0.0"]
