
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
                "w-20 h-20 rounded-[2rem] shadow-2xl flex items-center justify-center animate-bounce",
                isError ? "bg-primary/20 text-primary glow-primary" : "bg-primary/10 text-primary"
              )}>
                {isError ? <AlertTriangle size={48} /> : <Sparkles size={48} />}
              </div>
              <div className="space-y-2">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
