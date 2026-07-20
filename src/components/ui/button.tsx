import { cn } from "@/lib/cn";
import { LetterLoader } from "./letter-loader";
import "./ui.css";

type Variant = "primary" | "outline" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";
type Loader = "letter" | "spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loader?: Loader;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  loader = "spinner",
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn("btn", `btn-${variant}`, `btn-${size}`, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading &&
        (loader === "letter" ? (
          <LetterLoader size="sm" className="btn-loader" label="" />
        ) : (
          <span className="spinner" aria-hidden="true" />
        ))}
      {children}
    </button>
  );
}
