/**
 * 애플리케이션 진입점 (Entry Point)
 * 
 * React 애플리케이션을 DOM에 마운트하고 초기화합니다.
 * React 18의 createRoot API를 사용하여 동시성 기능을 활성화합니다.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// React 18의 createRoot를 사용하여 루트 엘리먼트 생성
const root = ReactDOM.createRoot(document.getElementById('root'));

// StrictMode로 감싸서 개발 중 잠재적 문제 감지
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
