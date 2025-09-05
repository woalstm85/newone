import React, { useState } from 'react';

// 기본 "이미지 없음" SVG를 인라인으로 생성
const createNoImageSvg = (width = 120, height = 120) => {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
      <g transform="translate(${width/2}, ${height/2})">
        <circle r="20" fill="#6c757d" opacity="0.3"/>
        <path d="M-8,-8 L8,8 M8,-8 L-8,8" stroke="#6c757d" stroke-width="2" stroke-linecap="round"/>
      </g>
      <text x="50%" y="85%" text-anchor="middle" fill="#6c757d" font-size="12" font-family="Arial, sans-serif">
        이미지 없음
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

const ImageWithFallback = ({ 
  src, 
  alt = "상품 이미지", 
  className = "", 
  width = 120, 
  height = 120,
  style = {},
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // 이미지 경로 정리 함수
  const getCleanImageSrc = (imageSrc) => {
    if (!imageSrc) return null;
    
    // 이미 완전한 URL인 경우
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      return imageSrc;
    }
    
    // 상대 경로인 경우 API 서버 기본 URL 추가
    if (imageSrc.startsWith('/')) {
      return `${process.env.REACT_APP_API_URL}${imageSrc}`;
    }
    
    return `${process.env.REACT_APP_API_URL}/${imageSrc}`;
  };

  const cleanSrc = getCleanImageSrc(src);
  
  // 이미지가 없거나 에러가 발생한 경우 fallback 이미지 표시
  if (!cleanSrc || hasError) {
    return (
      <img
        src={createNoImageSvg(width, height)}
        alt={alt}
        className={className}
        style={{ width, height, objectFit: 'cover', ...style }}
        {...props}
      />
    );
  }

  return (
    <>
      {isLoading && (
        <div 
          className={className}
          style={{ 
            width, 
            height, 
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style 
          }}
        >
          <div style={{ color: '#6c757d', fontSize: '12px' }}>로딩중...</div>
        </div>
      )}
      <img
        src={cleanSrc}
        alt={alt}
        className={className}
        style={{ 
          width, 
          height, 
          objectFit: 'cover',
          display: isLoading ? 'none' : 'block',
          ...style 
        }}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </>
  );
};

export default ImageWithFallback;
