const DEFAULT_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/'
];

export const ipfsToHttp = (cidOrUri, gateways = DEFAULT_GATEWAYS) => {
  if (!cidOrUri) return null;
  const cid = cidOrUri.startsWith('ipfs://') ? cidOrUri.replace('ipfs://', '') : cidOrUri;
  return gateways.map(g => `${g}${cid}`);
};

export const firstGatewayUrl = (cidOrUri) => {
  const urls = ipfsToHttp(cidOrUri);
  return urls && urls.length ? urls[0] : null;
};

export const fetchIpfsJson = async (cidOrUri) => {
  const urls = ipfsToHttp(cidOrUri);
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}
  }
  throw new Error('Failed to fetch IPFS JSON');
};


