const WEB3_STORAGE_TOKEN = process.env.REACT_APP_WEB3_STORAGE_TOKEN || '';

const fetchWithRetry = async (url, options, retries = 3, backoffMs = 1000, timeoutMs = 20000) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) return res;
      // retry on 5xx
      if (res.status >= 500 && attempt < retries) {
        await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
};

export const uploadFileToWeb3Storage = async (file) => {
  if (!WEB3_STORAGE_TOKEN) throw new Error('Missing REACT_APP_WEB3_STORAGE_TOKEN');
  const res = await fetchWithRetry('https://api.web3.storage/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${WEB3_STORAGE_TOKEN}` },
    body: file
  });
  if (!res.ok) throw new Error('Web3.Storage upload failed');
  const json = await res.json();
  return json.cid;
};

export const uploadJsonToWeb3Storage = async (obj) => {
  if (!WEB3_STORAGE_TOKEN) throw new Error('Missing REACT_APP_WEB3_STORAGE_TOKEN');
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
  const res = await fetchWithRetry('https://api.web3.storage/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${WEB3_STORAGE_TOKEN}` },
    body: blob
  });
  if (!res.ok) throw new Error('Web3.Storage JSON upload failed');
  const json = await res.json();
  return json.cid;
};


