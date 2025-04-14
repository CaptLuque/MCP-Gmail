#!/usr/bin/env node
    import { program } from 'commander';
    import { execSync } from 'child_process';
    import path from 'path';
    import { fileURLToPath } from 'url';

    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    program
      .name('gmail-mcp')
      .description('Gmail MCP Server CLI')
      .version('1.0.0');

    program
      .command('auth')
      .description('Authenticate with Gmail')
      .action(() => {
        console.log('Starting authentication process...');
        try {
          execSync('node ' + path.join(__dirname, 'auth.js'), { stdio: 'inherit' });
        } catch (error) {
          console.error('Authentication failed');
          process.exit(1);
        }
      });

    program
      .command('start')
      .description('Start the MCP server in stdio mode')
      .action(() => {
        console.log('Starting Gmail MCP server in stdio mode...');
        try {
          execSync('node ' + path.join(__dirname, 'index.js'), { stdio: 'inherit' });
        } catch (error) {
          console.error('Server failed to start');
          process.exit(1);
        }
      });

    program
      .command('http')
      .description('Start the MCP server in HTTP mode')
      .option('-p, --port <port>', 'Port to listen on', '3000')
      .action((options) => {
        console.log(`Starting Gmail MCP server in HTTP mode on port ${options.port}...`);
        process.env.PORT = options.port;
        try {
          execSync('node ' + path.join(__dirname, 'server-http.js'), { stdio: 'inherit' });
        } catch (error) {
          console.error('HTTP server failed to start');
          process.exit(1);
        }
      });

    program
      .command('inspect')
      .description('Start the MCP server with Inspector')
      .action(() => {
        console.log('Starting Gmail MCP server with Inspector...');
        try {
          execSync('npx -y @modelcontextprotocol/inspector node ' + path.join(__dirname, 'index.js'), { stdio: 'inherit' });
        } catch (error) {
          console.error('Inspector failed to start');
          process.exit(1);
        }
      });

    program.parse();
