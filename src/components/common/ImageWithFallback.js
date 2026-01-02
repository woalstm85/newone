/**
 * ImageWithFallback.js - 지연 로딩 + 에러 처리 이미지 컴포넌트
 * 
 * 주요 기능:
 * 1. Intersection Observer를 사용한 지연 로딩 (Lazy Loading)
 * 2. 이미지 로드 실패 시 자동으로 대체 이미지 표시
 * 3. 로딩 중 스피너 표시
 * 4. 부드러운 페이드인 애니메이션
 * 5. API URL 자동 처리
 * 6. 전역 이미지 캐시 - 이미 로드된 이미지는 즉시 표시
 * 
 * Props:
 * - src: 이미지 URL
 * - alt: 대체 텍스트
 * - className: CSS 클래스
 * - width: 너비
 * - height: 높이
 * - style: 추가 스타일
 * - threshold: 이미지 로드 시작 기준 (기본값: 0.1)
 * - rootMargin: 미리 로드 시작 거리 (기본값: '100px')
 * - disableLazy: 지연 로딩 비활성화 (기본값: false)
 */

import React, { useState, useRef, useEffect } from 'react';
import { CiImageOff } from 'react-icons/ci';
import './ImageWithFallback.css';

// 전역 이미지 캐시 - 이미 로드된 이미지 URL 저장
const loadedImageCache = new Set();

const ImageWithFallback = ({ 
  src, 
  alt = "상품 이미지", 
  className = "", 
  width = 120, 
  height = 120,
  style = {},
  threshold = 0.1,
  rootMargin = '100px',
  disableLazy = false,
  ...props 
}) => {
  /**
   * 이미지 경로 정리 및 API URL 추가
   */
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
  
  // 이미 캐시에 있는 이미지인지 확인
  const isAlreadyCached = cleanSrc && loadedImageCache.has(cleanSrc);
  
  const [isLoaded, setIsLoaded] = useState(isAlreadyCached);
  const [isInView, setIsInView] = useState(disableLazy || isAlreadyCached);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  /**
   * Intersection Observer로 뷰포트 진입 감지
   */
  useEffect(() => {
    // 이미 캐시된 이미지면 Observer 불필요
    if (disableLazy || isAlreadyCached) {
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
      {
        threshold,
        rootMargin
      }
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
  }, [threshold, rootMargin, disableLazy, isAlreadyCached]);

  /**
   * 이미지 로드 완료 핸들러
   */
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    // 캐시에 추가
    if (cleanSrc) {
      loadedImageCache.add(cleanSrc);
    }
  };

  /**
   * 이미지 로드 에러 핸들러
   */
  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // 이미지가 없거나 에러인 경우
  if (!cleanSrc || hasError) {
    return (
      <div 
        ref={imgRef}
        className={`lazy-image-fallback ${className}`}
        style={{ width, height, ...style }}
        {...props}
      >
        <CiImageOff size={Math.min(width, height) * 0.3} color="#ccc" />
      </div>
    );
  }

  return (
    <div 
      ref={imgRef}
      className={`lazy-image-container ${className}`}
      style={{ width, height, ...style }}
      {...props}
    >
      {/* 로딩 플레이스홀더 - 캐시된 이미지는 표시 안함 */}
      {!isLoaded && !isAlreadyCached && (
        <div className="lazy-image-loading">
          <div className="lazy-image-spinner-small"></div>
        </div>
      )}
      
      {/* 실제 이미지 - 뷰포트에 들어왔을 때만 로드 */}
      {isInView && (
        <img
          src={cleanSrc}
          alt={alt}
          className={`lazy-image-img ${isLoaded || isAlreadyCached ? 'loaded' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default ImageWithFallback;
