"use client";

import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface MotionProps {
  children: ReactNode;
  className?: string;
  revealOnView?: boolean;
}

export function MotionReveal({
  children,
  className,
  revealOnView = true,
}: MotionProps) {
  const reduceMotion = useReducedMotion();
  const hiddenState = reduceMotion ? false : { opacity: 0, y: 18 };
  const visibleState = { opacity: 1, y: 0 };

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={hiddenState}
        animate={revealOnView ? undefined : visibleState}
        whileInView={revealOnView ? visibleState : undefined}
        viewport={revealOnView ? { once: true, amount: 0.2 } : undefined}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={className}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

export function MotionStagger({ children, className }: MotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true, amount: 0.18 }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.08,
            },
          },
        }}
        className={className}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

export function MotionItem({ children, className }: MotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      className={className}
    >
      {children}
    </m.div>
  );
}
