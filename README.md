# gbed

Use Google Drive as your image bed. A lightweight local proxy that uploads images to Google Drive and returns direct-access URLs.

Designed as a bridge between [obsidian-image-uploader](https://github.com/yaleiyale/obsidian-image-uploader) and [gws](https://github.com/nicholasgasior/gws) CLI.

```
Obsidian (paste image)
  → obsidian-image-uploader (HTTP POST)
    → gbed (http://127.0.0.1:52323/upload)
      → gws drive files create (upload to Google Drive)
      → gws drive permissions create (set public)
    ← returns {"url": "https://lh3.googleusercontent.com/d/FILE_ID"}
  ← inserts ![](url) into Markdown
```

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [gws](https://github.com/nicholasgasior/gws) CLI installed and authenticated

## Install

```bash
git clone https://github.com/limin112/gbed.git
cd gbed
npm install
```

## Usage

```bash
# Just run it — auto-creates an "obsidian-images" folder on first launch
node server.js

# Or specify an existing folder
node server.js --folder-id YOUR_FOLDER_ID
```

Options:

```
--folder-id <id>   Google Drive folder ID (or set GDRIVE_FOLDER_ID)
                   If omitted, auto-creates an "obsidian-images" folder
--port <port>      Port to listen on (default: 52323)
--host <host>      Host to bind to (default: 127.0.0.1)
--help, -h         Show help
```

Environment variables `GDRIVE_FOLDER_ID`, `GDRIVE_PORT`, `GDRIVE_HOST` are also supported.

## Update

```bash
cd gbed
git pull
npm install
```

## Configure obsidian-image-uploader

In Obsidian Settings → Image Uploader:

| Setting | Value |
|---------|-------|
| Api Endpoint | `http://127.0.0.1:52323/upload` |
| Upload Header | `{}` |
| Upload Body | `{"image": "$FILE"}` |
| Image Url Path | `url` |

## (Optional) Auto-start on macOS

Create `~/Library/LaunchAgents/com.gbed.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.gbed</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/path/to/gbed/server.js</string>
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
launchctl load ~/Library/LaunchAgents/com.gbed.plist
```

## Test

```bash
curl -X POST http://127.0.0.1:52323/upload -F "image=@/path/to/test.png"
# {"url":"https://lh3.googleusercontent.com/d/..."}
```

## License

MIT
