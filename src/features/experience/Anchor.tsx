import type { CSSProperties, ReactNode } from "react";

import { anchorStyle } from "./Stage";

type AnchorProps = {
  x: number;
  y: number;
  depth: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

export function Anchor({ x, y, depth, className, style, children }: AnchorProps) {
  return (
    <div
      className={`anchor ${className ?? ""}`}
      style={{ ...anchorStyle(x, y, depth), ...style }}
    >
      {children}
    </div>
  );
}