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
}

export interface Requirement {
  id: string;
  reference_num: string;
  name: string;
  description: string;
}

export async function getRecord(referenceNum: string): Promise<Feature> {
  const res = await fetch(`${base()}/features/${referenceNum}`, { headers: auth() });
  if (!res.ok) throw new Error(`Aha API error: ${res.status} ${await res.text()}`);
  return (await res.json() as { feature: Feature }).feature;
}

export async function searchDocuments(query: string): Promise<Requirement[]> {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`${base()}/requirements?${params}`, { headers: auth() });
  if (!res.ok) throw new Error(`Aha API error: ${res.status} ${await res.text()}`);
  return (await res.json() as { requirements: Requirement[] }).requirements;
}

export async function createRequirement(
  featureId: string,
  input: { name: string; description: string }
): Promise<Requirement> {
  const res = await fetch(`${base()}/features/${featureId}/requirements`, {
    method: 'POST',
    headers: auth(),
    body: JSON.stringify({ requirement: input }),
  });
  if (!res.ok) throw new Error(`Aha API error: ${res.status} ${await res.text()}`);
  return (await res.json() as { requirement: Requirement }).requirement;
}

export async function updateRequirement(
  requirementId: string,
  input: { name?: string; description?: string }
): Promise<Requirement> {
  const res = await fetch(`${base()}/requirements/${requirementId}`, {
    method: 'PUT',
    headers: auth(),
    body: JSON.stringify({ requirement: input }),
  });
  if (!res.ok) throw new Error(`Aha API error: ${res.status} ${await res.text()}`);
  return (await res.json() as { requirement: Requirement }).requirement;
}
