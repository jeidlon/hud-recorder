export interface EncoderConfig {
  width: number
  height: number
  bitrate?: number // 기본 50Mbps
  framerate?: number // 기본 30fps
  codec?: string // 기본 avc1.640033 (H.264 High Profile)
}

export interface EncoderCallbacks {
  onChunk: (chunk: EncodedVideoChunk, meta: EncodedVideoChunkMetadata) => void
  onError: (error: Error) => void
}

export class VideoEncoderWrapper {
  private encoder: VideoEncoder | null = null
  private frameCount = 0
  private config: EncoderConfig
  private callbacks: EncoderCallbacks

  constructor(config: EncoderConfig, callbacks: EncoderCallbacks) {
    this.config = config
    this.callbacks = callbacks
  }

  async initialize(): Promise<void> {
    const codecConfig: VideoEncoderConfig = {
      codec: this.config.codec || 'avc1.640033',
      width: this.config.width,
      height: this.config.height,
      bitrate: this.config.bitrate || 50_000_000, // 50 Mbps
      framerate: this.config.framerate || 30,
      latencyMode: 'quality', // 품질 우선
      avc: {
        format: 'avc', // Annex B format for MP4
      },
    }

    // 코덱 지원 확인
    const support = await VideoEncoder.isConfigSupported(codecConfig)
    if (!support.supported) {
      throw new Error(`Codec not supported: ${codecConfig.codec}`)
    }

    this.encoder = new VideoEncoder({
      output: (chunk, meta) => {
        this.callbacks.onChunk(chunk, meta || {})
      },
      error: (e) => {
        this.callbacks.onError(new Error(e.message))
      },
    })

    this.encoder.configure(codecConfig)
    this.frameCount = 0

    console.log('VideoEncoder initialized:', codecConfig)
  }

  encodeFrame(frame: VideoFrame, keyFrame = false): void {
    if (!this.encoder) {
      throw new Error('Encoder not initialized')
    }

    this.encoder.encode(frame, {
      keyFrame: keyFrame || this.frameCount % 60 === 0, // 2초마다 키프레임
    })

    this.frameCount++
  }

  async flush(): Promise<void> {
    if (this.encoder) {
      await this.encoder.flush()
    }
  }

  close(): void {
    if (this.encoder) {
      this.encoder.close()
      this.encoder = null
    }
  }

  get encodedFrameCount(): number {
    return this.frameCount
  }
}
