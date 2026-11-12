import React from "react";
import {
  AbsoluteFill,
  Composition,
  Img,
  interpolate,
  OffthreadVideo,
  registerRoot,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

// ---------- brand ----------
const C = {
  pink: "#FCB4CC",
  rose: "rgba(214,150,140,0.93)", // dusty rose caption box (darkened from #E4B4A8 for legibility)
  butter: "#F6F09C",
  ink: "#2B2326",
  petal: "#EAC6CC",
  deepPink: "#E8789F",
};
const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

const fontCss = `
@font-face { font-family: Jost; src: url(${staticFile("jost-latin-600-normal.woff2")}); font-weight: 600; }
@font-face { font-family: Pretendard; src: url(${staticFile("Pretendard-SemiBold.woff2")}); font-weight: 600; }
@font-face { font-family: Pretendard; src: url(${staticFile("Pretendard-Bold.woff2")}); font-weight: 700; }
`;

// ---------- primitives ----------
const usePop = (delay = 0) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - delay, fps, config: {damping: 11, stiffness: 170, mass: 0.6}});
  return {transform: `scale(${interpolate(sp, [0, 1], [0.6, 1])})`, opacity: interpolate(frame - delay, [0, 4], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})};
};

const Src: React.FC<{from: number; rate?: number; zoom?: [number, number]; origin?: string; dur: number}> = ({from, rate = 1, zoom = [1, 1.04], origin = "50% 45%", dur}) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, dur], zoom, {extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: origin}}>
      <OffthreadVideo src={staticFile("src.mp4")} startFrom={s(from)} playbackRate={rate} muted style={{width: "100%", height: "100%"}} />
    </AbsoluteFill>
  );
};

// text with [highlight] markup -> butter keyword
const Rich: React.FC<{text: string}> = ({text}) => (
  <>
    {text.split(/(\[[^\]]+\])/).map((part, i) =>
      part.startsWith("[") ? (
        <span key={i} style={{background: C.butter, color: C.ink, padding: "0 10px", margin: "0 2px"}}>{part.slice(1, -1)}</span>
      ) : (
        <span key={i}>{part}</span>
      ),
    )}
  </>
);

const Caption: React.FC<{text: string; y?: number; size?: number; sub?: string}> = ({text, y = 1250, size = 54, sub}) => {
  const pop = usePop(0);
  return (
    <div style={{position: "absolute", top: y, left: 60, right: 60, textAlign: "center", ...pop}}>
      <span style={{display: "inline-block", background: C.rose, color: "#fff", fontFamily: "Pretendard", fontWeight: 600, fontSize: size, padding: "10px 26px 12px", lineHeight: 1.25, textShadow: "0 1px 2px rgba(90,40,40,.35)"}}>
        <Rich text={text} />
      </span>
      {sub && (
        <div style={{marginTop: 12, color: "#fff", fontFamily: "Pretendard", fontWeight: 600, fontSize: 36, textShadow: "0 2px 8px rgba(0,0,0,.55)"}}>{sub}</div>
      )}
    </div>
  );
};

// Sequenced captions inside a scene: [startSec, endSec, text, sub?]
type Cap = [number, number, string, string?];
const Captions: React.FC<{caps: Cap[]; y?: number}> = ({caps, y}) => (
  <>
    {caps.map(([a, b, t, sub], i) => (
      <Sequence key={i} from={s(a)} durationInFrames={s(b) - s(a)} layout="none">
        <Caption text={t} y={y} sub={sub} />
      </Sequence>
    ))}
  </>
);

const StepPill: React.FC<{text: string; y?: number; size?: number}> = ({text, y = 290, size = 76}) => {
  const pop = usePop(2);
  return (
    <div style={{position: "absolute", top: y, left: 0, right: 0, textAlign: "center", ...pop}}>
      <span style={{display: "inline-block", background: C.pink, color: "#fff", fontFamily: "Jost", fontWeight: 600, fontSize: size, borderRadius: 22, padding: "0 30px 10px", lineHeight: 1.15, letterSpacing: "-0.01em", textShadow: "0 1px 3px rgba(200,80,120,.35)"}}>{text}</span>
    </div>
  );
};

const Watermark: React.FC = () => (
  <div style={{position: "absolute", top: 165, left: 60}}>
    <span style={{background: C.pink, color: "#fff", fontFamily: "Jost", fontWeight: 600, fontSize: 30, borderRadius: 9, padding: "0 12px 4px"}}>glow up</span>
  </div>
);

const Progress: React.FC<{step: number}> = ({step}) => {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  return (
    <div style={{position: "absolute", top: 240, left: 60, right: 60, display: "flex", gap: 10}}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} style={{flex: 1, height: 10, borderRadius: 5, background: "rgba(255,255,255,.45)", overflow: "hidden"}}>
          <div style={{height: "100%", background: C.pink, width: i < step ? "100%" : i === step ? `${fill * 100}%` : "0%"}} />
        </div>
      ))}
    </div>
  );
};

const Scene: React.FC<{from: number; dur: number; children: React.ReactNode}> = ({from, dur, children}) => (
  <Sequence from={s(from)} durationInFrames={s(from + dur) - s(from)}>{children}</Sequence>
);

// ---------- scenes ----------
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const text = "puffy morning face…?";
  const n = Math.floor(interpolate(frame, [3, 18], [0, text.length], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}));
  return (
    <AbsoluteFill>
      <Src from={11.9} dur={s(1.3)} zoom={[1.55, 1.62]} origin="50% 33%" />
      <div style={{position: "absolute", top: 820, left: 0, right: 0, textAlign: "center"}}>
        <span style={{background: C.rose, color: "#fff", fontFamily: "Pretendard", fontWeight: 700, fontSize: 70, padding: "10px 28px 14px", visibility: n ? "visible" : "hidden"}}>{text.slice(0, n)}</span>
      </div>
    </AbsoluteFill>
  );
};

const Result: React.FC = () => (
  <AbsoluteFill>
    <Src from={61.3} dur={s(1.3)} zoom={[1.0, 1.05]} origin="50% 35%" />
    <StepPill text="5 minutes later ✨" y={300} size={84} />
  </AbsoluteFill>
);

const Intro: React.FC = () => (
  <AbsoluteFill>
    <Src from={0} dur={s(2.7)} zoom={[1, 1.02]} />
    <Sequence from={4} layout="none"><Caption text="annyeong! 안녕 👋" y={420} sub={'= "hi!" in Korean'} /></Sequence>
  </AbsoluteFill>
);

const Tag: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, 10], [-30, 0], {extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  const o = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: "clamp"});
  return (
    <div style={{position: "absolute", top: 300 + y, left: 0, right: 0, textAlign: "center", opacity: o}}>
      <span style={{background: "#fff", color: C.ink, fontFamily: "Pretendard", fontWeight: 700, fontSize: 38, padding: "8px 20px", border: `3px solid ${C.ink}`}}>{text}</span>
    </div>
  );
};
const Stat: React.FC<{text: string; y: number; delay: number}> = ({text, y, delay}) => {
  const pop = usePop(delay);
  return (
    <div style={{position: "absolute", top: y, left: 0, right: 0, textAlign: "center", ...pop}}>
      <span style={{background: C.butter, color: C.ink, fontFamily: "Pretendard", fontWeight: 700, fontSize: 60, padding: "6px 24px 10px"}}>{text}</span>
    </div>
  );
};

const Product: React.FC = () => {
  const dur = 7.2;
  return (
    <AbsoluteFill>
      <Src from={2.7} rate={8.7 / dur} dur={s(dur)} zoom={[1, 1.03]} />
      <Watermark />
      <Tag text="VT Cosmetics | V-Mode Gua Sha Cream" />
      <Stat text="caffeine 1% → de-puff" y={395} delay={s(0.7)} />
      <Stat text="retinal + 9 peptides → firm" y={500} delay={s(1.5)} />
      <Captions caps={[
        [0.2, 2.5, "this is VT's V-Mode Gua Sha Cream"],
        [2.5, 4.9, "twist it ON ↻", "the tip is your gua sha"],
        [4.9, 7.2, "for [de-puffing] + [firming]"],
      ]} />
      <Sequence from={s(4.9)} layout="none">
        <div style={{position: "absolute", top: 1440, left: 0, right: 0, textAlign: "center", color: "#fff", fontFamily: "Pretendard", fontWeight: 600, fontSize: 30, textShadow: "0 2px 6px rgba(0,0,0,.6)"}}>has retinal · wear SPF by day</div>
      </Sequence>
    </AbsoluteFill>
  );
};

const PointChip: React.FC<{label: string}> = ({label}) => {
  const frame = useCurrentFrame();
  const pulse = 1 + 0.35 * Math.abs(Math.sin(frame / 4));
  const pop = usePop(0);
  return (
    <div style={{position: "absolute", top: 1250, left: 0, right: 0, textAlign: "center", ...pop}}>
      <span style={{display: "inline-flex", alignItems: "center", gap: 18, background: C.rose, color: "#fff", fontFamily: "Pretendard", fontWeight: 600, fontSize: 56, padding: "10px 28px 12px"}}>
        <span style={{width: 26, height: 26, borderRadius: 13, background: C.pink, boxShadow: "0 0 0 4px #fff", transform: `scale(${pulse})`}} />
        {label}
      </span>
    </div>
  );
};

const Step1: React.FC = () => {
  const dur = 5, a = 11.4, b = 21.3, rate = (b - a) / dur;
  const t = (src: number) => (src - a) / rate; // source time -> scene time
  const points: [number, number, string][] = [
    [11.4, 13.3, "chin"], [13.3, 15.0, "under-eyes"], [15.0, 16.5, "brows"],
    [16.5, 17.8, "temples"], [17.8, 20.3, "cheekbones"], [20.3, 21.3, "brows"],
  ];
  return (
    <AbsoluteFill>
      <Src from={a} rate={rate} dur={s(dur)} />
      <Watermark /><Progress step={1} />
      <StepPill text="01 · press the points" />
      <Sequence durationInFrames={s(1.2)} layout="none"><Caption text="wake up drainage first" /></Sequence>
      {points.map(([p, q, l], i) => {
        const from = Math.max(s(1.2), s(t(p)));
        const to = s(t(q));
        return to > from ? <Sequence key={i} from={from} durationInFrames={to - from} layout="none"><PointChip label={l} /></Sequence> : null;
      })}
    </AbsoluteFill>
  );
};

const Step2: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={s(1.0)}>
      <Src from={22.3} rate={0.7} dur={s(1.0)} zoom={[1.6, 1.7]} origin="30% 50%" />
    </Sequence>
    <Sequence from={s(1.0)}>
      <Src from={23.4} rate={3.75} dur={s(0.8)} zoom={[1.0, 1.02]} />
      <div style={{position: "absolute", top: 400, right: 70, color: "#fff", fontFamily: "Pretendard", fontWeight: 700, fontSize: 60, textShadow: "0 2px 8px rgba(0,0,0,.5)"}}>▶▶</div>
    </Sequence>
    <Watermark /><Progress step={2} />
    <StepPill text="02 · squeeze + spread" />
    <Captions caps={[[0.1, 1.0, "squeeze some on"], [1.0, 1.8, "spread with your fingers"]]} />
  </AbsoluteFill>
);

const StepScene: React.FC<{step: number; title: string; a: number; b: number; dur: number; caps: Cap[]; punch?: [number, string]}> = ({step, title, a, b, dur, caps, punch}) => {
  const rate = (b - a) / dur;
  return (
    <AbsoluteFill>
      {punch ? (
        <>
          <Sequence durationInFrames={s(punch[0])}><Src from={a} rate={rate} dur={s(punch[0])} /></Sequence>
          <Sequence from={s(punch[0])}><Src from={a + punch[0] * rate} rate={rate} dur={s(dur - punch[0])} zoom={[1.28, 1.32]} origin={punch[1]} /></Sequence>
        </>
      ) : (
        <Src from={a} rate={rate} dur={s(dur)} />
      )}
      <Watermark /><Progress step={step} />
      <StepPill text={title} />
      <Captions caps={caps} />
    </AbsoluteFill>
  );
};

const Grid: React.FC = () => {
  const tiles: [number, number][] = [[14.0, 2], [24.0, 2.5], [28.0, 1.5], [33.0, 2], [41.0, 2.3], [50.0, 2.7]];
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: "#fff"}}>
      {tiles.map(([from, rate], i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const pop = spring({frame: frame - i * 3, fps: FPS, config: {damping: 12, mass: 0.5}});
        return (
          <div key={i} style={{position: "absolute", left: col * 540 + 6, top: row * 640 + 6, width: 528, height: 628, overflow: "hidden", borderRadius: 18, transform: `scale(${pop})`}}>
            <OffthreadVideo src={staticFile("src.mp4")} startFrom={s(from)} playbackRate={rate} muted style={{width: "100%", height: "100%", objectFit: "cover"}} />
            <div style={{position: "absolute", top: 14, left: 14, background: C.pink, color: "#fff", fontFamily: "Jost", fontWeight: 600, fontSize: 40, borderRadius: 12, padding: "0 14px 5px"}}>0{i + 1}</div>
          </div>
        );
      })}
      <Sequence from={6} layout="none">
        <div style={{position: "absolute", top: 905, left: 0, right: 0, textAlign: "center", ...{}}}>
          <GridStat />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
const GridStat: React.FC = () => {
  const pop = usePop(0);
  return <span style={{display: "inline-block", background: C.butter, color: C.ink, fontFamily: "Pretendard", fontWeight: 700, fontSize: 78, padding: "8px 34px 12px", boxShadow: "0 8px 30px rgba(0,0,0,.25)", ...pop}}>6 steps · 5 minutes</span>;
};

const BeforeAfter: React.FC = () => {
  const frame = useCurrentFrame();
  const wipe = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  const z = interpolate(frame, [0, s(2)], [1.3, 1.36]);
  const draw = interpolate(frame, [12, 30], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const half = (img: string, left: boolean, x = left ? 0 : 540) => (
    <div style={{position: "absolute", top: 0, bottom: 0, left: x, width: 540, overflow: "hidden"}}>
      <Img src={staticFile(img)} style={{position: "absolute", width: 1080, height: 1920, left: -270, transform: `scale(${z})`, transformOrigin: "50% 42%"}} />
    </div>
  );
  const Label: React.FC<{t: string; sub: string; x: number; d: number}> = ({t, sub, x, d}) => {
    const pop = usePop(d);
    return (
      <div style={{position: "absolute", top: 1240, left: x, width: 540, textAlign: "center", ...pop}}>
        <div style={{fontFamily: "Jost", fontWeight: 600, fontSize: 64, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,.55)"}}>{t}</div>
        <span style={{display: "inline-block", marginTop: 6, background: C.rose, color: "#fff", fontFamily: "Pretendard", fontWeight: 600, fontSize: 44, padding: "4px 18px 8px"}}>{sub}</span>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{background: "#000"}}>
      {half("before.jpg", true)}
      <div style={{position: "absolute", top: 0, bottom: 0, left: 540, width: 540 * wipe, overflow: "hidden"}}>{half("after.jpg", false, 0)}</div>
      <div style={{position: "absolute", top: 0, bottom: 0, left: 537 + 540 * (1 - wipe) * 0, width: 6, background: "#fff", opacity: wipe}} />
      <svg width="1080" height="1920" style={{position: "absolute"}}>
        <path d="M 380 1130 C 470 1030, 610 1030, 700 1120" stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={draw} />
        <path d="M 668 1098 L 702 1124 L 662 1136" stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={draw < 0.05 ? 1 : 0} />
      </svg>
      <Label t="before" sub="puffy" x={0} d={8} />
      <Label t="after ✨" sub="snatched" x={540} d={16} />
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => (
  <AbsoluteFill>
    <Src from={61.3} rate={2.05 / 2.5} dur={s(2.5)} zoom={[1, 1.03]} />
    <StepPill text="follow for the next episode 💗" y={1180} size={64} />
    <Sequence from={s(0.6)} layout="none"><Caption text="annyeong! 안녕 👋" y={1320} sub={'= "bye!"'} /></Sequence>
  </AbsoluteFill>
);

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 6], [0, 1], {extrapolateRight: "clamp"});
  const pop = usePop(3);
  return (
    <AbsoluteFill style={{background: C.petal, opacity: o, alignItems: "center", justifyContent: "center", flexDirection: "column"}}>
      <div style={{fontFamily: "Jost", fontWeight: 600, fontSize: 64, color: "#fff"}}>Sara's</div>
      <div style={{...pop, background: "#fff", color: C.deepPink, fontFamily: "Jost", fontWeight: 600, fontSize: 150, borderRadius: 36, padding: "0 48px 20px", lineHeight: 1.1}}>glow up</div>
      <div style={{fontFamily: "Jost", fontWeight: 600, fontSize: 48, color: "#fff", marginTop: 16}}>series</div>
    </AbsoluteFill>
  );
};

// ---------- timeline ----------
export const TOTAL = 40.3;
const DePuff: React.FC = () => (
  <AbsoluteFill style={{background: "#000"}}>
    <style>{fontCss}</style>
    <Scene from={0} dur={1.3}><Hook /></Scene>
    <Scene from={1.3} dur={1.3}><Result /></Scene>
    <Scene from={2.6} dur={2.7}><Intro /></Scene>
    <Scene from={5.3} dur={7.2}><Product /></Scene>
    <Scene from={12.5} dur={5}><Step1 /></Scene>
    <Scene from={17.5} dur={1.8}><Step2 /></Scene>
    <Scene from={19.3} dur={3}>
      <StepScene step={3} title="03 · forehead" a={27} b={31} dur={3} caps={[[0.1, 3, "sweep up & out to the [temples] ↗"]]} />
    </Scene>
    <Scene from={22.3} dur={3}>
      <StepScene step={4} title="04 · under-eyes" a={32} b={37.5} dur={3} punch={[1.6, "50% 42%"]} caps={[[0.1, 1.6, "under the eyes + across the cheeks"], [1.6, 3, "always toward your [ears]"]]} />
    </Scene>
    <Scene from={25.3} dur={3.5}>
      <StepScene step={5} title="05 · jawline" a={39.5} b={47.5} dur={3.5} caps={[[0.1, 1.8, "chin to ear along the jawline"], [1.8, 3.5, "this is the [snatch]"]]} />
    </Scene>
    <Scene from={28.8} dur={4.5}>
      <StepScene step={6} title="06 · drain the neck" a={48} b={60} dur={4.5} caps={[[0.1, 2.2, "drain down the neck"], [2.2, 4.5, "to your collarbones ↓"]]} />
    </Scene>
    <Scene from={33.3} dur={1.5}><Grid /></Scene>
    <Scene from={34.8} dur={2}><BeforeAfter /></Scene>
    <Scene from={36.8} dur={2.5}><Outro /></Scene>
    <Scene from={39.3} dur={1}><EndCard /></Scene>
  </AbsoluteFill>
);

const Root: React.FC = () => (
  <Composition id="DePuff" component={DePuff} durationInFrames={s(TOTAL)} fps={FPS} width={1080} height={1920} />
);
registerRoot(Root);
