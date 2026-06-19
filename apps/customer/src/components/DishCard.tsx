import { Plus, Star } from 'lucide-react';
import type { Dish } from '../../../../shared/types.js';

interface Props {
  dish: Dish;
  onAdd: (dish: Dish) => void;
}

export default function DishCard({ dish, onAdd }: Props) {
  return (
    <div className="group flex gap-4 p-4 bg-white rounded-xl2 shadow-soft hover:shadow-glow transition-all duration-300 animate-fade-up">
      <div className="relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden dish-thumb">
        {dish.image ? (
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-4xl font-serif text-brand-600/60">
            {dish.name.slice(0, 1)}
          </div>
        )}
        {dish.recommended ? (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-accent-500 text-white text-[10px] rounded-full shadow-sm flex items-center gap-1">
            <Star className="w-3 h-3" fill="white" strokeWidth={0} /> 主厨推荐
          </span>
        ) : null}
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg sm:text-xl text-ink leading-tight truncate">{dish.name}</h3>
        </div>
        {dish.tags && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {String(dish.tags).split(/[,，]/).filter(Boolean).slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                {t.trim()}
              </span>
            ))}
          </div>
        )}
        {dish.description && (
          <p className="mt-1.5 text-xs sm:text-sm text-muted leading-relaxed line-clamp-2">
            {dish.description}
          </p>
        )}
        <div className="mt-auto pt-3 flex items-end justify-between">
          <div className="flex items-baseline gap-0.5 text-brand-600">
            <span className="text-xs">¥</span>
            <span className="font-serif text-2xl leading-none">{dish.price.toFixed?.(dish.price % 1 === 0 ? 0 : 2) || dish.price}</span>
          </div>
          <button
            onClick={() => onAdd(dish)}
            className="btn-press w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-600 text-white grid place-items-center shadow-soft hover:shadow-glow transition-all"
            aria-label="加入购物车"
          >
            <Plus className="w-5 h-5" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}
