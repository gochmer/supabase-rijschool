"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useState } from "react";

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cx("marketing-reveal", className)}
      style={{ "--reveal-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function Float({
  children,
  delay = 0,
  className,
}: {
  children?: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cx("marketing-float", className)}
      style={{ "--float-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function SignatureLine({ className }: { className?: string }) {
  return <div className={cx("marketing-signature-line", className)} />;
}

export function HoverTilt({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [tilt, setTilt] = useState({
    mouseX: 50,
    mouseY: 50,
    rotateX: 0,
    rotateY: 0,
  });

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * 100;
    const py = ((event.clientY - rect.top) / rect.height) * 100;

    setTilt({
      mouseX: px,
      mouseY: py,
      rotateX: ((py - 50) / 50) * -4,
      rotateY: ((px - 50) / 50) * 5,
    });
  };

  const reset = () => {
    setTilt({
      mouseX: 50,
      mouseY: 50,
      rotateX: 0,
      rotateY: 0,
    });
  };

  return (
    <div
      className={cx("marketing-hover-tilt", className)}
      style={{
        "--hover-x": `${tilt.mouseX}%`,
        "--hover-y": `${tilt.mouseY}%`,
        transform: `perspective(900px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transformStyle: "preserve-3d",
      } as CSSProperties}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      <div className="marketing-hover-tilt-glow" />
      {children}
    </div>
  );
}
