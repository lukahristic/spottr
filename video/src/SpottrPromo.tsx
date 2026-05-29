import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { COLORS } from "./theme/tokens";
import { SCENES, STARTS } from "./scenes/constants";
import { S1Recognition } from "./scenes/S1Recognition";
import { S2ProductLands } from "./scenes/S2ProductLands";
import { S3Aliveness } from "./scenes/S3Aliveness";
import { S4Consent } from "./scenes/S4Consent";
import { S5Connection } from "./scenes/S5Connection";
import { S6Resolve } from "./scenes/S6Resolve";

/*
 * Master composition: 1080×1920, 30fps, 900 frames (30.0s).
 *
 * Each scene is a self-contained component inside its own Sequence and rebases
 * useCurrentFrame() to its own start. Scenes are placed back-to-back; the
 * CrossFade inside each scene dissolves through the cream background between
 * scenes, so the whole film reads as one slow breath.
 *
 * Audio: drop stems into src/audio/ and uncomment the <Audio> block below
 * (see src/audio/README.md). Left out by default so the project renders
 * before stems exist.
 */
export const SpottrPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.cream }}>
      <Sequence from={STARTS.s1} durationInFrames={SCENES.s1}>
        <S1Recognition />
      </Sequence>
      <Sequence from={STARTS.s2} durationInFrames={SCENES.s2}>
        <S2ProductLands />
      </Sequence>
      <Sequence from={STARTS.s3} durationInFrames={SCENES.s3}>
        <S3Aliveness />
      </Sequence>
      <Sequence from={STARTS.s4} durationInFrames={SCENES.s4}>
        <S4Consent />
      </Sequence>
      <Sequence from={STARTS.s5} durationInFrames={SCENES.s5}>
        <S5Connection />
      </Sequence>
      <Sequence from={STARTS.s6} durationInFrames={SCENES.s6}>
        <S6Resolve />
      </Sequence>

      {/*
        Audio (uncomment once stems are added to src/audio/):

        <Audio src={staticFile("audio/music.mp3")} volume={0.5} />
        <Sequence from={STARTS.s1}><Audio src={staticFile("audio/vo-1.mp3")} /></Sequence>
        <Sequence from={STARTS.s2}><Audio src={staticFile("audio/vo-2.mp3")} /></Sequence>
        ...etc per scene
      */}
    </AbsoluteFill>
  );
};
