/**
 * useErrorHandler.js - 에러 처리 커스텀 훅
 * 
 * 주요 기능:
 * 1. 에러 메시지를 모달로 표시
 * 2. 다양한 형태의 에러 객체 처리 (string, Error, API 응답 에러)
 * 3. 에러 모달 열기/닫기 상태 관리
 * 
 * 사용 시나리오:
 * - API 호출 실패 시 사용자에게 에러 메시지 표시
 * - 예외 처리 후 모달을 통한 피드백 제공
 * 
 * 사용 예:
 * const { showError, hideError, isModalOpen, modalMessage } = useErrorHandler();
 * try {
 *   await someApiCall();
 * } catch (error) {
 *   showError(error);
 * }
 */

import { useState, useCallback } from 'react';

export const useErrorHandler = () => {
  // 에러 모달 표시 여부
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 에러 모달에 표시할 메시지
  const [modalMessage, setModalMessage] = useState('');

  /**
   * 에러를 표시하는 함수
   * 다양한 형태의 에러를 처리하여 사용자에게 적절한 메시지 표시
   * 
   * @param {string|Error|Object} error - 에러 객체 또는 메시지
   * 
   * 처리 가능한 에러 형태:
   * 1. 문자열: 직접 메시지로 사용
   * 2. Error 객체: error.message 사용
   * 3. API 응답 에러: error.response.data.message 사용
   */
  const showError = useCallback((error) => {
    let message = '오류가 발생했습니다.';
    
    if (typeof error === 'string') {
      // 문자열 에러 메시지
      message = error;
    } else if (error?.message) {
      // Error 객체
      message = error.message;
    } else if (error?.response?.data?.message) {
      // API 응답 에러
      message = error.response.data.message;
    }
    
    setModalMessage(message);
    setIsModalOpen(true);
  }, []);

  /**
   * 에러 모달을 숨기고 상태 초기화
   */
  const hideError = useCallback(() => {
    setIsModalOpen(false);
    setModalMessage('');
  }, []);

  return {
    isModalOpen,    // 모달 표시 여부
    modalMessage,   // 표시할 에러 메시지
    showError,      // 에러 표시 함수
    hideError       // 에러 숨김 함수
  };
};

export default useErrorHandler;
