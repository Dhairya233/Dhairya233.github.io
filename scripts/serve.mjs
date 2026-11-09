// Tiny static server for local preview: `npm run dev` (serves dist/ on http://localhost:8080).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".mp4": "video/mp4", ".woff2": "font/woff2", ".pdf": "application/pdf", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".json": "application/json" };
const port = Number(process.env.PORT) || 8080;
createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  let file = resolve(join(root, url));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try { if ((await stat(file)).isDirectory()) file = join(file, "index.html"); } catch { /* fallthrough */ }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" }).end(body);
  } catch {
    const nf = await readFile(join(root, "404.html")).catch(() => Buffer.from("Not found"));
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }).end(nf);
  }
}).listen(port, "127.0.0.1", () => console.log(`http://localhost:${port}/`));
