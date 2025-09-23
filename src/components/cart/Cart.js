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
import ProductQuoteModal from '../modals/ProductQuoteModal';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { globalState } = useAuth();
  
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
      <div className="cart-header">
        <h2>
          <ShoppingCart size={24} className="header-icon" />
          장바구니 ({cartItems.length})
        </h2>
        <div className="cart-actions">
          <label className="select-all">
            <input
              type="checkbox"
              checked={cartItems.every(item => selectedItems[item.itemCd])}
              onChange={handleSelectAll}
            />
            전체 선택
          </label>
        </div>
      </div>

      <div className="cart-content">
        <div className="cart-list">
          {cartItems.map(item => (
            <div key={item.itemCd} className="cart-item">
              <div className="item-select">
                <input
                  type="checkbox"
                  checked={selectedItems[item.itemCd] || false}
                  onChange={() => handleSelectItem(item.itemCd)}
                />
              </div>

              {/* 데스크톱용 직접 자식 요소들 */}
              <div className="item-image">
                <ImageWithFallback
                  src={item.filePath}
                  alt={item.itemNm}
                  width={80}
                  height={80}
                />
              </div>

              <div className="item-info">
                <h4 className="item-name">{item.itemNm}</h4>
                <p className="item-code">코드: {item.itemCd}</p>
                {item.compNm && <p className="item-company">{item.compNm}</p>}
                {item.optValNm && (
                  <p className="item-option">
                    <span className="option-label">옵션:</span>
                    <span className="option-value">{item.optValNm}</span>
                  </p>
                )}
                <div className="item-price">
                  <span className="price-label">단가:</span>
                  {item.price.toLocaleString()}원
                </div>
              </div>

              <div className="item-quantity">
                <button 
                  onClick={() => handleQuantityChange(item.itemCd, -1)}
                  className="quantity-btn"
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
                  className="quantity-btn"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="item-total">
                합계: {item.totalAmount.toLocaleString()}원
              </div>

              <div className="item-actions">
                <button 
                  onClick={() => handleRemoveItem(item.itemCd)}
                  className="remove-btn"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* 모바일에서 가로 배치를 위한 메인 컨텐츠 래퍼 */}
              <div className="cart-item-main">
                <div className="item-image">
                  <ImageWithFallback
                    src={item.filePath}
                    alt={item.itemNm}
                    width={80}
                    height={80}
                  />
                </div>

                <div className="item-info">
                  <h4 className="item-name">{item.itemNm}</h4>
                  <p className="item-code">코드: {item.itemCd}</p>
                  {item.compNm && <p className="item-company">{item.compNm}</p>}
                  {item.optValNm && (
                    <p className="item-option">
                      <span className="option-label">옵션:</span>
                      <span className="option-value">{item.optValNm}</span>
                    </p>
                  )}
                  <div className="item-price">
                    <span className="price-label">단가:</span>
                    {item.price.toLocaleString()}원
                  </div>
                  <div className="item-total mobile-only">
                    합계: {item.totalAmount.toLocaleString()}원
                  </div>
                </div>
              </div>

              {/* 모바일에서 컨트롤 영역 */}
              <div className="cart-item-controls">
                <div className="item-quantity">
                  <button 
                    onClick={() => handleQuantityChange(item.itemCd, -1)}
                    className="quantity-btn"
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
                    className="quantity-btn"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="item-actions">
                  <button 
                    onClick={() => handleRemoveItem(item.itemCd)}
                    className="remove-btn"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="summary-info">
            <p>선택된 상품: <strong>{getSelectedCount()}개</strong></p>
            <p>총 금액: <strong>{calculateSelectedTotal().toLocaleString()}원</strong></p>
          </div>
          
          <div className="summary-actions">
            <button 
              className="quote-btn"
              onClick={handleQuoteRequest}
              disabled={getSelectedCount() === 0}
            >
              <Calculator size={18} />
              견적 의뢰하기 ({getSelectedCount()})
            </button>
          </div>
        </div>
      </div>

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
