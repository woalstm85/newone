import React from 'react';
import { ClipLoader } from 'react-spinners'; // 원하는 스피너 종류를 import 합니다.
import './MySpinner.css'; // 스피너 스타일을 위한 CSS 파일

function MySpinner() {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <ClipLoader
          color={"#007bff"} // CUST0010.css에서 사용한 메인 색상
          loading={true}
          size={50} // 스피너 크기
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      </div>
    </div>
  );
}

export default MySpinner;