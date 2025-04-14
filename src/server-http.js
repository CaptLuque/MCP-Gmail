import express from 'express';
    import { server } from './server.js';
    import { gmailService } from './gmail-service.js';
    import { HttpServerTransport } from '@modelcontextprotocol/sdk/server/http.js';

    // Create Express app
    const app = express();
    const port = process.env.PORT || 3000;

    // Initialize Gmail service
    async function startServer() {
      console.log('Initializing Gmail service...');
      const initialized = await gmailService.initialize();
      
      if (!initialized) {
        console.error('Failed to initialize Gmail service. Please run "npm run auth" first.');
        process.exit(1);
      }

      // Create HTTP transport for MCP
      const transport = new HttpServerTransport();
      
      // Connect the MCP server to the transport
      await server.connect(transport);
      
      // Use the MCP HTTP middleware
      app.use('/mcp', transport.createExpressMiddleware());
      
      // Add a simple home page
      app.get('/', (req, res) => {
        res.send(`
          <html>
            <head>
              <title>Gmail MCP Server</title>
              <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { color: #4285f4; }
                code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
              </style>
            </head>
            <body>
              <h1>Gmail MCP Server</h1>
              <p>The Gmail MCP server is running. MCP endpoint is available at <code>/mcp</code>.</p>
              <p>To use this server with an LLM, configure it to connect to <code>http://localhost:${port}/mcp</code></p>
              <p>For more information, see the <a href="https://github.com/modelcontextprotocol/mcp">MCP documentation</a>.</p>
            </body>
          </html>
        `);
      });
      
      // Start the server
      app.listen(port, () => {
        console.log(`Gmail MCP server running at http://localhost:${port}`);
        console.log(`MCP endpoint available at http://localhost:${port}/mcp`);
      });
    }

    startServer().catch(err => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
