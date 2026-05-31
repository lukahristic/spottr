import React from "react";
import { useCurrentFrame } from "remotion";

interface TypewriterProps {
  text: string;
  /** Frame typing begins (scene-local). */
  startAt?: number;
  /** Characters revealed per frame. */
  speed?: number;
  /** Show a blinking caret while/after typing. */
  caret?: boolean;
  /** Frame to hide the caret (e.g. on send). */
  caretOff?: number;
}

/**
 * Typewriter reveal via STRING SLICING — never per-character opacity
 * (explicit Remotion-skill rule). Reveals `text` left-to-right with a blinking
 * caret. Deterministic per frame so it renders identically every pass.
 */
export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  startAt = 0,
  speed = 0.6,
  caret = true,
  caretOff,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startAt);
  const count = Math.min(text.length, Math.floor(elapsed * speed));
  const shown = text.slice(0, count);

  const caretVisible =
    caret &&
    (caretOff === undefined || frame < caretOff) &&
    Math.floor(frame / 15) % 2 === 0;

  return (
    <span>
      {shown}
      {caretVisible && <span style={{ opacity: 0.6 }}>|</span>}
    </span>
  );
};
