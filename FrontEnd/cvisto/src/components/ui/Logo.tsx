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
      {/* Isotipo con estética skeuomórfica y acento verde esmeralda */}
      <div
        className={`relative flex items-center justify-center rounded-[10px] bg-gradient-to-b from-[#181F1B] to-[#0F1411] border border-white/[0.1] shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] shrink-0 overflow-hidden ${iconSizes[size]}`}
      >
        {/* Glow verde sutil superior */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#22C55E]/30 blur-md rounded-full pointer-events-none" />

        <svg
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5 relative z-10"
        >
          <defs>
            <linearGradient id="cvBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Icono de documento / CV */}
          <rect
            x="4"
            y="3"
            width="14"
            height="18"
            rx="2.5"
            fill="#121714"
            stroke="url(#cvBorderGrad)"
            strokeWidth="1.6"
          />

          {/* Líneas de texto del CV */}
          <line x1="7.5" y1="7" x2="14.5" y2="7" stroke="#4ADE80" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
          <line x1="7.5" y1="10.5" x2="12" y2="10.5" stroke="#A7B0AA" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          <line x1="7.5" y1="13.5" x2="14" y2="13.5" stroke="#A7B0AA" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          <line x1="7.5" y1="16.5" x2="11" y2="16.5" stroke="#A7B0AA" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />

          {/* Círculo de visto / verificación con tilde */}
          <circle
            cx="19"
            cy="19"
            r="6"
            fill="#22C55E"
            filter="url(#glow)"
          />
          <path
            d="M16.5 19L18.2 20.7L21.8 17.1"
            stroke="#080A09"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
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
