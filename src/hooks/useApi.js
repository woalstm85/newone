/**
 * useApi.js - API 호출 관리 커스텀 훅
 * 
 * 주요 기능:
 * 1. API 호출 시 로딩 상태 자동 관리
 * 2. 에러 처리 및 상태 관리
 * 3. 특정 API별 전용 훅 제공
 * 
 * 제공하는 훅:
 * - useApi: 범용 API 호출 훅
 * - useInventoryApi: 재고 관리 API 전용 훅
 * - useAuthApi: 인증 API 전용 훅
 */

import { useState, useCallback } from 'react';
import { inventoryAPI, authAPI } from '../services/api';

/**
 * useApi - 범용 API 호출 훅
 * 
 * 모든 API 호출에 사용할 수 있는 기본 훅
 * 로딩 상태와 에러를 자동으로 관리
 * 
 * @returns {Object} { loading, error, execute, clearError }
 * 
 * 사용 예:
 * const { loading, error, execute } = useApi();
 * const data = await execute(productAPI.getProductList, '검색어');
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * API 함수 실행
   * 
   * @param {Function} apiFunction - 실행할 API 함수
   * @param {...any} args - API 함수에 전달할 인자들
   * @returns {Promise<any>} API 응답 데이터
   */
  const execute = useCallback(async (apiFunction, ...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 에러 상태 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,      // API 호출 중 여부
    error,        // 에러 객체 (에러 없으면 null)
    execute,      // API 실행 함수
    clearError    // 에러 초기화 함수
  };
};

/**
 * useInventoryApi - 재고 관리 API 전용 훅
 * 
 * 재고 관련 API 호출을 간편하게 사용하기 위한 훅
 * 
 * @returns {Object} { loading, error, clearError, getCompanyInventory, getLotInventory }
 * 
 * 사용 예:
 * const { loading, getCompanyInventory } = useInventoryApi();
 * const inventory = await getCompanyInventory(userId);
 */
export const useInventoryApi = () => {
  const { loading, error, execute, clearError } = useApi();

  /**
   * 자사재고현황 조회 (CUST0010)
   * 
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Array>} 재고 목록
   */
  const getCompanyInventory = useCallback((userId) => {
    return execute(inventoryAPI.getCompanyInventory, userId);
  }, [execute]);

  /**
   * 시리얼/로트 재고 조회 (CUST0010_LOT)
   * 
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Array>} 로트별 재고 목록
   */
  const getLotInventory = useCallback((userId) => {
    return execute(inventoryAPI.getLotInventory, userId);
  }, [execute]);

  return {
    loading,
    error,
    clearError,
    getCompanyInventory,
    getLotInventory
  };
};

/**
 * useAuthApi - 인증 API 전용 훅
 * 
 * 로그인/로그아웃 관련 API 호출을 간편하게 사용하기 위한 훅
 * 
 * @returns {Object} { loading, error, clearError, login, logout }
 * 
 * 사용 예:
 * const { loading, login } = useAuthApi();
 * const result = await login(userId, password);
 */
export const useAuthApi = () => {
  const { loading, error, execute, clearError } = useApi();

  /**
   * 로그인
   * 
   * @param {string} userId - 사용자 ID
   * @param {string} password - 비밀번호
   * @returns {Promise<Object>} 로그인 결과 (사용자 정보, 토큰 등)
   */
  const login = useCallback((userId, password) => {
    return execute(authAPI.login, userId, password);
  }, [execute]);

  /**
   * 로그아웃
   * 
   * @returns {Promise<Object>} 로그아웃 결과
   */
  const logout = useCallback(() => {
    return execute(authAPI.logout);
  }, [execute]);

  return {
    loading,
    error,
    clearError,
    login,
    logout
  };
};

export default useApi;
