import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.AHA_SUBDOMAIN = 'cotality';
  process.env.AHA_API_KEY = 'test-key';
});

import { getRecord, searchDocuments, createRequirement, updateRequirement } from '../src/aha-client.js';

describe('getRecord', () => {
  it('GETs the correct feature URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ feature: { id: '1', reference_num: 'SYM-12345', name: 'Test Feature', description: 'desc' } }),
    });

    const result = await getRecord('SYM-12345');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://cotality.aha.io/api/v1/features/SYM-12345',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-key' }) })
    );
    expect(result.reference_num).toBe('SYM-12345');
  });

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, text: async () => 'Not Found' });
    await expect(getRecord('SYM-99999')).rejects.toThrow('Aha API error: 404 Not Found');
  });
});

describe('searchDocuments', () => {
  it('searches requirements with the query term', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ requirements: [{ id: 'R1', reference_num: 'SYM-100-1', name: 'req', description: 'd' }] }),
    });

    const results = await searchDocuments('claim status');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('claim+status'),
      expect.any(Object)
    );
    expect(results).toHaveLength(1);
  });
});

describe('createRequirement', () => {
  it('POSTs to the correct Aha endpoint with the requirement payload', async () => {
    const mockReq = { id: 'R1', reference_num: 'SYM-12345-1', name: 'Claims Workspace', description: '...' };
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ requirement: mockReq }) });

    const result = await createRequirement('SYM-12345', {
      name: 'Claims Workspace',
      description: '**Applies to:** Claims Workspace\n**Statement:** As an adjuster...',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://cotality.aha.io/api/v1/features/SYM-12345/requirements',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ requirement: { name: 'Claims Workspace', description: '**Applies to:** Claims Workspace\n**Statement:** As an adjuster...' } }),
      })
    );
    expect(result.reference_num).toBe('SYM-12345-1');
  });

  it('throws with a readable message when Aha rejects the request', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 422, text: async () => 'Name is required' });
    await expect(
      createRequirement('SYM-12345', { name: '', description: '' })
    ).rejects.toThrow('Aha API error: 422 Name is required');
  });
});

describe('updateRequirement', () => {
  it('PUTs to the correct Aha endpoint', async () => {
    const mockReq = { id: 'R1', reference_num: 'SYM-12345-1', name: 'Claims Workspace', description: 'Updated' };
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ requirement: mockReq }) });

    const result = await updateRequirement('SYM-12345-1', { description: 'Updated' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://cotality.aha.io/api/v1/requirements/SYM-12345-1',
      expect.objectContaining({ method: 'PUT' })
    );
    expect(result.description).toBe('Updated');
  });
});
