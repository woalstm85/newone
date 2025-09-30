/**
 * api.js - API 호출 함수 정의
 * 
 * 주요 기능:
 * 1. 비즈니스 로직에서 사용할 API 호출 함수 제공
 * 2. 기능별로 그룹화하여 관리 (authAPI, inventoryAPI, quoteAPI 등)
 * 3. apiClient를 활용한 실제 HTTP 요청 처리
 * 4. 에러 처리 및 로깅
 * 
 * API 그룹:
 * - authAPI: 인증 관련
 * - inventoryAPI: 재고 관리
 * - quoteAPI: 견적 의뢰
 * - productAPI: 제품 정보
 * - commonAPI: 공통 기능 (카테고리, 옵션, 파일)
 */

import apiClient from './apiClient';
import { API_ENDPOINTS } from './apiConfig';

/**
 * 인증 관련 API
 */
export const authAPI = {
  /**
   * 로그인
   * 
   * @param {string} userId - 사용자 ID
   * @param {string} password - 비밀번호
   * @returns {Promise<Object>} 로그인 응답 (사용자 정보, 토큰 등)
   */
  login: async (userId, password) => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.LOGIN(userId.trim(), password),
        {},
        { includeAuth: false } // 로그인은 인증 토큰 불필요
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 로그아웃
   * localStorage의 인증 정보 제거
   * 
   * @returns {Promise<Object>} 로그아웃 결과
   */
  logout: async () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
};

/**
 * 재고 관리 관련 API
 */
export const inventoryAPI = {
  /**
   * 자사재고현황 조회 (CUST0010)
   * 
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Array>} 재고 목록
   */
  getCompanyInventory: async (userId) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.CUST.COMPANY_INVENTORY(userId)
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 시리얼/로트 재고 조회 (CUST0010_LOT)
   * 
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Array>} 로트별 재고 목록
   */
  getLotInventory: async (userId) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.CUST.LOT_INVENTORY(userId)
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
};

/**
 * 견적의뢰 관련 API
 */
export const quoteAPI = {
  /**
   * 견적의뢰 목록 조회 (CUST0040)
   * 
   * @param {string} ym - 조회 년월 (YYYYMM 형식)
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Array>} 견적의뢰 목록
   */
  getQuoteRequests: async (ym, userId) => {
    try {
      const url = `https://api.newonetotal.co.kr/Comm/CUST0040?ym=${ym}&userId=${userId}`;
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 견적의뢰 등록 (MrsQtRequest)
   * 
   * @param {Object} requestData - 견적의뢰 데이터
   * @returns {Promise<Object>} 등록 결과
   */
  createQuoteRequest: async (requestData) => {
    try {
      const url = 'https://api.newonetotal.co.kr/Comm/MrsQtRequest';
      const response = await apiClient.post(url, requestData);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

/**
 * 제품 관련 API
 */
export const productAPI = {
  /**
   * 제품 목록 조회 (CUST0020)
   * 
   * @param {string} itemName - 제품명 검색어
   * @param {string} itemGroupLCd - 대분류 코드
   * @param {string} itemGroupMCd - 중분류 코드
   * @param {string} itemGroupSCd - 소분류 코드
   * @returns {Promise<Array>} 제품 목록
   */
  getProductList: async (itemName = '', itemGroupLCd = '', itemGroupMCd = '', itemGroupSCd = '') => {
    try {
      let url = 'https://api.newonetotal.co.kr/Comm/CUST0020';
      const params = [];
      
      // 검색 조건이 있는 경우만 쿼리 파라미터 추가
      if (itemName.trim()) {
        params.push(`p_itemNm=${encodeURIComponent(itemName.trim())}`);
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
      
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 대시보드 아이템 조회 (잉여재고, 행사품목)
   * 
   * @param {string} itemDivCd - 아이템 구분 코드
   * @returns {Promise<Array>} 대시보드 아이템 목록
   */
  getDashItems: async (itemDivCd) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.PRODUCT.DASH_ITEMS(itemDivCd)
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 카테고리 목록 조회
   * 
   * @returns {Promise<Array>} 카테고리 목록
   */
  getCategories: async () => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.PRODUCT.CATEGORIES()
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
};

/**
 * 공통 API
 */
export const commonAPI = {
  /**
   * 대분류 카테고리 조회
   * 
   * @returns {Promise<Array>} 대분류 목록
   */
  getCategoryL: async () => {
    try {
      const response = await apiClient.get(
        'https://api.newonetotal.co.kr/Comm/categoryL'
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 중분류 카테고리 조회
   * 
   * @returns {Promise<Array>} 중분류 목록
   */
  getCategoryM: async () => {
    try {
      const response = await apiClient.get(
        'https://api.newonetotal.co.kr/Comm/categoryM'
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 소분류 카테고리 조회
   * 
   * @returns {Promise<Array>} 소분류 목록
   */
  getCategoryS: async () => {
    try {
      const response = await apiClient.get(
        'https://api.newonetotal.co.kr/Comm/categoryS'
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 옵션값 조회
   * 
   * @param {string} optCd - 옵션 코드
   * @returns {Promise<Array>} 옵션값 목록
   */
  getOptionValues: async (optCd) => {
    try {
      const response = await apiClient.get(
        `https://api.newonetotal.co.kr/Comm/OptionValues?optCd=${optCd}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 파일 업로드
   * 
   * @param {File} file - 업로드할 파일
   * @param {Object} additionalData - 추가 데이터
   * @returns {Promise<Object>} 업로드 결과 (파일 ID, URL 등)
   */
  uploadFile: async (file, additionalData = {}) => {
    try {
      const response = await apiClient.uploadFile(
        API_ENDPOINTS.COMMON.FILE_UPLOAD(),
        file,
        additionalData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 파일 다운로드
   * 
   * @param {string} fileId - 파일 ID
   * @returns {Promise<Blob>} 파일 데이터
   */
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
      throw error;
    }
  },

  /**
   * 공통 코드 목록 조회
   * 
   * @param {string} codeType - 코드 타입
   * @returns {Promise<Array>} 코드 목록
   */
  getCodeList: async (codeType) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.COMMON.CODE_LIST(codeType)
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
};

/**
 * 모든 API를 하나의 객체로 export
 * 
 * 사용 예:
 * import api from './services/api';
 * api.auth.login(userId, password);
 * api.product.getProductList('검색어');
 */
export default {
  auth: authAPI,
  inventory: inventoryAPI,
  quote: quoteAPI,
  product: productAPI,
  common: commonAPI
};
