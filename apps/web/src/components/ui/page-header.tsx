import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly backHref?: string;
  readonly backLabel?: string;
  readonly action?: React.ReactNode;
  readonly className?: string;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("animate-slide-down", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="heading-1">{title}</h1>
          {subtitle && (
            <p className="text-text-secondary mt-1 text-sm md:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
