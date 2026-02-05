"use client";

import { useState } from "react";

interface ClubBadgeProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

const FALLBACK_BADGE = "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/notfound-crest.png";

export default function ClubBadge({ src, alt, width = 32, height = 32 }: ClubBadgeProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      src={imgSrc}
      alt={alt}
      style={{ width: `${width}px`, height: `${height}px`, objectFit: "contain" }}
      onError={() => setImgSrc(FALLBACK_BADGE)}
    />
  );
}
