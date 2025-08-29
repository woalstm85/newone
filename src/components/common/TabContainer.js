import React, { useEffect, useRef } from 'react';
import { useTabState } from '../../context/TabStateContext';

const TabContainer = ({ tabId, children, isActive }) => {
  const containerRef = useRef(null);
  const scrollPositionRef = useRef({ x: 0, y: 0 });
  const { saveTabState, getTabState } = useTabState();

  // 탭이 비활성화될 때 스크롤 위치 저장
  useEffect(() => {
    if (!isActive && containerRef.current) {
      const container = containerRef.current;
      scrollPositionRef.current = {
        x: container.scrollLeft || 0,
        y: container.scrollTop || 0
      };
      
      // 상태를 Context에 저장
      saveTabState(tabId, {
        scrollPosition: scrollPositionRef.current,
        timestamp: Date.now()
      });
    }
  }, [isActive, tabId, saveTabState]);

  // 탭이 활성화될 때 스크롤 위치 복원
  useEffect(() => {
    if (isActive && containerRef.current) {
      const savedState = getTabState(tabId);
      if (savedState && savedState.scrollPosition) {
        const container = containerRef.current;
        container.scrollLeft = savedState.scrollPosition.x;
        container.scrollTop = savedState.scrollPosition.y;
      }
    }
  }, [isActive, tabId, getTabState]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        display: isActive ? 'block' : 'none',
        height: '100%',
        width: '100%',
        overflow: 'auto'
      }}
      className={`tab-container ${isActive ? 'active' : 'inactive'}`}
    >
      {children}
    </div>
  );
};

export default TabContainer;