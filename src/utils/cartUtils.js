/**
 * cartUtils.js - 장바구니 유틸리티
 * 
 * 주요 기능:
 * - 거래처별 장바구니 키 관리
 * - localStorage를 통한 장바구니 데이터 CRUD
 * - 장바구니 업데이트 이벤트 발생
 * 
 * 장바구니 키 형식:
 * - 로그인 상태: cart_{거래처코드} (예: cart_CUST001)
 * - 비로그인 상태: cart_guest
 */

/**
 * 거래처 코드를 기반으로 장바구니 키 생성
 * 
 * @param {string} custCd - 거래처 코드 (G_CUST_CD)
 * @returns {string} 장바구니 키
 */
export const getCartKey = (custCd) => {
  if (!custCd) {
    return 'cart_guest'; // 비로그인 사용자
  }
  return `cart_${custCd}`; // 거래처별 장바구니
};

/**
 * 장바구니 데이터 가져오기
 * 
 * @param {string} custCd - 거래처 코드
 * @returns {Array} 장바구니 아이템 배열
 */
export const getCartItems = (custCd) => {
  try {
    const cartKey = getCartKey(custCd);
    const cartData = localStorage.getItem(cartKey);
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error('장바구니 데이터 로드 실패:', error);
    return [];
  }
};

/**
 * 장바구니 데이터 저장
 * 
 * @param {string} custCd - 거래처 코드
 * @param {Array} items - 장바구니 아이템 배열
 */
export const setCartItems = (custCd, items) => {
  try {
    const cartKey = getCartKey(custCd);
    localStorage.setItem(cartKey, JSON.stringify(items));
    
    // 장바구니 업데이트 이벤트 발생
    window.dispatchEvent(new Event('cartUpdated'));
  } catch (error) {
    console.error('장바구니 데이터 저장 실패:', error);
  }
};

/**
 * 장바구니에 아이템 추가
 * 
 * @param {string} custCd - 거래처 코드
 * @param {Object} newItem - 추가할 아이템
 * @returns {boolean} 성공 여부
 */
export const addToCart = (custCd, newItem) => {
  try {
    const cartItems = getCartItems(custCd);
    
    // 동일한 제품이 이미 있는지 확인 (itemCd와 optValCd로 비교)
    const existingItemIndex = cartItems.findIndex(
      item => item.itemCd === newItem.itemCd && 
              (item.optValCd || '') === (newItem.optValCd || '')
    );
    
    if (existingItemIndex > -1) {
      // 이미 있으면 수량 증가
      cartItems[existingItemIndex].quantity += newItem.quantity || 1;
      cartItems[existingItemIndex].totalAmount = 
        cartItems[existingItemIndex].price * cartItems[existingItemIndex].quantity;
    } else {
      // 새로운 아이템 추가
      const itemToAdd = {
        ...newItem,
        quantity: newItem.quantity || 1,
        totalAmount: newItem.price * (newItem.quantity || 1)
      };
      cartItems.push(itemToAdd);
    }
    
    setCartItems(custCd, cartItems);
    return true;
  } catch (error) {
    console.error('장바구니 추가 실패:', error);
    return false;
  }
};

/**
 * 장바구니에서 아이템 제거
 * 
 * @param {string} custCd - 거래처 코드
 * @param {string} itemCd - 제품 코드
 * @param {string} optValCd - 옵션값 코드 (선택)
 * @returns {boolean} 성공 여부
 */
export const removeFromCart = (custCd, itemCd, optValCd = '') => {
  try {
    const cartItems = getCartItems(custCd);
    const updatedItems = cartItems.filter(
      item => !(item.itemCd === itemCd && (item.optValCd || '') === optValCd)
    );
    
    setCartItems(custCd, updatedItems);
    return true;
  } catch (error) {
    console.error('장바구니 삭제 실패:', error);
    return false;
  }
};

/**
 * 장바구니 아이템 수량 업데이트
 * 
 * @param {string} custCd - 거래처 코드
 * @param {string} itemCd - 제품 코드
 * @param {number} quantity - 새로운 수량
 * @param {string} optValCd - 옵션값 코드 (선택)
 * @returns {boolean} 성공 여부
 */
export const updateCartItemQuantity = (custCd, itemCd, quantity, optValCd = '') => {
  try {
    const cartItems = getCartItems(custCd);
    const updatedItems = cartItems.map(item => {
      if (item.itemCd === itemCd && (item.optValCd || '') === optValCd) {
        const newQuantity = Math.max(1, quantity);
        return {
          ...item,
          quantity: newQuantity,
          totalAmount: item.price * newQuantity
        };
      }
      return item;
    });
    
    setCartItems(custCd, updatedItems);
    return true;
  } catch (error) {
    console.error('장바구니 수량 업데이트 실패:', error);
    return false;
  }
};

/**
 * 장바구니 전체 비우기
 * 
 * @param {string} custCd - 거래처 코드
 */
export const clearCart = (custCd) => {
  try {
    const cartKey = getCartKey(custCd);
    localStorage.removeItem(cartKey);
    window.dispatchEvent(new Event('cartUpdated'));
  } catch (error) {
    console.error('장바구니 초기화 실패:', error);
  }
};

/**
 * 장바구니 아이템 개수 가져오기
 * 
 * @param {string} custCd - 거래처 코드
 * @returns {number} 장바구니 아이템 개수
 */
export const getCartItemCount = (custCd) => {
  const cartItems = getCartItems(custCd);
  return cartItems.length;
};

/**
 * 선택된 아이템들 제거
 * 
 * @param {string} custCd - 거래처 코드
 * @param {Array} itemCdsToRemove - 제거할 아이템 코드 배열
 * @returns {boolean} 성공 여부
 */
export const removeSelectedItems = (custCd, itemCdsToRemove) => {
  try {
    const cartItems = getCartItems(custCd);
    const updatedItems = cartItems.filter(
      item => !itemCdsToRemove.includes(item.itemCd)
    );
    
    setCartItems(custCd, updatedItems);
    return true;
  } catch (error) {
    console.error('선택 아이템 삭제 실패:', error);
    return false;
  }
};
