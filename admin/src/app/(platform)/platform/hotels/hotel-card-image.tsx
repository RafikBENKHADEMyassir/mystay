"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";

type HotelCardImageProps = {
  name: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  primaryColor: string;
};

function looksLikeImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|svg|ico|avif)$/.test(path)) return true;
    if (parsed.hostname.includes("unsplash.com")) return true;
    if (parsed.hostname.includes("cloudinary.com")) return true;
    if (parsed.hostname.includes("imgur.com")) return true;
    if (parsed.searchParams.has("w") || parsed.searchParams.has("fit")) return true;
    // URLs without file extension that end in / are likely web pages, not images
    if (path.endsWith("/") && path !== "/") return false;
    return true;
  } catch {
    return false;
  }
}

export function HotelCardImage({ name, logoUrl, coverImageUrl, primaryColor }: HotelCardImageProps) {
  const [logoError, setLogoError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const showLogo = logoUrl && !logoError && looksLikeImageUrl(logoUrl);
  const showCover = coverImageUrl && !coverError && looksLikeImageUrl(coverImageUrl);

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="h-32 w-full"
      style={{
        backgroundColor: primaryColor ?? "#1a1a2e",
        backgroundImage: showCover ? `url(${coverImageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {showCover && (
        <img
          src={coverImageUrl!}
          alt=""
          className="hidden"
          onError={() => setCoverError(true)}
        />
      )}
      <div className="flex h-full items-center justify-center">
        {showLogo ? (
          <img
            src={logoUrl!}
            alt={name}
            className="h-16 w-auto max-w-[120px] object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Building2 className="h-8 w-8 text-white/70" />
            <span className="text-sm font-semibold text-white/90">{initials}</span>
          </div>
        )}
      </div>
    </div>
  );
}
