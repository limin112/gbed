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
- 已安装并完成认证 [gws]([https://github.com/nicholasgasior/gws](https://github.com/googleworkspace/cli) 命令行工具，记得勾选google drive作为资源库
- Obsidian里安装obsidian-image-uploader插件

## 安装

```bash
npm install -g @minlibuilds/gbed
```

或者用 git clone:

```bash
git clone https://github.com/limin112/gbed.git
cd gbed
npm install
```

## 使用

### 1. 先前台启动调试

```bash
# npm 全局安装方式
gbed

# git clone 方式
node server.js
```

首次启动会自动在 Google Drive 创建 `obsidian-images` 文件夹。看到以下输出说明启动成功:

```
Found existing folder: obsidian-images (xxx)
gbed running at http://127.0.0.1:52323/upload
```

### 2. 测试上传

新开一个终端窗口:

```bash
curl -X POST http://127.0.0.1:52323/upload -F "image=@/path/to/test.png"
# 应返回 {"url":"https://lh3.googleusercontent.com/d/..."}
```

浏览器打开返回的 URL 确认图片可以访问。

### 3. 配置 obsidian-image-uploader 插件

在 Obsidian 设置 → Image Uploader 中配置:

| 设置项 | 值 |
|---------|-------|
| Api Endpoint | `http://127.0.0.1:52323/upload` |
| Upload Header | `{}` |
| Upload Body | `{"image": "$FILE"}` |
| Image Url Path | `url` |

在 Obsidian 中粘贴一张图片，确认自动上传成功。

### 4. 调试通过后，改为后台运行

在前台终端按 `Ctrl+C` 停止，然后:

```bash
gbed -d          # 后台启动
gbed --stop      # 需要时停止
```

## 选项

```
--folder-id <id>   Google Drive 文件夹 ID（或设置 GDRIVE_FOLDER_ID）
                   不传则自动创建 obsidian-images
--port <port>      监听端口 (默认: 52323)
--host <host>      绑定地址 (默认: 127.0.0.1)
--daemon, -d       后台运行
--stop             停止后台进程
--help, -h         显示帮助
```

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

## 更新

```bash
# npm 方式
npm update -g @minlibuilds/gbed

# git clone 方式
cd gbed
git pull
npm install
```

## 许可协议

MIT
