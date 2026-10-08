"use client";

import { createElement, useEffect, useRef, useState, type ReactNode } from "react";

/** Adds `.in` once the element scrolls into view. Pure CSS does the animating. */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen] as const;
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "ul" | "ol" | "li" | "section" | "figure";
}

export function Reveal({ children, className = "", delay = 0, as = "div" }: RevealProps) {
  const [ref, seen] = useInView<HTMLElement>();
  return createElement(
    as,
    { ref, className: `rv ${seen ? "in" : ""} ${className}`.trim(), style: { "--d": `${delay}ms` } },
    children
  );
}

/** Gentle scroll parallax; disabled for reduced-motion users and off-screen elements. */
export function Parallax({ children, speed = 40, className = "" }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let visible = false;
    const update = () => {
      raf = 0;
      const r = el.parentElement!.getBoundingClientRect();
      const progress = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      el.style.transform = `translate3d(0, ${(-progress * speed).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (visible && !raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) onScroll();
    });
    io.observe(el.parentElement!);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);
  return (
    <div ref={ref} className={`par ${className}`} style={{ position: "absolute", inset: "-6% 0" }}>
      {children}
    </div>
  );
}
