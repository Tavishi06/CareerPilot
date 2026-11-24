import assert from "node:assert/strict";
import test from "node:test";

import {
  ApplicationApiError,
  createApplication,
  deleteApplication,
  listApplications,
  updateApplication,
} from "../src/applicationsApi.js";

const BASE_URL = "http://localhost:8000";

test("lists applications and safely encodes status filters", async (context) => {
  context.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    status: 200,
    json: async () => [{ id: "app-1" }],
  }));

  const result = await listApplications(BASE_URL, "in review & more");

  assert.deepEqual(result, [{ id: "app-1" }]);
  assert.equal(
    globalThis.fetch.mock.calls[0].arguments[0],
    `${BASE_URL}/api/v1/applications?status=in%20review%20%26%20more`
  );
});

test("creates applications with JSON request bodies", async (context) => {
  context.mock.method(globalThis, "fetch", async (_url, options) => ({
    ok: true,
    status: 201,
    json: async () => JSON.parse(options.body),
  }));
  const application = { company: "Example", role_title: "Engineer" };

  assert.deepEqual(await createApplication(BASE_URL, application), application);
  assert.equal(globalThis.fetch.mock.calls[0].arguments[1].method, "POST");
});

test("updates and deletes an application with encoded identifiers", async (context) => {
  context.mock.method(globalThis, "fetch", async (_url, options) => ({
    ok: true,
    status: options.method === "DELETE" ? 204 : 200,
    json: async () => ({ id: "id/with space" }),
  }));

  await updateApplication(BASE_URL, "id/with space", { company: "Example" });
  const deleted = await deleteApplication(BASE_URL, "id/with space");

  assert.equal(
    globalThis.fetch.mock.calls[0].arguments[0],
    `${BASE_URL}/api/v1/applications/id%2Fwith%20space`
  );
  assert.equal(globalThis.fetch.mock.calls[1].arguments[1].method, "DELETE");
  assert.equal(deleted, null);
});

test("surfaces API validation details with the HTTP status", async (context) => {
  context.mock.method(globalThis, "fetch", async () => ({
    ok: false,
    status: 422,
    json: async () => ({
      detail: [{ msg: "Company is required." }, { msg: "Role is required." }],
    }),
  }));

  await assert.rejects(
    createApplication(BASE_URL, {}),
    (error) =>
      error instanceof ApplicationApiError &&
      error.statusCode === 422 &&
      error.message === "Company is required. Role is required."
  );
});

test("surfaces server error details instead of returning success-shaped data", async (context) => {
  context.mock.method(globalThis, "fetch", async () => ({
    ok: false,
    status: 500,
    json: async () => ({ detail: "Database unavailable." }),
  }));

  await assert.rejects(
    listApplications(BASE_URL),
    (error) =>
      error instanceof ApplicationApiError &&
      error.statusCode === 500 &&
      error.message === "Database unavailable."
  );
});
