/**
 * index.js - Custom Hooks 통합 export
 * 
 * 주요 기능:
 * 모든 커스텀 훅을 한 곳에서 import할 수 있도록 통합 제공
 * 
 * 사용 예시:
 * import { useApi, useErrorHandler, useAuthApi } from './hooks';
 * 
 * 제공하는 훅:
 * - useApi: 범용 API 호출 훅
 * - useInventoryApi: 재고 관리 API 전용 훅
 * - useAuthApi: 인증 API 전용 훅
 * - useErrorHandler: 에러 처리 및 모달 표시 훅
 */

// API 관련 훅들
export { 
  default as useApi,      // 범용 API 호출 훅
  useInventoryApi,        // 재고 관리 전용 훅
  useAuthApi              // 인증 전용 훅
} from './useApi';

// 에러 처리 훅
export { default as useErrorHandler } from './useErrorHandler';

/**
 * 향후 추가 가능한 커스텀 훅 예시:
 * 
 * export { useLocalStorage } from './useLocalStorage';
 * - localStorage 관리 훅
 * 
 * export { useDebounce } from './useDebounce';
 * - 입력값 지연 처리 훅 (검색 등)
 * 
 * export { useInfiniteScroll } from './useInfiniteScroll';
 * - 무한 스크롤 구현 훅
 * 
 * export { usePagination } from './usePagination';
 * - 페이지네이션 관리 훅
 */
