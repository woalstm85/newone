/**
 * apiClient.js - HTTP 요청 처리 클라이언트
 * 
 * 주요 기능:
 * 1. RESTful API 요청 메서드 제공 (GET, POST, PUT, DELETE, PATCH)
 * 2. 인증 토큰 자동 추가
 * 3. 에러 응답 처리
 * 4. 파일 업로드 지원
 * 
 * 싱글톤 패턴으로 구현되어 전역에서 하나의 인스턴스만 사용
 */

import { API_CONFIG } from './apiConfig';

/**
 * HTTP 요청 기본 옵션 생성
 * 
 * @param {string} method - HTTP 메서드 (GET, POST, PUT, DELETE, PATCH)
 * @param {boolean} includeAuth - 인증 토큰 포함 여부
 * @returns {Object} fetch 요청 옵션 객체
 */
const getDefaultOptions = (method = 'GET', includeAuth = true) => {
  const options = {
    method,
    headers: { ...API_CONFIG.HEADERS },
  };

  // 인증이 필요한 경우 토큰 추가
  if (includeAuth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
  }

  return options;
};

/**
 * 응답 처리 함수
 * 
 * @param {Response} response - fetch API 응답 객체
 * @returns {Promise<Object>} 파싱된 JSON 데이터
 * @throws {Error} HTTP 에러 발생 시
 */
const handleResponse = async (response) => {
  // HTTP 상태 코드가 200번대가 아닌 경우 에러 처리
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  // JSON 응답 파싱 및 반환
  const data = await response.json();
  return data;
};

/**
 * API 클라이언트 클래스
 * 
 * HTTP 요청을 처리하는 메서드들을 제공합니다.
 */
class ApiClient {
  /**
   * @param {string} baseURL - API 기본 URL
   */
  constructor(baseURL = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * GET 요청
   * 
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} params - 쿼리 파라미터
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 응답 데이터
   */
  async get(endpoint, params = {}, options = {}) {
    const url = new URL(endpoint, this.baseURL);
    
    // 쿼리 파라미터 추가
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.append(key, value);
      }
    });

    const requestOptions = {
      ...getDefaultOptions('GET', options.includeAuth !== false),
      ...options
    };

    try {
      const response = await fetch(url.toString(), requestOptions);
      return await handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST 요청
   * 
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} data - 요청 본문 데이터
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 응답 데이터
   */
  async post(endpoint, data = {}, options = {}) {
    const url = new URL(endpoint, this.baseURL);
    
    const requestOptions = {
      ...getDefaultOptions('POST', options.includeAuth !== false),
      body: JSON.stringify(data),
      ...options
    };

    try {
      const response = await fetch(url.toString(), requestOptions);
      return await handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * PUT 요청
   * 
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} data - 요청 본문 데이터
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 응답 데이터
   */
  async put(endpoint, data = {}, options = {}) {
    const url = new URL(endpoint, this.baseURL);
    
    const requestOptions = {
      ...getDefaultOptions('PUT', options.includeAuth !== false),
      body: JSON.stringify(data),
      ...options
    };

    try {
      const response = await fetch(url.toString(), requestOptions);
      return await handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * DELETE 요청
   * 
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 응답 데이터
   */
  async delete(endpoint, options = {}) {
    const url = new URL(endpoint, this.baseURL);
    
    const requestOptions = {
      ...getDefaultOptions('DELETE', options.includeAuth !== false),
      ...options
    };

    try {
      const response = await fetch(url.toString(), requestOptions);
      return await handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * PATCH 요청 (부분 업데이트)
   * 
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} data - 요청 본문 데이터
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 응답 데이터
   */
  async patch(endpoint, data = {}, options = {}) {
    const url = new URL(endpoint, this.baseURL);
    
    const requestOptions = {
      ...getDefaultOptions('PATCH', options.includeAuth !== false),
      body: JSON.stringify(data),
      ...options
    };

    try {
      const response = await fetch(url.toString(), requestOptions);
      return await handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 파일 업로드 요청
   * 
   * @param {string} endpoint - API 엔드포인트
   * @param {File} file - 업로드할 파일
   * @param {Object} additionalData - 추가 데이터 (FormData에 포함)
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 응답 데이터
   */
  async uploadFile(endpoint, file, additionalData = {}, options = {}) {
    const url = new URL(endpoint, this.baseURL);
    
    const formData = new FormData();
    formData.append('file', file);
    
    // 추가 데이터가 있으면 FormData에 추가
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const requestOptions = {
      method: 'POST',
      headers: {
        // FormData 사용 시 Content-Type은 브라우저가 자동 설정
        'Accept': 'application/json',
      },
      body: formData,
      ...options
    };

    // 인증 토큰 추가
    if (options.includeAuth !== false) {
      const token = localStorage.getItem('authToken');
      if (token) {
        requestOptions.headers.Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url.toString(), requestOptions);
      return await handleResponse(response);
    } catch (error) {
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성 및 export
const apiClient = new ApiClient();

export default apiClient;
