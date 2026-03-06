# gbed

Use Google Drive as your image bed. A lightweight local proxy that uploads images to Google Drive and returns direct-access URLs.

用 Google Drive 当图床。轻量级本地代理，上传图片到 Google Drive 并返回可直接访问的图片链接。

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

## Prerequisites | 前置要求

- [Node.js](https://nodejs.org/) >= 18
- [gws](https://github.com/nicholasgasior/gws) CLI installed and authenticated | 已安装并完成认证

## Install | 安装

```bash
git clone https://github.com/limin112/gbed.git
cd gbed
npm install
```

## Usage | 使用

```bash
# Just run it — auto-creates an "obsidian-images" folder on first launch
# 直接运行，首次启动自动创建 obsidian-images 文件夹
node server.js

# Or specify an existing folder | 或指定已有文件夹
node server.js --folder-id YOUR_FOLDER_ID
```

Options | 选项:

```
--folder-id <id>   Google Drive folder ID (or set GDRIVE_FOLDER_ID)
                   Google Drive 文件夹 ID，不传则自动创建 obsidian-images
--port <port>      Port to listen on (default: 52323) | 监听端口
--host <host>      Host to bind to (default: 127.0.0.1) | 绑定地址
--help, -h         Show help | 显示帮助
```

Environment variables `GDRIVE_FOLDER_ID`, `GDRIVE_PORT`, `GDRIVE_HOST` are also supported.

也支持环境变量 `GDRIVE_FOLDER_ID`、`GDRIVE_PORT`、`GDRIVE_HOST`。

## Update | 更新

```bash
cd gbed
git pull
npm install
```

## Configure obsidian-image-uploader | 配置插件

In Obsidian Settings → Image Uploader | 在 Obsidian 设置 → Image Uploader 中配置:

| Setting | Value |
|---------|-------|
| Api Endpoint | `http://127.0.0.1:52323/upload` |
| Upload Header | `{}` |
| Upload Body | `{"image": "$FILE"}` |
| Image Url Path | `url` |

## (Optional) Auto-start on macOS | macOS 开机自启

Create | 创建 `~/Library/LaunchAgents/com.gbed.plist`:

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

## Test | 测试

```bash
curl -X POST http://127.0.0.1:52323/upload -F "image=@/path/to/test.png"
# {"url":"https://lh3.googleusercontent.com/d/..."}
```

## License

MIT
