import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import './ImageModal.css';

const ImageModal = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  altText = '', 
  title = '',
  showControls = true,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 이미지 로드 완료 핸들러
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // 이미지 로드 에러 핸들러
  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // 확대
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  // 축소
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.25));
  };

  // 회전
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // 리셋
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  // 배경 클릭으로 모달 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      e.stopPropagation();
      onClose(e);
    }
  };

  // 닫기 버튼 클릭 핸들러
  const handleCloseClick = (e) => {
    e.stopPropagation();
    onClose(e);
  };

  if (!isOpen) return null;

  return (
    <div className="image-modal-overlay" onClick={handleBackdropClick}>
      <div className="image-modal-container">
        {/* 헤더 */}
        <div className="image-modal-header">
          <div className="image-modal-title">
            {title && <h3>{title}</h3>}
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
          {isLoading && (
            <div className="image-modal-loading">
              <div className="image-modal-spinner"></div>
              <p>이미지를 불러오는 중...</p>
            </div>
          )}
          
          {hasError && (
            <div className="image-modal-error">
              <p>이미지를 불러올 수 없습니다.</p>
              <button onClick={() => window.location.reload()}>
                다시 시도
              </button>
            </div>
          )}

          {imageUrl && !hasError && (
            <div className="image-modal-image-container">
              <img
                src={imageUrl}
                alt={altText}
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
        </div>

        {/* 하단 정보 */}
        {altText && (
          <div className="image-modal-footer">
            <p>{altText}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;