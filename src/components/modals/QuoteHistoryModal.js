/**
 * QuoteHistoryModal.js
 * 견적 처리 이력을 타임라인 형태로 표시하는 모달 컴포넌트
 * 
 * 주요 기능:
 * - 견적 처리 이력을 시간순으로 표시
 * - 각 이력별 아이콘 및 색상 구분
 * - 상대적 시간 표시 (예: "3시간 전", "2일 전")
 * - 처리자 및 코멘트 정보 표시
 * - 타임라인 형태의 직관적인 UI
 */

import React from 'react';
import { X, Clock, User, MessageSquare, FileText, CheckCircle, XCircle, AlertCircle, Eye, Edit, Send } from 'lucide-react';
import './QuoteHistoryModal.css';

/**
 * QuoteHistoryModal 컴포넌트
 * 
 * @param {Object} quote - 견적 정보 (이력 포함)
 * @param {boolean} isOpen - 모달 열림/닫힘 상태
 * @param {Function} onClose - 모달 닫기 콜백 함수
 */
const QuoteHistoryModal = ({ quote, isOpen, onClose }) => {
  // 모달이 열려있지 않거나 견적 데이터가 없으면 렌더링하지 않음
  if (!isOpen || !quote) return null;

  /**
   * 날짜 포맷팅 함수
   * Date 객체를 한국 형식의 날짜/시간 문자열로 변환
   * 
   * @param {string} dateString - 날짜 문자열
   * @returns {string} 포맷된 날짜/시간 문자열 (예: "2024.03.15 14:30:45")
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * 상대적 시간 계산 함수
   * 현재 시간과의 차이를 계산하여 상대적 시간으로 표시
   * 
   * @param {string} dateString - 날짜 문자열
   * @returns {string} 상대적 시간 문자열 (예: "3시간 전", "2일 전")
   */
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // 시간 차이에 따라 적절한 형식으로 반환
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return formatDate(dateString);
  };

  /**
   * 액션별 아이콘 매핑 함수
   * 각 처리 액션에 맞는 아이콘을 반환
   * 
   * @param {string} action - 처리 액션명
   * @returns {JSX.Element} 아이콘 컴포넌트
   */
  const getActionIcon = (action) => {
    switch (action) {
      case '견적 요청':
        return <Send className="history-icon" />;
      case '견적 검토 시작':
        return <Eye className="history-icon" />;
      case '견적 수정':
        return <Edit className="history-icon" />;
      case '견적 승인':
        return <CheckCircle className="history-icon" />;
      case '견적 거절':
        return <XCircle className="history-icon" />;
      case '견적 보류':
        return <AlertCircle className="history-icon" />;
      default:
        return <FileText className="history-icon" />;
    }
  };

  /**
   * 액션별 색상 매핑 함수
   * 각 처리 액션에 맞는 테마 색상을 반환
   * 
   * @param {string} action - 처리 액션명
   * @returns {string} 색상 코드 (hex)
   */
  const getActionColor = (action) => {
    switch (action) {
      case '견적 요청':
        return '#3b82f6'; // 파란색
      case '견적 검토 시작':
        return '#8b5cf6'; // 보라색
      case '견적 수정':
        return '#f59e0b'; // 주황색
      case '견적 승인':
        return '#10b981'; // 초록색
      case '견적 거절':
        return '#ef4444'; // 빨간색
      case '견적 보류':
        return '#f97316'; // 주황색
      default:
        return '#6b7280'; // 회색
    }
  };

  /**
   * 백드롭 클릭 시 모달 닫기
   * 모달 외부를 클릭하면 모달이 닫힌다
   * 
   * @param {Event} e - 클릭 이벤트
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 견적 이력 데이터
  const history = quote.history || [];

  return (
    <div className="history-modal-overlay" onClick={handleBackdropClick}>
      <div className="history-modal-container">
        {/* 모달 헤더 */}
        <div className="history-modal-header">
          <div className="header-content">
            <h2 className="modal-title">
              <Clock className="title-icon" />
              견적 이력
            </h2>
            <div className="quote-info">
              <span className="quote-number">{quote.quoteNumber}</span>
              <span className="quote-company">{quote.customerInfo.companyName}</span>
            </div>
          </div>
          <button onClick={onClose} className="close-button">
            <X className="close-icon" />
          </button>
        </div>

        {/* 모달 컨텐츠 */}
        <div className="history-modal-content">
          {history.length === 0 ? (
            // 이력이 없는 경우
            <div className="empty-history">
              <Clock className="empty-icon" />
              <h3>이력이 없습니다</h3>
              <p>아직 처리된 이력이 없습니다.</p>
            </div>
          ) : (
            // 타임라인 형태로 이력 표시
            <div className="timeline-container">
              {history.map((item, index) => (
                <div key={index} className="timeline-item">
                  {/* 타임라인 마커 (아이콘 및 연결선) */}
                  <div className="timeline-marker">
                    <div 
                      className="timeline-dot"
                      style={{ backgroundColor: getActionColor(item.action) }}
                    >
                      {getActionIcon(item.action)}
                    </div>
                    {/* 마지막 항목이 아니면 연결선 표시 */}
                    {index < history.length - 1 && <div className="timeline-line"></div>}
                  </div>
                  
                  {/* 타임라인 내용 */}
                  <div className="timeline-content">
                    <div className="timeline-header">
                      {/* 처리 액션명 */}
                      <h4 className="timeline-action" style={{ color: getActionColor(item.action) }}>
                        {item.action}
                      </h4>
                      {/* 상대적 시간 표시 */}
                      <div className="timeline-meta">
                        <span className="timeline-time" title={formatDate(item.date)}>
                          {getRelativeTime(item.date)}
                        </span>
                      </div>
                    </div>
                    
                    {/* 상세 정보 */}
                    <div className="timeline-details">
                      {/* 처리자 */}
                      <div className="timeline-user">
                        <User className="user-icon" />
                        <span>{item.user}</span>
                      </div>
                      
                      {/* 코멘트 (있는 경우만 표시) */}
                      {item.comment && (
                        <div className="timeline-comment">
                          <MessageSquare className="comment-icon" />
                          <span>{item.comment}</span>
                        </div>
                      )}
                      
                      {/* 정확한 처리 일시 */}
                      <div className="timeline-date">
                        {formatDate(item.date)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="history-modal-footer">
          <div className="footer-info">
            <span>총 {history.length}개의 이력</span>
          </div>
          <div className="footer-actions">
            <button onClick={onClose} className="btn btn-secondary">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteHistoryModal;
