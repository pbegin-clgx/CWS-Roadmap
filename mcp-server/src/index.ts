import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getRecord, searchDocuments, createRequirement, updateRequirement } from './aha-client.js';

const server = new McpServer({ name: 'aha', version: '1.0.0' });

server.tool(
  'get_record',
  'Fetch an Aha feature by its reference number (e.g. SYM-12345). Returns title, description, and metadata.',
  { reference_num: z.string().describe('Aha feature reference number, e.g. SYM-12345') },
  async ({ reference_num }) => {
    const feature = await getRecord(reference_num);
    return { content: [{ type: 'text', text: JSON.stringify(feature, null, 2) }] };
  }
);

server.tool(
  'search_documents',
  'Search Aha requirements by keyword. Returns matching requirements for style and format context.',
  { query: z.string().describe('Search keywords, e.g. "claim status adjuster"') },
  async ({ query }) => {
    const results = await searchDocuments(query);
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  'create_requirement',
  'Create a new child requirement under an Aha feature. Call once per requirement (one per product).',
  {
    feature_id: z.string().describe('Aha feature reference number, e.g. SYM-12345'),
    name: z.string().describe('Short requirement name — use the product name, e.g. "Claims Workspace"'),
    description: z.string().describe('Full requirement markdown: **Applies to** / **Statement** / **Details**'),
  },
  async ({ feature_id, name, description }) => {
    const req = await createRequirement(feature_id, { name, description });
    return { content: [{ type: 'text', text: `Created ${req.reference_num}: ${req.name}` }] };
  }
);

server.tool(
  'update_requirement',
  'Update an existing Aha child requirement by its reference number (e.g. SYM-12345-1).',
  {
    requirement_ref_num: z.string().describe('Aha requirement reference number, e.g. SYM-12345-1'),
    name: z.string().optional().describe('Updated requirement name'),
    description: z.string().optional().describe('Updated requirement markdown'),
  },
  async ({ requirement_ref_num, name, description }) => {
    const req = await updateRequirement(requirement_ref_num, { name, description });
    return { content: [{ type: 'text', text: `Updated ${req.reference_num}: ${req.name}` }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
