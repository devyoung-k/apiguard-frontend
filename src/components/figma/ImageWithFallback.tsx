import Image from 'next/image';
import React, { useState } from 'react';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(
  props: React.ImgHTMLAttributes<HTMLImageElement>,
) {
  const [didError, setDidError] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  const { src, alt, style, className } = props;
  const resolvedSrc = typeof src === 'string' && src.length > 0 ? src : ERROR_IMG_SRC;

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: style?.width ?? 88,
    height: style?.height ?? 88,
    ...style,
  };

  return (
    <div
      className={`bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={containerStyle}
      data-original-url={src}
    >
      <Image
        src={didError ? ERROR_IMG_SRC : resolvedSrc}
        alt={alt ?? 'Image'}
        fill
        sizes="100vw"
        className="object-contain"
        unoptimized
        onError={handleError}
      />
    </div>
  );
}
