/**
 * OptimizedImage.js - 최적화된 이미지 컴포넌트
 * 
 * 주요 최적화:
 * 1. 전역 이미지 캐시 - 이미 로드된 이미지 즉시 표시
 * 2. 썸네일 우선 로드 - 작은 이미지 먼저 로드
 * 3. Progressive 로딩 - 썸네일 → 원본 순차 로드
 * 4. Intersection Observer - 뷰포트 진입 시 로드
 * 5. 에러 폴백 처리
 * 6. 브라우저 캐시 활용 (Cache-Control)
 * 7. 다음 페이지 이미지 프리로딩
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { CiImageOff } from 'react-icons/ci';
import './OptimizedImage.css';

// ============ 전역 이미지 캐시 ============
// 이미 로드 완료된 이미지 URL 저장 (메모리 캐시)
const imageCache = new Set();

// 로드 중인 이미지 Promise 저장 (중복 요청 방지)
const loadingPromises = new Map();

/**
 * 이미지 URL 정리 및 API URL 추가
 */
const getCleanImageSrc = (imageSrc) => {
  if (!imageSrc) return null;
  
  // 이미 완전한 URL인 경우
  if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
    return imageSrc;
  }
  
  // 상대 경로인 경우 API 서버 기본 URL 추가
  const baseUrl = process.env.REACT_APP_API_URL || '';
  if (imageSrc.startsWith('/')) {
    return `${baseUrl}${imageSrc}`;
  }
  
  return `${baseUrl}/${imageSrc}`;
};

/**
 * 썸네일 경로 추출 (thFilePath 또는 THFILEPATH)
 */
const getThumbnailPath = (src, thumbnailSrc) => {
  if (thumbnailSrc) return getCleanImageSrc(thumbnailSrc);
  
  // 원본 경로에서 썸네일 경로 유추 (th_ 접두사 추가)
  if (src) {
    const cleanSrc = getCleanImageSrc(src);
    if (cleanSrc) {
      const lastSlash = cleanSrc.lastIndexOf('/');
      if (lastSlash !== -1) {
        return cleanSrc.substring(0, lastSlash + 1) + 'th_' + cleanSrc.substring(lastSlash + 1);
      }
    }
  }
  return null;
};

/**
 * 이미지 프리로드 함수
 */
export const preloadImage = (src) => {
  const cleanSrc = getCleanImageSrc(src);
  if (!cleanSrc || imageCache.has(cleanSrc)) return Promise.resolve();
  
  // 이미 로드 중인 경우 해당 Promise 반환
  if (loadingPromises.has(cleanSrc)) {
    return loadingPromises.get(cleanSrc);
  }
  
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      imageCache.add(cleanSrc);
      loadingPromises.delete(cleanSrc);
      resolve();
    };
    img.onerror = () => {
      loadingPromises.delete(cleanSrc);
      resolve(); // 에러도 resolve로 처리 (다른 이미지 로드에 영향 없도록)
    };
    img.src = cleanSrc;
  });
  
  loadingPromises.set(cleanSrc, promise);
  return promise;
};

/**
 * 여러 이미지 프리로드 (다음 페이지용)
 */
export const preloadImages = (srcList) => {
  return Promise.all(srcList.filter(Boolean).map(preloadImage));
};

/**
 * 캐시 상태 확인
 */
export const isImageCached = (src) => {
  const cleanSrc = getCleanImageSrc(src);
  return cleanSrc && imageCache.has(cleanSrc);
};

/**
 * 캐시 클리어 (메모리 관리용)
 */
export const clearImageCache = () => {
  imageCache.clear();
  loadingPromises.clear();
};

/**
 * OptimizedImage 컴포넌트
 */
const OptimizedImage = memo(({ 
  src,
  thumbnailSrc,      // 썸네일 이미지 경로 (선택)
  alt = '이미지',
  className = '',
  width = 120,
  height = 120,
  style = {},
  threshold = 0.1,
  rootMargin = '200px',  // 더 일찍 로드 시작
  disableLazy = false,
  progressive = true,    // 썸네일 → 원본 순차 로드
  objectFit = 'cover',
  onClick,
  ...props 
}) => {
  const cleanSrc = getCleanImageSrc(src);
  const cleanThumbSrc = getThumbnailPath(src, thumbnailSrc);
  
  // 캐시 확인
  const isCached = cleanSrc && imageCache.has(cleanSrc);
  const isThumbCached = cleanThumbSrc && imageCache.has(cleanThumbSrc);
  
  const [isInView, setIsInView] = useState(disableLazy || isCached);
  const [thumbLoaded, setThumbLoaded] = useState(isThumbCached);
  const [fullLoaded, setFullLoaded] = useState(isCached);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef(null);

  // Intersection Observer
  useEffect(() => {
    if (disableLazy || isCached) {
      setIsInView(true);
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

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, disableLazy, isCached]);

  // 썸네일 로드 완료
  const handleThumbLoad = () => {
    setThumbLoaded(true);
    if (cleanThumbSrc) {
      imageCache.add(cleanThumbSrc);
    }
  };

  // 원본 이미지 로드 완료
  const handleFullLoad = () => {
    setFullLoaded(true);
    setHasError(false);
    if (cleanSrc) {
      imageCache.add(cleanSrc);
    }
  };

  // 이미지 로드 에러
  const handleError = () => {
    setHasError(true);
    setFullLoaded(true);
  };

  // 이미지 없거나 에러
  if (!cleanSrc || hasError) {
    return (
      <div 
        ref={containerRef}
        className={`opt-img-fallback ${className}`}
        style={{ width, height, ...style }}
        onClick={onClick}
        {...props}
      >
        <CiImageOff size={Math.min(width, height) * 0.3} color="#ccc" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`opt-img-container ${className}`}
      style={{ width, height, ...style }}
      onClick={onClick}
      {...props}
    >
      {/* 로딩 플레이스홀더 - 캐시된 경우 표시 안함 */}
      {!fullLoaded && !thumbLoaded && !isCached && (
        <div className="opt-img-loading">
          <div className="opt-img-spinner"></div>
        </div>
      )}
      
      {/* 썸네일 이미지 (Progressive 로딩) */}
      {isInView && progressive && cleanThumbSrc && !fullLoaded && !isCached && (
        <img
          src={cleanThumbSrc}
          alt={alt}
          className={`opt-img-thumb ${thumbLoaded ? 'loaded' : ''}`}
          style={{ objectFit }}
          onLoad={handleThumbLoad}
          onError={() => {}} // 썸네일 에러는 무시
          loading="lazy"
        />
      )}
      
      {/* 원본 이미지 */}
      {isInView && (
        <img
          src={cleanSrc}
          alt={alt}
          className={`opt-img-full ${fullLoaded || isCached ? 'loaded' : ''}`}
          style={{ objectFit }}
          onLoad={handleFullLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
