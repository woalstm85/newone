import React from 'react';
import { X, FileText, Building, User, Phone, Mail, MapPin, Calendar, Package, Calculator, CreditCard, Truck, Shield, Download, Printer } from 'lucide-react';
import './QuoteDetailModal.css';
import ImageWithFallback from '../common/ImageWithFallback';

const QuoteDetailModal = ({ quote, isOpen, onClose }) => {
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
      minute: '2-digit'
    });
  };

  // 금액 포맷팅
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 백드롭 클릭 시 모달 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 견적서 다운로드
  const handleDownload = () => {
    alert(`견적서 "${quote.quoteNumber}" 다운로드를 시작합니다.`);
  };

  // 견적서 인쇄
  const handlePrint = () => {
    window.print();
  };

  // 상태에 따른 색상 반환
  const getStatusColor = (status) => {
    switch (status) {
      case '대기중': return '#ffc107';
      case '검토중': return '#17a2b8';
      case '승인됨': return '#28a745';
      case '거절됨': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="quote-detail-overlay" onClick={handleBackdropClick}>
      <div className="quote-detail-container">
        {/* 모달 헤더 */}
        <div className="quote-detail-header">
          <div className="header-left">
            <h2 className="modal-title">
              <FileText className="title-icon" />
              견적서 상세
            </h2>
            <div className="quote-info">
              <span className="quote-number">{quote.quoteNumber}</span>
              <span 
                className="quote-status-badge"
                style={{ backgroundColor: getStatusColor(quote.status) }}
              >
                {quote.status}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <button onClick={handleDownload} className="action-btn download-btn" title="다운로드">
              <Download className="btn-icon" />
            </button>
            <button onClick={handlePrint} className="action-btn print-btn" title="인쇄">
              <Printer className="btn-icon" />
            </button>
            <button onClick={onClose} className="close-button" title="닫기">
              <X className="close-icon" />
            </button>
          </div>
        </div>

        {/* 모달 컨텐츠 */}
        <div className="quote-detail-content">
          <div className="content-grid">
            
            {/* 좌측: 기본 정보 */}
            <div className="left-panel">
              
              {/* 고객 정보 섹션 */}
              <div className="info-section">
                <h3 className="section-title">
                  <Building className="section-icon" />
                  고객 정보
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">
                      <Building className="info-icon" />
                      회사명
                    </span>
                    <span className="info-value">{quote.customerInfo.companyName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <User className="info-icon" />
                      담당자
                    </span>
                    <span className="info-value">{quote.customerInfo.contactPerson}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Phone className="info-icon" />
                      연락처
                    </span>
                    <span className="info-value">{quote.customerInfo.phone}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Mail className="info-icon" />
                      이메일
                    </span>
                    <span className="info-value">{quote.customerInfo.email}</span>
                  </div>
                  <div className="info-item full-width">
                    <span className="info-label">
                      <MapPin className="info-icon" />
                      주소
                    </span>
                    <span className="info-value">{quote.customerInfo.address}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Calendar className="info-icon" />
                      희망 납기일
                    </span>
                    <span className="info-value">{quote.customerInfo.requestDate}</span>
                  </div>
                </div>
                {quote.customerInfo.notes && (
                  <div className="notes-section">
                    <span className="notes-label">요청사항</span>
                    <p className="notes-content">{quote.customerInfo.notes}</p>
                  </div>
                )}
              </div>

              {/* 공급업체 정보 섹션 */}
              <div className="info-section">
                <h3 className="section-title">
                  <Building className="section-icon" />
                  공급업체 정보
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">
                      <Building className="info-icon" />
                      회사명
                    </span>
                    <span className="info-value">{quote.supplierInfo.companyName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <User className="info-icon" />
                      담당자
                    </span>
                    <span className="info-value">{quote.supplierInfo.contactPerson}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Phone className="info-icon" />
                      연락처
                    </span>
                    <span className="info-value">{quote.supplierInfo.phone}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Mail className="info-icon" />
                      이메일
                    </span>
                    <span className="info-value">{quote.supplierInfo.email}</span>
                  </div>
                </div>
              </div>

              {/* 견적 이력 섹션 */}
              <div className="info-section">
                <h3 className="section-title">
                  <Calendar className="section-icon" />
                  견적 이력
                </h3>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <span className="timeline-title">견적 요청</span>
                      <span className="timeline-date">{formatDate(quote.requestDate)}</span>
                    </div>
                  </div>
                  {quote.responseDate && (
                    <div className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <span className="timeline-title">견적 응답</span>
                        <span className="timeline-date">{formatDate(quote.responseDate)}</span>
                      </div>
                    </div>
                  )}
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <span className="timeline-title">견적 유효기한</span>
                      <span className="timeline-date">{formatDate(quote.validUntil)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측: 상품 및 견적 정보 */}
            <div className="right-panel">
              
              {/* 상품 정보 섹션 */}
              <div className="info-section">
                <h3 className="section-title">
                  <Package className="section-icon" />
                  상품 정보
                </h3>
                <div className="product-detail">
                  <div className="product-image-section">
                    <ImageWithFallback
                      src={quote.product.filePath}
                      alt={quote.product.itemNm}
                      width={120}
                      height={120}
                      className="product-image"
                    />
                  </div>
                  <div className="product-info-section">
                    <h4 className="product-name">{quote.product.itemNm}</h4>
                    <p className="product-code">상품코드: {quote.product.itemCd}</p>
                    <div className="product-price">
                      <span className="price-label">단가:</span>
                      <span className="price-value">{formatAmount(quote.product.unitPrice)}원</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 견적 상세 섹션 */}
              <div className="info-section">
                <h3 className="section-title">
                  <Calculator className="section-icon" />
                  견적 상세
                </h3>
                <div className="quote-calculation">
                  <div className="calc-row">
                    <span className="calc-label">단가</span>
                    <span className="calc-value">{formatAmount(quote.quoteDetails.unitPrice)}원</span>
                  </div>
                  <div className="calc-row">
                    <span className="calc-label">수량</span>
                    <span className="calc-value">{formatAmount(quote.quoteDetails.quantity)}개</span>
                  </div>
                  <div className="calc-row subtotal">
                    <span className="calc-label">소계</span>
                    <span className="calc-value">{formatAmount(quote.quoteDetails.subtotal)}원</span>
                  </div>
                  
                  {quote.quoteDetails.discountRate > 0 && (
                    <div className="calc-row discount">
                      <span className="calc-label">할인 ({quote.quoteDetails.discountRate}%)</span>
                      <span className="calc-value">-{formatAmount(quote.quoteDetails.discountAmount)}원</span>
                    </div>
                  )}
                  
                  <div className="calc-row">
                    <span className="calc-label">부가세 ({quote.quoteDetails.taxRate}%)</span>
                    <span className="calc-value">{formatAmount(quote.quoteDetails.taxAmount)}원</span>
                  </div>
                  
                  {quote.quoteDetails.shippingCost > 0 && (
                    <div className="calc-row">
                      <span className="calc-label">배송비</span>
                      <span className="calc-value">{formatAmount(quote.quoteDetails.shippingCost)}원</span>
                    </div>
                  )}
                  
                  <div className="calc-row total">
                    <span className="calc-label">총 금액</span>
                    <span className="calc-value">{formatAmount(quote.quoteDetails.totalAmount)}원</span>
                  </div>
                </div>
              </div>

              {/* 거래 조건 섹션 */}
              <div className="info-section">
                <h3 className="section-title">
                  <FileText className="section-icon" />
                  거래 조건
                </h3>
                <div className="terms-grid">
                  <div className="term-item">
                    <div className="term-icon-wrapper">
                      <CreditCard className="term-icon" />
                    </div>
                    <div className="term-content">
                      <span className="term-label">결제 조건</span>
                      <span className="term-value">{quote.quoteDetails.paymentTerms}</span>
                    </div>
                  </div>
                  
                  <div className="term-item">
                    <div className="term-icon-wrapper">
                      <Truck className="term-icon" />
                    </div>
                    <div className="term-content">
                      <span className="term-label">납품 조건</span>
                      <span className="term-value">{quote.quoteDetails.deliveryTerms}</span>
                    </div>
                  </div>
                  
                  <div className="term-item">
                    <div className="term-icon-wrapper">
                      <Shield className="term-icon" />
                    </div>
                    <div className="term-content">
                      <span className="term-label">보증 조건</span>
                      <span className="term-value">{quote.quoteDetails.warranty}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="quote-detail-footer">
          <div className="footer-info">
            <span className="footer-text">
              견적 유효기간: {formatDate(quote.validUntil)}까지
            </span>
          </div>
          <div className="footer-actions">
            <button onClick={onClose} className="btn btn-secondary">
              닫기
            </button>
            <button onClick={handleDownload} className="btn btn-primary">
              <Download className="btn-icon" />
              견적서 다운로드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetailModal;