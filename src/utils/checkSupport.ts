export async function checkWebCodecsSupport(): Promise<{
  supported: boolean
  details: {
    videoDecoder: boolean
    videoEncoder: boolean
    h264Decode: boolean
    h264Encode: boolean
  }
}> {
  const videoDecoder = typeof VideoDecoder !== 'undefined'
  const videoEncoder = typeof VideoEncoder !== 'undefined'

  let h264Decode = false
  let h264Encode = false

  if (videoDecoder) {
    try {
      const result = await VideoDecoder.isConfigSupported({
        codec: 'avc1.640033', // H.264 High Profile
        codedWidth: 1920,
        codedHeight: 1080,
      })
      h264Decode = result.supported ?? false
    } catch {
      h264Decode = false
    }
  }

  if (videoEncoder) {
    try {
      const result = await VideoEncoder.isConfigSupported({
        codec: 'avc1.640033',
        width: 1920,
        height: 1080,
        bitrate: 50_000_000,
        framerate: 60,
      })
      h264Encode = result.supported ?? false
    } catch {
      h264Encode = false
    }
  }

  return {
    supported: videoDecoder && videoEncoder && h264Decode && h264Encode,
    details: { videoDecoder, videoEncoder, h264Decode, h264Encode },
  }
}
