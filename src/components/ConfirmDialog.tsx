import { AnimatePresence, motion } from 'framer-motion'
import { Button } from './Button'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'CANCEL',
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          role="presentation"
        >
          <motion.div
            className="w-full max-w-sm rounded-3xl border border-line/60 bg-surface p-6 text-center shadow-2xl"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            <h2
              id="confirm-dialog-title"
              className="text-lg font-bold uppercase tracking-wide text-ink"
            >
              {title}
            </h2>
            <p className="mt-3 text-sm text-muted">{description}</p>
            <div className="mt-6 flex flex-col gap-3">
              <Button
                variant={destructive ? 'danger' : 'primary'}
                fullWidth
                onClick={onConfirm}
                autoFocus
              >
                {confirmLabel}
              </Button>
              <Button variant="ghost" fullWidth onClick={onCancel}>
                {cancelLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
