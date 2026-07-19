"use client";

import { useEffect, useState } from "react";
import { Leaf, Music2 } from "lucide-react";

type FallItem = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  scale: number;
  drift: number;
  spin: number;
  opacity: number;
  kind: "leaf" | "note";
};

const COUNT = 14;

function makeItems(): FallItem[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 12,
    duration: 14 + Math.random() * 10,
    scale: 0.6 + Math.random() * 0.8,
    drift: (Math.random() - 0.5) * 200,
    spin: (Math.random() - 0.5) * 720,
    opacity: 0.08 + Math.random() * 0.16,
    kind: Math.random() > 0.5 ? "leaf" : "note",
  }));
}

export function AmbientLeeks() {
  const [items, setItems] = useState<FallItem[]>([]);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setReduce(true);
      return;
    }
    setItems(makeItems());
  }, []);

  if (reduce || items.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {items.map((it) => (
        <span
          key={it.id}
          className="ambient-fall"
          style={{
            left: `${it.left}%`,
            animationDelay: `${it.delay}s`,
            animationDuration: `${it.duration}s`,
            ["--s" as string]: it.scale,
            ["--drift" as string]: `${it.drift}px`,
            ["--spin" as string]: `${it.spin}deg`,
            ["--o" as string]: it.opacity,
          }}
        >
          {it.kind === "leaf" ? (
            <Leaf
              size={22}
              strokeWidth={1.5}
              style={{ color: "var(--color-miku-400)" }}
            />
          ) : (
            <Music2
              size={18}
              strokeWidth={1.5}
              style={{ color: "var(--color-miku-pink-400)" }}
            />
          )}
        </span>
      ))}
    </div>
  );
}
