import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "../src/server.js";

const credentials = Buffer.from("captain:correct-horse").toString("base64");
let baseUrl;
let server;

before(async () => {
  server = createServer({
    SECRET_MESSAGE: "classified message",
    USERNAME: "captain",
    PASSWORD: "correct-horse",
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(() => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))));

test("GET / returns the greeting", async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "Hello, world!\n");
});

test("GET /secret requests Basic Auth", async () => {
  const response = await fetch(`${baseUrl}/secret`);
  assert.equal(response.status, 401);
  assert.match(response.headers.get("www-authenticate"), /^Basic /);
  assert.equal(await response.text(), "Invalid username or password\n");
});

test("GET /secret rejects incorrect credentials", async () => {
  const response = await fetch(`${baseUrl}/secret`, {
    headers: { authorization: `Basic ${Buffer.from("captain:wrong").toString("base64")}` },
  });
  assert.equal(response.status, 401);
});

test("GET /secret returns the configured message", async () => {
  const response = await fetch(`${baseUrl}/secret`, {
    headers: { authorization: `Basic ${credentials}` },
  });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "classified message\n");
});

