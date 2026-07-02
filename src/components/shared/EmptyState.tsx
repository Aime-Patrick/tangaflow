import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed border-border-default bg-bg-surface p-12",
        className
      )}
    >
      {/* Dot grid background */}
      <div className="absolute inset-0 rounded-md opacity-30 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {icon && (
        <div className="relative mb-6 rounded-full bg-accent-primary-subtle p-4 text-accent-primary">
          {icon}
        </div>
      )}

      <h3 className="relative text-lg font-semibold text-text-primary">{title}</h3>
      <p className="relative mt-2 max-w-sm text-center text-text-secondary">
        {description}
      </p>

      {action && <div className="relative mt-6">{action}</div>}
    </div>
  );
}
