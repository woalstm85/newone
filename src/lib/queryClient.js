/**
 * queryClient.js - React Query 설정
 * 
 * 전역 QueryClient 인스턴스 및 기본 설정
 * 
 * 주요 설정:
 * - staleTime: 데이터가 "신선"하다고 간주되는 시간 (이 시간 동안 refetch 안함)
 * - gcTime: 사용하지 않는 캐시 데이터 보관 시간 (구 cacheTime)
 * - refetchOnWindowFocus: 창 포커스 시 자동 refetch 여부
 * - retry: 실패 시 재시도 횟수
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5분간 데이터를 "신선"하다고 간주 (이 시간 동안 캐시 데이터 사용)
      staleTime: 5 * 60 * 1000,
      
      // 10분간 미사용 캐시 데이터 보관
      gcTime: 10 * 60 * 1000,
      
      // 창 포커스 시 자동 refetch 비활성화 (필요시 true로 변경)
      refetchOnWindowFocus: false,
      
      // 마운트 시 stale 데이터면 refetch
      refetchOnMount: true,
      
      // 네트워크 재연결 시 refetch
      refetchOnReconnect: true,
      
      // 실패 시 1번 재시도
      retry: 1,
      
      // 재시도 간격 (ms)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // mutation 실패 시 재시도 안함
      retry: 0,
    },
  },
});

/**
 * 캐시 무효화 헬퍼 함수들
 */

// 특정 쿼리 키의 캐시 무효화
export const invalidateQuery = (queryKey) => {
  queryClient.invalidateQueries({ queryKey });
};

// 특정 쿼리 키의 캐시 삭제
export const removeQuery = (queryKey) => {
  queryClient.removeQueries({ queryKey });
};

// 모든 캐시 초기화
export const clearAllCache = () => {
  queryClient.clear();
};

// 특정 쿼리 키로 시작하는 모든 쿼리 무효화
export const invalidateQueriesStartingWith = (prefix) => {
  queryClient.invalidateQueries({ 
    predicate: (query) => query.queryKey[0] === prefix 
  });
};

export default queryClient;
