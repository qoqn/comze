import { describe, test, expect } from "bun:test";
import {
  renderTable,
  renderHeader,
  renderFooter,
  formatPackageChoice,
} from "../src/ui/render";
import type { PackageInfo } from "../src/types";

describe("formatPackageChoice", () => {
  test("formats major update correctly", () => {
    const pkg: PackageInfo = {
      name: "vendor/package",
      currentVersion: "^1.0",
      latestVersion: "2.0.0",
      diffType: "major",
      releaseTime: new Date().toISOString(),
      age: "1 d",
      ageMonths: 0,
    };
    const result = formatPackageChoice(pkg);
    expect(result).toContain("vendor/package");
    expect(result).toContain("^1.0");
    expect(result).toContain("2.0.0");
    expect(result).toContain("1 d");
  });

  test("formats minor update correctly", () => {
    const pkg: PackageInfo = {
      name: "vendor/package",
      currentVersion: "^1.0",
      latestVersion: "1.5.0",
      diffType: "minor",
      releaseTime: new Date().toISOString(),
      age: "2 w",
      ageMonths: 0,
    };
    const result = formatPackageChoice(pkg);
    expect(result).toContain("vendor/package");
    expect(result).toContain("1.5.0");
  });

  test("formats patch update correctly", () => {
    const pkg: PackageInfo = {
      name: "vendor/package",
      currentVersion: "^1.0.0",
      latestVersion: "1.0.5",
      diffType: "patch",
      releaseTime: new Date().toISOString(),
      age: "3 mo",
      ageMonths: 3,
    };
    const result = formatPackageChoice(pkg);
    expect(result).toContain("1.0.5");
  });
  test("includes colored age in output", () => {
    const pkg: PackageInfo = {
      name: "vendor/package",
      currentVersion: "^1.0",
      latestVersion: "2.0.0",
      diffType: "major",
      releaseTime: new Date().toISOString(),
      age: "1 mo",
      ageMonths: 1,
    };
    const result = formatPackageChoice(pkg);
    expect(result).toContain("1 mo");
  });

  test("includes major version availability info", () => {
    const pkg: PackageInfo = {
      name: "vendor/package",
      currentVersion: "^1.0",
      latestVersion: "1.5.0",
      diffType: "minor",
      releaseTime: new Date().toISOString(),
      age: "1 mo",
      ageMonths: 1,
      majorAvailable: "2.0.0",
    };
    const result = formatPackageChoice(pkg);
    expect(result).toContain("2.0.0 available");
  });

  test("includes PHP requirement info", () => {
    const pkg: PackageInfo = {
      name: "vendor/package",
      currentVersion: "^1.0",
      latestVersion: "1.5.0",
      diffType: "minor",
      releaseTime: new Date().toISOString(),
      age: "1 mo",
      ageMonths: 1,
      phpRequirement: ">=8.1",
    };
    const result = formatPackageChoice(pkg);
    expect(result).toContain("php >=8.1");
  });
});

describe("renderTable", () => {
  test("handles empty package list", () => {
    expect(() => renderTable([])).not.toThrow();
  });

  test("renders major update", () => {
    const packages: PackageInfo[] = [
      {
        name: "vendor/package",
        currentVersion: "^1.0",
        latestVersion: "2.0.0",
        diffType: "major",
        releaseTime: new Date().toISOString(),
        age: "1 d",
        ageMonths: 0,
      },
    ];
    expect(() => renderTable(packages)).not.toThrow();
  });

  test("renders minor update", () => {
    const packages: PackageInfo[] = [
      {
        name: "vendor/package",
        currentVersion: "^1.0",
        latestVersion: "1.5.0",
        diffType: "minor",
        releaseTime: new Date().toISOString(),
        age: "2 w",
        ageMonths: 0,
      },
    ];
    expect(() => renderTable(packages)).not.toThrow();
  });

  test("renders patch update", () => {
    const packages: PackageInfo[] = [
      {
        name: "vendor/package",
        currentVersion: "^1.0.0",
        latestVersion: "1.0.5",
        diffType: "patch",
        releaseTime: new Date().toISOString(),
        age: "3 mo",
        ageMonths: 3,
      },
    ];
    expect(() => renderTable(packages)).not.toThrow();
  });
});

describe("renderHeader", () => {
  test("renders without error", () => {
    expect(() => renderHeader("0.2.0")).not.toThrow();
  });
});

describe("renderFooter", () => {
  test("renders with updates", () => {
    expect(() => renderFooter(true)).not.toThrow();
  });

  test("renders without updates", () => {
    expect(() => renderFooter(false)).not.toThrow();
  });
});
