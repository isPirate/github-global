'use client'

import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast'
import { useToast } from './use-toast'
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, variant, action, ...props }) {
        const icon = {
          success: <CheckCircle className="h-5 w-5" />,
          error: <AlertCircle className="h-5 w-5" />,
          warning: <AlertTriangle className="h-5 w-5" />,
          info: <Info className="h-5 w-5" />,
          default: null,
        }[variant || 'default']

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-3">
              {icon}
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action && (
                <ToastAction
                  onClick={action.onClick}
                  altText={action.label}
                  className="mt-auto"
                >
                  {action.label}
                </ToastAction>
              )}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
