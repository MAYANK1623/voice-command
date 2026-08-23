import type { ItemCategory, ShoppingItem } from '@/types'
import { CATEGORY_META } from '@/data/categoryMeta'
import { Badge } from '@/components/common/Badge'
import { ItemCard } from './ItemCard'

interface CategorySectionProps {
  category: ItemCategory
  items: ShoppingItem[]
}

export function CategorySection({ category, items }: CategorySectionProps) {
  const meta = CATEGORY_META[category]

  return (
    <section>
      <div className="mb-2 flex items-center gap-2 px-1">
        <span aria-hidden className="text-sm">
          {meta.emoji}
        </span>
        <h2 className="text-sm font-semibold text-ink">{meta.label}</h2>
        <Badge color={meta.color}>{items.length}</Badge>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </ul>
    </section>
  )
}
