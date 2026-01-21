import * as React from 'react'
import { motion } from 'framer-motion'
import { Upload, Film } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoDropzoneProps {
  onFileSelect: (file: File) => void
  hasFile: boolean
  fileName?: string
}

export const VideoDropzone = React.forwardRef<HTMLDivElement, VideoDropzoneProps>(
  ({ onFileSelect, hasFile, fileName }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith('video/')) {
        onFileSelect(file)
      }
    }

    return (
      <motion.div
        ref={ref}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          'relative flex flex-col items-center justify-center',
          'w-full h-48 rounded-xl cursor-pointer',
          'border-2 border-dashed transition-all duration-200',
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : hasFile
              ? 'border-green-500/50 bg-green-500/5'
              : 'border-white/10 bg-zinc-900/50 hover:border-white/20'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelect(file)
          }}
        />

        <motion.div
          animate={{ y: isDragging ? -5 : 0 }}
          className="flex flex-col items-center gap-3"
        >
          {hasFile ? (
            <>
              <Film className="w-10 h-10 text-green-400" />
              <span className="text-sm text-green-400 font-medium">{fileName}</span>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-zinc-500" />
              <span className="text-sm text-zinc-400">
                Drop video file or click to browse
              </span>
              <span className="text-xs text-zinc-600">Supports MP4, WebM, MOV</span>
            </>
          )}
        </motion.div>
      </motion.div>
    )
  }
)

VideoDropzone.displayName = 'VideoDropzone'
