import * as MP4BoxModule from 'mp4box'
import type {
  MP4ArrayBuffer,
  MP4File,
  MP4Info,
  Sample,
  DataStream,
} from 'mp4box'

// mp4box는 CommonJS 모듈이므로 default export 처리
const MP4Box = (MP4BoxModule as unknown as { default: typeof MP4BoxModule }).default || MP4BoxModule

export interface DemuxerCallbacks {
  onConfig: (config: VideoDecoderConfig) => void
  onChunk: (chunk: EncodedVideoChunk) => void
  onComplete: () => void
  onError: (error: Error) => void
}

interface TrackEntry {
  avcC?: { write: (stream: DataStream) => void }
  hvcC?: { write: (stream: DataStream) => void }
  vpcC?: { write: (stream: DataStream) => void }
  av1C?: { write: (stream: DataStream) => void }
}

interface TrackBox {
  mdia: {
    minf: {
      stbl: {
        stsd: {
          entries: TrackEntry[]
        }
      }
    }
  }
}

export class MP4Demuxer {
  private mp4File: MP4File
  private callbacks: DemuxerCallbacks

  constructor(callbacks: DemuxerCallbacks) {
    this.callbacks = callbacks
    this.mp4File = MP4Box.createFile()

    this.mp4File.onReady = this.onReady.bind(this)
    this.mp4File.onSamples = this.onSamples.bind(this)
    this.mp4File.onError = (e: string) => callbacks.onError(new Error(e))
  }

  async loadFile(file: File): Promise<void> {
    const buffer = await file.arrayBuffer()
    const mp4Buffer = buffer as MP4ArrayBuffer
    mp4Buffer.fileStart = 0

    this.mp4File.appendBuffer(mp4Buffer)
    this.mp4File.flush()
  }

  private onReady(info: MP4Info): void {
    const videoTrack = info.videoTracks[0]
    if (!videoTrack) {
      this.callbacks.onError(new Error('No video track found'))
      return
    }

    // VideoDecoderConfig 생성
    const config: VideoDecoderConfig = {
      codec: videoTrack.codec,
      codedWidth: videoTrack.video.width,
      codedHeight: videoTrack.video.height,
      description: this.getDescription(videoTrack),
    }

    this.callbacks.onConfig(config)

    // 샘플 추출 시작
    this.mp4File.setExtractionOptions(videoTrack.id, null, {
      nbSamples: Infinity,
    })
    this.mp4File.start()
  }

  private getDescription(track: { id: number }): Uint8Array | undefined {
    // avcC box에서 description 추출
    const trak = this.mp4File.getTrackById(track.id) as TrackBox | undefined
    if (!trak) return undefined

    for (const entry of trak.mdia.minf.stbl.stsd.entries) {
      const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C
      if (box) {
        const stream = new MP4Box.DataStream(
          undefined,
          0,
          MP4Box.DataStream.BIG_ENDIAN
        )
        box.write(stream)
        return new Uint8Array(stream.buffer, 8) // box header 제외
      }
    }
    return undefined
  }

  private onSamples(_trackId: number, _ref: unknown, samples: Sample[]): void {
    for (const sample of samples) {
      const chunk = new EncodedVideoChunk({
        type: sample.is_sync ? 'key' : 'delta',
        timestamp: (sample.cts * 1_000_000) / sample.timescale, // microseconds
        duration: (sample.duration * 1_000_000) / sample.timescale,
        data: sample.data,
      })
      this.callbacks.onChunk(chunk)
    }
    this.callbacks.onComplete()
  }

  destroy(): void {
    this.mp4File.flush()
  }
}
