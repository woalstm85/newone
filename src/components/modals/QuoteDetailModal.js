import React, { useState } from 'react';
import { X, Calendar, User, MapPin, Phone, Building, FileText, Eye, Package, Printer, Download, Mail } from 'lucide-react';
import { CiImageOff } from 'react-icons/ci';
import ImageModal from '../common/ImageModal';
import { generateQuotePDF, generateQuoteHTML } from '../utils/pdfGenerator';
import './QuoteDetailModal.css';

const QuoteDetailModal = ({ isOpen, onClose, quote }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '', alt: '' });

  if (!isOpen || !quote) return null;

  // 이미지 클릭 핸들러
  const handleImageClick = (imageUrl, itemName) => {
    if (imageUrl) {
      setSelectedImage({
        url: imageUrl,
        title: itemName || '',
        alt: itemName || ''
      });
      setIsImageModalOpen(true);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    if (dateString.length === 8) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return dateString;
  };

  // 금액 포맷팅
  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '0';
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 전체 견적 금액 계산
  const totalQuoteAmount = quote.subData?.reduce((sum, item) => sum + (item.reqAmount || 0), 0) || 0;

  // PDF 출력 핸들러
  const handlePrintPDF = () => {
    try {
      const pdfData = {
        quoteNumber: quote.reqNo,
        status: '청구',
        statusColor: '#007bff',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        customerInfo: {
          companyName: quote.custNm || '-',
          contactPerson: quote.contactNm || '-',
          phone: quote.contactTel || '-',
          email: quote.contactEmail || quote.email || '-',
          address: quote.custAddr || quote.siteNm || '-'
        },
        product: {
          itemNm: '견적의뢰 품목',
          itemCd: quote.reqNo,
          unitPrice: totalQuoteAmount,
        },
        quantity: quote.subData?.length || 0,
        quoteDetails: {
          subtotal: totalQuoteAmount,
          discountRate: 0,
          discountAmount: 0,
          taxRate: 10,
          taxAmount: Math.floor(totalQuoteAmount * 0.1),
          shippingCost: 0,
          totalAmount: totalQuoteAmount + Math.floor(totalQuoteAmount * 0.1),
          paymentTerms: '현금 결제',
          deliveryTerms: '원했시 납기에 맞춰 배송',
          warranty: '제품 보증 1년'
        },
        supplierInfo: {
          companyName: '우리회사',
          contactPerson: '영업대표',
          phone: '02-1234-5678',
          email: 'sales@company.com'
        }
      };
      
      // PDF 생성 시도
      generateQuotePDF(pdfData);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  };

  // HTML 출력 핸들러 (인쇄용)
  const handlePrintHTML = () => {
    try {
      const pdfData = {
        quoteNumber: quote.reqNo,
        status: '청구',
        statusColor: '#007bff',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customerInfo: {
          companyName: quote.custNm || '-',
          contactPerson: quote.contactNm || '-',
          phone: quote.contactTel || '-',
          email: quote.contactEmail || quote.email || '-',
          address: quote.custAddr || quote.siteNm || '-'
        },
        product: {
          itemNm: '견적의뢰 품목',
          itemCd: quote.reqNo,
          unitPrice: totalQuoteAmount,
        },
        quantity: quote.subData?.length || 0,
        quoteDetails: {
          subtotal: totalQuoteAmount,
          discountRate: 0,
          discountAmount: 0,
          taxRate: 10,
          taxAmount: Math.floor(totalQuoteAmount * 0.1),
          shippingCost: 0,
          totalAmount: totalQuoteAmount + Math.floor(totalQuoteAmount * 0.1),
          paymentTerms: '현금 결제',
          deliveryTerms: '원했시 납기에 맞춰 배송',
          warranty: '제품 보증 1년'
        },
        supplierInfo: {
          companyName: '우리회사',
          contactPerson: '영업대표',
          phone: '02-1234-5678',
          email: 'sales@company.com'
        }
      };
      
      // HTML 생성 및 인쇄
      const printWindow = generateQuoteHTML(pdfData);
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (error) {
      console.error('인쇄 오류:', error);
      alert('인쇄 중 오류가 발생했습니다.');
    }
  };

  // 배경 클릭으로 모달 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="quote-detail-modal-overlay" onClick={handleBackdropClick}>
      <div className="quote-detail-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className="quote-detail-modal-header">
          <div className="quote-detail-header-left">
            <FileText size={24} />
            <div className="quote-detail-header-info">
              <h2>견적의뢰 상세</h2>
              <span className="quote-detail-req-no">{quote.reqNo}</span>
            </div>
          </div>
          <button className="quote-detail-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="quote-detail-modal-body">
          {/* 기본 정보 섹션 */}
          <div className="quote-detail-section">
            <div className="quote-detail-section-header">
              <h3>기본 정보</h3>
            </div>
            <div className="quote-detail-info-grid">
              <div className="quote-detail-info-item">
                <Calendar size={16} />
                <div className="quote-detail-info-content">
                  <span className="quote-detail-info-label">요청일자</span>
                  <span className="quote-detail-info-value">{formatDate(quote.reqDate)}</span>
                </div>
              </div>
              <div className="quote-detail-info-item">
                <Calendar size={16} />
                <div className="quote-detail-info-content">
                  <span className="quote-detail-info-label">희망납기</span>
                  <span className="quote-detail-info-value">{formatDate(quote.dueDate)}</span>
                </div>
              </div>
              <div className="quote-detail-info-item">
                <Building size={16} />
                <div className="quote-detail-info-content">
                  <span className="quote-detail-info-label">고객사</span>
                  <span className="quote-detail-info-value">{quote.custNm}</span>
                </div>
              </div>
              <div className="quote-detail-info-item">
                <User size={16} />
                <div className="quote-detail-info-content">
                  <span className="quote-detail-info-label">담당자</span>
                  <span className="quote-detail-info-value">{quote.contactNm}</span>
                </div>
              </div>
              <div className="quote-detail-info-item">
                <Phone size={16} />
                <div className="quote-detail-info-content">
                  <span className="quote-detail-info-label">연락처</span>
                  <span className="quote-detail-info-value">{quote.contactTel}</span>
                </div>
              </div>
              <div className="quote-detail-info-item">
                <Mail size={16} />
                <div className="quote-detail-info-content">
                  <span className="quote-detail-info-label">이메일</span>
                  <span className="quote-detail-info-value">{quote.contactEmail || quote.email || '-'}</span>
                </div>
              </div>
              <div className="quote-detail-info-item">
                <MapPin size={16} />
                <div className="quote-detail-info-content">
                  <span className="quote-detail-info-label">주소</span>
                  <span className="quote-detail-info-value">{quote.siteNm}</span>
                </div>
              </div>
            </div>
            
            {/* 요청사항 */}
            {quote.reqDesc && (
              <div className="quote-detail-request-desc">
                <div className="quote-detail-desc-header">
                  <FileText size={16} />
                  <span>요청사항</span>
                </div>
                <div className="quote-detail-desc-content">
                  {quote.reqDesc}
                </div>
              </div>
            )}
          </div>

          {/* 견적 품목 섹션 - 이미지 포함 */}
          <div className="quote-detail-section">
            <div className="quote-detail-section-header">
              <h3>견적 품목 ({quote.subData?.length || 0}건)</h3>
              <div className="quote-detail-total-amount">
                총 견적금액: <span>{formatAmount(totalQuoteAmount)}원</span>
              </div>
            </div>

            {/* 이미지가 포함된 품목 리스트 */}
            <div className="quote-detail-items-with-images">
              {quote.subData?.map((item, index) => (
                <div key={index} className="quote-detail-item-with-image">
                  {/* 이미지 영역 */}
                  <div className="quote-detail-item-image">
                    {item.thFilePath ? (
                      <div className="quote-detail-image-container">
                        <img
                          src={item.thFilePath}
                          alt={item.itemNm}
                          className="quote-detail-image"
                        />
                        <div className="quote-detail-image-overlay">
                          <button
                            className="quote-detail-image-btn"
                            onClick={() => handleImageClick(item.thFilePath, item.itemNm)}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="quote-detail-no-image">
                        <Package size={24} color="#ccc" />
                      </div>
                    )}
                  </div>

                  {/* 품목 정보 영역 */}
                  <div className="quote-detail-item-info">
                    <h4>{item.itemNm}</h4>
                    <div className="quote-detail-item-details">
                      <p><span>품목코드:</span> {item.itemCd}</p>
                      {item.optValNm && <p><span>옵션:</span> {item.optValNm}</p>}
                      {item.remark && <p><span>비고:</span> {item.remark}</p>}
                    </div>
                  </div>

                  {/* 수량 및 금액 영역 */}
                  <div className="quote-detail-item-amount">
                    <div className="quote-detail-amount-row">
                      <span className="quote-detail-amount-label">수량:</span>
                      <span className="quote-detail-amount-value">{formatAmount(item.reqQty)}</span>
                    </div>
                    <div className="quote-detail-amount-row">
                      <span className="quote-detail-amount-label">단가:</span>
                      <span className="quote-detail-amount-value">{formatAmount(item.reqPrice)}원</span>
                    </div>
                    <div className="quote-detail-amount-row total">
                      <span className="quote-detail-amount-label">금액:</span>
                      <strong className="quote-detail-amount-total">{formatAmount(item.reqAmount)}원</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="quote-detail-modal-footer">
          <div className="quote-detail-footer-summary">
            <strong>총 {quote.subData?.length || 0}개 품목 | 총 견적금액: {formatAmount(totalQuoteAmount)}원</strong>
          </div>
          <div className="quote-detail-footer-actions">
            {/* PDF 및 인쇄 버튼 - 임시 비활성화 */}
            {false && (
              <>
                <button 
                  className="quote-detail-action-btn primary"
                  onClick={handlePrintPDF}
                >
                  <Download size={16} />
                  PDF 다운로드
                </button>
                <button 
                  className="quote-detail-action-btn primary"
                  onClick={handlePrintHTML}
                >
                  <Printer size={16} />
                  인쇄
                </button>
              </>
            )}
            <button className="quote-detail-action-btn secondary" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* 이미지 모달 */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={(e) => {
          e && e.stopPropagation && e.stopPropagation();
          setIsImageModalOpen(false);
        }}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
        altText={selectedImage.alt}
        showControls={true}
        showDownload={true}
      />
    </div>
  );
};

export default QuoteDetailModal;