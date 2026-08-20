import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center mb-3">
        <Icon size={26} />
      </div>
      <p className="text-slate-500 text-sm font-bold">{title}</p>
      {subtitle && <p className="text-slate-400 text-xs mt-1 max-w-[240px]">{subtitle}</p>}
    </div>
  );
}
