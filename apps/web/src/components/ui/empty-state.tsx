import { cn } from "@/lib/utils";

interface EmptyStateProps {
  readonly icon: string;
  readonly title: string;
  readonly description?: string;
  readonly action?: React.ReactNode;
  readonly className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "card-responsive text-center py-12 px-6 animate-fade-in",
        className,
      )}
    >
      <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
        <span className="text-4xl">{icon}</span>
      </div>
      <h2 className="heading-3 text-text-primary mb-2">{title}</h2>
      {description && (
        <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
