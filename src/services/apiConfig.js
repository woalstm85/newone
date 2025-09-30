/**
 * apiConfig.js - API 기본 설정 및 엔드포인트 정의
 * 
 * 주요 기능:
 * 1. API 서버 기본 URL 및 타임아웃 설정 (환경 변수 활용)
 * 2. 공통 HTTP 헤더 정의
 * 3. API 엔드포인트 URL 관리 (중앙 집중화)
 * 
 * 환경 변수:
 * - REACT_APP_API_URL: API 서버 주소 (.env 파일에서 관리)
 * 
 * 보안 개선:
 * - 하드코딩된 URL 제거
 * - 환경 변수를 통한 API URL 관리
 * - 모든 엔드포인트를 한 곳에서 관리
 */

// API 기본 설정
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  TIMEOUT: 10000, // 요청 타임아웃: 10초
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

/**
 * API 엔드포인트 정의
 * 
 * 각 기능별로 그룹화하여 관리
 * 함수형으로 정의하여 동적 파라미터 처리
 * 모든 URL을 상대 경로로 구성하여 BASE_URL과 결합
 */
export const API_ENDPOINTS = {
  // 로그인 관련
  LOGIN: (userId, password) => `/Comm/login/${userId}/${password}`,
  
  // 고객(CUST) 관련
  CUST: {
    // 자사재고현황 조회 (CUST0010)
    COMPANY_INVENTORY: (userId) => `/Comm/CUST0010?userId=${userId}`,
    
    // 시리얼/로트 재고현황 조회 (CUST0010_LOT)
    LOT_INVENTORY: (userId) => `/Comm/CUST0010_LOT?userId=${userId}`,
    
    // 견적의뢰 조회 (CUST0040)
    QUOTE_REQUEST: (ym, userId) => `/Comm/CUST0040?ym=${ym}&userId=${userId}`,
    
    // 견적의뢰 등록 (MrsQtRequest)
    QUOTE_CREATE: () => `/Comm/MrsQtRequest`,
  },
  
  // 제품 관련
  PRODUCT: {
    // 제품 목록 조회 (CUST0020)
    PRODUCT_LIST: () => `/Comm/CUST0020`,
    
    // 대시보드 아이템 조회 (잉여재고, 행사품목)
    DASH_ITEMS: (itemDivCd) => `/Comm/DashItems?itemDivCd=${itemDivCd}`,
    
    // 카테고리 목록 조회
    CATEGORIES: () => `/Comm/category`,
  },
  
  // 공통 API
  COMMON: {
    // 대분류 카테고리
    CATEGORY_L: () => `/Comm/categoryL`,
    
    // 중분류 카테고리
    CATEGORY_M: () => `/Comm/categoryM`,
    
    // 소분류 카테고리
    CATEGORY_S: () => `/Comm/categoryS`,
    
    // 옵션값 조회
    OPTION_VALUES: (optCd) => `/Comm/OptionValues?optCd=${optCd}`,
    
    // 파일 업로드
    FILE_UPLOAD: () => `/api/common/upload`,
    
    // 파일 다운로드
    FILE_DOWNLOAD: (fileId) => `/api/common/download/${fileId}`,
    
    // 공통 코드 조회
    CODE_LIST: (codeType) => `/api/common/codes/${codeType}`,
  }
};

/**
 * 쿼리 스트링 빌더 함수
 * 
 * @param {Object} params - 쿼리 파라미터 객체
 * @returns {string} 생성된 쿼리 스트링 (예: "?key1=value1&key2=value2")
 * 
 * 사용 예:
 * buildQueryString({ page: 1, limit: 10 }) => "?page=1&limit=10"
 */
export function buildQueryString(params) {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }
  
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    // null, undefined, 빈 문자열은 제외
    if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * 완전한 URL 생성 함수
 * 
 * @param {string} endpoint - API 엔드포인트 경로
 * @returns {string} 전체 URL (BASE_URL + endpoint)
 */
export function buildFullUrl(endpoint) {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}
