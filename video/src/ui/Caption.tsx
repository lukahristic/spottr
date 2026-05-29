import React from "react";
import { useCurrentFrame } from "remotion";
import { SANS } from "../theme/fonts";
import { COLORS } from "../theme/tokens";
import { fadeUp } from "../motion/fadeUp";
import { WordReveal } from "../motion/WordReveal";

interface CaptionProps {
  text: string;
  /** Frame at which it begins (relative to the enclosing Sequence). */
  delay?: number;
  /** Word-by-word reveal (headline feel) vs whole-line fade. */
  perWord?: boolean;
  /** Optional frame to fade the whole caption out. */
  out?: number;
  style?: React.CSSProperties;
}

/* Lower-third / full-frame caption. Inter, ink on cream — readable at mobile size.
 * Captions are burned in so the film is muted-autoplay safe. */
export const Caption: React.FC<CaptionProps> = ({
  text,
  delay = 0,
  perWord = false,
  out,
  style,
}) => {
  const frame = useCurrentFrame();
  const enter = fadeUp(frame, { delay, duration: 22, distance: 18 });
  const outOpacity =
    out !== undefined ? Math.max(0, 1 - Math.max(0, frame - out) / 14) : 1;

  const base: React.CSSProperties = {
    fontFamily: SANS,
    color: COLORS.ink,
    fontSize: 40,
    fontWeight: 500,
    lineHeight: 1.25,
    textAlign: "center",
    maxWidth: 760,
    margin: "0 auto",
    ...style,
  };

  if (perWord) {
    return (
      <div style={{ ...base, opacity: outOpacity }}>
        <WordReveal text={text} delay={delay} stagger={5} duration={18} />
      </div>
    );
  }

  return (
    <div style={{ ...base, opacity: enter.opacity * outOpacity, transform: enter.transform }}>
      {text}
    </div>
  );
};

/* Small uppercase eyebrow / URL line — generous tracking. */
export const Eyebrow: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const frame = useCurrentFrame();
  const enter = fadeUp(frame, { delay, duration: 22, distance: 12 });
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 20,
        fontWeight: 500,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: COLORS.mute,
        textAlign: "center",
        ...enter,
      }}
    >
      {text}
    </div>
  );
};
