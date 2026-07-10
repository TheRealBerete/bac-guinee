"use client";

import { useState } from "react";
import Image from "next/image";

export function Illustration({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`bg-gradient-to-br from-[var(--color-hero-gradient-start)] to-[var(--color-hero-gradient-end)] rounded-[20px] ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[20px] ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" onError={() => setErrored(true)} />
    </div>
  );
}
