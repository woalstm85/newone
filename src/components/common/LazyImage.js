/**
 * LazyImage.js - 지연 로딩 이미지 컴포넌트
 * 
 * 주요 기능:
 * 1. Intersection Observer를 사용한 지연 로딩
 * 2. 로딩 중 플레이스홀더 표시
 * 3. 이미지 로드 실패 시 에러 처리
 * 4. 부드러운 페이드인 애니메이션
 */

import React, { useState, useRef, useEffect } from 'react';
import { CiImageOff } from 'react-icons/ci';
import './LazyImage.css';

const LazyImage = ({ 
  src, 
  alt = '', 
  className = '', 
  placeholderClassName = '',
  errorClassName = '',
  onClick,
  style = {},
  threshold = 0.1,  // 이미지가 10% 보이면 로드 시작
  rootMargin = '100px'  // 뷰포트 100px 전에 미리 로드
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
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
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // 이미지가 없거나 에러인 경우
  if (!src || hasError) {
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
      {/* 로딩 플레이스홀더 */}
      {!isLoaded && (
        <div className={`lazy-image-placeholder ${placeholderClassName}`}>
          <div className="lazy-image-spinner"></div>
        </div>
      )}
      
      {/* 실제 이미지 - 뷰포트에 들어왔을 때만 로드 */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default LazyImage;
