import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingCart, Calculator, User, Phone, Mail, Building, MapPin, MessageSquare, Calendar, FileText } from 'lucide-react';
import './QuoteModal.css';

const QuoteModal = ({ product, isOpen, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    requestDate: '',
    notes: ''
  });

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen || !product) return null;

  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  const handleInputChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotal = () => {
    return (product.price * quantity).toLocaleString();
  };

  const handleSubmit = async () => {
    // 필수 필드 검증
    if (!customerInfo.companyName || !customerInfo.contactPerson || 
        !customerInfo.phone || !customerInfo.email) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      // 견적 요청 데이터 준비
      const quoteData = {
        product: {
          itemCd: product.itemCd,
          itemNm: product.itemNm,
          price: product.price,
          filePath: product.filePath
        },
        quantity,
        customerInfo,
        totalAmount: product.price * quantity,
        requestDate: new Date().toISOString()
      };
      
      console.log('견적 요청 데이터:', quoteData);
      
      // TODO: 실제 API 호출
      // const response = await fetch(`${process.env.REACT_APP_API_URL}/api/quote-request`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(quoteData)
      // });
      
      alert('견적 요청이 성공적으로 전송되었습니다!');
      handleClose();
    } catch (error) {
      console.error('견적 요청 전송 실패:', error);
      alert('견적 요청 전송 중 오류가 발생했습니다.');
    }
  };

  const handleClose = () => {
    // 모달 닫을 때 상태 초기화
    setQuantity(1);
    setCustomerInfo({
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      requestDate: '',
      notes: ''
    });
    onClose();
  };

  // 백드롭 클릭 시 모달 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="quote-modal-overlay" onClick={handleBackdropClick}>
      <div className="quote-modal-container">
        {/* 모달 헤더 */}
        <div className="quote-modal-header">
          <h2 className="modal-title">
            <FileText className="title-icon" />
            견적 요청
          </h2>
          <button onClick={handleClose} className="close-button">
            <X className="close-icon" />
          </button>
        </div>

        {/* 모달 컨텐츠 */}
        <div className="quote-modal-content">
          <div className="modal-grid">
            
            {/* 상품 정보 섹션 */}
            <div className="product-section">
              <h3 className="section-title">
                <ShoppingCart className="section-icon" />
                상품 정보
              </h3>
              
              <div className="product-details">
                <div className="product-image">
                  <img 
                    src={product.filePath || "https://via.placeholder.com/120?text=No+Image"} 
                    alt={product.itemNm}
                    onError={(e) => { 
                      e.target.onerror = null; 
                      e.target.src="https://via.placeholder.com/120?text=No+Image" 
                    }}
                  />
                </div>
                <div className="product-info">
                  <h4 className="product-name">{product.itemNm}</h4>
                  <p className="product-code">상품코드: {product.itemCd}</p>
                  <div className="price-info">
                    <div className="current-price">
                      {Number(product.price).toLocaleString()} 원
                    </div>
                    {product.originalPrice && (
                      <div className="original-price">
                        정가: {Number(product.originalPrice).toLocaleString()} 원
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 수량 선택 */}
              <div className="quantity-section">
                <label className="quantity-label">수량</label>
                <div className="quantity-controls">
                  <button 
                    onClick={() => handleQuantityChange(-1)}
                    className="quantity-btn"
                  >
                    <Minus className="btn-icon" />
                  </button>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="quantity-input"
                    min="1"
                  />
                  <button 
                    onClick={() => handleQuantityChange(1)}
                    className="quantity-btn"
                  >
                    <Plus className="btn-icon" />
                  </button>
                  <span className="quantity-unit">개</span>
                </div>
              </div>

              {/* 총 금액 */}
              <div className="total-section">
                <div className="total-row">
                  <span className="total-label">
                    <Calculator className="calculator-icon" />
                    예상 총 금액
                  </span>
                  <div className="total-amount">
                    {calculateTotal()} 원
                  </div>
                </div>
                <p className="total-note">
                  * 실제 견적은 수량 및 배송비에 따라 달라질 수 있습니다.
                </p>
              </div>
            </div>

            {/* 견적 요청 폼 섹션 */}
            <div className="form-section">
              <h3 className="section-title">
                <User className="section-icon" />
                고객 정보
              </h3>

              <div className="form-fields">
                {/* 회사명 */}
                <div className="field-group">
                  <label className="field-label">
                    <Building className="field-icon" />
                    회사명 *
                  </label>
                  <input 
                    type="text"
                    value={customerInfo.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="field-input"
                    placeholder="회사명을 입력하세요"
                  />
                </div>

                {/* 담당자 */}
                <div className="field-group">
                  <label className="field-label">
                    <User className="field-icon" />
                    담당자명 *
                  </label>
                  <input 
                    type="text"
                    value={customerInfo.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="field-input"
                    placeholder="담당자명을 입력하세요"
                  />
                </div>

                {/* 연락처 */}
                <div className="field-group">
                  <label className="field-label">
                    <Phone className="field-icon" />
                    연락처 *
                  </label>
                  <input 
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="field-input"
                    placeholder="010-0000-0000"
                  />
                </div>

                {/* 이메일 */}
                <div className="field-group">
                  <label className="field-label">
                    <Mail className="field-icon" />
                    이메일 *
                  </label>
                  <input 
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="field-input"
                    placeholder="example@company.com"
                  />
                </div>

                {/* 주소 */}
                <div className="field-group">
                  <label className="field-label">
                    <MapPin className="field-icon" />
                    배송 주소
                  </label>
                  <textarea 
                    value={customerInfo.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="field-textarea"
                    rows="2"
                    placeholder="배송받을 주소를 입력하세요"
                  />
                </div>

                {/* 희망 납기일 */}
                <div className="field-group">
                  <label className="field-label">
                    <Calendar className="field-icon" />
                    희망 납기일
                  </label>
                  <input 
                    type="date"
                    value={customerInfo.requestDate}
                    onChange={(e) => handleInputChange('requestDate', e.target.value)}
                    className="field-input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* 추가 요청사항 */}
                <div className="field-group">
                  <label className="field-label">
                    <MessageSquare className="field-icon" />
                    추가 요청사항
                  </label>
                  <textarea 
                    value={customerInfo.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="field-textarea"
                    rows="2"
                    placeholder="특별한 요구사항이나 문의사항을 입력하세요"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="quote-modal-footer">
          <button onClick={handleClose} className="cancel-button">
            취소
          </button>
          <button onClick={handleSubmit} className="submit-button">
            견적 요청 보내기
          </button>
        </div>
        
        <div className="submit-note">
          견적 요청 후 영업일 기준 1-2일 내에 담당자가 연락드립니다.
        </div>
      </div>
    </div>
  );
};

export default QuoteModal;