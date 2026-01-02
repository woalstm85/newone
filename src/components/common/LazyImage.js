/**
 * LazyImage.js - 지연 로딩 이미지 컴포넌트 (최적화 버전)
 * 
 * 주요 기능:
 * 1. Intersection Observer를 사용한 지연 로딩
 * 2. 전역 이미지 캐시 - 이미 로드된 이미지 즉시 표시
 * 3. 로딩 중 플레이스홀더 표시
 * 4. 이미지 로드 실패 시 에러 처리
 * 5. 부드러운 페이드인 애니메이션
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { CiImageOff } from 'react-icons/ci';
import './LazyImage.css';

// 전역 이미지 캐시 (다른 컴포넌트와 공유)
const imageCache = new Set();

/**
 * 이미지 URL 정리 및 API URL 추가
 */
const getCleanImageSrc = (imageSrc) => {
  if (!imageSrc) return null;
  
  if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
    return imageSrc;
  }
  
  const baseUrl = process.env.REACT_APP_API_URL || '';
  if (imageSrc.startsWith('/')) {
    return `${baseUrl}${imageSrc}`;
  }
  
  return `${baseUrl}/${imageSrc}`;
};

/**
 * 캐시 상태 확인 (외부 사용)
 */
export const isImageCached = (src) => {
  const cleanSrc = getCleanImageSrc(src);
  return cleanSrc && imageCache.has(cleanSrc);
};

/**
 * 이미지 프리로드 (외부 사용)
 */
export const preloadImage = (src) => {
  const cleanSrc = getCleanImageSrc(src);
  if (!cleanSrc || imageCache.has(cleanSrc)) return Promise.resolve();
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      imageCache.add(cleanSrc);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = cleanSrc;
  });
};

const LazyImage = memo(({ 
  src, 
  alt = '', 
  className = '', 
  placeholderClassName = '',
  errorClassName = '',
  onClick,
  style = {},
  threshold = 0.1,
  rootMargin = '150px'  // 더 일찍 로드
}) => {
  const cleanSrc = getCleanImageSrc(src);
  const isCached = cleanSrc && imageCache.has(cleanSrc);
  
  const [isLoaded, setIsLoaded] = useState(isCached);
  const [isInView, setIsInView] = useState(isCached);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (isCached) {
      setIsInView(true);
      setIsLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, isCached]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    if (cleanSrc) {
      imageCache.add(cleanSrc);
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // 이미지가 없거나 에러인 경우
  if (!cleanSrc || hasError) {
    return (
      <div 
        ref={imgRef}
        className={`lazy-image-error ${errorClassName}`}
        style={style}
      >
        <CiImageOff size={24} color="#ccc" />
      </div>
    );
  }

  return (
    <div 
      ref={imgRef} 
      className={`lazy-image-wrapper ${className}`}
      style={style}
      onClick={onClick}
    >
      {/* 로딩 플레이스홀더 - 캐시된 이미지는 표시 안함 */}
      {!isLoaded && !isCached && (
        <div className={`lazy-image-placeholder ${placeholderClassName}`}>
          <div className="lazy-image-spinner"></div>
        </div>
      )}
      
      {/* 실제 이미지 */}
      {isInView && (
        <img
          src={cleanSrc}
          alt={alt}
          className={`lazy-image ${isLoaded || isCached ? 'loaded' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
