import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("page-header", className)}>
      <div className="page-header-main">
        {icon && <span className="page-header-icon" aria-hidden="true">{icon}</span>}
        <div>
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-sub">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
