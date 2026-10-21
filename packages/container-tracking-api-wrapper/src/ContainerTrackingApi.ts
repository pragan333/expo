const ENDPOINT = 'https://container.vesselfinder.com/api/1.0';
const VALIDATION_REGEX = /^\w{3}(U|J|Z|R)\d{7}$/;
const POLL_INTERVAL_MS = 10_000;
const MIN_TIMEOUT_SECONDS = 10;

export type ContainerResponse = string;

export class ContainerTrackingApi {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('apiKey is required.');
    }
    this.apiKey = apiKey;
  }

  /**
   * Validates a container number.
   *
   * Rules:
   * 1. Must be exactly 11 characters long.
   * 2. Format: first three chars are alphanumeric, fourth is U/J/Z/R, followed by seven digits.
   * 3. The last digit must match a check digit computed via the standard ISO 6346 formula.
   */
  validateContainerNumber(containerNumber: string): boolean {
    if (containerNumber.length !== 11 || !VALIDATION_REGEX.test(containerNumber)) {
      return false;
    }

    const alphabet = '0123456789A BCDEFGHIJK LMNOPQRSTU VWXYZ';
    const checkSum =
      containerNumber
        .slice(0, -1)
        .split('')
        .reduce((sum, char, index) => sum + alphabet.indexOf(char) * Math.pow(2, index), 0) %
      11 %
      10;

    return String(checkSum) === containerNumber[containerNumber.length - 1];
  }

  /**
   * Performs a single GET request to the Container Tracking API.
   *
   * @param methodUrl - Path appended to the base endpoint URL.
   * @returns The raw response text.
   */
  private async call(methodUrl: string): Promise<Response> {
    const url = `${ENDPOINT}/${methodUrl}`;
    return fetch(url);
  }

  /**
   * Tracks a container by number.
   *
   * The API works asynchronously:
   *  - First call returns status `queued` (HTTP 202).
   *  - Subsequent calls return `processing` (HTTP 202) until done.
   *  - A non-202 response indicates completion (`success` or `error`).
   *
   * @param containerNumber - 11-character container number (e.g. "MEDU6965343").
   * @param sealine         - 2–4 character SCAC code (e.g. "MSCU"). Defaults to "AUTO".
   * @param timeout         - Max seconds to wait for a final response (default: 60).
   *                          Pass 0 or null to make only a single request.
   *                          Must be at least 10 seconds if non-zero.
   * @returns The raw response body as a string.
   */
  async container(
    containerNumber: string,
    sealine?: string,
    timeout: number | null = 60
  ): Promise<ContainerResponse> {
    if (!this.validateContainerNumber(containerNumber)) {
      throw new Error(`Invalid container number: ${containerNumber}`);
    }

    let methodUrl = `container/${this.apiKey}/${containerNumber}`;

    if (sealine !== undefined && sealine !== null) {
      if (sealine.length < 2 || sealine.length > 4) {
        throw new Error(`Invalid sealine: ${sealine}`);
      }
      methodUrl += `/${sealine}`;
    }

    if (timeout === null || timeout === 0) {
      const response = await this.call(methodUrl);
      return response.text();
    }

    if (timeout < MIN_TIMEOUT_SECONDS) {
      throw new Error(`The timeout should be at least ${MIN_TIMEOUT_SECONDS} seconds.`);
    }

    let remaining = timeout;

    while (remaining > 0) {
      const response = await this.call(methodUrl);
      if (response.status !== 202) {
        return response.text();
      }

      await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      remaining -= POLL_INTERVAL_MS / 1000;
    }

    throw new Error('Request timed out.');
  }
}
