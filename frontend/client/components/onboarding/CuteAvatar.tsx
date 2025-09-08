import React from "react";

export type AvatarGender = "male" | "female";
export type AvatarMood = "wave" | "think" | "cheer";

export default function CuteAvatar({ gender, mood, size = 220 }: { gender: AvatarGender; mood: AvatarMood; size?: number }) {
  const topColor = gender === "female" ? "#ff79a6" : "#6aa6ff";
  const topLight = gender === "female" ? "#ffd2e1" : "#d7e6ff";
  const hairFill = "#2a2a2a";
  const skin = "#ffe3cf";

  // Arm poses vary by mood for clearer gestures
  const arms = {
    wave: {
      left: { d: "M62 134 q-24 10 -30 24", hand: { cx: 28, cy: 160 } },
      right: { d: "M138 128 q24 -28 32 -44", hand: { cx: 172, cy: 92 } }, // raised near head
      clsRight: "arm-wave",
      clsLeft: "",
    },
    think: {
      left: { d: "M62 134 q-20 10 -26 22", hand: { cx: 30, cy: 158 } },
      right: { d: "M138 132 q16 -18 4 -30", hand: { cx: 118, cy: 98 } }, // hand to chin
      clsRight: "arm-think",
      clsLeft: "",
    },
    cheer: {
      left: { d: "M62 132 q-18 -40 -10 -64", hand: { cx: 56, cy: 62 } }, // up
      right: { d: "M138 132 q18 -40 10 -64", hand: { cx: 144, cy: 62 } }, // up
      clsRight: "arm-cheer",
      clsLeft: "arm-cheer",
    },
  }[mood];

  return (
    <div className={`avatar avatar-${mood}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 220" width={size} height={size} aria-hidden>
        {/* shadow */}
        <ellipse cx="100" cy="210" rx="44" ry="8" fill="#000" opacity="0.06" />

        {/* body */}
        <path d="M60 160 q40 30 80 0 v26 H60z" fill={topColor} />
        <rect x="58" y="120" width="84" height="52" rx="24" fill={topLight} />

        {/* head */}
        <circle cx="100" cy="88" r="36" fill={skin} />
        {/* hair */}
        {gender === "female" ? (
          <>
            <path d="M64 82 q36 -30 72 0 v22 q-8 10 -16 0 q-18 -10 -40 0 q-8 10 -16 0 z" fill={hairFill} />
            <path d="M60 86 q-6 26 6 44" stroke={hairFill} strokeWidth="8" strokeLinecap="round" />
            <path d="M140 86 q6 26 -6 44" stroke={hairFill} strokeWidth="8" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M64 78c6-14 22-24 36-24s30 10 36 24" stroke={hairFill} strokeWidth="10" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* eyes */}
        <circle cx="86" cy="88" r="5" fill="#222" />
        <circle cx="114" cy="88" r="5" fill="#222" />
        {/* eyebrows */}
        <path d="M78 80 q8 -6 16 0" stroke="#222" strokeWidth="3" strokeLinecap="round" />
        <path d="M106 80 q8 -6 16 0" stroke="#222" strokeWidth="3" strokeLinecap="round" />
        {/* mouth */}
        {mood === "think" ? (
          <path d="M88 104 q12 6 24 0" stroke="#e87d7d" strokeWidth="4" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M86 104 q14 10 28 0" stroke="#e87d7d" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}

        {/* cheeks */}
        <circle cx="76" cy="98" r="5" fill="#ffb6c1" opacity="0.8" />
        <circle cx="124" cy="98" r="5" fill="#ffb6c1" opacity="0.8" />

        {/* arms */}
        <g className={`arm-left ${arms.clsLeft || ""}`}>
          <path d={arms.left.d} stroke={skin} strokeWidth="12" strokeLinecap="round" fill="none" />
          <circle cx={arms.left.hand.cx} cy={arms.left.hand.cy} r="6" fill={skin} />
        </g>
        <g className={`arm-right ${arms.clsRight || ""}`}>
          <path d={arms.right.d} stroke={skin} strokeWidth="12" strokeLinecap="round" fill="none" />
          <circle cx={arms.right.hand.cx} cy={arms.right.hand.cy} r="6" fill={skin} />
        </g>
      </svg>
    </div>
  );
}
