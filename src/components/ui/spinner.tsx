import { LetterLoader } from "./letter-loader";

export function Spinner({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return <LetterLoader size={size} className={className} />;
}

export function LoadingScreen({ label = "加载中" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <LetterLoader size="lg" label={label} />
      <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
        {label}…
      </p>
    </div>
  );
}
