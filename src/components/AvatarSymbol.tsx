import clsx from 'clsx'
import type { Symbol } from '../engine/ticTacToe'

const sizeMap = {
  sm: 'h-9 w-9 text-base',
  md: 'h-12 w-12 text-xl',
  lg: 'h-16 w-16 text-2xl',
}

export function AvatarSymbol({
  symbol,
  size = 'md',
  ring = false,
  className,
}: {
  symbol: Symbol
  size?: keyof typeof sizeMap
  ring?: boolean
  className?: string
}) {
  const isX = symbol === 'X'
  return (
    <div
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full font-bold',
        sizeMap[size],
        isX ? 'bg-x/15 text-x' : 'bg-o/15 text-o',
        ring && (isX ? 'ring-2 ring-x' : 'ring-2 ring-o'),
        className,
      )}
      aria-hidden="true"
    >
      {symbol}
    </div>
  )
}
