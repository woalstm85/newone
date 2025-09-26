import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Calculator,
  ImageOff // Package 대신 ImageOff 아이콘 사용
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Cart.css';
import ImageWithFallback from '../common/ImageWithFallback';
import Modal from '../common/Modal';
import ProductQuoteModal from '../modals/ProductQuoteModal';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { globalState } = useAuth();
  const navigate = useNavigate();
  
  // 성공 모달 메시지 상태 추가
  const [successMessage, setSuccessMessage] = useState('');
  
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

  // 선택된 상품들을 ProductQuoteModal에 맞는 형식으로 변환
  const getSelectedItemsForQuote = () => {
    return cartItems
      .filter(item => selectedItems[item.itemCd])
      .map(item => ({
        itemCd: item.itemCd,
        itemNm: item.itemNm,
        compNm: item.compNm,
        price: item.price,
        quantity: item.quantity,
        filePath: item.filePath,
        optCd: item.optCd || '',
        optValCd: item.optValCd || '',
        optValNm: item.optValNm || '',
        shipAvDate: item.shipAvDate
      }));
  };

  // 상품 수량 업데이트 함수 (델타 방식)
  const handleQuoteQuantityUpdate = (itemCd, delta) => {
    handleQuantityChange(itemCd, delta);
  };

  // 견적 모달에서 상품 제거
  const handleQuoteRemoveProduct = (itemCd) => {
    handleRemoveItem(itemCd);
  };

  // 견적 의뢰하기 - ProductQuoteModal 사용
  const handleQuoteRequest = () => {
    // 로그인 체크
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    // 선택된 항목이 있는지 확인
    const selectedItemsList = Object.keys(selectedItems).filter(itemCd => selectedItems[itemCd]);
    if (selectedItemsList.length === 0) {
      setSuccessMessage('견적 의뢰할 상품을 선택해주세요.');
      setShowSuccessModal(true);
      return;
    }

    setShowQuoteModal(true);
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <ShoppingCart size={48} className="empty-icon" />
          <h3>장바구니가 비어있습니다</h3>
          <p>잉여재고나 행사품목에서 상품을 추가해보세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      {/* 상단 흰색 영역 - 타이틀 및 컨트롤 */}
      <div className="cart-header-section">
        <div className="cart-title-area">
          <h2 className="cart-main-title">
            <ShoppingCart size={28} className="header-icon" />
            장바구니
          </h2>
          <p className="cart-description">
            선택한 상품들을 확인하고 견적을 요청하세요.
          </p>
        </div>
        
        <div className="cart-controls">
          <label className="select-all-control">
            <input
              type="checkbox"
              checked={cartItems.every(item => selectedItems[item.itemCd])}
              onChange={handleSelectAll}
            />
            <span>전체 선택 ({cartItems.length}개)</span>
          </label>
          
          <button 
            className="selected-delete-btn"
            onClick={() => {
              const selectedItemCodes = cartItems
                .filter(item => selectedItems[item.itemCd])
                .map(item => item.itemCd);
              selectedItemCodes.forEach(itemCd => handleRemoveItem(itemCd));
            }}
            disabled={getSelectedCount() === 0}
          >
            선택삭제 ({getSelectedCount()})
          </button>
        </div>
      </div>

      {/* 상품 목록 영역 - 회색 배경 */}
      <div className="cart-items-section">
        <div className="cart-items-list">
          {cartItems.map(item => (
            <div key={item.itemCd} className="cart-item-row">
              {/* 데스크톱용 체크박스 영역 */}
              <div className="item-select-area">
                <input
                  type="checkbox"
                  checked={selectedItems[item.itemCd] || false}
                  onChange={() => handleSelectItem(item.itemCd)}
                />
              </div>

              {/* 데스크톱용 이미지 영역 */}
              <div className="item-image-area">
                {item.filePath && item.filePath !== 'null' && item.filePath !== '' ? (
                  <ImageWithFallback
                    src={item.filePath}
                    alt={item.itemNm}
                    width={120}
                    height={120}
                  />
                ) : (
                  <div className="item-image-placeholder">
                    <ImageOff size={40} color="#adb5bd" strokeWidth={1.0} />
                  </div>
                )}
              </div>

              {/* 모바일용 체크박스와 이미지를 세로 배치 */}
              <div className="item-checkbox-image-area">
                <div className="item-select-area">
                  <input
                    type="checkbox"
                    checked={selectedItems[item.itemCd] || false}
                    onChange={() => handleSelectItem(item.itemCd)}
                  />
                </div>

                <div className="item-image-area">
                  {item.filePath && item.filePath !== 'null' && item.filePath !== '' ? (
                    <ImageWithFallback
                      src={item.filePath}
                      alt={item.itemNm}
                      width={70}
                      height={70}
                    />
                  ) : (
                    <div className="item-image-placeholder">
                      <ImageOff size={30} color="#adb5bd" strokeWidth={1.0} />
                    </div>
                  )}
                </div>
              </div>

              <div className="item-info-area">
                <div className="item-source-badge">
                  {item.source === 'surplus' ? '잉여재고' : '행사품목'}
                </div>
                
                <h3 className="item-title">{item.itemNm}</h3>
                
                <div className="item-details">
                  <div className="item-detail-row">
                    <span className="detail-label">코드:</span>
                    <span className="detail-value code-value">{item.itemCd}</span>
                  </div>
                  
                  {item.compNm && (
                    <div className="item-detail-row">
                      <span className="detail-label">업체:</span>
                      <span className="detail-value company-value">{item.compNm}</span>
                    </div>
                  )}
                  
                  {item.optValNm && (
                    <div className="item-detail-row">
                      <span className="detail-label">옵션:</span>
                      <span className="detail-value option-value">{item.optValNm}</span>
                    </div>
                  )}
                  
                  <div className="item-detail-row">
                    <span className="detail-label">단가:</span>
                    <span className="detail-value price-value">{item.price.toLocaleString()}원</span>
                  </div>
                </div>
                
                {/* 모바일에서 수량과 합계를 정보 영역 하단에 배치 */}
                <div className="mobile-quantity-total">
                  <div className="mobile-quantity">
                    <span className="mobile-label">수량:</span>
                    <div className="mobile-quantity-controls">
                      <button 
                        onClick={() => handleQuantityChange(item.itemCd, -1)}
                        className="mobile-quantity-btn"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="mobile-quantity-display">{item.quantity}</span>
                      <button 
                        onClick={() => handleQuantityChange(item.itemCd, 1)}
                        className="mobile-quantity-btn"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mobile-total">
                    <span className="mobile-label">합계:</span>
                    <span className="mobile-total-price">{item.totalAmount.toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              <div className="item-quantity-area">
                <span className="quantity-label">수량</span>
                <div className="quantity-controls">
                  <button 
                    onClick={() => handleQuantityChange(item.itemCd, -1)}
                    className="quantity-btn minus"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleQuantityInput(item.itemCd, e.target.value)}
                    className="quantity-input"
                    min="1"
                  />
                  <button 
                    onClick={() => handleQuantityChange(item.itemCd, 1)}
                    className="quantity-btn plus"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="item-total-area">
                <span className="total-label">합계</span>
                <div className="total-price">{item.totalAmount.toLocaleString()}원</div>
              </div>

              <div className="item-actions-area">
                <button 
                  onClick={() => handleRemoveItem(item.itemCd)}
                  className="remove-item-btn"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 요약 및 액션 영역 */}
      <div className="cart-summary-section">
        <div className="summary-content">
          <div className="summary-info">
            <span className="summary-text">
              선택된 상품 <strong>{getSelectedCount()}개</strong> · 
              총 금액 <strong className="total-amount">{calculateSelectedTotal().toLocaleString()}원</strong>
            </span>
          </div>
          
          <button 
            className="quote-request-btn"
            onClick={handleQuoteRequest}
            disabled={getSelectedCount() === 0}
          >
            <Calculator size={18} />
            견적 의뢰하기
          </button>
        </div>
      </div>

      {/* 로그인 필요 모달 */}
      <Modal
        isOpen={showLoginModal}
        title="로그인 필요"
        message="견적 의뢰를 하시려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?"
        onConfirm={() => {
          setShowLoginModal(false);
          navigate('/login');
        }}
        onCancel={() => setShowLoginModal(false)}
      />
      
      {/* ProductQuoteModal 사용 */}
      <ProductQuoteModal 
        products={getSelectedItemsForQuote()}
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        onRemoveProduct={handleQuoteRemoveProduct}
        onUpdateQuantity={handleQuoteQuantityUpdate}
      />

      {/* 성공/안내 모달 */}
      <Modal
        isOpen={showSuccessModal}
        title={successMessage.includes('선택') ? "안내" : "성공"}
        message={successMessage}
        onConfirm={() => setShowSuccessModal(false)}
      />
    </div>
  );
};

export default Cart;