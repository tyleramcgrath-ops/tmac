import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sniffImageType } from "@/lib/photos";
import { scanMessage } from "@/lib/scam-guard";
import { countryByCode, flagFor } from "@/lib/countries";

describe("passwords", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
    expect(await verifyPassword("wrong password", stored)).toBe(false);
  });

  it("rejects missing or malformed hashes", async () => {
    expect(await verifyPassword("anything", null)).toBe(false);
    expect(await verifyPassword("anything", "md5$abc")).toBe(false);
  });

  it("salts each hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });
});

describe("sniffImageType", () => {
  it("detects real image signatures", () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
  });

  it("rejects anything else, whatever its name", () => {
    expect(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("%PDF-1.7"))).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
  });
});

describe("scanMessage", () => {
  it("flags money requests and paid arrangements", () => {
    expect(scanMessage("can you send money via western union")).toEqual(
      expect.arrayContaining(["asks for money", "mentions a money-transfer service"]),
    );
    expect(scanMessage("my rates are 200 roses per hour")).toContain(
      "looks like a paid arrangement, which isn't allowed here",
    );
    expect(scanMessage("add me on telegram")).toContain("wants to move off the platform");
  });

  it("leaves ordinary flirting alone", () => {
    expect(scanMessage("Hey! Landing in Medellín next week, drinks?")).toEqual([]);
  });
});

describe("countries", () => {
  it("builds flags and names from ISO codes", () => {
    expect(flagFor("CO")).toBe("🇨🇴");
    expect(countryByCode("PT")).toMatchObject({ name: "Portugal", flag: "🇵🇹" });
    expect(countryByCode("XX")).toBeNull();
  });
});
