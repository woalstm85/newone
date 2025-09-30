/**
 * apiConfig.ts - API 기본 설정 및 엔드포인트 정의
 * 
 * 주요 기능:
 * 1. API 서버 기본 URL 및 타임아웃 설정
 * 2. 공통 HTTP 헤더 정의
 * 3. API 엔드포인트 URL 관리 (환경 변수 활용)
 * 
 * 환경 변수:
 * - REACT_APP_API_URL: API 서버 주소 (.env 파일에서 관리)
 */

// API 설정 타입 정의
interface ApiConfig {
  BASE_URL: string;
  TIMEOUT: number;
  HEADERS: {
    'Content-Type': string;
    'Accept': string;
  };
}

// API 엔드포인트 타입 정의
interface ApiEndpoints {
  LOGIN: (userId: string, password: string) => string;
  CUST: {
    COMPANY_INVENTORY: (userId: string) => string;
    LOT_INVENTORY: (userId: string) => string;
    QUOTE_REQUEST: (ym: string, userId: string) => string;
    QUOTE_CREATE: () => string;
  };
  PRODUCT: {
    PRODUCT_LIST: () => string;
    DASH_ITEMS: (itemDivCd: string) => string;
    CATEGORIES: () => string;
  };
  COMMON: {
    CATEGORY_L: () => string;
    CATEGORY_M: () => string;
    CATEGORY_S: () => string;
    OPTION_VALUES: (optCd: string) => string;
    FILE_UPLOAD: () => string;
    FILE_DOWNLOAD: (fileId: string) => string;
    CODE_LIST: (codeType: string) => string;
  };
}

// API 기본 설정
export const API_CONFIG: ApiConfig = {
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
 * 모든 URL을 BASE_URL을 기반으로 상대 경로로 구성
 */
export const API_ENDPOINTS: ApiEndpoints = {
  // 로그인 관련
  LOGIN: (userId: string, password: string) => 
    `/Comm/login/${userId}/${password}`,
  
  // 고객(CUST) 관련
  CUST: {
    // 자사재고현황 조회 (CUST0010)
    COMPANY_INVENTORY: (userId: string) => 
      `/Comm/CUST0010?userId=${userId}`,
    
    // 시리얼/로트 재고현황 조회 (CUST0010_LOT)
    LOT_INVENTORY: (userId: string) => 
      `/Comm/CUST0010_LOT?userId=${userId}`,
    
    // 견적의뢰 조회 (CUST0040)
    QUOTE_REQUEST: (ym: string, userId: string) => 
      `/Comm/CUST0040?ym=${ym}&userId=${userId}`,
    
    // 견적의뢰 등록 (MrsQtRequest)
    QUOTE_CREATE: () => 
      `/Comm/MrsQtRequest`,
  },
  
  // 제품 관련
  PRODUCT: {
    // 제품 목록 조회 (CUST0020)
    PRODUCT_LIST: () => 
      `/Comm/CUST0020`,
    
    // 대시보드 아이템 조회 (잉여재고, 행사품목)
    DASH_ITEMS: (itemDivCd: string) => 
      `/Comm/DashItems?itemDivCd=${itemDivCd}`,
    
    // 카테고리 목록 조회
    CATEGORIES: () => 
      `/Comm/category`,
  },
  
  // 공통 API
  COMMON: {
    // 대분류 카테고리
    CATEGORY_L: () => 
      `/Comm/categoryL`,
    
    // 중분류 카테고리
    CATEGORY_M: () => 
      `/Comm/categoryM`,
    
    // 소분류 카테고리
    CATEGORY_S: () => 
      `/Comm/categoryS`,
    
    // 옵션값 조회
    OPTION_VALUES: (optCd: string) => 
      `/Comm/OptionValues?optCd=${optCd}`,
    
    // 파일 업로드
    FILE_UPLOAD: () => 
      `/api/common/upload`,
    
    // 파일 다운로드
    FILE_DOWNLOAD: (fileId: string) => 
      `/api/common/download/${fileId}`,
    
    // 공통 코드 조회
    CODE_LIST: (codeType: string) => 
      `/api/common/codes/${codeType}`,
  }
};

/**
 * 쿼리 스트링 빌더 함수
 * 
 * @param params - 쿼리 파라미터 객체
 * @returns 생성된 쿼리 스트링 (예: "?key1=value1&key2=value2")
 * 
 * 사용 예:
 * buildQueryString({ page: 1, limit: 10 }) => "?page=1&limit=10"
 */
export function buildQueryString(params: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }
  
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    // null, undefined, 빈 문자열은 제외
    if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * 완전한 URL 생성 함수
 * 
 * @param endpoint - API 엔드포인트 경로
 * @returns 전체 URL (BASE_URL + endpoint)
 */
export function buildFullUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}
