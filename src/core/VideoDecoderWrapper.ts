export interface DecoderCallbacks {
  onFrame: (frame: VideoFrame) => void
  onError: (error: Error) => void
}

export class VideoDecoderWrapper {
  private decoder: VideoDecoder | null = null
  private callbacks: DecoderCallbacks
  private configured = false

  constructor(callbacks: DecoderCallbacks) {
    this.callbacks = callbacks
  }

  configure(config: VideoDecoderConfig): void {
    this.decoder = new VideoDecoder({
      output: (frame) => {
        this.callbacks.onFrame(frame)
      },
      error: (e) => {
        this.callbacks.onError(new Error(e.message))
      },
    })

    this.decoder.configure(config)
    this.configured = true
  }

  decode(chunk: EncodedVideoChunk): void {
    if (!this.decoder || !this.configured) {
      throw new Error('Decoder not configured')
    }
    this.decoder.decode(chunk)
  }

  async flush(): Promise<void> {
    if (this.decoder) {
      await this.decoder.flush()
    }
  }

  destroy(): void {
    if (this.decoder) {
      this.decoder.close()
      this.decoder = null
    }
    this.configured = false
  }

  get isConfigured(): boolean {
    return this.configured
  }
}
