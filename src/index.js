#!/usr/bin/env node
    import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
    import { server } from './server.js';
    import { gmailService } from './gmail-service.js';

    console.log('Starting Gmail MCP server...');

    // Initialize Gmail service
    const initialized = await gmailService.initialize();
    if (!initialized) {
      console.error('Failed to initialize Gmail service. Please run "npm run auth" first.');
      process.exit(1);
    }

    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    await server.connect(transport);
