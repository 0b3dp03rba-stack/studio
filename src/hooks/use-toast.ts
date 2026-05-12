"use client"

import * as React from "react"
import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 4000 
const SPAM_COOLDOWN = 5000 

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string }

interface State {
  toasts: ToasterToast[]
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

const lastToastTimes = new Map<string, number>()

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast],
      }
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }
    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId || action.toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      }
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    default:
      return state
  }
}

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

function toast({ title, description, ...props }: Omit<ToasterToast, "id">) {
  const now = Date.now()
  const messageKey = `${String(title)}-${String(description)}`
  
  // 1. Cek Cooldown Spam
  const lastTime = lastToastTimes.get(messageKey) || 0
  if (now - lastTime < SPAM_COOLDOWN) return { id: "spam", dismiss: () => {}, update: () => {} }

  // 2. Cek apakah sudah ada toast aktif
  const activeToast = memoryState.toasts.find(t => t.open)
  if (activeToast) return { id: "active", dismiss: () => {}, update: () => {} }

  lastToastTimes.set(messageKey, now)
  const id = genId()

  const update = (props: ToasterToast) => dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } })
  const dismiss = () => {
    dispatch({ type: "DISMISS_TOAST", toastId: id })
    setTimeout(() => {
      lastToastTimes.delete(messageKey)
    }, SPAM_COOLDOWN)
  }

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      title,
      description,
      id,
      open: true,
      onOpenChange: (open) => { if (!open) dismiss() },
    },
  })

  setTimeout(() => {
    dismiss()
    setTimeout(() => {
      dispatch({ type: "REMOVE_TOAST", toastId: id })
    }, 500)
  }, TOAST_REMOVE_DELAY)

  return { id, dismiss, update }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
