# Deployment Instructions for Gmail MCP Server

    ## Option 1: Run Locally

    1. Complete the setup and authentication:
       ```bash
       npm install
       # Create credentials/credentials.json from Google Cloud Console
       npm run auth
       ```

    2. Start the server:
       ```bash
       # For CLI/stdio mode (to use with LLMs that support direct process communication)
       npm start
       
       # For HTTP mode (to use with LLMs that connect via HTTP)
       node src/server-http.js
       ```

    ## Option 2: Deploy as NPM Package

    1. Publish to npm (for your own use or organization):
       ```bash
       # Update package name in package.json to be unique (e.g., @yourorg/gmail-mcp)
       npm login
       npm publish
       ```

    2. Install and use globally:
       ```bash
       npm install -g @yourorg/gmail-mcp
       
       # Authenticate
       gmail-mcp-auth
       
       # Run
       gmail-mcp
       ```

    3. Use with MCP Inspector:
       ```bash
       npx @modelcontextprotocol/inspector npx @yourorg/gmail-mcp
       ```

    ## Option 3: Deploy as Docker Container

    1. Build the Docker image:
       ```bash
       docker build -t gmail-mcp .
       ```

    2. Run the container:
       ```bash
       # Create a volume for credentials
       docker volume create gmail-mcp-credentials
       
       # Run in interactive mode for authentication
       docker run -it -p 3000:3000 -v gmail-mcp-credentials:/app/credentials gmail-mcp npm run auth
       
       # Run the server
       docker run -d -p 3000:3000 -v gmail-mcp-credentials:/app/credentials gmail-mcp
       ```

    ## Option 4: Deploy to Cloud Services

    ### Deploy to Heroku

    1. Create a Heroku app:
       ```bash
       heroku create your-gmail-mcp
       ```

    2. Add a Procfile:
       ```
       web: node src/server-http.js
       ```

    3. Deploy:
       ```bash
       git push heroku main
       ```

    4. Set up authentication:
       - Run authentication locally
       - Copy the generated token.json to Heroku:
       ```bash
       heroku config:set GMAIL_TOKEN=$(cat credentials/token.json)
       ```

    ### Deploy to Google Cloud Run

    1. Build and push Docker image:
       ```bash
       gcloud builds submit --tag gcr.io/your-project/gmail-mcp
       ```

    2. Deploy to Cloud Run:
       ```bash
       gcloud run deploy gmail-mcp --image gcr.io/your-project/gmail-mcp --platform managed
       ```

    3. Set up authentication:
       - Store credentials and token in Secret Manager
       - Mount them as volumes in the container

    ## Connecting to the MCP Server

    ### For LLMs that support direct MCP integration:

    1. Configure the LLM to use your MCP server:
       - For local stdio mode: Point to the local process
       - For HTTP mode: Point to the HTTP endpoint (e.g., http://localhost:3000/mcp)

    ### For custom applications:

    1. Use the MCP client library to connect to your server:
       ```javascript
       import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
       import { HttpClientTransport } from '@modelcontextprotocol/sdk/client/http.js';

       const transport = new HttpClientTransport('http://localhost:3000/mcp');
       const client = new McpClient();
       await client.connect(transport);

       // Now you can use the client to call tools and access resources
       const result = await client.callTool('search_emails', { query: 'from:example.com' });
       ```

    ## Security Considerations

    1. **OAuth Tokens**: The token.json file contains sensitive OAuth credentials. Ensure it's properly secured.
    
    2. **HTTPS**: When deploying publicly, always use HTTPS to protect data in transit.
    
    3. **Access Control**: Consider adding authentication to the HTTP server to prevent unauthorized access.
    
    4. **Scopes**: The Gmail API scopes used are quite broad. Consider limiting them if you don't need all functionality.
