import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

export interface MuxerConfig {
  width: number
  height: number
  fps: number
}

/**
 * mp4-muxer를 사용한 MP4 파일 생성
 * EncodedVideoChunk[]를 받아서 MP4 Blob으로 변환
 */
export class MP4MuxerWrapper {
  private muxer: Muxer<ArrayBufferTarget> | null = null
  private config: MuxerConfig
  private target: ArrayBufferTarget

  constructor(config: MuxerConfig) {
    this.config = config
    this.target = new ArrayBufferTarget()
  }

  /**
   * Muxer 초기화
   */
  initialize(_decoderConfig?: VideoDecoderConfig): void {
    const { width, height, fps } = this.config

    this.muxer = new Muxer({
      target: this.target,
      video: {
        codec: 'avc',
        width,
        height,
      },
      fastStart: 'in-memory', // moov를 파일 앞에 배치
      firstTimestampBehavior: 'offset', // 첫 타임스탬프를 0으로
    })

    console.log(`MP4Muxer initialized: ${width}x${height} @ ${fps}fps`)
  }

  /**
   * 인코딩된 비디오 청크 추가
   */
  addVideoChunk(chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata): void {
    if (!this.muxer) {
      throw new Error('Muxer not initialized')
    }

    this.muxer.addVideoChunk(chunk, meta)
  }

  /**
   * 최종 MP4 Blob 생성
   */
  finalize(): Blob {
    if (!this.muxer) {
      throw new Error('Muxer not initialized')
    }

    this.muxer.finalize()

    const buffer = this.target.buffer
    const blob = new Blob([buffer], { type: 'video/mp4' })

    console.log(`MP4 created: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)

    return blob
  }
}
