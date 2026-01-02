/**
 * useQueries.js - React Query 커스텀 훅 모음
 * 
 * 각 화면별로 사용하는 데이터 조회 훅을 정의
 * 캐싱을 통해 메뉴 이동 시 불필요한 API 호출 방지
 * 
 * 사용법:
 * const { data, isLoading, refetch } = useCompanyInventory(userId);
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryAPI, productAPI, commonAPI, quoteAPI } from '../services/api';

// ============ Query Keys ============
// 쿼리 키를 상수로 관리하여 일관성 유지
export const QUERY_KEYS = {
  // 재고 관련
  COMPANY_INVENTORY: 'companyInventory',
  LOT_INVENTORY: 'lotInventory',
  
  // 제품 관련
  PRODUCTS: 'products',
  PRODUCT_DETAIL: 'productDetail',
  PRODUCT_FILES: 'productFiles',
  
  // 잉여재고/행사품목
  SURPLUS_PRODUCTS: 'surplusProducts',
  EVENT_PRODUCTS: 'eventProducts',
  
  // 대시보드
  DASHBOARD_DATA: 'dashboardData',
  
  // 공통
  CATEGORIES: 'categories',
  OPTION_VALUES: 'optionValues',
  
  // 견적
  QUOTES: 'quotes',
  QUOTE_DETAIL: 'quoteDetail',
};

// ============ 재고 관련 훅 ============

/**
 * 자사재고현황 조회 (CUST0010)
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 추가 옵션
 */
export const useCompanyInventory = (userId, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.COMPANY_INVENTORY, userId],
    queryFn: () => inventoryAPI.getCompanyInventory(userId),
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3분
    ...options,
  });
};

/**
 * 시리얼/로트 재고 조회 (CUST0010_LOT)
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 추가 옵션
 */
export const useLotInventory = (userId, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.LOT_INVENTORY, userId],
    queryFn: () => inventoryAPI.getLotInventory(userId),
    enabled: !!userId,
    staleTime: 3 * 60 * 1000,
    ...options,
  });
};

// ============ 제품 관련 훅 ============

/**
 * 제품 목록 조회 (CUST0020)
 * @param {string} custCd - 거래처 코드
 * @param {Object} options - 추가 옵션
 */
export const useProducts = (custCd, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTS, custCd],
    queryFn: () => productAPI.getProducts(custCd),
    enabled: !!custCd,
    staleTime: 5 * 60 * 1000, // 5분
    ...options,
  });
};

/**
 * 제품 상세 정보 조회
 * @param {string} itemCd - 제품 코드
 * @param {Object} options - 추가 옵션
 */
export const useProductDetail = (itemCd, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCT_DETAIL, itemCd],
    queryFn: () => productAPI.getProductDetail(itemCd),
    enabled: !!itemCd,
    staleTime: 10 * 60 * 1000, // 10분 (상세 정보는 자주 안 바뀜)
    ...options,
  });
};

/**
 * 제품 파일(이미지) 목록 조회
 * @param {string} itemCd - 제품 코드
 * @param {Object} options - 추가 옵션
 */
export const useProductFiles = (itemCd, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCT_FILES, itemCd],
    queryFn: () => commonAPI.getProductFiles(itemCd),
    enabled: !!itemCd,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

// ============ 잉여재고/행사품목 훅 ============

/**
 * 잉여재고 목록 조회
 * @param {Object} options - 추가 옵션
 */
export const useSurplusProducts = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SURPLUS_PRODUCTS],
    queryFn: () => productAPI.getSurplusProducts(),
    staleTime: 3 * 60 * 1000,
    ...options,
  });
};

/**
 * 행사품목 목록 조회
 * @param {Object} options - 추가 옵션
 */
export const useEventProducts = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.EVENT_PRODUCTS],
    queryFn: () => productAPI.getEventProducts(),
    staleTime: 3 * 60 * 1000,
    ...options,
  });
};

// ============ 대시보드 훅 ============

/**
 * 대시보드 데이터 조회
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 추가 옵션
 */
export const useDashboardData = (userId, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_DATA, userId],
    queryFn: async () => {
      // 대시보드에서 필요한 여러 데이터를 병렬로 조회
      const [inventory, surplusProducts, eventProducts] = await Promise.all([
        inventoryAPI.getCompanyInventory(userId).catch(() => []),
        productAPI.getSurplusProducts().catch(() => []),
        productAPI.getEventProducts().catch(() => []),
      ]);
      
      return {
        inventory,
        surplusProducts,
        eventProducts,
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 대시보드는 2분
    ...options,
  });
};

// ============ 공통 훅 ============

/**
 * 카테고리 목록 조회
 * @param {Object} options - 추가 옵션
 */
export const useCategories = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CATEGORIES],
    queryFn: () => commonAPI.getCategories(),
    staleTime: 30 * 60 * 1000, // 카테고리는 30분 (자주 안 바뀜)
    ...options,
  });
};

/**
 * 옵션값 조회
 * @param {string} optCd - 옵션 코드
 * @param {Object} options - 추가 옵션
 */
export const useOptionValues = (optCd, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.OPTION_VALUES, optCd],
    queryFn: () => commonAPI.getOptionValues(optCd),
    enabled: !!optCd && optCd !== 'OP0000',
    staleTime: 30 * 60 * 1000,
    ...options,
  });
};

// ============ 견적 관련 훅 ============

/**
 * 견적 목록 조회
 * @param {string} custCd - 거래처 코드
 * @param {Object} options - 추가 옵션
 */
export const useQuotes = (custCd, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.QUOTES, custCd],
    queryFn: () => quoteAPI.getQuotes(custCd),
    enabled: !!custCd,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

/**
 * 견적 상세 조회
 * @param {string} reqCd - 견적요청 코드
 * @param {Object} options - 추가 옵션
 */
export const useQuoteDetail = (reqCd, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.QUOTE_DETAIL, reqCd],
    queryFn: () => quoteAPI.getQuoteDetail(reqCd),
    enabled: !!reqCd,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// ============ Mutation 훅 (데이터 변경) ============

/**
 * 견적 요청 mutation
 */
export const useCreateQuote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (quoteData) => quoteAPI.createQuote(quoteData),
    onSuccess: () => {
      // 견적 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTES] });
    },
  });
};

// ============ 캐시 관리 훅 ============

/**
 * 캐시 관리 유틸리티 훅
 */
export const useCacheManager = () => {
  const queryClient = useQueryClient();
  
  return {
    // 특정 쿼리 무효화 (다음 접근 시 새로 조회)
    invalidate: (queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    },
    
    // 특정 쿼리 즉시 refetch
    refetch: (queryKey) => {
      queryClient.refetchQueries({ queryKey });
    },
    
    // 특정 쿼리 캐시 제거
    remove: (queryKey) => {
      queryClient.removeQueries({ queryKey });
    },
    
    // 모든 캐시 초기화
    clearAll: () => {
      queryClient.clear();
    },
    
    // 재고 관련 캐시 무효화
    invalidateInventory: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMPANY_INVENTORY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOT_INVENTORY] });
    },
    
    // 제품 관련 캐시 무효화
    invalidateProducts: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SURPLUS_PRODUCTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_PRODUCTS] });
    },
  };
};

export default {
  QUERY_KEYS,
  useCompanyInventory,
  useLotInventory,
  useProducts,
  useProductDetail,
  useProductFiles,
  useSurplusProducts,
  useEventProducts,
  useDashboardData,
  useCategories,
  useOptionValues,
  useQuotes,
  useQuoteDetail,
  useCreateQuote,
  useCacheManager,
};
