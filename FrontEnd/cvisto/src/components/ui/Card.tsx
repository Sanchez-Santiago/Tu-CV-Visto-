import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  elevated?: boolean;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  interactive = false,
  elevated = false,
  noPadding = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-[16px] transition-all duration-160 ${
        interactive
          ? "skeuo-card-interactive cursor-pointer"
          : elevated
          ? "skeuo-surface-elevated"
          : "skeuo-surface"
      } ${noPadding ? "" : "p-5 sm:p-6"} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`flex items-center justify-between pb-3.5 border-b border-white/[0.05] ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <h3 className={`text-base font-semibold text-[#F2F5F3] tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <p className={`text-xs text-[#A7B0AA] mt-0.5 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => <div className={`pt-3.5 ${className}`} {...props}>{children}</div>;
