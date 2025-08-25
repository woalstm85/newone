// context/CommonCodeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const CommonCodeContext = createContext();

export function CommonCodeProvider({ children }) {
  // 초기 상태를 빈 배열로 설정
  const [commonCodes, setCommonCodes] = useState({
    CD190: [],
    CD191: [],
    CD120: []
  });

  useEffect(() => {
    const fetchCommonCodes = async () => {
      try {
        // 동시에 여러 코드 데이터 가져오기
        const responses = await Promise.all([
          fetch('http://localhost:3001/api/common', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ P_CDDIV: 'CD190' })
          }),
          fetch('http://localhost:3001/api/common', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ P_CDDIV: 'CD191' })
          }),
          fetch('http://localhost:3001/api/common', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ P_CDDIV: 'CD120' })
          })
        ]);

        const [cd190Data, cd191Data, cd120Data] = await Promise.all(
          responses.map(response => response.json())
        );

        setCommonCodes({
          CD190: cd190Data || [],
          CD191: cd191Data || [],
          CD120: cd120Data || []
        });

      } catch (error) {
        console.error('공통 코드 조회 실패:', error);
      }
    };

    fetchCommonCodes();
  }, []);

  const getCodeName = (codeType, code) => {
    if (!code) return '';
    const codeArray = commonCodes[codeType] || [];
    const found = codeArray.find(item => String(item.ComCd) === String(code));
    return found ? found.ComNm : code;
  };


  return (
    <CommonCodeContext.Provider value={{ commonCodes, getCodeName }}>
      {children}
    </CommonCodeContext.Provider>
  );
}

export const useCommonCode = () => {
  const context = useContext(CommonCodeContext);
  if (!context) {
    throw new Error('useCommonCode must be used within a CommonCodeProvider');
  }
  return context;
};