
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
                isError ? "bg-primary/20 text-primary glow-primary border-4 border-primary" : "bg-primary/10 text-primary border-4 border-primary/30"
              )}>
                {isError ? <AlertTriangle size={48} /> : <Sparkles size={48} />}
              </div>
              <div className="space-y-3">
                {title && <ToastTitle className="text-2xl font-black uppercase tracking-tighter leading-none">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-xs font-bold leading-relaxed opacity-80 max-w-xs mx-auto break-words">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action && <div className="mt-4">{action}</div>}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="fixed top-0 left-0 right-0 flex justify-center items-center h-screen pointer-events-none z-[1000] p-6" />
    </ToastProvider>
  )
}
