import React from "react";
import { Composition } from "remotion";
import { SpottrPromo } from "./SpottrPromo";
import { TOTAL, FPS } from "./scenes/constants";
import { fraunces } from "./theme/fonts";
import { inter } from "./theme/fonts";

// Ensure fonts are referenced so tree-shaking keeps the loaders.
void fraunces;
void inter;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SpottrPromo"
        component={SpottrPromo}
        durationInFrames={TOTAL}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
