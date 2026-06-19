import { Leaf } from 'lucide-react';

export default function Empty({ title = '暂无内容', desc }: { title?: string; desc?: string }) {
  return (
    <div className="py-16 flex flex-col items-center text-center animate-fade-up">
      <div className="w-20 h-20 rounded-full bg-brand-50 grid place-items-center mb-4">
        <Leaf className="w-9 h-9 text-brand-500" strokeWidth={1.5} />
      </div>
      <div className="font-serif text-xl text-ink/80">{title}</div>
      {desc && <p className="text-sm text-muted mt-1.5 max-w-xs">{desc}</p>}
    </div>
  );
}
