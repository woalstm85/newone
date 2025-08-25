import React from 'react';
import './Modal.css';

function Modal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="top_modal-overlay">
      <div className="top_modal-content">
        <div className="top_modal-header">
          {title}
        </div>
        <div 
          className="top_modal-body" 
          style={{ 
            whiteSpace: 'pre-line',
            wordBreak: 'keep-all',
          }}
        >
          {message}
        </div>
        <div className="top_modal-footer">
          <button className="top_modal-button confirm" onClick={onConfirm}>
            확인
          </button>
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