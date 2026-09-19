import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showText = true,
  className = "",
}) => {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Isotipo: círculo con checkmark */}
      <div
        className={`relative flex items-center justify-center rounded-[10px] bg-gradient-to-b from-[#181F1B] to-[#0F1411] border border-white/[0.1] shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] shrink-0 overflow-hidden ${iconSizes[size]}`}
      >
        {/* Glow verde sutil superior */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#22C55E]/25 blur-md rounded-full pointer-events-none" />

        <svg
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5 relative z-10"
        >
          <defs>
            <filter id="logoGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Fondo del círculo */}
          <circle cx="14" cy="14" r="11" fill="#0F1712" />

          {/* Anillo verde con glow */}
          <circle
            cx="14"
            cy="14"
            r="10"
            stroke="#22C55E"
            strokeWidth="1.8"
            strokeOpacity="0.9"
            filter="url(#logoGlow)"
          />

          {/* Checkmark grueso y blanco */}
          <path
            d="M8.5 14.2L12 17.7L19.5 10.5"
            stroke="#22C55E"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#logoGlow)"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-bold tracking-tight text-[#F2F5F3] font-['Inter'] leading-none ${textSizes[size]}`}
          >
            CV<span className="text-[#22C55E]">isto</span>
          </span>
          {size !== "sm" && (
            <span className="text-[10px] uppercase font-medium tracking-wider text-[#A7B0AA] mt-0.5">
              Workspace
            </span>
          )}
        </div>
      )}
    </div>
  );
};
