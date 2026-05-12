
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Sparkles, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="down">
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isError = variant === 'destructive';
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex flex-col items-center gap-6 w-full text-center py-4">
              <div className={cn(
                "w-16 h-16 rounded-[1.5rem] shadow-2xl flex items-center justify-center",
                isError ? "bg-primary/20 text-primary border-4 border-primary" : "bg-primary/10 text-primary border-4 border-primary/30"
              )}>
                {isError ? <AlertTriangle size={32} /> : <Sparkles size={32} />}
              </div>
              <div className="space-y-3">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action && <div className="mt-4">{action}</div>}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
