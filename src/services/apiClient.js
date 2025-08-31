import { API_CONFIG } from './apiConfig';

// HTTP 요청 타입별 기본 옵션
const getDefaultOptions = (method = 'GET', includeAuth = true) => {
  const options = {
    method,
    headers: { ...API_CONFIG.HEADERS },
  };

  // 인증이 필요한 경우 토큰 추가 (필요시 구현)
  if (includeAuth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
  }

  return options;
};

// 응답 처리 함수
const handleResponse = async (response) => {
  // 응답이 ok가 아닌 경우 에러 처리
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  // JSON 응답 파싱
  const data = await response.json();
  return data;
};

// 기본 API 클라이언트 클래스
class ApiClient {
  constructor(baseURL = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
  }

  // GET 요청
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
      console.error('GET 요청 실패:', error);
      throw error;
    }
  }

  // POST 요청
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
      console.error('POST 요청 실패:', error);
      throw error;
    }
  }

  // PUT 요청
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
      console.error('PUT 요청 실패:', error);
      throw error;
    }
  }

  // DELETE 요청
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
      console.error('DELETE 요청 실패:', error);
      throw error;
    }
  }

  // PATCH 요청
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
      console.error('PATCH 요청 실패:', error);
      throw error;
    }
  }

  // 파일 업로드 요청
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
        // FormData 사용시 Content-Type 헤더는 브라우저가 자동으로 설정
        'Accept': 'application/json',
      },
      body: formData,
      ...options
    };

    // 인증 토큰 추가 (필요시)
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
      console.error('파일 업로드 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
const apiClient = new ApiClient();

export default apiClient;
