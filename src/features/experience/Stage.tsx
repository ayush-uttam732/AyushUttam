import type { CSSProperties } from "react";

/** Width / height of public/images/room.jpg. Change if you swap the image. */
export const IMAGE_ASPECT = 1706 / 876;

/** The image is drawn slightly zoomed so the parallax never shows edges. */
export const ZOOM = 1.035;

/** How far (in image-uv units) the scene shifts for mouse = ±1. */
export const STRENGTH_X = 0.026;
export const STRENGTH_Y = 0.014;

/**
 * Position something on the image.
 *  x, y  = 0..1 position on the image (0,0 = top-left)
 *  depth = 0 (far) .. 1 (near). Must match the depth map around that spot.
 * It follows the same parallax as the background, so it sticks to the object.
 */
export function anchorStyle(x: number, y: number, depth: number): CSSProperties {
  const left = 50 + (x - 0.5) * ZOOM * 100;
  const top = 50 + (y - 0.5) * ZOOM * 100;
  const dx = -STRENGTH_X * (depth - 0.5) * ZOOM * 100;
  const dy = -STRENGTH_Y * (depth - 0.5) * ZOOM * 100;

  return {
    left: `calc(${left}% + var(--mx, 0) * ${dx}%)`,
    top: `calc(${top}% + var(--my, 0) * ${dy}%)`,
  };
}

/** Where a zoom-in should aim (percent inside the stage). */
export function focusOrigin(x: number, y: number) {
  return {
    x: 50 + (x - 0.5) * ZOOM * 100,
    y: 50 + (y - 0.5) * ZOOM * 100,
  };
}