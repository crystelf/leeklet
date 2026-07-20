import { cn } from "@/lib/cn";
import "./letter-loader.css";

type LoaderSize = "sm" | "md" | "lg";

const SCALE: Record<LoaderSize, number> = {
  sm: 0.28,
  md: 0.9,
  lg: 1.4,
};

export function LetterLoader({
  size = "md",
  className,
  label = "正在加载",
}: {
  size?: LoaderSize;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn("letter-loader", className)}
      role="status"
      aria-label={label}
      style={{ ["--ll-scale" as string]: SCALE[size] }}
    >
      <span className="ll-letter ll-letter-l" aria-hidden="true">
        L
      </span>
      <span className="ll-letter-o" aria-hidden="true">
        <span className="ll-stripe-wrap">
          <span className="ll-stripe ll-stripe-first" />
          <span className="ll-stripe ll-stripe-second" />
          <span className="ll-stripe ll-stripe-third" />
        </span>
      </span>
      <span className="ll-letter-group" aria-hidden="true">
        <span>A</span>
        <span>D</span>
      </span>
      <span className="ll-sr-only">{label}</span>
    </div>
  );
}
