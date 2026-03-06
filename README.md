# gdrive-image-server

A lightweight local HTTP proxy that uploads images to Google Drive and returns direct-access URLs. Designed as a bridge between [obsidian-image-uploader](https://github.com/yaleiyale/obsidian-image-uploader) and [gws](https://github.com/nicholasgasior/gws) CLI.

```
Obsidian (paste image)
  → obsidian-image-uploader (HTTP POST)
    → gdrive-image-server (http://127.0.0.1:52323/upload)
      → gws drive files create (upload to Google Drive)
      → gws drive permissions create (set public)
    ← returns {"url": "https://lh3.googleusercontent.com/d/FILE_ID"}
  ← inserts ![](url) into Markdown
```

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [gws](https://github.com/nicholasgasior/gws) CLI installed and authenticated

## Setup

### 1. Create a Google Drive folder

```bash
gws drive files create --json '{"name": "obsidian-images", "mimeType": "application/vnd.google-apps.folder"}'
# Note the returned FOLDER_ID

gws drive permissions create --params '{"fileId": "FOLDER_ID"}' --json '{"role": "reader", "type": "anyone"}'
```

### 2. Configure and start the server

```bash
git clone https://github.com/YOUR_USERNAME/gdrive-image-server.git
cd gdrive-image-server
npm install
```

Edit `server.js` and set your `FOLDER_ID`:

```js
const FOLDER_ID = "your-folder-id-here";
```

Start the server:

```bash
node server.js
# gdrive-image-server running at http://127.0.0.1:52323/upload
```

### 3. Configure obsidian-image-uploader

In Obsidian Settings → Image Uploader:

| Setting | Value |
|---------|-------|
| Api Endpoint | `http://127.0.0.1:52323/upload` |
| Upload Header | `{}` |
| Upload Body | `{"image": "$FILE"}` |
| Image Url Path | `url` |

### 4. (Optional) Auto-start on macOS

Create `~/Library/LaunchAgents/com.gdrive-image-server.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.gdrive-image-server</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/path/to/gdrive-image-server/server.js</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.gdrive-image-server.plist
```

## Test

```bash
curl -X POST http://127.0.0.1:52323/upload -F "image=@/path/to/test.png"
# {"url":"https://lh3.googleusercontent.com/d/..."}
```

## License

MIT
