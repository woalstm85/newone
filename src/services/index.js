/**
 * index.js - 서비스 레이어 통합 export
 * 
 * 주요 기능:
 * 모든 서비스 모듈을 한 곳에서 import할 수 있도록 통합 제공
 * 
 * 사용 예시:
 * 
 * 1. 개별 모듈 import:
 *    import { apiClient, API_CONFIG } from './services';
 * 
 * 2. API 함수 import:
 *    import { authAPI, productAPI } from './services';
 * 
 * 3. 전체 API import:
 *    import api from './services/api';
 *    api.auth.login(userId, password);
 */

// 개별 모듈 export
export { default as apiClient } from './apiClient';
export { API_CONFIG, API_ENDPOINTS } from './apiConfig';

// API 함수들 export (기능별로 그룹화됨)
export { 
  authAPI,        // 인증 관련 API
  inventoryAPI,   // 재고 관리 API
  quoteAPI,       // 견적 의뢰 API
  productAPI,     // 제품 관련 API
  commonAPI       // 공통 API (카테고리, 파일 등)
} from './api';
