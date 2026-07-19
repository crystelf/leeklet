export function LeekLogo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/leek.png"
      alt="Leeklet 大葱"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain", display: "block" }}
      draggable={false}
    />
  );
}

export function LeekLogoWord({ size = 34, stacked = false }: { size?: number; stacked?: boolean }) {
  if (stacked) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <span
          className="grid place-items-center animate-miku-bob"
          style={{ width: size, height: size }}
        >
          <LeekLogo size={size} />
        </span>
        <div className="leading-none text-center">
          <div
            className="font-display font-bold tracking-tight"
            style={{ fontSize: size * 0.46, color: "var(--fg)" }}
          >
            Leeklet
          </div>
          <div
            className="font-display"
            style={{
              fontSize: size * 0.26,
              color: "var(--accent)",
              letterSpacing: "0.08em",
              marginTop: 2,
            }}
          >
            大葱管理
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid place-items-center animate-miku-bob"
        style={{ width: size, height: size }}
      >
        <LeekLogo size={size} />
      </span>
      <div className="leading-none">
        <div
          className="font-display font-bold tracking-tight"
          style={{ fontSize: size * 0.5, color: "var(--fg)" }}
        >
          Leeklet
        </div>
        <div
          className="font-display"
          style={{
            fontSize: size * 0.28,
            color: "var(--accent)",
            letterSpacing: "0.08em",
          }}
        >
          大葱管理
        </div>
      </div>
    </div>
  );
}
