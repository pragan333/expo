import { ContainerTrackingApi } from '../src/ContainerTrackingApi';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchResponse(status: number, body: string): jest.Mock {
  return jest.fn().mockResolvedValue({
    status,
    text: () => Promise.resolve(body),
  } as unknown as Response);
}

describe('ContainerTrackingApi', () => {
  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    it('throws when apiKey is empty', () => {
      expect(() => new ContainerTrackingApi('')).toThrow('apiKey is required.');
    });

    it('creates an instance with a valid apiKey', () => {
      expect(() => new ContainerTrackingApi('test-key')).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // validateContainerNumber
  // -------------------------------------------------------------------------
  describe('validateContainerNumber', () => {
    const api = new ContainerTrackingApi('dummy-key');

    it('returns true for a valid container number', () => {
      // MEDU6965343 is the canonical example from the API docs
      expect(api.validateContainerNumber('MEDU6965343')).toBe(true);
    });

    it('returns false when the number is shorter than 11 chars', () => {
      expect(api.validateContainerNumber('MEDU696534')).toBe(false);
    });

    it('returns false when the number is longer than 11 chars', () => {
      expect(api.validateContainerNumber('MEDU69653430')).toBe(false);
    });

    it('returns false when the fourth character is not U/J/Z/R', () => {
      expect(api.validateContainerNumber('MEDX6965343')).toBe(false);
    });

    it('returns false when the check digit is wrong', () => {
      // Change last digit so it does not match
      expect(api.validateContainerNumber('MEDU6965340')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // container — parameter validation
  // -------------------------------------------------------------------------
  describe('container – parameter validation', () => {
    const api = new ContainerTrackingApi('dummy-key');

    it('throws for an invalid container number', async () => {
      await expect(api.container('INVALID_NUM')).rejects.toThrow('Invalid container number');
    });

    it('throws when sealine is shorter than 2 characters', async () => {
      await expect(api.container('MEDU6965343', 'A')).rejects.toThrow('Invalid sealine');
    });

    it('throws when sealine is longer than 4 characters', async () => {
      await expect(api.container('MEDU6965343', 'ABCDE')).rejects.toThrow('Invalid sealine');
    });

    it('throws when timeout is between 1 and 9 seconds', async () => {
      await expect(api.container('MEDU6965343', undefined, 5)).rejects.toThrow(
        'timeout should be at least 10 seconds'
      );
    });
  });

  // -------------------------------------------------------------------------
  // container — single-shot mode (timeout 0 / null)
  // -------------------------------------------------------------------------
  describe('container – single-shot mode', () => {
    afterEach(() => jest.restoreAllMocks());

    it('makes exactly one request when timeout is 0', async () => {
      const mockFetch = mockFetchResponse(200, '{"status":"success"}');
      global.fetch = mockFetch;

      const api = new ContainerTrackingApi('my-key');
      const result = await api.container('MEDU6965343', undefined, 0);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toBe('{"status":"success"}');
    });

    it('makes exactly one request when timeout is null', async () => {
      const mockFetch = mockFetchResponse(200, '{"status":"success"}');
      global.fetch = mockFetch;

      const api = new ContainerTrackingApi('my-key');
      const result = await api.container('MEDU6965343', undefined, null);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toBe('{"status":"success"}');
    });
  });

  // -------------------------------------------------------------------------
  // container — polling mode
  // -------------------------------------------------------------------------
  describe('container – polling mode', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('returns immediately when first response is not 202', async () => {
      const mockFetch = mockFetchResponse(200, '{"status":"success"}');
      global.fetch = mockFetch;

      const api = new ContainerTrackingApi('my-key');
      const promise = api.container('MEDU6965343', 'MSCU', 30);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toBe('{"status":"success"}');
    });

    it('polls until non-202 response is received within timeout', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({ status: 202, text: () => Promise.resolve('queued') })
        .mockResolvedValueOnce({ status: 202, text: () => Promise.resolve('processing') })
        .mockResolvedValueOnce({ status: 200, text: () => Promise.resolve('{"status":"success"}') });

      global.fetch = mockFetch as unknown as typeof fetch;

      const api = new ContainerTrackingApi('my-key');
      const promise = api.container('MEDU6965343', undefined, 30);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toBe('{"status":"success"}');
    });

    it('throws when all retries exhaust the timeout', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValue({ status: 202, text: () => Promise.resolve('processing') });

      global.fetch = mockFetch as unknown as typeof fetch;

      const api = new ContainerTrackingApi('my-key');
      const promise = api.container('MEDU6965343', undefined, 10);
      // Attach the rejection handler BEFORE advancing timers to avoid unhandled rejection warnings.
      const assertion = expect(promise).rejects.toThrow('Request timed out.');

      await jest.runAllTimersAsync();
      await assertion;
    });

    it('appends sealine to the URL when provided', async () => {
      const mockFetch = mockFetchResponse(200, '{"status":"success"}');
      global.fetch = mockFetch;

      const api = new ContainerTrackingApi('MY_KEY');
      await api.container('MEDU6965343', 'MSCU', 0);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://container.vesselfinder.com/api/1.0/container/MY_KEY/MEDU6965343/MSCU'
      );
    });

    it('omits sealine from the URL when not provided', async () => {
      const mockFetch = mockFetchResponse(200, '{"status":"success"}');
      global.fetch = mockFetch;

      const api = new ContainerTrackingApi('MY_KEY');
      await api.container('MEDU6965343', undefined, 0);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://container.vesselfinder.com/api/1.0/container/MY_KEY/MEDU6965343'
      );
    });
  });
});
