import { useState, useCallback } from 'react';

// 에러 처리를 위한 커스텀 훅
export const useErrorHandler = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const showError = useCallback((error) => {
    let message = '오류가 발생했습니다.';
    
    if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
    } else if (error?.response?.data?.message) {
      message = error.response.data.message;
    }
    
    setModalMessage(message);
    setIsModalOpen(true);
  }, []);

  const hideError = useCallback(() => {
    setIsModalOpen(false);
    setModalMessage('');
  }, []);

  return {
    isModalOpen,
    modalMessage,
    showError,
    hideError
  };
};

export default useErrorHandler;