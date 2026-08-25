import { describe, expect, it } from "vitest";

describe("Supabase server configuration", () => {
  it("can access the configured voting table without exposing credentials", async () => {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const table = process.env.VOTATION_TABLE;

    expect(url).toMatch(/^https:\/\//);
    expect(serviceRoleKey).toBeTruthy();
    expect(table).toMatch(/^[A-Za-z_][A-Za-z0-9_]*$/);

    const response = await fetch(
      `${url}/rest/v1/${encodeURIComponent(table!)}?select=*&limit=1`,
      {
        method: "GET",
        headers: {
          apikey: serviceRoleKey!,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    );

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    expect(response.status).toBeLessThan(500);
  }, 15_000);
});
