import { useState, useCallback } from 'react';
import { inventoryAPI, authAPI } from '../services';

// API 호출을 위한 커스텀 훅
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiFunction, ...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      return result;
    } catch (err) {
      setError(err);
      console.error('API 호출 오류:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError
  };
};

// 특정 API를 위한 커스텀 훅들
export const useInventoryApi = () => {
  const { loading, error, execute, clearError } = useApi();

  const getCompanyInventory = useCallback((userId) => {
    return execute(inventoryAPI.getCompanyInventory, userId);
  }, [execute]);

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

// 로그인 API 훅
export const useAuthApi = () => {
  const { loading, error, execute, clearError } = useApi();

  const login = useCallback((userId, password) => {
    return execute(authAPI.login, userId, password);
  }, [execute]);

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