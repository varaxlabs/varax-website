import { describe, it, expect } from "vitest";
import { buildPayload, toRFC3339, getFeaturesForPlan } from "../src/lib/license/payload";

describe("toRFC3339", () => {
  it("formats dates without milliseconds", () => {
    const date = new Date("2026-01-15T00:00:00.000Z");
    expect(toRFC3339(date)).toBe("2026-01-15T00:00:00Z");
  });

  it("strips milliseconds from arbitrary dates", () => {
    const date = new Date("2026-06-15T14:30:45.123Z");
    expect(toRFC3339(date)).toBe("2026-06-15T14:30:45Z");
  });
});

describe("getFeaturesForPlan", () => {
  it("includes explore for pro-annual", () => {
    const features = getFeaturesForPlan("pro-annual");
    expect(features).toContain("explore");
    expect(features).toContain("reports");
  });

  it("excludes explore for pro-monthly", () => {
    const features = getFeaturesForPlan("pro-monthly");
    expect(features).not.toContain("explore");
    expect(features).toContain("reports");
  });
});

describe("buildPayload", () => {
  it("produces alphabetically ordered keys in JSON", () => {
    const now = new Date("2026-01-15T00:00:00Z");
    const payload = buildPayload("Acme Corp", "pro-annual", 365, now);
    const json = JSON.stringify(payload);
    const keys = Object.keys(JSON.parse(json));
    expect(keys).toEqual(["expires", "features", "issued", "org", "plan"]);
  });

  it("sets correct expiry for annual plan", () => {
    const now = new Date("2026-01-15T00:00:00Z");
    const payload = buildPayload("Test Org", "pro-annual", 365, now);
    expect(payload.issued).toBe("2026-01-15T00:00:00Z");
    expect(payload.expires).toBe("2027-01-15T00:00:00Z");
  });

  it("sets correct expiry for monthly plan", () => {
    const now = new Date("2026-01-15T00:00:00Z");
    const payload = buildPayload("Test Org", "pro-monthly", 30, now);
    expect(payload.issued).toBe("2026-01-15T00:00:00Z");
    expect(payload.expires).toBe("2026-02-14T00:00:00Z");
  });
});
