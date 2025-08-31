import apiClient from './apiClient';
import { API_ENDPOINTS } from './apiConfig';

// 로그인 관련 API
export const authAPI = {
  // 로그인
  login: async (userId, password) => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.LOGIN(userId.trim(), password),
        {},
        { includeAuth: false } // 로그인은 인증 불필요
      );
      return response;
    } catch (error) {
      console.error('로그인 API 오류:', error);
      throw error;
    }
  },

  // 로그아웃 (필요시)
  logout: async () => {
    try {
      // 로컬 스토리지 정리
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      return { success: true };
    } catch (error) {
      console.error('로그아웃 처리 오류:', error);
      throw error;
    }
  }
};

// 재고관리 관련 API
export const inventoryAPI = {
  // 일반재고 조회
  getNormalInventory: async (searchParams = {}) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.CUST.INVENTORY_NORMAL(),
        searchParams
      );
      return response;
    } catch (error) {
      console.error('일반재고 조회 오류:', error);
      throw error;
    }
  },

  // 옵션재고 조회
  getOptionInventory: async (searchParams = {}) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.CUST.INVENTORY_OPTION(),
        searchParams
      );
      return response;
    } catch (error) {
      console.error('옵션재고 조회 오류:', error);
      throw error;
    }
  },

  // 시리얼/로트 재고 조회
  getSerialInventory: async (searchParams = {}) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.CUST.INVENTORY_SERIAL(),
        searchParams
      );
      return response;
    } catch (error) {
      console.error('시리얼재고 조회 오류:', error);
      throw error;
    }
  }
};

// 고객관리 관련 API
export const customerAPI = {
  // 고객 목록 조회
  getCustomerList: async (searchParams = {}) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.CUST.CUSTOMER_LIST(),
        searchParams
      );
      return response;
    } catch (error) {
      console.error('고객 목록 조회 오류:', error);
      throw error;
    }
  },

  // 고객 상세 조회
  getCustomerDetail: async (custId) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.CUST.CUSTOMER_DETAIL(custId)
      );
      return response;
    } catch (error) {
      console.error('고객 상세 조회 오류:', error);
      throw error;
    }
  },

  // 고객 등록
  createCustomer: async (customerData) => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.CUST.CUSTOMER_CREATE(),
        customerData
      );
      return response;
    } catch (error) {
      console.error('고객 등록 오류:', error);
      throw error;
    }
  },

  // 고객 수정
  updateCustomer: async (custId, customerData) => {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.CUST.CUSTOMER_UPDATE(custId),
        customerData
      );
      return response;
    } catch (error) {
      console.error('고객 수정 오류:', error);
      throw error;
    }
  },

  // 고객 삭제
  deleteCustomer: async (custId) => {
    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.CUST.CUSTOMER_DELETE(custId)
      );
      return response;
    } catch (error) {
      console.error('고객 삭제 오류:', error);
      throw error;
    }
  }
};

// 대시보드 관련 API
export const dashboardAPI = {
  // 대시보드 요약 정보
  getSummary: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.SUMMARY());
      return response;
    } catch (error) {
      console.error('대시보드 요약 조회 오류:', error);
      throw error;
    }
  },

  // 대시보드 차트 데이터
  getChartData: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.CHARTS());
      return response;
    } catch (error) {
      console.error('대시보드 차트 조회 오류:', error);
      throw error;
    }
  },

  // 최근 활동 조회
  getRecentActivity: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITY());
      return response;
    } catch (error) {
      console.error('최근 활동 조회 오류:', error);
      throw error;
    }
  }
};

// 공통 API
export const commonAPI = {
  // 파일 업로드
  uploadFile: async (file, additionalData = {}) => {
    try {
      const response = await apiClient.uploadFile(
        API_ENDPOINTS.COMMON.FILE_UPLOAD(),
        file,
        additionalData
      );
      return response;
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      throw error;
    }
  },

  // 파일 다운로드
  downloadFile: async (fileId) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.COMMON.FILE_DOWNLOAD(fileId),
        {},
        { 
          headers: { 
            'Accept': 'application/octet-stream' 
          } 
        }
      );
      return response;
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      throw error;
    }
  },

  // 코드 목록 조회
  getCodeList: async (codeType) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.COMMON.CODE_LIST(codeType)
      );
      return response;
    } catch (error) {
      console.error('코드 목록 조회 오류:', error);
      throw error;
    }
  }
};

// 모든 API를 하나의 객체로 내보내기
export default {
  auth: authAPI,
  inventory: inventoryAPI,
  customer: customerAPI,
  dashboard: dashboardAPI,
  common: commonAPI
};
