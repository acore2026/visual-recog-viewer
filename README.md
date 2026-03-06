# Visual Recog Viewer

visual-recog 服务的下游视频流查看器，通过 WebSocket 连接显示目标识别模式的实时视频流。

## 快速开始

### 1. 启动 visual-recog 服务（WebSocket 输出模式）

```bash
cd /home/acore/proj/compute_network/visual-recog

# 设置模型路径
export YOLO_MODEL_PATH=/path/to/yolov8n.onnx

# 启动服务
visual-recog \
  --mode object \
  --protocol udp \
  --listen-port 9000 \
  --downstream-protocol websocket \
  --downstream-host 0.0.0.0 \
  --downstream-port 8765
```

### 2. 启动前端查看器

```bash
cd /home/acore/proj/compute_network/visual-recog-viewer
npm install
npm run dev
```

### 3. 连接视频流

浏览器访问 `http://localhost:5173`，输入 visual-recog 服务地址：
- 主机: `localhost`（或 visual-recog 所在机器的 IP）
- 端口: `8765`

点击"连接"即可查看实时视频流。

## 功能特性

- **直接连接**: WebSocket 直连 visual-recog，无需中继服务
- **实时显示**: JPEG 视频帧实时渲染
- **FPS 统计**: 实时显示帧率
- **配置记忆**: 自动保存连接配置
- **移动端优化**: 支持横屏/竖屏，适配触摸操作
- **PWA 支持**: 可安装为安卓 Web App

## 部署到安卓 Web App

### 构建

```bash
npm run build
```

### 部署

1. 静态托管：将 `dist/` 部署到任意静态服务器
2. 局域网共享：`python3 -m http.server 8080`
3. 安卓安装：Chrome 打开页面 → "添加到主屏幕"

## 项目结构

```
visual-recog-viewer/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── style.css               # 样式
│   ├── types/
│   │   └── index.ts            # 类型定义
│   ├── viewer/
│   │   └── VideoStreamViewer.ts   # 视频流显示
│   └── ui/
│       ├── ConnectionPanel.ts  # 连接面板
│       └── StatusBar.ts        # 状态栏
├── public/                     # 静态资源
├── index.html
├── package.json
└── vite.config.ts
```

## 协议说明

前端通过 WebSocket 直接连接 visual-recog：

```
ws://host:port
```

**接收数据**: 二进制 JPEG 图像帧

## 故障排除

### 无法连接

1. 确认 visual-recog 已启动: `netstat -tlnp | grep 8765`
2. 检查防火墙设置
3. 确认 `--downstream-protocol websocket` 参数已设置

### 视频卡顿

1. 降低输入分辨率: ffmpeg `-vf "scale=640:480"`
2. 调整帧率: `-r 15`
3. 降低 JPEG 质量: `-q:v 10`

## 许可证

MIT
