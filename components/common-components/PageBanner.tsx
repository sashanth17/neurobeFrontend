import React from "react";

export interface BannerBadge {
  label: string;
  className?: string;
  dot?: boolean;
}

export interface BannerStatItem {
  label: string;
  value: string | number;
  valueColor?: string;
}

export interface PageBannerProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  badges?: BannerBadge[];
  stats?: BannerStatItem[];
  rightContent?: React.ReactNode;
  className?: string;
}

const PageBanner = ({
  title,
  description,
  icon,
  imageUrl,
  badges,
  stats,
  rightContent,
  className = "",
}: PageBannerProps) => {
  return (
    <div
      className={`relative mb-6  rounded-2xl bg-color1 px-8 py-7 mt-2 ${className}`}
    >
      <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        {/* Left Content */}
        <div className="flex-1">
          {/* Badges / Tags */}
          {badges && badges.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {badges.map((badge, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 rounded-full text-xs ${
                    badge.className || "bg-blue-600 text-white px-3 py-1 font-medium"
                  }`}
                >
                  {badge.dot && (
                    <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                  )}
                  {badge.label}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-5">
            {icon && (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {title}
              </h1>
              {description && (
                <p className="mt-1 max-w-2xl text-xs text-white/70 sm:text-sm">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Content / Stats */}
        {stats && stats.length > 0 && (
          <div className="flex shrink-0 items-center divide-x divide-white/10 rounded-xl border border-white/10 bg-[#131d3d]/80 px-6 py-3.5 shadow-sm backdrop-blur-sm">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`${
                  idx === 0
                    ? "pr-5 sm:pr-6"
                    : idx === stats.length - 1
                    ? "pl-5 sm:pl-6"
                    : "px-5 sm:px-6"
                } text-center`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#000] sm:text-[11px] text-white/90 ">
                  {stat.label}
                </p>
                <p
                  className={`mt-1 text-xl font-bold sm:text-2xl ${
                    stat.valueColor || "text-white"
                  }`}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {rightContent && <div className="shrink-0">{rightContent}</div>}
      </div>

      {imageUrl && (
        <img
          src={imageUrl}
          alt="banner"
          className="pointer-events-none absolute -bottom-4 right-6 h-48"
        />
      )}

      {/* decorative circles */}
      <div className="absolute -top-10 right-10 h-48 w-48 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 right-32 h-32 w-32 rounded-full bg-white/5" />
    </div>
  );
};

export default PageBanner;
