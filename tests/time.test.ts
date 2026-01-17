import { describe, test, expect } from "bun:test";
import { formatAge, getAgeMonths } from "../src/utils/time";

describe("formatAge", () => {
  test('returns "now" for very recent dates', () => {
    const now = new Date().toISOString();
    expect(formatAge(now)).toBe("now");
  });

  test("returns hours for dates less than a day old", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatAge(twoHoursAgo)).toBe("2 h");
  });

  test("returns days for dates less than a week old", () => {
    const threeDaysAgo = new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(formatAge(threeDaysAgo)).toBe("3 d");
  });

  test("returns weeks for dates less than a month old", () => {
    const twoWeeksAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(formatAge(twoWeeksAgo)).toBe("2 w");
  });

  test("returns months for dates less than a year old", () => {
    const threeMonthsAgo = new Date(
      Date.now() - 90 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(formatAge(threeMonthsAgo)).toBe("3 mo");
  });

  test("returns years for dates older than a year", () => {
    const twoYearsAgo = new Date(
      Date.now() - 730 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(formatAge(twoYearsAgo)).toBe("2 y");
  });

  test("returns minutes for dates less than an hour old", () => {
    const thirtyMinutesAgo = new Date(
      Date.now() - 30 * 60 * 1000,
    ).toISOString();
    expect(formatAge(thirtyMinutesAgo)).toBe("30 m");
  });

  test("handles edge case: exactly 1 day", () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatAge(oneDayAgo)).toBe("1 d");
  });

  test("handles edge case: exactly 1 year", () => {
    const oneYearAgo = new Date(
      Date.now() - 365 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(formatAge(oneYearAgo)).toBe("1 y");
  });
});

describe("getAgeMonths", () => {
  test("returns 0 for recent dates", () => {
    const now = new Date().toISOString();
    expect(getAgeMonths(now)).toBe(0);
  });

  test("returns correct months for past dates", () => {
    const threeMonthsAgo = new Date(
      Date.now() - 90 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(getAgeMonths(threeMonthsAgo)).toBe(3);

    const sixMonthsAgo = new Date(
      Date.now() - 180 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(getAgeMonths(sixMonthsAgo)).toBe(6);

    const twelveMonthsAgo = new Date(
      Date.now() - 365 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(getAgeMonths(twelveMonthsAgo)).toBe(12);

    const twentyFourMonthsAgo = new Date(
      Date.now() - 730 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(getAgeMonths(twentyFourMonthsAgo)).toBe(24);
  });

  test("handles edge cases", () => {
    const almost3Months = new Date(
      Date.now() - 89 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(getAgeMonths(almost3Months)).toBe(2);
  });
});
