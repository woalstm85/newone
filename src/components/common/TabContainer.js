/**
 * TabContainer.js - 탭 컨테이너 (상태 유지)
 * 
 * 주요 기능:
 * 1. 탭 전환 시 스크롤 위치 저장/복원
 * 2. TabStateContext와 연동하여 탭별 상태 관리
 * 3. 비활성 탭은 display:none으로 숨김 (DOM 유지)
 * 
 * Props:
 * - tabId: 탭 고유 식별자
 * - children: 탭 내용
 * - isActive: 활성 탭 여부
 * 
 * 동작 원리:
 * - 탭이 비활성화될 때: 현재 스크롤 위치를 Context에 저장
 * - 탭이 활성화될 때: 저장된 스크롤 위치로 복원
 * - 각 탭의 DOM은 유지되므로 상태 손실 없음
 * 
 * 사용 예:
 * <TabContainer tabId="CUST0010" isActive={activeTab === 'CUST0010'}>
 *   <CUST0010Component />
 * </TabContainer>
 */

import React, { useEffect, useRef } from 'react';
import { useTabState } from '../../context/TabStateContext';

const TabContainer = ({ tabId, children, isActive }) => {
  const containerRef = useRef(null);
  const scrollPositionRef = useRef({ x: 0, y: 0 });
  const { saveTabState, getTabState } = useTabState();

  /**
   * 탭이 비활성화될 때 스크롤 위치 저장
   */
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

  /**
   * 탭이 활성화될 때 스크롤 위치 복원
   */
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
        display: isActive ? 'block' : 'none',  // 활성 탭만 표시
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
