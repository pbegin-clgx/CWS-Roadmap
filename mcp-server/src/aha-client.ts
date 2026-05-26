function validateEnv(): void {
  if (!process.env.AHA_SUBDOMAIN) throw new Error('AHA_SUBDOMAIN environment variable is not set');
  if (!process.env.AHA_API_KEY) throw new Error('AHA_API_KEY environment variable is not set');
}

const base = () => `https://${process.env.AHA_SUBDOMAIN}.aha.io/api/v1`;
const auth = () => ({
  Authorization: `Bearer ${process.env.AHA_API_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
});

export interface Feature {
  id: string;
  reference_num: string;
  name: string;
  description: string;
  workflow_status?: { name: string };
  [key: string]: unknown;
}

export interface Requirement {
  id: string;
  reference_num: string;
  name: string;
  description: string;
  workflow_status?: { name: string };
  [key: string]: unknown;
}

export async function getRecord(referenceNum: string): Promise<Feature> {
  validateEnv();
  const res = await fetch(`${base()}/features/${referenceNum}`, { headers: auth() });
  if (!res.ok) throw new Error(`Aha API error: ${res.status} ${await res.text()}`);
  return (await res.json() as { feature: Feature }).feature;
}

export async function searchDocuments(query: string): Promise<Requirement[]> {
  validateEnv();
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`${base()}/search?${params}`, { headers: auth() });
  if (!res.ok) throw new Error(`Aha API error: ${res.status} ${await res.text()}`);
  const data = await res.json() as { records: (Requirement & { type: string })[] };
  return data.records.filter(r => r.type === 'Requirement');
}

export async function createRequirement(
  featureId: string,
  input: { name: string; description: string }
): Promise<Requirement> {
  validateEnv();
  const res = await fetch(`${base()}/features/${featureId}/requirements`, {
    method: 'POST',
    headers: auth(),
    body: JSON.stringify({ requirement: input }),
  });
  if (!res.ok) throw new Error(`Aha API error: ${res.status} ${await res.text()}`);
  return (await res.json() as { requirement: Requirement }).requirement;
}

export async function updateRequirement(
  requirementRefNum: string,
  input: { name?: string; description?: string }
): Promise<Requirement> {
  validateEnv();
  const res = await fetch(`${base()}/requirements/${requirementRefNum}`, {
    method: 'PUT',
    headers: auth(),
    body: JSON.stringify({ requirement: input }),
  });
  if (!res.ok) throw new Error(`Aha API error: ${res.status} ${await res.text()}`);
  return (await res.json() as { requirement: Requirement }).requirement;
}
