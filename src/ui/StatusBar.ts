export class StatusBar {
  private statusBar: HTMLElement
  private fpsEl: HTMLElement
  private messageEl: HTMLElement

  constructor(elementId: string) {
    const bar = document.getElementById(elementId)
    if (!bar) throw new Error(`Element '${elementId}' not found`)
    this.statusBar = bar
    this.fpsEl = bar.querySelector('#fps-counter') as HTMLElement
    this.messageEl = bar.querySelector('#status-message') as HTMLElement
  }

  updateFPS(fps: number): void {
    if (this.fpsEl) this.fpsEl.textContent = `FPS: ${fps}`
  }

  showMessage(message: string): void {
    this.statusBar.classList.remove('error')
    if (this.messageEl) this.messageEl.textContent = message
  }

  showError(error: string): void {
    this.statusBar.classList.add('error')
    if (this.messageEl) this.messageEl.textContent = error
    setTimeout(() => this.statusBar.classList.remove('error'), 5000)
  }
}
