/**
 * MySpinner.js - 로딩 스피너 컴포넌트
 * 
 * 주요 기능:
 * 1. 전체 화면 오버레이 스피너
 * 2. react-spinners의 ClipLoader 사용
 * 3. 로딩 중임을 시각적으로 표시
 * 
 * 사용 시나리오:
 * - API 호출 중
 * - 데이터 로딩 중
 * - 페이지 전환 중
 * 
 * 사용 예:
 * {loading && <MySpinner />}
 */

import React from 'react';
import { ClipLoader } from 'react-spinners';
import './MySpinner.css';

function MySpinner() {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <ClipLoader
          color={"#007bff"}      // 파란색 스피너
          loading={true}
          size={50}              // 스피너 크기
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      </div>
    </div>
  );
}

export default MySpinner;
