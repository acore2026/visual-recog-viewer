export class VideoStreamViewer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private ws: WebSocket | null = null
  private currentImage: HTMLImageElement | null = null

  // 统计
  private frameCount = 0
  private fps = 0
  private bytesReceived = 0
  private lastStatsTime = 0

  // 回调
  onFrame?: (fps: number) => void
  onError?: (error: string) => void

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) throw new Error(`Canvas element '${canvasId}' not found`)
    this.canvas = canvas

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2d context')
    this.ctx = ctx

    this.currentImage = new Image()
    this.currentImage.onload = () => this.render()
    this.resize()
  }

  async connect(host: string, port: number): Promise<void> {
    this.disconnect()

    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${host}:${port}`
      this.ws = new WebSocket(wsUrl)
      this.ws.binaryType = 'arraybuffer'

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        resolve()
      }

      this.ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          this.handleFrame(new Uint8Array(event.data))
        }
      }

      this.ws.onerror = () => {
        reject(new Error('WebSocket connection failed'))
      }

      this.ws.onclose = () => {
        this.onError?.('连接已断开')
      }
    })
  }

  private handleFrame(data: Uint8Array): void {
    this.bytesReceived += data.length
    this.frameCount++

    const now = performance.now()
    if (now - this.lastStatsTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastStatsTime))
      this.onFrame?.(this.fps)
      this.frameCount = 0
      this.bytesReceived = 0
      this.lastStatsTime = now
    }

    const blob = new Blob([data as unknown as ArrayBuffer], { type: 'image/jpeg' })
    const url = URL.createObjectURL(blob)

    if (this.currentImage) {
      const oldUrl = this.currentImage.src
      this.currentImage.src = url
      if (oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl)
    }
  }

  private render(): void {
    if (!this.currentImage || !this.currentImage.complete) return

    const img = this.currentImage
    const scale = Math.min(
      this.canvas.width / img.naturalWidth,
      this.canvas.height / img.naturalHeight
    )

    const drawWidth = img.naturalWidth * scale
    const drawHeight = img.naturalHeight * scale
    const x = (this.canvas.width - drawWidth) / 2
    const y = (this.canvas.height - drawHeight) / 2

    this.ctx.fillStyle = '#000'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.drawImage(img, x, y, drawWidth, drawHeight)
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    if (this.currentImage?.src.startsWith('blob:')) {
      URL.revokeObjectURL(this.currentImage.src)
      this.currentImage.src = ''
    }

    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  resize(): void {
    const parent = this.canvas.parentElement
    if (!parent) return
    this.canvas.width = parent.clientWidth
    this.canvas.height = parent.clientHeight
    this.render()
  }

  setActive(_active: boolean): void {
    // 节能处理
  }
}
