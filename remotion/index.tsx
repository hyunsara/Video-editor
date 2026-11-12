import React from "react";
import {AbsoluteFill, Composition, interpolate, registerRoot, spring, useCurrentFrame, useVideoConfig} from "remotion";

const Title: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = spring({frame, fps, config: {damping: 12}});
  const opacity = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{backgroundColor: "#111", justifyContent: "center", alignItems: "center"}}>
      <h1 style={{color: "white", fontSize: 110, fontFamily: "sans-serif", transform: `scale(${scale})`, opacity}}>{text}</h1>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition id="Title" component={Title} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={{text: "Remotion works!"}} />
);
registerRoot(Root);
