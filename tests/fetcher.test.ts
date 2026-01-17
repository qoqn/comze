import { describe, test, expect, mock, afterEach } from "bun:test";
import { fetchPackage, fetchAllPackages } from "../src/fetcher";

describe("fetchPackage", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns package info for valid package", async () => {
    const mockResponse = {
      packages: {
        "vendor/package": [
          {
            version: "2.0.0",
            version_normalized: "2.0.0.0",
            time: "2024-01-01T12:00:00+00:00",
          },
          {
            version: "1.0.0",
            version_normalized: "1.0.0.0",
            time: "2023-01-01T12:00:00+00:00",
          },
        ],
      },
    };

    // @ts-expect-error - mocking fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await fetchPackage("vendor/package");
    expect(result).not.toBeNull();
    expect(result?.latestVersion).toBe("2.0.0");
    expect(result?.releaseTime).toBe("2024-01-01T12:00:00+00:00");
  });

  test("returns null for non-existent package", async () => {
    // @ts-expect-error - mocking fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      }),
    );

    const result = await fetchPackage("nonexistent/package");
    expect(result).toBeNull();
  });

  test("returns null for empty versions", async () => {
    // @ts-expect-error - mocking fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ packages: { "vendor/package": [] } }),
      }),
    );

    const result = await fetchPackage("vendor/package");
    expect(result).toBeNull();
  });

  test("skips dev versions and returns latest stable", async () => {
    const mockResponse = {
      packages: {
        "vendor/package": [
          {
            version: "dev-main",
            version_normalized: "dev-main",
            time: "2024-02-01T12:00:00+00:00",
          },
          {
            version: "2.0.0-beta",
            version_normalized: "2.0.0.0-beta",
            time: "2024-01-15T12:00:00+00:00",
          },
          {
            version: "1.5.0",
            version_normalized: "1.5.0.0",
            time: "2024-01-01T12:00:00+00:00",
          },
        ],
      },
    };

    // @ts-expect-error - mocking fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await fetchPackage("vendor/package");
    expect(result?.latestVersion).toBe("1.5.0");
  });

  test("falls back to first version if no stable versions", async () => {
    const mockResponse = {
      packages: {
        "vendor/package": [
          {
            version: "dev-main",
            version_normalized: "dev-main",
            time: "2024-02-01T12:00:00+00:00",
          },
          {
            version: "dev-develop",
            version_normalized: "dev-develop",
            time: "2024-01-15T12:00:00+00:00",
          },
        ],
      },
    };

    // @ts-expect-error - mocking fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await fetchPackage("vendor/package");
    expect(result?.latestVersion).toBe("dev-main");
  });

  test("returns null on fetch error", async () => {
    // @ts-expect-error - mocking fetch
    globalThis.fetch = mock(() => Promise.reject(new Error("Network error")));

    const result = await fetchPackage("vendor/package");
    expect(result).toBeNull();
  });

  test("returns null when packages object is missing", async () => {
    // @ts-expect-error - mocking fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    const result = await fetchPackage("vendor/package");
    expect(result).toBeNull();
  });

  test("returns first eligible when preferStable is false", async () => {
    const mockResponse = {
      packages: {
        "vendor/package": [
          {
            version: "2.0.0-beta",
            version_normalized: "2.0.0.0-beta",
            time: "2024-02-01T12:00:00+00:00",
          },
          {
            version: "1.5.0",
            version_normalized: "1.5.0.0",
            time: "2024-01-01T12:00:00+00:00",
          },
        ],
      },
    };

    // @ts-expect-error - mocking fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await fetchPackage("vendor/package", "beta", false);
    expect(result?.latestVersion).toBe("2.0.0-beta");
  });
  test("parses PHP requirement from package", async () => {
    const mockResponse = {
      packages: {
        "vendor/package": [
          {
            version: "1.5.0",
            version_normalized: "1.5.0.0",
            time: "2024-01-01T12:00:00+00:00",
            require: { php: ">=8.1" },
          },
        ],
      },
    };

    // @ts-expect-error - mocking fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await fetchPackage("vendor/package");
    expect(result?.phpRequirement).toBe(">=8.1");
  });

  test("detects available major version when current version is provided", async () => {
    const mockResponse = {
      packages: {
        "vendor/package": [
          {
            version: "2.0.0",
            version_normalized: "2.0.0.0",
            time: "2024-02-01T12:00:00+00:00",
          },
          {
            version: "1.5.0",
            version_normalized: "1.5.0.0",
            time: "2024-01-01T12:00:00+00:00",
          },
        ],
      },
    };

    // @ts-expect-error - mocking fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await fetchPackage(
      "vendor/package",
      "stable",
      true,
      "1.0.0",
      false,
    );
    expect(result?.latestVersion).toBe("1.5.0");
    expect(result?.majorVersion).toBe("2.0.0");
  });

  test("does not report major version if already on latest major", async () => {
    const mockResponse = {
      packages: {
        "vendor/package": [
          {
            version: "2.5.0",
            version_normalized: "2.5.0.0",
            time: "2024-02-01T12:00:00+00:00",
          },
        ],
      },
    };

    // @ts-expect-error - mocking fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await fetchPackage(
      "vendor/package",
      "stable",
      true,
      "^2.0.0",
    );
    expect(result?.latestVersion).toBe("2.5.0");
    expect(result?.majorVersion).toBeUndefined();
  });
});

describe("fetchAllPackages", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("fetches multiple packages", async () => {
    // @ts-expect-error - mocking fetch
    globalThis.fetch = mock((url: string) => {
      const packageName = url
        .replace("https://repo.packagist.org/p2/", "")
        .replace(".json", "");
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            packages: {
              [packageName]: [
                {
                  version: "1.0.0",
                  version_normalized: "1.0.0.0",
                  time: "2024-01-01T12:00:00+00:00",
                },
              ],
            },
          }),
      });
    });

    const packages = {
      "vendor/package1": "^1.0",
      "vendor/package2": "^2.0",
    };

    const results = await fetchAllPackages(packages);
    expect(results.size).toBe(2);
    expect(results.has("vendor/package1")).toBe(true);
    expect(results.has("vendor/package2")).toBe(true);
  });

  test("handles failed fetches gracefully", async () => {
    let callCount = 0;
    // @ts-expect-error - mocking fetch
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            packages: {
              "vendor/package2": [
                {
                  version: "2.0.0",
                  version_normalized: "2.0.0.0",
                  time: "2024-01-01T12:00:00+00:00",
                },
              ],
            },
          }),
      });
    });

    const packages = {
      "vendor/package1": "^1.0",
      "vendor/package2": "^2.0",
    };

    const results = await fetchAllPackages(packages);
    expect(results.size).toBe(1);
    expect(results.has("vendor/package2")).toBe(true);
  });

  test("returns empty map for empty input", async () => {
    const results = await fetchAllPackages({});
    expect(results.size).toBe(0);
  });
});
