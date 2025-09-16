import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Calculator
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Cart.css';
import ImageWithFallback from '../common/ImageWithFallback';
import Modal from '../common/Modal';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { globalState } = useAuth();
  
  // 견적 의뢰 폼 상태
  const [quoteForm, setQuoteForm] = useState({
    custNm: '',           // 업체명
    managerName: '',      // 담당자명
    contact: '',          // 연락처
    email: '',            // 이메일
    address: '',          // 주소
    requestContent: '',   // 요청사항
    deliveryDate: ''      // 희망 납기일
  });
  
  // 유효성 검증 오류 상태
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  
  // 로그인 상태 확인
  const isLoggedIn = !!globalState.G_USER_ID;

  // 컴포넌트 마운트 시 장바구니 데이터 로드
  useEffect(() => {
    loadCartItems();
  }, []);

  // 장바구니 데이터 로드
  const loadCartItems = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(savedCart);
    
    // 선택 상태 초기화 (모든 항목 선택)
    const initialSelected = {};
    savedCart.forEach(item => {
      initialSelected[item.itemCd] = true;
    });
    setSelectedItems(initialSelected);
  };

  // 수량 변경
  const handleQuantityChange = (itemCd, delta) => {
    const updatedItems = cartItems.map(item => {
      if (item.itemCd === itemCd) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQuantity,
          totalAmount: item.price * newQuantity
        };
      }
      return item;
    });
    
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // 수량 직접 입력
  const handleQuantityInput = (itemCd, value) => {
    const newQuantity = Math.max(1, parseInt(value) || 1);
    const updatedItems = cartItems.map(item => {
      if (item.itemCd === itemCd) {
        return {
          ...item,
          quantity: newQuantity,
          totalAmount: item.price * newQuantity
        };
      }
      return item;
    });
    
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
  };

  // 항목 삭제
  const handleRemoveItem = (itemCd) => {
    const updatedItems = cartItems.filter(item => item.itemCd !== itemCd);
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
    window.dispatchEvent(new Event('cartUpdated'));
    
    // 선택 상태에서도 제거
    const updatedSelected = { ...selectedItems };
    delete updatedSelected[itemCd];
    setSelectedItems(updatedSelected);
  };

  // 개별 선택/해제
  const handleSelectItem = (itemCd) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemCd]: !prev[itemCd]
    }));
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    const allSelected = cartItems.every(item => selectedItems[item.itemCd]);
    const newSelectedState = {};
    
    cartItems.forEach(item => {
      newSelectedState[item.itemCd] = !allSelected;
    });
    
    setSelectedItems(newSelectedState);
  };

  // 선택된 항목들의 총 금액 계산
  const calculateSelectedTotal = () => {
    return cartItems
      .filter(item => selectedItems[item.itemCd])
      .reduce((total, item) => total + item.totalAmount, 0);
  };

  // 선택된 항목 개수
  const getSelectedCount = () => {
    return Object.values(selectedItems).filter(Boolean).length;
  };

  // 견적 의뢰하기
  const handleQuoteRequest = () => {
    // 로그인 체크
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    // 선택된 항목이 있는지 확인
    const selectedCartItems = cartItems.filter(item => selectedItems[item.itemCd]);
    if (selectedCartItems.length === 0) {
      setShowSuccessModal(true);
      return;
    }

    // 폼 초기화 - 로그인 정보로 설정
    setQuoteForm({
      custNm: globalState.G_CUST_NM || '',
      managerName: globalState.G_USER_NM || '',
      contact: '',
      email: '',
      address: '',
      requestContent: '',
      deliveryDate: ''
    });

    // 에러 상태 초기화
    setValidationErrors({});

    setShowQuoteModal(true);
  };

  // 폼 입력 핸들러
  const handleFormChange = (field, value) => {
    setQuoteForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 해당 필드의 에러 상태 초기화
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  // 유효성 검증
  const validateForm = () => {
    const errors = {};
    let firstErrorField = null;

    // 필수 항목 검증
    if (!quoteForm.custNm.trim()) {
      errors.custNm = true;
      if (!firstErrorField) firstErrorField = 'custNm';
    }
    if (!quoteForm.managerName.trim()) {
      errors.managerName = true;
      if (!firstErrorField) firstErrorField = 'managerName';
    }
    if (!quoteForm.contact.trim()) {
      errors.contact = true;
      if (!firstErrorField) firstErrorField = 'contact';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      // 첫 번째 에러 필드에 따른 메시지
      const errorMessages = {
        custNm: '업체명을 입력해주세요.',
        managerName: '담당자명을 입력해주세요.',
        contact: '연락처를 입력해주세요.'
      };
      
      setValidationMessage(errorMessages[firstErrorField]);
      setShowValidationModal(true);
      return false;
    }

    return true;
  };

  // 견적 의뢰 확인
  const confirmQuoteRequest = async () => {
    // 유효성 검증
    if (!validateForm()) {
      return;
    }

    try {
      const selectedCartItems = cartItems.filter(item => selectedItems[item.itemCd]);
      
      const quoteData = {
        items: selectedCartItems,
        totalAmount: calculateSelectedTotal(),
        requestDate: new Date().toISOString(),
        userId: globalState.G_USER_ID,
        formData: quoteForm
      };
      
      console.log('견적 요청 데이터:', quoteData);
      
      // TODO: 실제 API 호출
      // const response = await fetch(`${process.env.REACT_APP_API_URL}/api/quote-request`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(quoteData)
      // });
      
      // 성공 모달 표시
      setShowQuoteModal(false);
      setShowSuccessModal(true);
      
      // 견적 의뢰한 항목들을 장바구니에서 제거
      const remainingItems = cartItems.filter(item => !selectedItems[item.itemCd]);
      setCartItems(remainingItems);
      localStorage.setItem('cart', JSON.stringify(remainingItems));
      window.dispatchEvent(new Event('cartUpdated'));
      
      // 선택 상태 초기화
      const newSelectedState = {};
      remainingItems.forEach(item => {
        newSelectedState[item.itemCd] = true;
      });
      setSelectedItems(newSelectedState);
      
    } catch (error) {
      console.error('견적 의뢰 전송 실패:', error);
      setValidationMessage('견적 의뢰 전송 중 오류가 발생했습니다.');
      setShowValidationModal(true);
    }
  };

  // 장바구니가 비어있는 경우
  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-header">
          <h2>
            <ShoppingCart className="header-icon" />
            장바구니
          </h2>
        </div>
        <div className="empty-cart">
          <ShoppingCart size={64} className="empty-icon" />
          <h3>장바구니가 비어있습니다</h3>
          <p>상품을 장바구니에 담아보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      {/* 헤더 */}
      <div className="cart-header">
        <h2>
          <ShoppingCart className="header-icon" />
          장바구니 ({cartItems.length}개)
        </h2>
        <div className="cart-actions">
          <label className="select-all">
            <input
              type="checkbox"
              checked={cartItems.length > 0 && cartItems.every(item => selectedItems[item.itemCd])}
              onChange={handleSelectAll}
            />
            전체 선택
          </label>
        </div>
      </div>

      {/* 장바구니 목록 */}
      <div className="cart-list">
        {cartItems.map(item => (
          <div key={item.itemCd} className="cart-item">
            {/* 선택 체크박스 */}
            <div className="item-select">
              <input
                type="checkbox"
                checked={selectedItems[item.itemCd] || false}
                onChange={() => handleSelectItem(item.itemCd)}
              />
            </div>

            {/* 상품 이미지 */}
            <div className="item-image">
              <ImageWithFallback
                src={item.filePath}
                alt={item.itemNm}
                width={80}
                height={80}
              />
            </div>

            {/* 상품 정보 */}
            <div className="item-info">
              <h4 className="item-name">{item.itemNm}</h4>
              <p className="item-code">상품코드: {item.itemCd}</p>
              <div className="item-price">
                단가: {Number(item.price).toLocaleString()} 원
              </div>
            </div>

            {/* 수량 조절 */}
            <div className="cart-quantity-section">
              <label>수량</label>
              <div className="cart-quantity-controls">
                <button 
                  onClick={() => handleQuantityChange(item.itemCd, -1)}
                  className="cart-quantity-btn"
                >
                  <Minus size={16} />
                </button>
                <input 
                  type="number" 
                  value={item.quantity}
                  onChange={(e) => handleQuantityInput(item.itemCd, e.target.value)}
                  className="cart-quantity-input"
                  min="1"
                />
                <button 
                  onClick={() => handleQuantityChange(item.itemCd, 1)}
                  className="cart-quantity-btn"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* 총액 */}
            <div className="item-total">
              <div className="total-amount">
                {Number(item.totalAmount).toLocaleString()} 원
              </div>
            </div>

            {/* 삭제 버튼 */}
            <div className="item-actions">
              <button 
                onClick={() => handleRemoveItem(item.itemCd)}
                className="remove-btn"
                title="상품 삭제"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 하단 요약 */}
      <div className="cart-summary">
        <div className="summary-info">
          <div className="selected-info">
            선택된 상품: {getSelectedCount()}개
          </div>
          <div className="total-info">
            총 금액: <span className="total-amount">{calculateSelectedTotal().toLocaleString()} 원</span>
          </div>
        </div>
        <button 
          onClick={handleQuoteRequest}
          className={`quote-request-btn ${getSelectedCount() === 0 ? 'disabled' : ''}`}
          disabled={getSelectedCount() === 0}
        >
          <Calculator className="btn-icon" />
          견적 의뢰하기 ({getSelectedCount()}개)
        </button>
      </div>

      {/* 견적 의뢰 입력 모달 */}
      {showQuoteModal && (
        <div className="quote-modal-overlay">
          <div className="quote-modal-large">
            <div className="quote-modal-header">
              <h3>견적 의뢰 입력</h3>
              <button 
                className="quote-modal-close"
                onClick={() => setShowQuoteModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="quote-modal-body">
              {/* 왼쪽: 상품 목록 */}
              <div className="quote-products-section">
                <div className="quote-products-header">
                  <h4>선택된 상품 ({getSelectedCount()}개)</h4>
                  <div className="quote-total-amount">
                    총 금액: <strong>{calculateSelectedTotal().toLocaleString()} 원</strong>
                  </div>
                </div>
                
                <div className="quote-products-list">
                  {cartItems
                    .filter(item => selectedItems[item.itemCd])
                    .map(item => (
                    <div key={item.itemCd} className="quote-product-item">
                      {/* 선택 체크박스 */}
                      <div className="quote-item-select">
                        <input
                          type="checkbox"
                          checked={selectedItems[item.itemCd] || false}
                          onChange={() => handleSelectItem(item.itemCd)}
                        />
                      </div>

                      {/* 상품 이미지 */}
                      <div className="quote-item-image">
                        <ImageWithFallback
                          src={item.filePath}
                          alt={item.itemNm}
                          width={60}
                          height={60}
                        />
                      </div>

                      {/* 상품 정보 */}
                      <div className="quote-item-info">
                        <h5 className="quote-item-name">{item.itemNm}</h5>
                        <p className="quote-item-code">{item.itemCd}</p>
                        <div className="quote-item-price">
                          {Number(item.price).toLocaleString()} 원
                        </div>
                      </div>

                      {/* 수량 조절 */}
                      <div className="quote-quantity-section">
                        <div className="quote-quantity-controls">
                          <button 
                            onClick={() => handleQuantityChange(item.itemCd, -1)}
                            className="quote-quantity-btn"
                          >
                            <Minus size={14} />
                          </button>
                          <input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => handleQuantityInput(item.itemCd, e.target.value)}
                            className="quote-quantity-input"
                            min="1"
                          />
                          <button 
                            onClick={() => handleQuantityChange(item.itemCd, 1)}
                            className="quote-quantity-btn"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* 총액 */}
                      <div className="quote-item-total">
                        <div className="quote-total-amount">
                          {Number(item.totalAmount).toLocaleString()} 원
                        </div>
                      </div>

                      {/* 삭제 버튼 */}
                      <div className="quote-item-actions">
                        <button 
                          onClick={() => handleRemoveItem(item.itemCd)}
                          className="quote-remove-btn"
                          title="상품 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {getSelectedCount() === 0 && (
                    <div className="quote-no-products">
                      <p>선택된 상품이 없습니다.</p>
                      <p>장바구니에서 상품을 선택해주세요.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 오른쪽: 입력 폼 */}
              <div className="quote-form-section">
                <h4>견적 요청 정보</h4>
                
                <div className="quote-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>업체명 *</label>
                      <input
                        type="text"
                        value={quoteForm.custNm}
                        onChange={(e) => handleFormChange('custNm', e.target.value)}
                        placeholder="업체명을 입력하세요"
                        className={validationErrors.custNm ? 'error' : ''}
                      />
                    </div>
                    <div className="form-group">
                      <label>담당자명 *</label>
                      <input
                        type="text"
                        value={quoteForm.managerName}
                        onChange={(e) => handleFormChange('managerName', e.target.value)}
                        placeholder="담당자명을 입력하세요"
                        className={validationErrors.managerName ? 'error' : ''}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>연락처 *</label>
                      <input
                        type="tel"
                        value={quoteForm.contact}
                        onChange={(e) => handleFormChange('contact', e.target.value)}
                        placeholder="010-0000-0000"
                        className={validationErrors.contact ? 'error' : ''}
                      />
                    </div>
                    <div className="form-group">
                      <label>이메일</label>
                      <input
                        type="email"
                        value={quoteForm.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group full-width">
                    <label>주소</label>
                    <input
                      type="text"
                      value={quoteForm.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      placeholder="주소를 입력하세요"
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>희망 납기일</label>
                    <input
                      type="date"
                      value={quoteForm.deliveryDate}
                      onChange={(e) => handleFormChange('deliveryDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>요청사항</label>
                    <textarea
                      value={quoteForm.requestContent}
                      onChange={(e) => handleFormChange('requestContent', e.target.value)}
                      placeholder="추가 요청사항이 있으시면 입력해주세요"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="quote-modal-footer">
              <button 
                className="quote-modal-btn cancel"
                onClick={() => setShowQuoteModal(false)}
              >
                취소
              </button>
              <button 
                className="quote-modal-btn confirm"
                onClick={confirmQuoteRequest}
                disabled={getSelectedCount() === 0}
              >
                견적 의뢰하기 ({getSelectedCount()}개)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 로그인 필요 모달 */}
      <Modal
        isOpen={showLoginModal}
        title="로그인 필요"
        message="견적 의뢰를 하시려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?"
        onConfirm={() => {
          setShowLoginModal(false);
          window.location.href = '/login';
        }}
        onCancel={() => setShowLoginModal(false)}
      />
      
      {/* 성공/안내 모달 */}
      <Modal
        isOpen={showSuccessModal}
        title={getSelectedCount() === 0 ? "안내" : "성공"}
        message={getSelectedCount() === 0 ? 
          "견적 의뢰할 상품을 선택해주세요." : 
          "선택된 상품들의 견적 의뢰가 성공적으로 전송되었습니다!"
        }
        onConfirm={() => setShowSuccessModal(false)}
      />
      
      {/* 유효성 검증 모달 */}
      <Modal
        isOpen={showValidationModal}
        title="입력 오류"
        message={validationMessage}
        onConfirm={() => setShowValidationModal(false)}
      />
    </div>
  );
};

export default Cart;