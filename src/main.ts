import './style.css'
import { VideoStreamViewer } from './viewer/VideoStreamViewer.js'
import { ConnectionPanel } from './ui/ConnectionPanel.js'
import { StatusBar } from './ui/StatusBar.js'

// 注册 Service Worker (用于 PWA)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(console.error)
}

class App {
  private viewer: VideoStreamViewer
  private connectionPanel: ConnectionPanel
  private statusBar: StatusBar

  constructor() {
    this.viewer = new VideoStreamViewer('video-canvas')
    this.connectionPanel = new ConnectionPanel('connection-panel')
    this.statusBar = new StatusBar('status-bar')

    this.init()
  }

  private init(): void {
    // 绑定连接事件
    this.connectionPanel.onConnect = (host, port) => {
      this.connect(host, port)
    }

    this.connectionPanel.onDisconnect = () => {
      this.disconnect()
    }

    // 绑定查看器事件
    this.viewer.onFrame = (fps) => {
      this.statusBar.updateFPS(fps)
    }

    this.viewer.onError = (error) => {
      this.statusBar.showError(error)
    }

    // 响应式调整
    window.addEventListener('resize', () => {
      this.viewer.resize()
    })

    // 处理可见性变化（节能）
    document.addEventListener('visibilitychange', () => {
      this.viewer.setActive(!document.hidden)
    })
  }

  private async connect(host: string, port: number): Promise<void> {
    try {
      this.statusBar.showMessage('正在连接...')
      this.connectionPanel.setConnecting(true)

      await this.viewer.connect(host, port)

      this.statusBar.showMessage('已连接')
      this.connectionPanel.setConnected(true)
    } catch (error) {
      this.statusBar.showError(`连接失败: ${error}`)
      this.connectionPanel.setConnecting(false)
    }
  }

  private disconnect(): void {
    this.viewer.disconnect()
    this.connectionPanel.setConnected(false)
    this.statusBar.showMessage('已断开')
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  new App()
})
