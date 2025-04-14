FROM node:18-slim

    WORKDIR /app

    # Copy package files and install dependencies
    COPY package*.json ./
    RUN npm install

    # Copy application code
    COPY src/ ./src/
    COPY README.md ./

    # Create credentials directory
    RUN mkdir -p credentials

    # Expose port for HTTP server
    EXPOSE 3000

    # Set the command to run the server
    CMD ["node", "src/server-http.js"]
