import { google } from 'googleapis';
    import fs from 'fs/promises';
    import path from 'path';
    import { fileURLToPath } from 'url';
    import { OAuth2Client } from 'google-auth-library';

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const TOKEN_PATH = path.join(__dirname, '../credentials/token.json');
    const CREDENTIALS_PATH = path.join(__dirname, '../credentials/credentials.json');

    class GmailService {
      constructor() {
        this.auth = null;
        this.gmail = null;
      }

      async initialize() {
        try {
          // Check if credentials and token exist
          try {
            await fs.access(CREDENTIALS_PATH);
            await fs.access(TOKEN_PATH);
          } catch (err) {
            console.error('Error: credentials or token file not found.');
            console.log('Please run "npm run auth" first to authenticate with Gmail.');
            return false;
          }

          // Load client secrets and token
          const credentialsContent = await fs.readFile(CREDENTIALS_PATH, 'utf8');
          const tokenContent = await fs.readFile(TOKEN_PATH, 'utf8');
          
          const credentials = JSON.parse(credentialsContent);
          const token = JSON.parse(tokenContent);
          
          // Create OAuth client
          const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;
          this.auth = new OAuth2Client(
            client_id,
            client_secret,
            redirect_uris[0] || 'http://localhost:3000/oauth2callback'
          );
          
          this.auth.setCredentials(token);
          
          // Create Gmail API client
          this.gmail = google.gmail({ version: 'v1', auth: this.auth });
          
          console.log('Gmail service initialized successfully');
          return true;
        } catch (err) {
          console.error('Error initializing Gmail service:', err);
          return false;
        }
      }

      async getEmailsByLabel(label) {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          const response = await this.gmail.users.messages.list({
            userId: 'me',
            labelIds: [label],
            maxResults: 10
          });

          const messages = response.data.messages || [];
          
          // Fetch full details for each message
          const emails = await Promise.all(
            messages.map(async (message) => {
              const details = await this.gmail.users.messages.get({
                userId: 'me',
                id: message.id
              });
              return details.data;
            })
          );
          
          return emails;
        } catch (error) {
          console.error(`Error fetching emails with label ${label}:`, error);
          throw new Error(`Failed to fetch emails: ${error.message}`);
        }
      }

      async getEmailById(id) {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          const response = await this.gmail.users.messages.get({
            userId: 'me',
            id: id
          });
          
          return response.data;
        } catch (error) {
          console.error(`Error fetching email with ID ${id}:`, error);
          throw new Error(`Failed to fetch email: ${error.message}`);
        }
      }

      async getLabels() {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          const response = await this.gmail.users.labels.list({
            userId: 'me'
          });
          
          return response.data.labels || [];
        } catch (error) {
          console.error('Error fetching labels:', error);
          throw new Error(`Failed to fetch labels: ${error.message}`);
        }
      }

      async sendEmail({ to, subject, body, cc, bcc, attachments }) {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          // Construct email headers
          let email = [
            `To: ${to}`,
            `Subject: ${subject}`
          ];
          
          if (cc) email.push(`Cc: ${cc}`);
          if (bcc) email.push(`Bcc: ${bcc}`);
          
          email.push('Content-Type: text/plain; charset=utf-8');
          email.push('MIME-Version: 1.0');
          email.push('');
          email.push(body);
          
          // Convert to base64 encoded string
          const encodedEmail = Buffer.from(email.join('\r\n')).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
          
          // Send the email
          const response = await this.gmail.users.messages.send({
            userId: 'me',
            requestBody: {
              raw: encodedEmail
            }
          });
          
          return { id: response.data.id, status: 'sent' };
        } catch (error) {
          console.error('Error sending email:', error);
          throw new Error(`Failed to send email: ${error.message}`);
        }
      }

      async searchEmails(query, maxResults = 10) {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          const response = await this.gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: maxResults
          });
          
          const messages = response.data.messages || [];
          
          // Fetch full details for each message
          const emails = await Promise.all(
            messages.map(async (message) => {
              const details = await this.gmail.users.messages.get({
                userId: 'me',
                id: message.id
              });
              return details.data;
            })
          );
          
          return emails;
        } catch (error) {
          console.error(`Error searching emails with query ${query}:`, error);
          throw new Error(`Failed to search emails: ${error.message}`);
        }
      }

      async createLabel(name, color) {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          const response = await this.gmail.users.labels.create({
            userId: 'me',
            requestBody: {
              name: name,
              labelListVisibility: 'labelShow',
              messageListVisibility: 'show',
              // Color settings if provided
              ...(color && {
                color: {
                  backgroundColor: color,
                  textColor: '#ffffff'
                }
              })
            }
          });
          
          return response.data;
        } catch (error) {
          console.error(`Error creating label ${name}:`, error);
          throw new Error(`Failed to create label: ${error.message}`);
        }
      }

      async addLabels(emailId, labelIds) {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          await this.gmail.users.messages.modify({
            userId: 'me',
            id: emailId,
            requestBody: {
              addLabelIds: labelIds
            }
          });
          
          return true;
        } catch (error) {
          console.error(`Error adding labels to email ${emailId}:`, error);
          throw new Error(`Failed to add labels: ${error.message}`);
        }
      }

      async removeLabels(emailId, labelIds) {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          await this.gmail.users.messages.modify({
            userId: 'me',
            id: emailId,
            requestBody: {
              removeLabelIds: labelIds
            }
          });
          
          return true;
        } catch (error) {
          console.error(`Error removing labels from email ${emailId}:`, error);
          throw new Error(`Failed to remove labels: ${error.message}`);
        }
      }

      async trashEmail(emailId) {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          await this.gmail.users.messages.trash({
            userId: 'me',
            id: emailId
          });
          
          return true;
        } catch (error) {
          console.error(`Error trashing email ${emailId}:`, error);
          throw new Error(`Failed to trash email: ${error.message}`);
        }
      }

      async untrashEmail(emailId) {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          await this.gmail.users.messages.untrash({
            userId: 'me',
            id: emailId
          });
          
          return true;
        } catch (error) {
          console.error(`Error untrashing email ${emailId}:`, error);
          throw new Error(`Failed to untrash email: ${error.message}`);
        }
      }

      async deleteEmail(emailId) {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          await this.gmail.users.messages.delete({
            userId: 'me',
            id: emailId
          });
          
          return true;
        } catch (error) {
          console.error(`Error deleting email ${emailId}:`, error);
          throw new Error(`Failed to delete email: ${error.message}`);
        }
      }

      async markAsRead(emailId) {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          await this.gmail.users.messages.modify({
            userId: 'me',
            id: emailId,
            requestBody: {
              removeLabelIds: ['UNREAD']
            }
          });
          
          return true;
        } catch (error) {
          console.error(`Error marking email ${emailId} as read:`, error);
          throw new Error(`Failed to mark email as read: ${error.message}`);
        }
      }

      async markAsUnread(emailId) {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          await this.gmail.users.messages.modify({
            userId: 'me',
            id: emailId,
            requestBody: {
              addLabelIds: ['UNREAD']
            }
          });
          
          return true;
        } catch (error) {
          console.error(`Error marking email ${emailId} as unread:`, error);
          throw new Error(`Failed to mark email as unread: ${error.message}`);
        }
      }

      async getThread(threadId) {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          const response = await this.gmail.users.threads.get({
            userId: 'me',
            id: threadId
          });
          
          return response.data;
        } catch (error) {
          console.error(`Error fetching thread ${threadId}:`, error);
          throw new Error(`Failed to fetch thread: ${error.message}`);
        }
      }

      async getProfile() {
        if (!this.gmail) {
          throw new Error('Gmail service not initialized');
        }

        try {
          const response = await this.gmail.users.getProfile({
            userId: 'me'
          });
          
          return response.data;
        } catch (error) {
          console.error('Error fetching user profile:', error);
          throw new Error(`Failed to fetch profile: ${error.message}`);
        }
      }
    }

    export const gmailService = new GmailService();
