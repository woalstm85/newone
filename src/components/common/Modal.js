/**
 * Modal.js - 범용 확인/취소 모달
 * 
 * 주요 기능:
 * 1. 메시지 표시용 범용 모달
 * 2. 확인/취소 버튼 제공
 * 3. 취소 버튼은 선택적 표시
 * 4. 멀티라인 메시지 지원
 * 
 * Props:
 * - isOpen: 모달 열림 상태
 * - title: 모달 제목
 * - message: 표시할 메시지 (줄바꿈 지원)
 * - onConfirm: 확인 버튼 클릭 콜백
 * - onCancel: 취소 버튼 클릭 콜백 (선택적)
 * 
 * 사용 예:
 * <Modal
 *   isOpen={showModal}
 *   title="알림"
 *   message="정말 삭제하시겠습니까?"
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 */

import React from 'react';
import './Modal.css';

function Modal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="top_modal-overlay">
      <div className="top_modal-content">
        {/* 헤더 */}
        <div className="top_modal-header">
          {title}
        </div>
        
        {/* 본문 */}
        <div 
          className="top_modal-body" 
          style={{ 
            whiteSpace: 'pre-line',  // 줄바꿈 문자(\n) 처리
            wordBreak: 'keep-all',   // 한글 단어 단위 줄바꿈
          }}
        >
          {message}
        </div>
        
        {/* 액션 버튼 */}
        <div className="top_modal-footer">
          <button className="top_modal-button confirm" onClick={onConfirm}>
            확인
          </button>
          {/* 취소 콜백이 있을 경우에만 취소 버튼 표시 */}
          {onCancel && (
            <button className="top_modal-button cancel" onClick={onCancel}>
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;
