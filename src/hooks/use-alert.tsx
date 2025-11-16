import { useState, useCallback, Fragment } from 'react'
import { createRoot } from 'react-dom/client'
import AlertDialog from '@/components/ui/AlertDialog'

type AlertOptions = {
  type: 'success' | 'error' | 'warning'
  title: string
  message: string
  confirmText?: string
}

type ConfirmOptions = AlertOptions & {
  onConfirm: () => void;
  onCancel?: () => void;
  cancelText?: string
}

const useAlert = () => {
  const showAlert = useCallback((options: ConfirmOptions) => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const cleanup = () => {
      root.unmount()
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }

    const handleConfirm = () => {
      options.onConfirm()
      cleanup()
    }

    const handleCancel = () => {
      if (options.onCancel) {
        options.onCancel()
      }
      cleanup()
    }

    const alertElement = (
      <AlertDialog
        {...options}
        onConfirm={handleConfirm}
        onCancel={options.onCancel ? handleCancel : undefined}
      />
    )

    root.render(alertElement)
  }, [])

  return { showAlert }
}

export { useAlert };
