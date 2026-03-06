export class ConnectionPanel {
  private connectBtn: HTMLButtonElement
  private disconnectBtn: HTMLButtonElement
  private hostInput: HTMLInputElement
  private portInput: HTMLInputElement

  onConnect?: (host: string, port: number) => void
  onDisconnect?: () => void

  constructor(elementId: string) {
    const panel = document.getElementById(elementId)
    if (!panel) throw new Error(`Element '${elementId}' not found`)

    this.connectBtn = panel.querySelector('#btn-connect') as HTMLButtonElement
    this.disconnectBtn = panel.querySelector('#btn-disconnect') as HTMLButtonElement
    this.hostInput = panel.querySelector('#host') as HTMLInputElement
    this.portInput = panel.querySelector('#port') as HTMLInputElement

    this.bindEvents()

    // 从 localStorage 加载配置
    const saved = localStorage.getItem('visual-recog-connection')
    if (saved) {
      const { host, port } = JSON.parse(saved)
      this.hostInput.value = host
      this.portInput.value = port.toString()
    }
  }

  private bindEvents(): void {
    this.connectBtn.addEventListener('click', () => {
      const host = this.hostInput.value || 'localhost'
      const port = parseInt(this.portInput.value, 10) || 8765

      // 保存配置
      localStorage.setItem('visual-recog-connection', JSON.stringify({ host, port }))

      this.onConnect?.(host, port)
    })

    this.disconnectBtn.addEventListener('click', () => {
      this.onDisconnect?.()
    })
  }

  setConnecting(connecting: boolean): void {
    this.connectBtn.disabled = connecting
    this.connectBtn.textContent = connecting ? '连接中...' : '连接'
  }

  setConnected(connected: boolean): void {
    this.connectBtn.disabled = connected
    this.disconnectBtn.disabled = !connected
    this.connectBtn.textContent = connected ? '已连接' : '连接'
    this.hostInput.disabled = connected
    this.portInput.disabled = connected
  }
}
