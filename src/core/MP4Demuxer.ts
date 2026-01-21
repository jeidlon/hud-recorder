import * as MP4BoxModule from 'mp4box'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MP4Box = (MP4BoxModule as any).default || MP4BoxModule

// mp4box 타입 정의
interface MP4ArrayBuffer extends ArrayBuffer {
  fileStart: number
}

interface MP4File {
  onReady: (info: MP4Info) => void
  onSamples: (trackId: number, ref: unknown, samples: Sample[]) => void
  onError: (error: string) => void
  appendBuffer: (buffer: MP4ArrayBuffer) => void
  flush: () => void
  start: () => void
  setExtractionOptions: (trackId: number, user: unknown, options: { nbSamples: number }) => void
  getTrackById: (id: number) => TrackBox | undefined
}

interface MP4Info {
  videoTracks: Array<{
    id: number
    codec: string
    video: { width: number; height: number }
  }>
}

interface Sample {
  is_sync: boolean
  cts: number
  duration: number
  timescale: number
  data: Uint8Array
}

export interface DemuxerCallbacks {
  onConfig: (config: VideoDecoderConfig) => void
  onChunk: (chunk: EncodedVideoChunk) => void
  onComplete: () => void
  onError: (error: Error) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataStreamType = any

interface TrackEntry {
  avcC?: { write: (stream: DataStreamType) => void }
  hvcC?: { write: (stream: DataStreamType) => void }
  vpcC?: { write: (stream: DataStreamType) => void }
  av1C?: { write: (stream: DataStreamType) => void }
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const DataStream = (MP4Box as any).DataStream
        const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN)
        box.write(stream)
        const buffer = stream.buffer as ArrayBuffer
        if (buffer.byteLength > 8) {
          return new Uint8Array(buffer, 8) // box header 제외
        }
        return new Uint8Array(buffer)
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
