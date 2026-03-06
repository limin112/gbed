#!/usr/bin/env node

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { execFile } = require("node:child_process");
const Busboy = require("busboy");

// --- CLI ---

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: gbed --folder-id <FOLDER_ID> [options]

Options:
  --folder-id <id>   Google Drive folder ID (or set GDRIVE_FOLDER_ID)
                     If omitted, auto-creates an "obsidian-images" folder
  --port <port>      Port to listen on (default: 52323)
  --host <host>      Host to bind to (default: 127.0.0.1)
  --help, -h         Show this help message

Example:
  gbed
  gbed --folder-id 1SWqsJ0MV9MXU5WkITiZnxoIO69aTjIAR
  gbed --port 8080`);
  process.exit(0);
}

function getArg(name, fallback) {
  const i = args.indexOf(name);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : fallback;
}

let FOLDER_ID = getArg("--folder-id", process.env.GDRIVE_FOLDER_ID);
const PORT = Number(getArg("--port", process.env.GDRIVE_PORT || "52323"));
const HOST = getArg("--host", process.env.GDRIVE_HOST || "127.0.0.1");
const TMP_DIR = path.join(os.tmpdir(), "gdrive-upload");
const GWS_TIMEOUT = 30000;
const DEFAULT_FOLDER_NAME = "obsidian-images";

// --- Core ---

fs.mkdirSync(TMP_DIR, { recursive: true });

function gws(args) {
  return new Promise((resolve, reject) => {
    execFile("gws", args, { timeout: GWS_TIMEOUT }, (err, stdout) => {
      if (err) return reject(err);
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(`Failed to parse gws output: ${stdout}`));
      }
    });
  });
}

async function handleUpload(req, res) {
  let tmpPath = null;

  try {
    const { filePath, fileName } = await new Promise((resolve, reject) => {
      const busboy = Busboy({ headers: req.headers });
      let resolved = false;

      busboy.on("file", (_fieldname, file, info) => {
        if (resolved) {
          file.resume();
          return;
        }
        resolved = true;

        const ext = path.extname(info.filename) || ".png";
        const baseName = path.basename(info.filename, ext);
        const rand = crypto.randomBytes(4).toString("hex");
        const safeName = `${Date.now()}-${rand}${ext}`;
        const filePath = path.join(TMP_DIR, safeName);
        const ws = fs.createWriteStream(filePath);

        file.pipe(ws);
        ws.on("finish", () =>
          resolve({ filePath, fileName: `${baseName}-${rand}${ext}` })
        );
        ws.on("error", reject);
      });

      busboy.on("error", reject);
      busboy.on("finish", () => {
        if (!resolved) reject(new Error("No file field found in request"));
      });

      req.pipe(busboy);
    });

    tmpPath = filePath;

    const uploaded = await gws([
      "drive", "files", "create",
      "--upload", filePath,
      "--json", JSON.stringify({ name: fileName, parents: [FOLDER_ID] }),
    ]);

    const fileId = uploaded.id;
    if (!fileId) throw new Error("No file ID returned from upload");

    await gws([
      "drive", "permissions", "create",
      "--params", JSON.stringify({ fileId }),
      "--json", JSON.stringify({ role: "reader", type: "anyone" }),
    ]);

    const url = `https://lh3.googleusercontent.com/d/${fileId}`;
    console.log(`Uploaded: ${fileName} -> ${url}`);

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ url }));
  } catch (err) {
    console.error("Upload failed:", err.message);
    res.writeHead(500, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ error: err.message }));
  } finally {
    if (tmpPath) {
      fs.unlink(tmpPath, () => {});
    }
  }
}

async function findOrCreateFolder() {
  // Search for existing folder
  const result = await gws([
    "drive", "files", "list",
    "--params", JSON.stringify({
      q: `name='${DEFAULT_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id,name)",
    }),
  ]);

  if (result.files && result.files.length > 0) {
    console.log(`Found existing folder: ${DEFAULT_FOLDER_NAME} (${result.files[0].id})`);
    return result.files[0].id;
  }

  // Create new folder
  console.log(`Creating folder: ${DEFAULT_FOLDER_NAME}`);
  const folder = await gws([
    "drive", "files", "create",
    "--json", JSON.stringify({ name: DEFAULT_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  ]);

  // Set public readable
  await gws([
    "drive", "permissions", "create",
    "--params", JSON.stringify({ fileId: folder.id }),
    "--json", JSON.stringify({ role: "reader", type: "anyone" }),
  ]);

  console.log(`Created folder: ${DEFAULT_FOLDER_NAME} (${folder.id})`);
  return folder.id;
}

async function main() {
  if (!FOLDER_ID) {
    FOLDER_ID = await findOrCreateFolder();
  }

  const server = http.createServer((req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
    } else if (req.method === "POST" && req.url === "/upload") {
      handleUpload(req, res);
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`gbed running at http://${HOST}:${PORT}/upload`);
    console.log(`Uploading to Google Drive folder: ${FOLDER_ID}`);
  });
}

main().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
