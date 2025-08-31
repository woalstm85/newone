import { useState, useCallback } from 'react';
import { inventoryAPI, authAPI, customerAPI } from '../services';

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

  const getNormalInventory = useCallback((searchParams) => {
    return execute(inventoryAPI.getNormalInventory, searchParams);
  }, [execute]);

  const getOptionInventory = useCallback((searchParams) => {
    return execute(inventoryAPI.getOptionInventory, searchParams);
  }, [execute]);

  const getSerialInventory = useCallback((searchParams) => {
    return execute(inventoryAPI.getSerialInventory, searchParams);
  }, [execute]);

  return {
    loading,
    error,
    clearError,
    getNormalInventory,
    getOptionInventory,
    getSerialInventory
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

// 고객 API 훅
export const useCustomerApi = () => {
  const { loading, error, execute, clearError } = useApi();

  const getCustomerList = useCallback((searchParams) => {
    return execute(customerAPI.getCustomerList, searchParams);
  }, [execute]);

  const getCustomerDetail = useCallback((custId) => {
    return execute(customerAPI.getCustomerDetail, custId);
  }, [execute]);

  const createCustomer = useCallback((customerData) => {
    return execute(customerAPI.createCustomer, customerData);
  }, [execute]);

  const updateCustomer = useCallback((custId, customerData) => {
    return execute(customerAPI.updateCustomer, custId, customerData);
  }, [execute]);

  const deleteCustomer = useCallback((custId) => {
    return execute(customerAPI.deleteCustomer, custId);
  }, [execute]);

  return {
    loading,
    error,
    clearError,
    getCustomerList,
    getCustomerDetail,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
};

export default useApi;