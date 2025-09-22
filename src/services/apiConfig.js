// API 기본 설정
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  TIMEOUT: 10000, // 10초
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// API 엔드포인트 정의
export const API_ENDPOINTS = {
  // 로그인 관련
  LOGIN: (userId, password) => `/Comm/login/${userId}/${password}`,
  
  // 고객 관련 (CUST)
  CUST: {
    // 자사재고현황 조회 (CUST0010)
    COMPANY_INVENTORY: (userId) => `/Comm/CUST0010?userId=${userId}`,
    // 시리얼/로트 재고현황 조회 (CUST0010_LOT)
    LOT_INVENTORY: (userId) => `/Comm/CUST0010_LOT?userId=${userId}`,
    // 견적의뢰 관리 (CUST0040)
    QUOTE_REQUEST: (ym, userId) => `/Comm/CUST0040?ym=${ym}&userId=${userId}`,
  },
  
  // 제품 관련
  PRODUCT: {
    // 제품 목록 조회 (CUST0020)
    PRODUCT_LIST: (itemName = '') => `/Comm/CUST0020?p_itemNm=${itemName}`,
    // 대시보드 아이템 조회
    DASH_ITEMS: (itemDivCd) => `/Comm/DashItems?itemDivCd=${itemDivCd}`,
    // 카테고리 목록 조회
    CATEGORIES: () => `/Comm/category`,
  },
  // 공통 API
  COMMON: {
    FILE_UPLOAD: () => `/api/common/upload`,
    FILE_DOWNLOAD: (fileId) => `/api/common/download/${fileId}`,
    CODE_LIST: (codeType) => `/api/common/codes/${codeType}`,
  }
};

// 쿼리 스트링 빌더 함수
function buildQueryString(params) {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }
  
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}