/**
 * recentViewUtils.js - 최근 본 상품 관리 유틸리티
 * 
 * localStorage를 사용하여 사용자가 본 상품을 추적하고 관리합니다.
 */

const RECENT_VIEW_KEY = 'recent_viewed_products';
const MAX_RECENT_ITEMS = 10; // 최대 10개까지 저장

/**
 * 최근 본 상품 목록 가져오기
 */
export const getRecentViewedProducts = () => {
  try {
    const items = localStorage.getItem(RECENT_VIEW_KEY);
    return items ? JSON.parse(items) : [];
  } catch (error) {
    console.error('Failed to get recent viewed products:', error);
    return [];
  }
};

/**
 * 최근 본 상품에 추가
 * @param {Object} product - 상품 정보
 */
export const addRecentViewedProduct = (product) => {
  try {
    if (!product || !product.itemCd) {
      return;
    }

    const recentItems = getRecentViewedProducts();
    
    // 이미 존재하는 상품이면 제거 (맨 앞에 다시 추가하기 위해)
    const filteredItems = recentItems.filter(item => item.itemCd !== product.itemCd);
    
    // 새로운 상품을 맨 앞에 추가
    const newRecentItems = [
      {
        itemCd: product.itemCd,
        itemNm: product.itemNm,
        disPrice: product.disPrice,
        salePrice: product.salePrice,
        FILEPATH: product.FILEPATH,
        unitNm: product.unitNm,
        shipAvDate: product.shipAvDate,
        viewedAt: new Date().toISOString()
      },
      ...filteredItems
    ].slice(0, MAX_RECENT_ITEMS); // 최대 개수만큼만 유지
    
    localStorage.setItem(RECENT_VIEW_KEY, JSON.stringify(newRecentItems));
    
    // 커스텀 이벤트 발생 (다른 컴포넌트에서 감지할 수 있도록)
    window.dispatchEvent(new Event('recentViewUpdated'));
  } catch (error) {
    console.error('Failed to add recent viewed product:', error);
  }
};

/**
 * 최근 본 상품 목록 초기화
 */
export const clearRecentViewedProducts = () => {
  try {
    localStorage.removeItem(RECENT_VIEW_KEY);
    window.dispatchEvent(new Event('recentViewUpdated'));
  } catch (error) {
    console.error('Failed to clear recent viewed products:', error);
  }
};

/**
 * 특정 상품을 최근 본 목록에서 제거
 * @param {string} itemCd - 상품 코드
 */
export const removeRecentViewedProduct = (itemCd) => {
  try {
    const recentItems = getRecentViewedProducts();
    const filteredItems = recentItems.filter(item => item.itemCd !== itemCd);
    localStorage.setItem(RECENT_VIEW_KEY, JSON.stringify(filteredItems));
    window.dispatchEvent(new Event('recentViewUpdated'));
  } catch (error) {
    console.error('Failed to remove recent viewed product:', error);
  }
};
