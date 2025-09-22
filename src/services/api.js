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
  // 자사재고현황 조회
  getCompanyInventory: async (userId) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.CUST.COMPANY_INVENTORY(userId)
      );
      return response;
    } catch (error) {
      console.error('자사재고현황 조회 오류:', error);
      throw error;
    }
  },

  // 시리얼/로트 재고 조회
  getLotInventory: async (userId) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.CUST.LOT_INVENTORY(userId)
      );
      return response;
    } catch (error) {
      console.error('시리얼/로트 재고 조회 오류:', error);
      throw error;
    }
  }
};

// 견적의뢰 관리 관련 API
export const quoteAPI = {
  // 견적의뢰 목록 조회
  getQuoteRequests: async (ym, userId) => {
    try {
      const url = `https://api.newonetotal.co.kr/Comm/CUST0040?ym=${ym}&userId=${userId}`;
      console.log('CUST0040 API URL:', url);
      
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      console.error('견적의뢰 목록 조회 오류:', error);
      throw error;
    }
  },

  // 견적의뢰 등록 (MrsOtRequest)
  createQuoteRequest: async (requestData) => {
    try {
      const url = 'https://api.newonetotal.co.kr/Comm/MrsQtRequest';
      console.log('견적의뢰 등록 API URL:', url);
      console.log('견적의뢰 등록 데이터:', requestData);
      
      const response = await apiClient.post(url, requestData);
      return response;
    } catch (error) {
      console.error('견적의뢰 등록 오류:', error);
      throw error;
    }
  }
};

// 제품 관련 API
export const productAPI = {
  // 제품 목록 조회 (CUST0020) - 카테고리 파라미터 추가
  getProductList: async (itemName = '', itemGroupLCd = '', itemGroupMCd = '', itemGroupSCd = '') => {
    try {
      let url = 'https://api.newonetotal.co.kr/Comm/CUST0020';
      const params = [];
      
      if (itemName.trim()) {
        params.push(`itemName=${encodeURIComponent(itemName.trim())}`);
      }
      if (itemGroupLCd) {
        params.push(`itemGroupLCd=${itemGroupLCd}`);
      }
      if (itemGroupMCd) {
        params.push(`itemGroupMCd=${itemGroupMCd}`);
      }
      if (itemGroupSCd) {
        params.push(`itemGroupSCd=${itemGroupSCd}`);
      }
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      console.log('CUST0020 API URL:', url);
      
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      console.error('제품 목록 조회 오류:', error);
      throw error;
    }
  },

  // 대시보드 아이템 조회 (잉여재고, 행사품목)
  getDashItems: async (itemDivCd) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.PRODUCT.DASH_ITEMS(itemDivCd)
      );
      return response;
    } catch (error) {
      console.error('대시보드 아이템 조회 오류:', error);
      throw error;
    }
  },

  // 카테고리 목록 조회
  getCategories: async () => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.PRODUCT.CATEGORIES()
      );
      return response;
    } catch (error) {
      console.error('카테고리 목록 조회 오류:', error);
      throw error;
    }
  }
};

// 대시보드 관련 API (사용하지 않으므로 제거)

// 공통 API
export const commonAPI = {
  // 카테고리 API들
  getCategoryL: async () => {
    try {
      const response = await apiClient.get(
        'https://api.newonetotal.co.kr/Comm/categoryL'
      );
      return response;
    } catch (error) {
      console.error('대분류 조회 오류:', error);
      throw error;
    }
  },

  getCategoryM: async () => {
    try {
      const response = await apiClient.get(
        'https://api.newonetotal.co.kr/Comm/categoryM'
      );
      return response;
    } catch (error) {
      console.error('중분류 조회 오류:', error);
      throw error;
    }
  },

  getCategoryS: async () => {
    try {
      const response = await apiClient.get(
        'https://api.newonetotal.co.kr/Comm/categoryS'
      );
      return response;
    } catch (error) {
      console.error('소분류 조회 오류:', error);
      throw error;
    }
  },

  // 옵션값 API
  getOptionValues: async (optCd) => {
    try {
      const response = await apiClient.get(
        `https://api.newonetotal.co.kr/Comm/OptionValues?optCd=${optCd}`
      );
      return response;
    } catch (error) {
      console.error('옵션값 조회 오류:', error);
      throw error;
    }
  },

  // 옵션값 API
  getOptionValues: async (optCd) => {
    try {
      const response = await apiClient.get(
        `https://api.newonetotal.co.kr/Comm/OptionValues?optCd=${optCd}`
      );
      return response;
    } catch (error) {
      console.error('옵션값 조회 오류:', error);
      throw error;
    }
  },

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
  quote: quoteAPI,
  product: productAPI,
  common: commonAPI
};
