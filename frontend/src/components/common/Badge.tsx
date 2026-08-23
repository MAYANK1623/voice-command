import type { ReactNode } from 'react'

// Tailwind's JIT compiler needs to see full class names statically, so we
// can't build "bg-{color}-100" from a variable — this map spells every
// combination out. Keep it in sync with CATEGORY_META colors in
// data/categoryMeta.ts whenever a new category color is added.
const COLOR_CLASSES: Record<string, string> = {
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-amber-100 text-amber-800',
  orange: 'bg-orange-100 text-orange-800',
  purple: 'bg-purple-100 text-purple-800',
  slate: 'bg-slate-100 text-slate-800',
  gray: 'bg-gray-100 text-gray-800',
}

interface BadgeProps {
  color: string
  children: ReactNode
}

export function Badge({ color, children }: BadgeProps) {
  const classes = COLOR_CLASSES[color] ?? COLOR_CLASSES.gray
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}
    >
      {children}
    </span>
  )
}
