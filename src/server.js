import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
    import { z } from 'zod';
    import { gmailService } from './gmail-service.js';

    // Create an MCP server for Gmail interaction
    const server = new McpServer({
      name: "Gmail MCP",
      version: "1.0.0",
      description: "MCP server for interacting with Gmail"
    });

    // Resource to get emails by label
    server.resource(
      "emails",
      new ResourceTemplate("gmail://emails/{label}", { list: undefined }),
      async (uri, { label }) => {
        try {
          const emails = await gmailService.getEmailsByLabel(label);
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(emails, null, 2)
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error fetching emails with label ${label}: ${error.message}`
            }]
          };
        }
      }
    );

    // Resource to get a specific email by ID
    server.resource(
      "email",
      new ResourceTemplate("gmail://email/{id}", { list: undefined }),
      async (uri, { id }) => {
        try {
          const email = await gmailService.getEmailById(id);
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(email, null, 2)
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error fetching email with ID ${id}: ${error.message}`
            }]
          };
        }
      }
    );

    // Resource to get all labels
    server.resource(
      "labels",
      new ResourceTemplate("gmail://labels", { list: undefined }),
      async (uri) => {
        try {
          const labels = await gmailService.getLabels();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(labels, null, 2)
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error fetching labels: ${error.message}`
            }]
          };
        }
      }
    );

    // Tool to send an email
    server.tool(
      "send_email",
      {
        to: z.string().email().describe("Recipient email address"),
        subject: z.string().describe("Email subject"),
        body: z.string().describe("Email body content"),
        cc: z.string().email().optional().describe("CC recipient (optional)"),
        bcc: z.string().email().optional().describe("BCC recipient (optional)"),
        attachments: z.array(z.string()).optional().describe("List of attachment file paths (optional)")
      },
      async ({ to, subject, body, cc, bcc, attachments }) => {
        try {
          const result = await gmailService.sendEmail({ to, subject, body, cc, bcc, attachments });
          return {
            content: [{ 
              type: "text", 
              text: `Email sent successfully to ${to}. Message ID: ${result.id}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to send email: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Send an email through Gmail" }
    );

    // Tool to search emails
    server.tool(
      "search_emails",
      {
        query: z.string().describe("Gmail search query (same format as Gmail search box)"),
        maxResults: z.number().int().positive().max(100).default(10).describe("Maximum number of results to return")
      },
      async ({ query, maxResults }) => {
        try {
          const results = await gmailService.searchEmails(query, maxResults);
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(results, null, 2) 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Search failed: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Search for emails using Gmail search syntax" }
    );

    // Tool to create a new label
    server.tool(
      "create_label",
      {
        name: z.string().describe("Name for the new label"),
        color: z.string().optional().describe("Color for the label (optional)")
      },
      async ({ name, color }) => {
        try {
          const label = await gmailService.createLabel(name, color);
          return {
            content: [{ 
              type: "text", 
              text: `Label "${name}" created successfully. ID: ${label.id}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to create label: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Create a new Gmail label" }
    );

    // Tool to add labels to an email
    server.tool(
      "add_labels",
      {
        emailId: z.string().describe("ID of the email"),
        labelIds: z.array(z.string()).describe("Array of label IDs to add")
      },
      async ({ emailId, labelIds }) => {
        try {
          await gmailService.addLabels(emailId, labelIds);
          return {
            content: [{ 
              type: "text", 
              text: `Labels added successfully to email ${emailId}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to add labels: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Add labels to an email" }
    );

    // Tool to remove labels from an email
    server.tool(
      "remove_labels",
      {
        emailId: z.string().describe("ID of the email"),
        labelIds: z.array(z.string()).describe("Array of label IDs to remove")
      },
      async ({ emailId, labelIds }) => {
        try {
          await gmailService.removeLabels(emailId, labelIds);
          return {
            content: [{ 
              type: "text", 
              text: `Labels removed successfully from email ${emailId}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to remove labels: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Remove labels from an email" }
    );

    // Tool to trash an email
    server.tool(
      "trash_email",
      {
        emailId: z.string().describe("ID of the email to move to trash")
      },
      async ({ emailId }) => {
        try {
          await gmailService.trashEmail(emailId);
          return {
            content: [{ 
              type: "text", 
              text: `Email ${emailId} moved to trash successfully` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to trash email: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Move an email to trash" }
    );

    // Tool to untrash an email
    server.tool(
      "untrash_email",
      {
        emailId: z.string().describe("ID of the email to restore from trash")
      },
      async ({ emailId }) => {
        try {
          await gmailService.untrashEmail(emailId);
          return {
            content: [{ 
              type: "text", 
              text: `Email ${emailId} restored from trash successfully` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to restore email: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Restore an email from trash" }
    );

    // Tool to permanently delete an email
    server.tool(
      "delete_email",
      {
        emailId: z.string().describe("ID of the email to permanently delete")
      },
      async ({ emailId }) => {
        try {
          await gmailService.deleteEmail(emailId);
          return {
            content: [{ 
              type: "text", 
              text: `Email ${emailId} permanently deleted` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to delete email: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Permanently delete an email" }
    );

    // Tool to mark email as read
    server.tool(
      "mark_as_read",
      {
        emailId: z.string().describe("ID of the email to mark as read")
      },
      async ({ emailId }) => {
        try {
          await gmailService.markAsRead(emailId);
          return {
            content: [{ 
              type: "text", 
              text: `Email ${emailId} marked as read` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to mark email as read: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Mark an email as read" }
    );

    // Tool to mark email as unread
    server.tool(
      "mark_as_unread",
      {
        emailId: z.string().describe("ID of the email to mark as unread")
      },
      async ({ emailId }) => {
        try {
          await gmailService.markAsUnread(emailId);
          return {
            content: [{ 
              type: "text", 
              text: `Email ${emailId} marked as unread` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to mark email as unread: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Mark an email as unread" }
    );

    // Tool to get email thread
    server.tool(
      "get_thread",
      {
        threadId: z.string().describe("ID of the thread to retrieve")
      },
      async ({ threadId }) => {
        try {
          const thread = await gmailService.getThread(threadId);
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(thread, null, 2) 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to get thread: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Get all emails in a thread" }
    );

    // Tool to get user profile
    server.tool(
      "get_profile",
      {},
      async () => {
        try {
          const profile = await gmailService.getProfile();
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(profile, null, 2) 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to get profile: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Get user profile information" }
    );

    export { server };
