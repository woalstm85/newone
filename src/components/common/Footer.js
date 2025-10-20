import React from 'react';
import './Footer.css';

/**
 * Footer 컴포넌트
 * @param {string} variant - 'default' (회색 배경) 또는 'white' (흰색 배경)
 */
const Footer = ({ variant = 'default' }) => {
  return (
    <footer className={`footer-container ${variant === 'white' ? 'footer-white' : ''}`}>
      <div className="footer-content">
        <div className="footer-left">
          <div className="footer-logo">NEWONE</div>
          <div className="footer-contact">
            <span>📞 031-298-1191</span>
          </div>
        </div>

        <div className="footer-center">
          <div className="footer-info">
            <span>대표이사: 이율범</span>
            <span className="footer-divider">|</span>
            <span>사업자등록번호: 124-87-01984</span>
          </div>
          <div className="footer-info">
            <span>본사: 경기도 수원시 권선구 서둔로 21. Tel: 031-298-1191 Fax: 031-297-4460</span>
          </div>
          <div className="footer-info">
            <span>일산지사: 경기도 고양시 일산동구 중앙로 1079 601호(백석동, 더리브스타일). Tel: 031-912-1191 Fax: 031-912-4460</span>
          </div>
        </div>

        <div className="footer-right">
          <a 
            href="https://www.newonetotal.co.kr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
          >
            공식 홈페이지 →
          </a>
          <div className="footer-copyright">
            © 2025 NEWONE
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
