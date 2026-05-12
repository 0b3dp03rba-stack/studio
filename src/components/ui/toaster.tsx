"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastAction,
} from "@/components/ui/toast"
import { ShieldAlert, AlertTriangle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="right" duration={10000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isError = variant === 'destructive';
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-4 items-start w-full">
              <div className={cn(
                "mt-0.5 p-2 rounded-xl shrink-0",
                isError ? "bg-primary/20 text-primary" : "bg-white/10 text-white"
              )}>
                {isError ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div className="grid gap-1.5 flex-1 min-w-0">
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

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
