import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
  className?: string
}

export const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  ({ children, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={cn(
          'min-h-screen w-full',
          'bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950',
          className
        )}
      >
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </motion.div>
    )
  }
)

AppShell.displayName = 'AppShell'
