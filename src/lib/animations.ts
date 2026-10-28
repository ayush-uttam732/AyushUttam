import type { CSSProperties } from "react";

/** Staggered reveal: <div className="reveal" style={stagger(i)} /> */
export const stagger = (index: number): CSSProperties =>
  ({ "--i": index }) as CSSProperties;