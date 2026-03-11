"use client";

import { useState } from "react";

type HotelDetailImageProps = {
  name: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
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
    if (path.endsWith("/") && path !== "/") return false;
    return true;
  } catch {
    return false;
  }
}

export function HotelDetailImage({ name, logoUrl, coverImageUrl, primaryColor, secondaryColor }: HotelDetailImageProps) {
  const [logoError, setLogoError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const showLogo = logoUrl && !logoError && looksLikeImageUrl(logoUrl);
  const showCover = coverImageUrl && !coverError && looksLikeImageUrl(coverImageUrl);

  return (
    <div
      className="flex h-48 items-center justify-center"
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
      {showLogo ? (
        <img
          src={logoUrl!}
          alt={name}
          className="h-24 w-auto max-w-[200px] object-contain"
          onError={() => setLogoError(true)}
        />
      ) : (
        <span
          className="text-3xl font-bold"
          style={{ color: secondaryColor }}
        >
          {name}
        </span>
      )}
    </div>
  );
}
