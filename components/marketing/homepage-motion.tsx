"use client";

import type { MouseEvent, ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
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
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{ y: [0, -8, 0], scale: [1, 1.01, 1] }}
      transition={{
        duration: 7.5,
        ease: "easeInOut",
        repeat: Number.POSITIVE_INFINITY,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export function SignatureLine({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div
        className={className}
        style={{
          background:
            "linear-gradient(90deg, rgba(186,230,253,0.08), rgba(14,165,233,0.9), rgba(16,185,129,0.8), rgba(186,230,253,0.08))",
        }}
      />
    );
  }

  return (
    <motion.div
      className={className}
      animate={{
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{
        duration: 9,
        ease: "linear",
        repeat: Number.POSITIVE_INFINITY,
      }}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(186,230,253,0.08), rgba(14,165,233,0.9), rgba(16,185,129,0.8), rgba(186,230,253,0.08))",
        backgroundSize: "200% 100%",
      }}
    />
  );
}

export function HoverTilt({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);

  const smoothRotateX = useSpring(rotateX, { stiffness: 140, damping: 18 });
  const smoothRotateY = useSpring(rotateY, { stiffness: 140, damping: 18 });
  const smoothMouseX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 120, damping: 20 });

  const glow = useMotionTemplate`radial-gradient(circle at ${smoothMouseX}% ${smoothMouseY}%, rgba(255,255,255,0.24), transparent 38%)`;

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * 100;
    const py = ((event.clientY - rect.top) / rect.height) * 100;

    mouseX.set(px);
    mouseY.set(py);
    rotateX.set(((py - 50) / 50) * -4);
    rotateY.set(((px - 50) / 50) * 5);
  };

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
    mouseX.set(50);
    mouseY.set(50);
  };

  return (
    <motion.div
      className={className}
      style={{
        rotateX: smoothRotateX,
        rotateY: smoothRotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ background: glow }}
      />
      {children}
    </motion.div>
  );
}
