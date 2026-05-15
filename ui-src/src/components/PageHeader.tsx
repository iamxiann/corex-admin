import { cn } from "@/lib/cn";

type Props = {
  eyebrow?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode; // small chips below title
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, meta, className }: Props) {
  return (
    <div className={cn("mb-6 flex items-start justify-between gap-6", className)}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="mb-1.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            {eyebrow}
          </div>
        )}
        <h1 className="text-balance text-[22px] font-medium tracking-tight text-zinc-50">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[12.5px] text-zinc-500">{description}</p>
        )}
        {meta && <div className="mt-2.5 flex items-center gap-2 text-[11.5px]">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}

export function HeaderLiveDot({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {children && <span className="tabular">{children}</span>}
    </>
  );
}

export function HeaderEyebrow({ children, dot }: { children: React.ReactNode; dot?: string }) {
  return (
    <>
      {dot && <span className={cn("inline-block h-1.5 w-1.5 rounded-full", dot)} />}
      {children}
    </>
  );
}
