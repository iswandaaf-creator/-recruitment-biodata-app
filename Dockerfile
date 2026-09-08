FROM node:20-slim

# Install Chromium and C++ build tools for native SQLite3 compilation
RUN apt-get update && apt-get install -y \
    chromium \
    python3 \
    make \
    g++ \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm rebuild better-sqlite3 --build-from-source

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
