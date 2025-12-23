"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      style={
        {
          '--normal-bg': 'hsl(210 20% 90%)',
          '--normal-text': 'hsl(210 20% 15%)',
          '--normal-border': 'hsl(210 20% 80%)',
          '--success-bg': 'hsl(210 20% 90%)',
          '--success-text': 'hsl(210 20% 15%)',
          '--success-border': 'hsl(210 20% 80%)',
          '--error-bg': 'hsl(0 100% 97%)',
          '--error-text': 'hsl(0 100% 15%)',
          '--error-border': 'hsl(0 80% 90%)',
        } as React.CSSProperties
      }
      {...props}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:shadow-lg !opacity-100',
          description: 'group-[.toast]:text-neutral-600',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
        ...props.toastOptions,
      }}
    />
  )
}

export { Toaster }
