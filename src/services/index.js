// services/index.js - 모든 서비스를 한번에 import 할 수 있도록 하는 인덱스 파일

// 개별 모듈들 export
export { default as apiClient } from './apiClient';
export { API_CONFIG, API_ENDPOINTS } from './apiConfig';

// api.js에서 모든 API 함수들을 가져와서 다시 export
export { 
  authAPI, 
  inventoryAPI, 
  quoteAPI,
  productAPI, 
  commonAPI 
} from './api';
