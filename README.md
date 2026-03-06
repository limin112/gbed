# gbed

用 Google Drive 当图床。轻量级本地代理，上传图片到 Google Drive 并返回可直接访问的图片链接。

作为 obsidian-image-uploader插件和 [gws](https://github.com/nicholasgasior/gws) 命令行工具之间的桥梁。

```
Obsidian (复制/粘贴图片)
  → obsidian-image-uploader (HTTP POST)
    → gbed (http://127.0.0.1:52323/upload)
      → gws drive files create (上传至 Google Drive)
      → gws drive permissions create (设置为公开)
    ← 返回 {"url": "https://lh3.googleusercontent.com/d/FILE_ID"}
  ← 将 ![](url) 插入到 Markdown 中
```

## 前置要求

- [Node.js](https://nodejs.org/) >= 18
- 已安装并完成认证 [gws](https://github.com/nicholasgasior/gws) 命令行工具，记得勾选google drive作为资源库
- Obsidian里安装obsidian-image-uploader插件

## 安装

```bash
npm install -g gbed
```

或者用 git clone:

```bash
git clone https://github.com/limin112/gbed.git
cd gbed
npm install
```

## 使用

```bash
# npm 全局安装后直接运行，首次启动自动在google drive创建 obsidian-images 文件夹
gbed

# 或 git clone 方式
node server.js

# 指定已有google drive文件夹
gbed --folder-id YOUR_FOLDER_ID
```

选项:

```
--folder-id <id>   Google Drive 文件夹 ID（或设置 GDRIVE_FOLDER_ID）
                   不传则自动创建 obsidian-images
--port <port>      监听端口 (默认: 52323)
--host <host>      绑定地址 (默认: 127.0.0.1)
--help, -h         显示帮助
```

也支持环境变量 `GDRIVE_FOLDER_ID`、`GDRIVE_PORT`、`GDRIVE_HOST`。

## 更新

```bash
cd gbed
git pull
npm install
```

## 配置 obsidian-image-uploader 插件

在 Obsidian 设置 → Image Uploader 中配置:

| 设置项 | 值 |
|---------|-------|
| Api Endpoint | `http://127.0.0.1:52323/upload` |
| Upload Header | `{}` |
| Upload Body | `{"image": "$FILE"}` |
| Image Url Path | `url` |

## (可选) macOS 开机自启

创建 `~/Library/LaunchAgents/com.gbed.plist`:

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

## 测试

```bash
curl -X POST http://127.0.0.1:52323/upload -F "image=@/path/to/test.png"
# {"url":"https://lh3.googleusercontent.com/d/..."}
```

## 许可协议

MIT
