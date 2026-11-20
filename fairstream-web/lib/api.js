const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const ls = () => (typeof window !== 'undefined' ? window.localStorage : null);
export const getToken = () => ls()?.getItem('fs_token');
export const getRole = () => ls()?.getItem('fs_role') || 'listener';
export const saveSession = ({ token, role }) => { ls().setItem('fs_token', token); ls().setItem('fs_role', role); };
export const logout = () => { ls()?.clear(); window.location.href = '/login'; };
export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
export async function uploadFile(file) {
  const fd = new FormData(); fd.append('file', file);
  const res = await fetch(BASE + '/upload', { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload failed'); return data.url;
}
export const kes = n => 'KES ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const audioSrc = t => (t.ipfs_cid.startsWith('http') ? t.ipfs_cid : `https://gateway.pinata.cloud/ipfs/${t.ipfs_cid}`);
