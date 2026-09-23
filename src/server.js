import http from "node:http";
import { pathToFileURL } from "node:url";

function unauthorized(response) {
  response.writeHead(401, {
    "content-type": "text/plain; charset=utf-8",
    "www-authenticate": 'Basic realm="Secret area", charset="UTF-8"',
  });
  response.end("Invalid username or password\n");
}

function hasValidCredentials(request, username, password) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Basic ")) return false;

  try {
    const decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator === -1) return false;

    return decoded.slice(0, separator) === username && decoded.slice(separator + 1) === password;
  } catch {
    return false;
  }
}

export function createServer(environment = process.env) {
  const { SECRET_MESSAGE, USERNAME, PASSWORD } = environment;
  if (!SECRET_MESSAGE || !USERNAME || !PASSWORD) {
    throw new Error("SECRET_MESSAGE, USERNAME and PASSWORD must be configured");
  }

  return http.createServer((request, response) => {
    if (request.method === "GET" && request.url === "/") {
      response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      response.end("Hello, world!\n");
      return;
    }

    if (request.method === "GET" && request.url === "/secret") {
      if (!hasValidCredentials(request, USERNAME, PASSWORD)) {
        unauthorized(response);
        return;
      }

      response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      response.end(`${SECRET_MESSAGE}\n`);
      return;
    }

    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end('{"status":"ok"}\n');
      return;
    }

    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
  });
}

const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  const host = process.env.HOST ?? "0.0.0.0";
  const port = Number(process.env.PORT ?? 3000);
  const server = createServer();

  server.listen(port, host, () => console.log(`Service listening on http://${host}:${port}`));

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close((error) => process.exit(error ? 1 : 0));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
