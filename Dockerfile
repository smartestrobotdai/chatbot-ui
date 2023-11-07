# ---- Base Node ----
FROM node:19-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- Dependencies ----
FROM base AS dependencies
RUN npm ci

# ---- Build ----
FROM dependencies AS build
COPY . .
RUN npm run build

# ---- Production ----
FROM node:19-alpine AS production
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
COPY --from=build /app/next.config.js ./next.config.js
COPY --from=build /app/next-i18next.config.js ./next-i18next.config.js

# set the evnironment variable
ENV DEFAULT_MODEL "llama-2-13b-sth"
ENV DEFAULT_EMBEDDING_MODEL "all-mpnet-base-v2-local"
ENV DEFAULT_MEMORY_TYPE "all-mpnet-base-v2-local"
ENV OPENAI_API_HOST "http://llm-service:5000"
# Expose the port the app will run on

EXPOSE 3000

# Start the application
CMD ["npm", "start"]

#docker run -e "OPENAI_API_HOST=http://192.168.49.2:30050" -p 3001:3000 llm-chatbot:01