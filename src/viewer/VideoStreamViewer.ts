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
    this.currentImage.onload = () => {
      console.log('[VideoStreamViewer] Image loaded, rendering...')
      this.render()
    }
    this.currentImage.onerror = () => {
      console.error('[VideoStreamViewer] Image load error for src:', this.currentImage?.src?.substring(0, 100))
    }
    this.resize()

    // 初始清空画布
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  async connect(host: string, port: number): Promise<void> {
    this.disconnect()

    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${host}:${port}`
      console.log(`[VideoStreamViewer] Connecting to ${wsUrl}`)

      this.ws = new WebSocket(wsUrl)
      this.ws.binaryType = 'arraybuffer'

      this.ws.onopen = () => {
        console.log('[VideoStreamViewer] WebSocket connected')
        resolve()
      }

      this.ws.onmessage = (event) => {
        console.log('[VideoStreamViewer] Received message:', typeof event.data, event.data?.byteLength || event.data?.length)
        if (event.data instanceof ArrayBuffer) {
          this.handleFrame(new Uint8Array(event.data))
        } else {
          console.log('[VideoStreamViewer] Text message:', event.data)
        }
      }

      this.ws.onerror = (err) => {
        console.error('[VideoStreamViewer] WebSocket error:', err)
        reject(new Error('WebSocket connection failed'))
      }

      this.ws.onclose = (event) => {
        console.log(`[VideoStreamViewer] WebSocket closed: code=${event.code}, reason=${event.reason}`)
        this.onError?.('连接已断开')
      }
    })
  }

  private handleFrame(data: Uint8Array): void {
    console.log(`[VideoStreamViewer] Handling frame: ${data.length} bytes`)
    this.bytesReceived += data.length
    this.frameCount++

    const now = performance.now()
    if (now - this.lastStatsTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastStatsTime))
      console.log(`[VideoStreamViewer] FPS: ${this.fps}, Frames: ${this.frameCount}`)
      this.onFrame?.(this.fps)
      this.frameCount = 0
      this.bytesReceived = 0
      this.lastStatsTime = now
    }

    // 诊断：打印数据的前16个字节（hex）
    const hexBytes = Array.from(data.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ')
    console.log(`[VideoStreamViewer] Data header (hex): ${hexBytes}`)

    // 检查是否是有效的 JPEG (FF D8 FF)
    const isJpeg = data.length >= 3 && data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF
    console.log(`[VideoStreamViewer] Is valid JPEG: ${isJpeg}`)

    if (!isJpeg) {
      // 尝试解码为文本看看是什么
      const textPreview = new TextDecoder().decode(data.slice(0, 100))
      console.error(`[VideoStreamViewer] Not a JPEG! Text preview: ${textPreview}`)
      return
    }

    try {
      const blob = new Blob([data.buffer], { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      console.log(`[VideoStreamViewer] Created blob URL: ${url}, blob size: ${blob.size}`)

      if (this.currentImage) {
        const oldUrl = this.currentImage.src
        this.currentImage.src = url
        if (oldUrl.startsWith('blob:')) {
          URL.revokeObjectURL(oldUrl)
        }
      }
    } catch (err) {
      console.error('[VideoStreamViewer] Error creating blob:', err)
    }
  }

  private render(): void {
    if (!this.currentImage || !this.currentImage.complete) {
      console.log('[VideoStreamViewer] Image not ready for render')
      return
    }

    const img = this.currentImage
    console.log(`[VideoStreamViewer] Rendering: ${img.naturalWidth}x${img.naturalHeight}`)

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
    console.log('[VideoStreamViewer] Render complete')
  }

  disconnect(): void {
    console.log('[VideoStreamViewer] Disconnecting...')
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
