#!/usr/bin/env node
    import express from 'express';
    import { OAuth2Client } from 'google-auth-library';
    import fs from 'fs/promises';
    import path from 'path';
    import { fileURLToPath } from 'url';
    import open from 'open';

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const TOKEN_PATH = path.join(__dirname, '../credentials/token.json');
    const CREDENTIALS_PATH = path.join(__dirname, '../credentials/credentials.json');

    // Create credentials directory if it doesn't exist
    try {
      await fs.mkdir(path.join(__dirname, '../credentials'), { recursive: true });
    } catch (err) {
      console.error('Error creating credentials directory:', err);
    }

    async function authenticate() {
      try {
        // Check if credentials file exists
        try {
          await fs.access(CREDENTIALS_PATH);
        } catch (err) {
          console.error('Error: credentials.json file not found.');
          console.log('Please create a credentials.json file in the credentials directory with your Google OAuth client credentials.');
          console.log('You can obtain these credentials from the Google Cloud Console (https://console.cloud.google.com)');
          console.log('1. Create a project');
          console.log('2. Enable the Gmail API');
          console.log('3. Create OAuth client ID credentials (Web application type)');
          console.log('4. Set the redirect URI to http://localhost:3000/oauth2callback');
          console.log('5. Download the JSON and save it as credentials/credentials.json');
          process.exit(1);
        }

        // Load client secrets from credentials file
        const content = await fs.readFile(CREDENTIALS_PATH, 'utf8');
        const credentials = JSON.parse(content);
        
        // Create OAuth client
        const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;
        const oAuth2Client = new OAuth2Client(
          client_id,
          client_secret,
          redirect_uris[0] || 'http://localhost:3000/oauth2callback'
        );

        // Check if we have a stored token
        try {
          const token = await fs.readFile(TOKEN_PATH, 'utf8');
          oAuth2Client.setCredentials(JSON.parse(token));
          console.log('Using existing authentication token.');
          return oAuth2Client;
        } catch (err) {
          return getNewToken(oAuth2Client);
        }
      } catch (err) {
        console.error('Error during authentication:', err);
        process.exit(1);
      }
    }

    async function getNewToken(oAuth2Client) {
      return new Promise((resolve, reject) => {
        const app = express();
        let server;

        // Generate the authorization URL
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.labels',
            'https://www.googleapis.com/auth/gmail.modify'
          ],
        });

        // Open the authorization URL in the browser
        console.log('Authorizing with Google. Opening browser...');
        open(authUrl);

        // Set up the callback route
        app.get('/oauth2callback', async (req, res) => {
          const { code } = req.query;
          
          if (!code) {
            res.send('Authentication failed: No code received');
            reject(new Error('No code received'));
            server.close();
            return;
          }

          try {
            // Exchange the code for tokens
            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);
            
            // Save the token for future use
            await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
            console.log('Token stored successfully');
            
            // Send success response
            res.send('Authentication successful! You can close this window.');
            
            // Close the server and resolve the promise
            server.close();
            resolve(oAuth2Client);
          } catch (err) {
            console.error('Error retrieving access token:', err);
            res.send('Authentication failed: ' + err.message);
            server.close();
            reject(err);
          }
        });

        // Start the server
        server = app.listen(3000, () => {
          console.log('Waiting for authentication...');
        });
      });
    }

    // Run the authentication process
    try {
      const auth = await authenticate();
      console.log('Authentication successful!');
      process.exit(0);
    } catch (err) {
      console.error('Authentication failed:', err);
      process.exit(1);
    }
