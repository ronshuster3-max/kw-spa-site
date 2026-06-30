const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const publicDir = path.join(root, "public");
const dataDir = path.join(root, "data");
const siteFile = path.join(dataDir, "site.json");
const leadsFile = path.join(dataDir, "leads.json");
const bookingsFile = path.join(dataDir, "bookings.json");
const port = process.env.PORT || 3000;
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2));
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  if (Buffer.isBuffer(body)) {
    res.end(body);
    return;
  }
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function cleanText(value, max = 400) {
  return String(value || "").trim().slice(0, max);
}

function isAuthed(req) {
  const token = process.env.ADMIN_TOKEN || "demo-admin";
  return req.headers.authorization === `Bearer ${token}`;
}

async function api(req, res) {
  if (req.url === "/api/site" && req.method === "GET") {
    return send(res, 200, await readJson(siteFile, {}));
  }

  if (req.url === "/api/site" && req.method === "PUT") {
    if (!isAuthed(req)) return send(res, 401, { error: "Admin token required." });
    const body = await parseBody(req);
    await writeJson(siteFile, body);
    return send(res, 200, { ok: true });
  }

  if (req.url === "/api/leads" && req.method === "GET") {
    if (!isAuthed(req)) return send(res, 401, { error: "Admin token required." });
    return send(res, 200, await readJson(leadsFile, []));
  }

  if (req.url === "/api/leads" && req.method === "POST") {
    const body = await parseBody(req);
    const lead = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name: cleanText(body.name, 120),
      phone: cleanText(body.phone, 80),
      email: cleanText(body.email, 160),
      message: cleanText(body.message, 1200)
    };
    if (!lead.name || (!lead.phone && !lead.email)) {
      return send(res, 400, { error: "Name and phone or email are required." });
    }
    const leads = await readJson(leadsFile, []);
    leads.unshift(lead);
    await writeJson(leadsFile, leads);
    return send(res, 201, { ok: true, lead });
  }

  if (req.url === "/api/bookings" && req.method === "GET") {
    if (!isAuthed(req)) return send(res, 401, { error: "Admin token required." });
    return send(res, 200, await readJson(bookingsFile, []));
  }

  if (req.url === "/api/bookings" && req.method === "POST") {
    const body = await parseBody(req);
    const booking = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name: cleanText(body.name, 120),
      phone: cleanText(body.phone, 80),
      service: cleanText(body.service, 160),
      preferredDate: cleanText(body.preferredDate, 80),
      preferredTime: cleanText(body.preferredTime, 80),
      note: cleanText(body.note, 800)
    };
    if (!booking.name || !booking.phone || !booking.service) {
      return send(res, 400, { error: "Name, phone, and service are required." });
    }
    const bookings = await readJson(bookingsFile, []);
    bookings.unshift(booking);
    await writeJson(bookingsFile, bookings);
    return send(res, 201, { ok: true, booking });
  }

  return send(res, 404, { error: "Not found." });
}

async function staticFile(req, res) {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const safePath = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(publicDir, safePath));

  if (!filePath.startsWith(publicDir)) {
    return send(res, 403, "Forbidden", "text/plain; charset=utf-8");
  }

  try {
    const data = await fs.readFile(filePath);
    send(res, 200, data, mimeTypes[path.extname(filePath)] || "application/octet-stream");
  } catch {
    send(res, 404, "Not found", "text/plain; charset=utf-8");
  }
}

http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) return await api(req, res);
    return await staticFile(req, res);
  } catch (error) {
    send(res, 500, { error: error.message || "Server error." });
  }
}).listen(port, host, () => {
  console.log(`KW Spa site running at http://${host}:${port}`);
  console.log(`Admin dashboard: http://${host}:${port}/admin.html`);
});
