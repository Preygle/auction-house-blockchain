import { uploadFileToWeb3Storage, uploadJsonToWeb3Storage } from '../../utils/storage';

describe('Web3.Storage uploads', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, REACT_APP_WEB3_STORAGE_TOKEN: 'test-token' };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  test('uploadFileToWeb3Storage: success returns CID', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ cid: 'bafy123' })
    });

    const file = new Blob(['hello']);
    const cid = await uploadFileToWeb3Storage(file);
    expect(cid).toBe('bafy123');
    expect(global.fetch).toHaveBeenCalledWith('https://api.web3.storage/upload', expect.objectContaining({ method: 'POST' }));
  });

  test('uploadFileToWeb3Storage: 503 failure throws', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    const file = new Blob(['hello']);
    await expect(uploadFileToWeb3Storage(file)).rejects.toThrow('Web3.Storage upload failed');
  });

  test('uploadJsonToWeb3Storage: success returns CID', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ cid: 'bafyjson' })
    });

    const cid = await uploadJsonToWeb3Storage({ a: 1 });
    expect(cid).toBe('bafyjson');
  });

  test('uploadJsonToWeb3Storage: 503 failure throws', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(uploadJsonToWeb3Storage({ a: 1 })).rejects.toThrow('Web3.Storage JSON upload failed');
  });
});


