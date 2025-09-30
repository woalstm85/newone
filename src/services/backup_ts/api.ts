/**
 * api.ts - API 호출 함수 정의
 * 
 * 주요 기능:
 * 1. 비즈니스 로직에서 사용할 API 호출 함수 제공
 * 2. 기능별로 그룹화하여 관리 (authAPI, inventoryAPI, quoteAPI 등)
 * 3. apiClient를 활용한 실제 HTTP 요청 처리
 * 4. 에러 처리 및 로깅
 * 5. TypeScript 타입 정의로 타입 안정성 확보
 * 
 * API 그룹:
 * - authAPI: 인증 관련
 * - inventoryAPI: 재고 관리
 * - quoteAPI: 견적 의뢰
 * - productAPI: 제품 정보
 * - commonAPI: 공통 기능 (카테고리, 옵션, 파일)
 */

import apiClient from './apiClient';
import { API_ENDPOINTS, buildQueryString } from './apiConfig';

// ========== 타입 정의 ==========

// 로그인 응답 타입
interface LoginResponse {
  userId: string;
  userNm: string;
  token?: string;
  [key: string]: any;
}

// 재고 아이템 타입
interface InventoryItem {
  itemCd: string;
  itemNm: string;
  quantity: number;
  [key: string]: any;
}

// 견적의뢰 타입
interface QuoteRequest {
  qtNo?: string;
  userId: string;
  items: QuoteItem[];
  [key: string]: any;
}

interface QuoteItem {
  itemCd: string;
  itemNm: string;
  quantity: number;
  price?: number;
  [key: string]: any;
}

// 제품 타입
interface Product {
  itemCd: string;
  itemNm: string;
  price: number;
  compNm?: string;
  filePath?: string;
  [key: string]: any;
}

// 카테고리 타입
interface Category {
  code: string;
  name: string;
  [key: string]: any;
}

// 옵션값 타입
interface OptionValue {
  optCd: string;
  optValCd: string;
  optValNm: string;
  [key: string]: any;
}

// 파일 업로드 응답 타입
interface FileUploadResponse {
  fileId: string;
  fileUrl: string;
  [key: string]: any;
}

// 공통 코드 타입
interface CommonCode {
  code: string;
  name: string;
  [key: string]: any;
}

// ========== API 함수 정의 ==========

/**
 * 인증 관련 API
 */
export const authAPI = {
  /**
   * 로그인
   * 
   * @param userId - 사용자 ID
   * @param password - 비밀번호
   * @returns 로그인 응답 (사용자 정보, 토큰 등)
   */
  login: async (userId: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>(
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
   * @returns 로그아웃 결과
   */
  logout: async (): Promise<{ success: boolean }> => {
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
   * @param userId - 사용자 ID
   * @returns 재고 목록
   */
  getCompanyInventory: async (userId: string): Promise<InventoryItem[]> => {
    try {
      const response = await apiClient.get<InventoryItem[]>(
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
   * @param userId - 사용자 ID
   * @returns 로트별 재고 목록
   */
  getLotInventory: async (userId: string): Promise<InventoryItem[]> => {
    try {
      const response = await apiClient.get<InventoryItem[]>(
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
   * @param ym - 조회 년월 (YYYYMM 형식)
   * @param userId - 사용자 ID
   * @returns 견적의뢰 목록
   */
  getQuoteRequests: async (ym: string, userId: string): Promise<QuoteRequest[]> => {
    try {
      const response = await apiClient.get<QuoteRequest[]>(
        API_ENDPOINTS.CUST.QUOTE_REQUEST(ym, userId)
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 견적의뢰 등록 (MrsQtRequest)
   * 
   * @param requestData - 견적의뢰 데이터
   * @returns 등록 결과
   */
  createQuoteRequest: async (requestData: QuoteRequest): Promise<any> => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.CUST.QUOTE_CREATE(),
        requestData
      );
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
   * @param itemName - 제품명 검색어
   * @param itemGroupLCd - 대분류 코드
   * @param itemGroupMCd - 중분류 코드
   * @param itemGroupSCd - 소분류 코드
   * @returns 제품 목록
   */
  getProductList: async (
    itemName: string = '', 
    itemGroupLCd: string = '', 
    itemGroupMCd: string = '', 
    itemGroupSCd: string = ''
  ): Promise<Product[]> => {
    try {
      const params: Record<string, string> = {};
      
      // 검색 조건이 있는 경우만 파라미터 추가
      if (itemName.trim()) {
        params.p_itemNm = itemName.trim();
      }
      if (itemGroupLCd) {
        params.itemGroupLCd = itemGroupLCd;
      }
      if (itemGroupMCd) {
        params.itemGroupMCd = itemGroupMCd;
      }
      if (itemGroupSCd) {
        params.itemGroupSCd = itemGroupSCd;
      }
      
      const queryString = buildQueryString(params);
      const endpoint = API_ENDPOINTS.PRODUCT.PRODUCT_LIST() + queryString;
      
      const response = await apiClient.get<Product[]>(endpoint);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 대시보드 아이템 조회 (잉여재고, 행사품목)
   * 
   * @param itemDivCd - 아이템 구분 코드
   * @returns 대시보드 아이템 목록
   */
  getDashItems: async (itemDivCd: string): Promise<Product[]> => {
    try {
      const response = await apiClient.get<Product[]>(
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
   * @returns 카테고리 목록
   */
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await apiClient.get<Category[]>(
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
   * @returns 대분류 목록
   */
  getCategoryL: async (): Promise<Category[]> => {
    try {
      const response = await apiClient.get<Category[]>(
        API_ENDPOINTS.COMMON.CATEGORY_L()
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 중분류 카테고리 조회
   * 
   * @returns 중분류 목록
   */
  getCategoryM: async (): Promise<Category[]> => {
    try {
      const response = await apiClient.get<Category[]>(
        API_ENDPOINTS.COMMON.CATEGORY_M()
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 소분류 카테고리 조회
   * 
   * @returns 소분류 목록
   */
  getCategoryS: async (): Promise<Category[]> => {
    try {
      const response = await apiClient.get<Category[]>(
        API_ENDPOINTS.COMMON.CATEGORY_S()
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 옵션값 조회
   * 
   * @param optCd - 옵션 코드
   * @returns 옵션값 목록
   */
  getOptionValues: async (optCd: string): Promise<OptionValue[]> => {
    try {
      const response = await apiClient.get<OptionValue[]>(
        API_ENDPOINTS.COMMON.OPTION_VALUES(optCd)
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 파일 업로드
   * 
   * @param file - 업로드할 파일
   * @param additionalData - 추가 데이터
   * @returns 업로드 결과 (파일 ID, URL 등)
   */
  uploadFile: async (file: File, additionalData: Record<string, any> = {}): Promise<FileUploadResponse> => {
    try {
      const response = await apiClient.uploadFile<FileUploadResponse>(
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
   * @param fileId - 파일 ID
   * @returns 파일 데이터
   */
  downloadFile: async (fileId: string): Promise<Blob> => {
    try {
      const response = await apiClient.get<Blob>(
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
   * @param codeType - 코드 타입
   * @returns 코드 목록
   */
  getCodeList: async (codeType: string): Promise<CommonCode[]> => {
    try {
      const response = await apiClient.get<CommonCode[]>(
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
