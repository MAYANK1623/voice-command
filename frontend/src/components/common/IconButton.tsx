import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  label: string // accessible name; this button renders icon-only
}

export function IconButton({ children, label, className = '', ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink active:scale-95 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
