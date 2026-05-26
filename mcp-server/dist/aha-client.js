function validateEnv() {
    if (!process.env.AHA_SUBDOMAIN)
        throw new Error('AHA_SUBDOMAIN environment variable is not set');
    if (!process.env.AHA_API_KEY)
        throw new Error('AHA_API_KEY environment variable is not set');
}
const base = () => `https://${process.env.AHA_SUBDOMAIN}.aha.io/api/v1`;
const auth = () => ({
    Authorization: `Bearer ${process.env.AHA_API_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
});
export async function getRecord(referenceNum) {
    validateEnv();
    const res = await fetch(`${base()}/features/${referenceNum}`, { headers: auth() });
    if (!res.ok)
        throw new Error(`Aha API error: ${res.status} ${await res.text()}`);
    return (await res.json()).feature;
}
export async function searchDocuments(query) {
    validateEnv();
    const params = new URLSearchParams({ q: query });
    const res = await fetch(`${base()}/search?${params}`, { headers: auth() });
    if (!res.ok)
        throw new Error(`Aha API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.records.filter(r => r.type === 'Requirement');
}
export async function createRequirement(featureId, input) {
    validateEnv();
    const res = await fetch(`${base()}/features/${featureId}/requirements`, {
        method: 'POST',
        headers: auth(),
        body: JSON.stringify({ requirement: input }),
    });
    if (!res.ok)
        throw new Error(`Aha API error: ${res.status} ${await res.text()}`);
    return (await res.json()).requirement;
}
export async function updateRequirement(requirementRefNum, input) {
    validateEnv();
    const res = await fetch(`${base()}/requirements/${requirementRefNum}`, {
        method: 'PUT',
        headers: auth(),
        body: JSON.stringify({ requirement: input }),
    });
    if (!res.ok)
        throw new Error(`Aha API error: ${res.status} ${await res.text()}`);
    return (await res.json()).requirement;
}
