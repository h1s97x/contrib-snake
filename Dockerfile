FROM oven/bun:1.3
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
