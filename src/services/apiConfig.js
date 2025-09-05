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
    // 재고현황 - 새로운 API 엔드포인트로 변경
    INVENTORY_NORMAL: () => `/Comm/Stock?p_mode=normal`,
    INVENTORY_OPTION: () => `/Comm/Stock?p_mode=option`,
    INVENTORY_SERIAL: () => `/Comm/Stock?p_mode=serial`,
    
    // 고객관리
    CUSTOMER_LIST: (params = {}) => `/api/CUST0020${buildQueryString(params)}`,
    CUSTOMER_DETAIL: (custId) => `/api/CUST0020/${custId}`,
    CUSTOMER_CREATE: () => `/api/CUST0020`,
    CUSTOMER_UPDATE: (custId) => `/api/CUST0020/${custId}`,
    CUSTOMER_DELETE: (custId) => `/api/CUST0020/${custId}`,
  },
  
  // 대시보드 관련
  DASHBOARD: {
    SUMMARY: () => `/api/dashboard/summary`,
    CHARTS: () => `/api/dashboard/charts`,
    RECENT_ACTIVITY: () => `/api/dashboard/activity`,
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