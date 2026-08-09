import React from 'react';

/**
 * Centered marketing device figure (light editorial pages).
 *
 * @param {{
 *   src: string,
 *   alt: string,
 *   caption?: string,
 *   className?: string,
 * }} props
 */
export default function MarketingIphoneFigure({
  src,
  alt,
  caption,
  className = '',
}) {
  return (
    <figure className={`mx-auto w-full max-w-sm ${className}`.trim()}>
      <img
        src={src}
        alt={alt}
        width={900}
        height={1350}
        decoding="async"
        loading="lazy"
        className="mx-auto h-auto w-full select-none"
      />
      {caption ? (
        <figcaption className="mt-4 text-center text-sm leading-relaxed text-slate-500">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
