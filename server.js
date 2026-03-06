const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFile } = require("node:child_process");
const Busboy = require("busboy");

const PORT = 52323;
const HOST = "127.0.0.1";
const FOLDER_ID = "1SWqsJ0MV9MXU5WkITiZnxoIO69aTjIAR";
const TMP_DIR = "/tmp/gdrive-upload";
const GWS_TIMEOUT = 30000;

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

    // Upload to Google Drive
    const uploaded = await gws([
      "drive",
      "files",
      "create",
      "--upload",
      filePath,
      "--json",
      JSON.stringify({ name: fileName, parents: [FOLDER_ID] }),
    ]);

    const fileId = uploaded.id;
    if (!fileId) throw new Error("No file ID returned from upload");

    const url = `https://lh3.googleusercontent.com/d/${fileId}`;
    console.log(`Uploaded: ${fileName} -> ${url}`);

    // Set public permission (must complete before returning URL)
    await gws([
      "drive",
      "permissions",
      "create",
      "--params",
      JSON.stringify({ fileId }),
      "--json",
      JSON.stringify({ role: "reader", type: "anyone" }),
    ]);

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
  console.log(`gdrive-image-server running at http://${HOST}:${PORT}/upload`);
});
