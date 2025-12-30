/**
 * ImageModal.js - 이미지 확대/축소/회전 모달
 * 
 * 주요 기능:
 * 1. 이미지 확대 보기 모달
 * 2. 줌 인/아웃 (25% ~ 300%)
 * 3. 90도 단위 회전
 * 4. 여러 이미지 화살표 네비게이션
 * 5. 로딩 및 에러 처리
 * 6. ESC 키 및 배경 클릭으로 닫기
 * 7. 좌우 화살표 키로 이미지 이동
 * 
 * Props:
 * - isOpen: 모달 열림 상태
 * - onClose: 닫기 콜백
 * - imageUrl: 단일 이미지 URL (하위 호환)
 * - images: 이미지 배열 [{url, alt, title}, ...]
 * - initialIndex: 시작 이미지 인덱스 (기본: 0)
 * - altText: 대체 텍스트
 * - title: 모달 제목
 * - showControls: 컨트롤 표시 여부 (기본: true)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import './ImageModal.css';

const ImageModal = ({ 
  isOpen, 
  onClose, 
  imageUrl,        // 단일 이미지 (하위 호환)
  images = [],     // 여러 이미지 배열
  initialIndex = 0,
  altText = '', 
  title = '',
  showControls = true,
}) => {
  // 이미지 리스트 구성 (images 배열 우선, 없으면 imageUrl 사용)
  const imageList = images.length > 0 
    ? images 
    : imageUrl 
      ? [{ url: imageUrl, alt: altText, title: title }] 
      : [];
  
  // 현재 이미지 인덱스
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // 이미지 변환 상태
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  // 로딩 및 에러 상태
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 여러 이미지 여부
  const hasMultipleImages = imageList.length > 1;

  /**
   * 이전 이미지
   */
  const handlePrevImage = useCallback(() => {
    if (!hasMultipleImages) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1));
    setScale(1);
    setRotation(0);
    setIsLoading(true);
    setHasError(false);
  }, [hasMultipleImages, imageList.length]);

  /**
   * 다음 이미지
   */
  const handleNextImage = useCallback(() => {
    if (!hasMultipleImages) return;
    setCurrentIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0));
    setScale(1);
    setRotation(0);
    setIsLoading(true);
    setHasError(false);
  }, [hasMultipleImages, imageList.length]);

  /**
   * 모달 열릴 때마다 상태 초기화
   * body 스크롤 제어
   */
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setRotation(0);
      setIsLoading(true);
      setHasError(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  /**
   * ESC 키로 모달 닫기, 좌우 화살표로 이미지 이동
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasMultipleImages) {
        handlePrevImage();
      } else if (e.key === 'ArrowRight' && hasMultipleImages) {
        handleNextImage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, hasMultipleImages, handlePrevImage, handleNextImage]);

  /**
   * 이미지 로드 완료 핸들러
   */
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  /**
   * 이미지 로드 에러 핸들러
   */
  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  /**
   * 확대 (최대 300%)
   */
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  /**
   * 축소 (최소 25%)
   */
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.25));
  };

  /**
   * 90도 회전
   */
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  /**
   * 원본 크기로 리셋
   */
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  /**
   * 배경 클릭으로 모달 닫기
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      e.stopPropagation();
      onClose(e);
    }
  };

  /**
   * 닫기 버튼 클릭 핸들러
   */
  const handleCloseClick = (e) => {
    e.stopPropagation();
    onClose(e);
  };

  if (!isOpen || imageList.length === 0) return null;

  // 현재 이미지 정보
  const currentImage = imageList[currentIndex];
  const currentUrl = currentImage?.url || '';
  const currentAlt = currentImage?.alt || altText || '';
  const currentTitle = currentImage?.title || title || '';

  return (
    <div className="image-modal-overlay" onClick={handleBackdropClick}>
      <div className="image-modal-container">
        {/* 헤더 */}
        <div className="image-modal-header">
          <div className="image-modal-title">
            {currentTitle && <h3>{currentTitle}</h3>}
            {/* 이미지 카운터 */}
            {hasMultipleImages && (
              <span className="image-modal-counter">
                {currentIndex + 1} / {imageList.length}
              </span>
            )}
          </div>
          <button 
            className="image-modal-close-btn"
            onClick={handleCloseClick}
            aria-label="모달 닫기"
          >
            <X size={24} />
          </button>
        </div>

        {/* 컨트롤 바 */}
        {showControls && (
          <div className="image-modal-controls">
            <button 
              className="image-modal-control-btn"
              onClick={handleZoomOut}
              disabled={scale <= 0.25}
              title="축소"
            >
              <ZoomOut size={20} />
            </button>
            <span className="image-modal-zoom-info">
              {Math.round(scale * 100)}%
            </span>
            <button 
              className="image-modal-control-btn"
              onClick={handleZoomIn}
              disabled={scale >= 3}
              title="확대"
            >
              <ZoomIn size={20} />
            </button>
            <button 
              className="image-modal-control-btn"
              onClick={handleRotate}
              title="회전"
            >
              <RotateCw size={20} />
            </button>
            <button 
              className="image-modal-control-btn"
              onClick={handleReset}
              title="원본 크기"
            >
              원본
            </button>
          </div>
        )}

        {/* 이미지 컨테이너 */}
        <div className="image-modal-content">
          {/* 로딩 스피너 */}
          {isLoading && (
            <div className="image-modal-loading">
              <div className="image-modal-spinner"></div>
              <p>이미지를 불러오는 중...</p>
            </div>
          )}
          
          {/* 에러 메시지 */}
          {hasError && (
            <div className="image-modal-error">
              <p>이미지를 불러올 수 없습니다.</p>
              <button onClick={() => window.location.reload()}>
                다시 시도
              </button>
            </div>
          )}

          {/* 이전 버튼 */}
          {hasMultipleImages && (
            <button 
              className="image-modal-nav-btn prev"
              onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
              aria-label="이전 이미지"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {/* 이미지 */}
          {currentUrl && !hasError && (
            <div className="image-modal-image-container">
              <img
                src={currentUrl}
                alt={currentAlt}
                className="image-modal-image"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  display: isLoading ? 'none' : 'block'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable={false}
              />
            </div>
          )}

          {/* 다음 버튼 */}
          {hasMultipleImages && (
            <button 
              className="image-modal-nav-btn next"
              onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
              aria-label="다음 이미지"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>

        {/* 하단 정보 */}
        {currentAlt && (
          <div className="image-modal-footer">
            <p>{currentAlt}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
