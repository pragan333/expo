import ExpoWebBrowser, {
  normalizeUrl,
  featureObjectToString,
} from '../ExpoWebBrowser.web';

describe(normalizeUrl, () => {
  it(`normalizes url`, async () => {
    expect(normalizeUrl(new URL('https://expo.io'))).toBe('expo.io/');
    expect(normalizeUrl(new URL('HTTP://localhost:8081/FOO/bar?a=b&b=a#123'))).toBe(
      'localhost:8081/foo/bar'
    );
    expect(normalizeUrl(new URL('exp://foobar:'))).toBe('null');
    expect(normalizeUrl(new URL('https://localhost:777//fooo//bser/'))).toBe(
      'localhost:777/fooo/bser/'
    );
  });
});

describe('featureObjectToString', () => {
  it(`converts object to string`, async () => {
    expect(
      featureObjectToString({
        foo: 'bar',
        // Test that empty strings are omitted
        invalid: '',
        // Test that booleans are converted to yes/no strings
        enabled: true,
        disabled: false,
        // Test that string booleans are left alone
        gotMilk: 'yes',
      })
    ).toBe('foo=bar,enabled=yes,disabled=no,gotMilk=yes');
  });
});

describe(ExpoWebBrowser.maybeCompleteAuthSession, () => {
  const getHandle = () => 'ExpoWebBrowserRedirectHandle';
  const getRedirectUrlHandle = (hash: string) => `ExpoWebBrowser_RedirectUrl_${hash}`;

  let originalWindow: any;
  let store: Record<string, string>;

  beforeEach(() => {
    originalWindow = global.window;
    store = {};
    (global as any).window = {
      ...(originalWindow ?? {}),
      location: {
        href: 'https://example.com/auth',
        origin: 'https://example.com',
        protocol: 'https:',
        pathname: '/auth',
      },
      localStorage: {
        getItem: jest.fn((key: string) => store[key] ?? null),
        setItem: jest.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete store[key];
        }),
      },
    };
  });

  afterEach(() => {
    if (originalWindow) {
      (global as any).window = originalWindow;
    } else {
      delete (global as any).window;
    }
    store = {};
    jest.resetAllMocks();
  });

  it('returns failed result when no session handle exists', () => {
    expect(ExpoWebBrowser.maybeCompleteAuthSession({})).toEqual({
      type: 'failed',
      message: 'No auth session is currently in progress',
    });
  });

  it('fails when redirect URL does not match current URL', () => {
    const handle = 'abc';
    window.localStorage.setItem(getHandle(), handle);
    window.localStorage.setItem(getRedirectUrlHandle(handle), 'https://other.com/redirect');

    const currentUrl = normalizeUrl(window.location as any);
    const result = ExpoWebBrowser.maybeCompleteAuthSession({});
    expect(result).toEqual({
      type: 'failed',
      message: `Current URL "${currentUrl}" and original redirect URL "https://other.com/redirect" do not match.`,
    });
  });
});
