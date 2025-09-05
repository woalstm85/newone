import React from 'react';
import { X, Clock, User, MessageSquare, FileText, CheckCircle, XCircle, AlertCircle, Eye, Edit, Send } from 'lucide-react';
import './QuoteHistoryModal.css';

const QuoteHistoryModal = ({ quote, isOpen, onClose }) => {
  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen || !quote) return null;

  // 날짜 포맷팅
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

  // 상대적 시간 계산
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return formatDate(dateString);
  };

  // 액션별 아이콘 매핑
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

  // 액션별 색상 매핑
  const getActionColor = (action) => {
    switch (action) {
      case '견적 요청':
        return '#3b82f6';
      case '견적 검토 시작':
        return '#8b5cf6';
      case '견적 수정':
        return '#f59e0b';
      case '견적 승인':
        return '#10b981';
      case '견적 거절':
        return '#ef4444';
      case '견적 보류':
        return '#f97316';
      default:
        return '#6b7280';
    }
  };

  // 백드롭 클릭 시 모달 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
            <div className="empty-history">
              <Clock className="empty-icon" />
              <h3>이력이 없습니다</h3>
              <p>아직 처리된 이력이 없습니다.</p>
            </div>
          ) : (
            <div className="timeline-container">
              {history.map((item, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker">
                    <div 
                      className="timeline-dot"
                      style={{ backgroundColor: getActionColor(item.action) }}
                    >
                      {getActionIcon(item.action)}
                    </div>
                    {index < history.length - 1 && <div className="timeline-line"></div>}
                  </div>
                  
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h4 className="timeline-action" style={{ color: getActionColor(item.action) }}>
                        {item.action}
                      </h4>
                      <div className="timeline-meta">
                        <span className="timeline-time" title={formatDate(item.date)}>
                          {getRelativeTime(item.date)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="timeline-details">
                      <div className="timeline-user">
                        <User className="user-icon" />
                        <span>{item.user}</span>
                      </div>
                      
                      {item.comment && (
                        <div className="timeline-comment">
                          <MessageSquare className="comment-icon" />
                          <span>{item.comment}</span>
                        </div>
                      )}
                      
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
