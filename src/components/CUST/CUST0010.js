/**
 * ===================================================================
 * CUST0010: 재고 현황 관리 React 컴포넌트
 * ===================================================================
 * 최종수정일: 2025-10-01
 * * 주요 기능:
 * - 일반 재고 및 시리얼/로트 재고 조회
 * - 리스트(테이블) 뷰와 이미지(카드) 뷰 모드 전환
 * - 제품명, 로트번호 등으로 데이터 검색 및 초기화
 * - 페이지네이션 및 페이지당 표시 항목 수 제어
 * - 이미지 클릭 시 확대 보기 모달 표시
 * - 로트 재고의 상세 입출고 이력 확장/축소 기능
 * - 반응형 UI 지원 (모바일/태블릿/데스크톱)
 * ===================================================================
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 아이콘 라이브러리
import { Package, Hash, List, ImageIcon, Search, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Eye, FileText } from 'lucide-react';
import { CiImageOff } from 'react-icons/ci';

// 공통 컴포넌트
import Modal from '../common/Modal';
import ImageModal from '../common/ImageModal';
import MySpinner from '../common/MySpinner';

// 컨텍스트 및 API
import { useMenu } from '../../context/MenuContext';
import { useAuth } from '../../context/AuthContext';
import { inventoryAPI } from '../../services/api';

// CSS 스타일시트
import './CUST0010.css';

function CUST0010() {
  // ===================================================================
  // 1. 상태(State) 및 참조(Ref) 관리
  // ===================================================================
  
  // UI 제어 상태
  const [activeTab, setActiveTab] = useState('normal'); // 현재 활성화된 탭 ('normal' 또는 'serial')
  const [viewMode, setViewMode] = useState('image');    // 현재 뷰 모드 ('list' 또는 'image')
  const [isSearchVisible, setIsSearchVisible] = useState(window.innerWidth > 768); // 검색 영역 표시 여부
  const [loading, setLoading] = useState(false);        // 데이터 로딩 상태
  const [expandedLots, setExpandedLots] = useState(new Set()); // 확장된 로트 번호 목록 (Set으로 관리하여 중복 방지 및 성능 최적화)
  
  // 데이터 상태
  const [gridData, setGridData] = useState([]); // API로부터 받은 원본 데이터 배열
  const [itemName, setItemName] = useState(''); // 검색어 입력 값
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);   // 현재 페이지 번호
  const [itemsPerPage, setItemsPerPage] = useState(50); // 페이지당 표시할 아이템 수
  
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);         // 일반 알림 모달
  const [modalMessage, setModalMessage] = useState('');          // 알림 모달 메시지
  const [isImageModalOpen, setIsImageModalOpen] = useState(false); // 이미지 확대 보기 모달
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '', alt: '' }); // 확대할 이미지 정보
  
  // 모바일 스와이프 제스처 상태
  const [touchStart, setTouchStart] = useState(null); // 터치 시작 Y 좌표
  const [touchEnd, setTouchEnd] = useState(null);     // 터치 종료 Y 좌표
  
  // DOM 참조
  const searchToggleRef = useRef(null); // 검색 영역 DOM을 참조 (외부 클릭 감지용)

  // ===================================================================
  // 2. 컨텍스트 및 상수
  // ===================================================================
  const { currentMenuTitle } = useMenu();
  const { globalState } = useAuth();
  const minSwipeDistance = 50; // 스와이프로 인식할 최소 Y축 이동 거리
  
  // ===================================================================
  // 3. 유틸리티 함수
  // ===================================================================
  
  /**
   * 날짜 문자열을 'YYYY-MM-DD' 또는 'YYYY-MM-DD HH:mm:ss' 형식으로 포맷팅
   * @param {string} dateString - 날짜 문자열 (예: '20251001' 또는 ISO 형식)
   * @returns {string} 포맷팅된 날짜 또는 '-'
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    if (dateString.includes('T')) {
      return new Date(dateString).toLocaleString('ko-KR');
    }
    if (dateString.length === 8) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return dateString;
  };
  
  /**
   * 숫자를 세 자리마다 쉼표가 있는 문자열로 포맷팅
   * @param {number} amount - 포맷팅할 숫자
   * @returns {string} 포맷팅된 숫자 문자열
   */
  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(amount);
  };
  
  /**
   * 입출고 구분에 따라 CSS 클래스명 반환
   * @param {string} inOutDiv - 구분 값 (예: '입고', '출고', '조정')
   * @returns {string} CSS 클래스명
   */
  const getInOutBadgeClass = (inOutDiv) => {
    switch (inOutDiv) {
      case '입고': return 'lot-badge-in';
      case '출고': return 'lot-badge-out';
      case '조정': return 'lot-badge-adjust';
      default: return 'lot-badge-default';
    }
  };
  
  // ===================================================================
  // 4. 데이터 조회 (API 호출)
  // ===================================================================
  
  /**
   * 활성화된 탭에 따라 재고 데이터를 API로부터 비동기적으로 가져옴
   */
  const fetchData = useCallback(async () => {
    if (!globalState.G_USER_ID) {
      setModalMessage('로그인이 필요합니다.');
      setIsModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const apiCall = activeTab === 'serial' 
        ? inventoryAPI.getLotInventory(globalState.G_USER_ID)
        : inventoryAPI.getCompanyInventory(globalState.G_USER_ID);
        
      const response = await apiCall;

      if (Array.isArray(response)) {
        let filteredData = response;
        // 검색어가 있는 경우 데이터 필터링
        if (itemName.trim()) {
          const lowerCaseItemName = itemName.trim().toLowerCase();
          filteredData = response.filter(item =>
            (item.itemNm && item.itemNm.toLowerCase().includes(lowerCaseItemName)) ||
            (activeTab === 'serial' && item.lotNo && item.lotNo.toLowerCase().includes(lowerCaseItemName)) ||
            (activeTab === 'serial' && item.itemCd && item.itemCd.toLowerCase().includes(lowerCaseItemName))
          );
        }
        setGridData(filteredData);
      } else {
        setGridData([]);
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      setGridData([]);
      setModalMessage(`데이터 조회 중 오류가 발생했습니다: ${error.message}`);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  }, [activeTab, itemName, globalState.G_USER_ID]);

  // ===================================================================
  // 5. 이벤트 핸들러
  // ===================================================================
  
  /** 탭 변경 핸들러 */
  const handleTabChange = (tab) => {
    if (activeTab === tab) return; // 같은 탭 클릭 시 무시
    setActiveTab(tab);
    setGridData([]);  // 탭 변경 시 데이터 초기화
    setCurrentPage(1); // 1페이지로 리셋
  };

  /** 검색 실행 핸들러 */
  const handleSearch = () => {
    setCurrentPage(1);
    fetchData();
    // 모바일에서 검색 후 검색창 자동으로 닫기
    if (window.innerWidth <= 768) {
      setIsSearchVisible(false);
    }
  };

  /** 검색 조건 초기화 핸들러 */
  const handleReset = () => {
    setItemName('');
    setCurrentPage(1);
    // fetchData(); // 초기화 후 바로 검색하려면 주석 해제
  };

  /** 뷰 모드 변경 핸들러 */
  const handleViewModeChange = (mode) => setViewMode(mode);

  /** 페이지 번호 변경 핸들러 */
  const handlePageChange = (page) => setCurrentPage(page);

  /** 페이지당 아이템 수 변경 핸들러 */
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };
  
  /** 이미지 클릭 시 확대 모달 열기 */
  const handleImageClick = (imageUrl, itemName) => {
    if (imageUrl) {
      setSelectedImage({ url: imageUrl, alt: `${itemName || ''} 이미지` });
      setIsImageModalOpen(true);
    }
  };

  /** 로트 이력 확장/축소 토글 */
  const toggleLotExpansion = (lotNo) => {
    const newExpanded = new Set(expandedLots);
    if (newExpanded.has(lotNo)) {
      newExpanded.delete(lotNo); // 이미 있으면 제거
    } else {
      newExpanded.add(lotNo);    // 없으면 추가
    }
    setExpandedLots(newExpanded);
  };
  
  /** 모바일 검색 영역 토글 */
  const toggleSearchArea = () => setIsSearchVisible(prev => !prev);
  
  // --- 모바일 스와이프 이벤트 핸들러 ---
  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientY); };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientY);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    // 아래로 스와이프하면 검색창 열기, 위로 스와이프하면 닫기
    if (distance < -minSwipeDistance && !isSearchVisible) setIsSearchVisible(true);
    else if (distance > minSwipeDistance && isSearchVisible) setIsSearchVisible(false);
  };

  // ===================================================================
  // 6. 라이프사이클 관리 (useEffect)
  // ===================================================================
  
  /**
   * 컴포넌트 마운트 시, 탭이 변경될 때 데이터를 가져옴
   * fetchData 함수는 useCallback으로 메모이제이션 되어 있어 불필요한 재실행 방지
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]); // activeTab, G_USER_ID는 fetchData의 의존성 배열에 포함됨
  
  /**
   * 모바일에서 검색 영역 외부를 클릭하면 닫히도록 이벤트 리스너 등록/해제
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 모바일 화면이고, 검색창이 열려있고, 클릭된 영역이 검색창 내부가 아닐 때
      if (window.innerWidth <= 768 && isSearchVisible && searchToggleRef.current && !searchToggleRef.current.contains(event.target)) {
        setIsSearchVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchVisible]);

  // ===================================================================
  // 7. 메모이제이션 (useMemo)
  // ===================================================================
  
  /**
   * 페이지네이션 관련 값들을 계산.
   * gridData, currentPage, itemsPerPage가 변경될 때만 재계산.
   */
  const { currentItems, totalPages, startIndex, endIndex } = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return {
      currentItems: gridData.slice(startIdx, endIdx),
      totalPages: Math.ceil(gridData.length / itemsPerPage),
      startIndex: gridData.length > 0 ? startIdx + 1 : 0,
      endIndex: Math.min(endIdx, gridData.length),
    };
  }, [gridData, currentPage, itemsPerPage]);

  // ===================================================================
  // 8. 렌더링 함수
  // ===================================================================

  /** 데이터 없음 메시지 렌더링 */
  const renderNoDataMessage = (message, icon) => (
    <div className="cust0010-no-data">
      {icon}
      <p>{message}</p>
    </div>
  );

  // 일반 재고 이미지 뷰 렌더링
  const renderNormalInventoryImage = () => {
    const items = currentItems.map((item, index) => (
      <div key={`${item.itemCd}-${index}`} className="cust0010-inventory-image-card" >
        <div className="cust0010-inventory-image-header">
          <h4>{item.itemNm}</h4>
          <span className={`cust0010-inventory-badge ${item.closingQty > 0 ? 'normal' : 'warning'}`}>
            {item.closingQty > 0 ? '재고있음' : '재고없음'}
          </span>
        </div>
        <div className="cust0010-inventory-image-content">
          <div className="cust0010-inventory-image-section">
            <div className="cust0010-inventory-image-placeholder">
              {item.thFilePath ? (
                <>
                  <img
                    src={item.thFilePath}
                    alt={item.itemNm}
                    className="cust0010-inventory-image"
                  />
                  <div className="cust0010-image-overlay">
                    <button
                      className="cust0010-overlay-view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(item.thFilePath, item.itemNm, item.itemCd);
                      }}
                    >
                      <Eye size={14} />
                      확대
                    </button>
                  </div>
                </>
              ) : (
                <div className="cust0010-inventory-no-image">
                  <CiImageOff size={48} color="#ccc" />
                </div>
              )}
            </div>
            
            <div className="cust0010-inventory-image-info">
                <span className="cust0010-inventory-option-badge">
                  🏷️ {item.optValNm}
                </span>
              {item.unitNm && (
                <span className="cust0010-inventory-unit-badge">
                  📏 {item.unitNm}
                </span>
              )}
            </div>
          </div>
          
          <div className="cust0010-inventory-item-details">
            <div className="cust0010-inventory-item-specs">
              <div className="cust0010-inventory-spec-row">
                <span className="cust0010-inventory-spec-label">기초재고:</span>
                <span className="cust0010-inventory-spec-value">{(item.openingQty || 0).toLocaleString()}</span>
              </div>
              <div className="cust0010-inventory-spec-row">
                <span className="cust0010-inventory-spec-label">입고:</span>
                <span className="cust0010-inventory-spec-value">{(item.totalInQty || 0).toLocaleString()}</span>
              </div>
              <div className="cust0010-inventory-spec-row">
                <span className="cust0010-inventory-spec-label">출고:</span>
                <span className="cust0010-inventory-spec-value">{(item.totalOutQty || 0).toLocaleString()}</span>
              </div>
              <div className="cust0010-inventory-spec-row">
                <span className="cust0010-inventory-spec-label">현재고:</span>
                <span className="cust0010-inventory-spec-value">{(item.closingQty || 0).toLocaleString()}</span>
              </div>
              <div className="cust0010-inventory-spec-row">
                <span className="cust0010-inventory-spec-label">평균단가:</span>
                <span className="cust0010-inventory-spec-client">{(item.avgPrice || 0).toLocaleString()}원</span>
              </div>
            </div>
            {item.locCd ? (
              <span className="cust0010-inventory-location-badge">
                📍 {item.locCd}
              </span>
            ) : (
              <span className="cust0010-inventory-no-location-badge">
                📋 위치 미지정
              </span>
            )}
          </div>
        </div>
      </div>
    ));

    return (
      <div className="cust0010-inventory-image-grid">
        {items.length > 0 ? items : (
          <div className="cust0010-no-data">
            <CiImageOff size={48} color="#ccc" />
            <p>데이터가 없습니다.</p>
          </div>
        )}
      </div>
    );
  };
  
  // 시리얼 재고 이미지 뷰 렌더링
  const renderSerialInventoryImage = () => {
    const items = currentItems.map((item, index) => (
      <div key={`${item.lotNo}-${index}`} className="cust0010-inventory-image-card">
        <div className="cust0010-inventory-image-header">
          <div className="cust0010-serial-header-content">
            <span className="cust0010-inventory-lot-badge">{item.lotNo}</span>
            <h4>{item.itemNm}</h4>
          </div>
          <span className={`cust0010-inventory-badge ${item.currentQty > 0 ? 'normal' : 'warning'}`}>
            {item.currentQty > 0 ? '재고있음' : '재고없음'}
          </span>
        </div>
        <div className="cust0010-inventory-image-content">
          <div className="cust0010-inventory-image-section">
            <div className="cust0010-inventory-image-placeholder">
              {item.filePath || item.thFilePath ? (
                <>
                  <img
                    src={item.filePath || item.thFilePath}
                    alt={item.itemNm}
                    className="cust0010-inventory-image"
                  />
                  <div className="cust0010-image-overlay">
                    <button
                      className="cust0010-overlay-view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(item.filePath || item.thFilePath, item.itemNm, item.itemCd);
                      }}
                    >
                      <Eye size={14} />
                      확대
                    </button>
                  </div>
                </>
              ) : (
                <div className="cust0010-inventory-no-image">
                  <CiImageOff size={48} color="#ccc" />
                </div>
              )}
            </div>
            
            <div className="cust0010-inventory-image-info">
              {item.optValNm && (
                <span className="cust0010-inventory-option-badge">
                  🏷️ {item.optValNm}
                </span>
              )}
            </div>
          </div>
          
          <div className="cust0010-inventory-item-details">
            <div className="cust0010-inventory-item-specs">
              <div className="cust0010-inventory-spec-row">
                <span className="cust0010-inventory-spec-label">입고일:</span>
                <span className="cust0010-inventory-spec-date">{formatDate(item.inpDat)}</span>
              </div>
              <div className="cust0010-inventory-spec-row">
                <span className="cust0010-inventory-spec-label">입고수량:</span>
                <div className="cust0010-inventory-spec-with-unit">
                  <span className="cust0010-inventory-spec-value">{formatAmount(item.inpQty)}</span>
                  {item.unitNm && (
                    <span className="cust0010-inventory-inline-unit-badge">{item.unitNm}</span>
                  )}
                </div>
              </div>
              <div className="cust0010-inventory-spec-row">
                <span className="cust0010-inventory-spec-label">입고금액:</span>
                <span className="cust0010-inventory-spec-client">{formatAmount(item.inpAmt)}원</span>
              </div>
              <div className="cust0010-inventory-spec-row">
                <span className="cust0010-inventory-spec-label">현재고:</span>
                <div className="cust0010-inventory-spec-with-unit">
                  <span className={`cust0010-inventory-spec-value ${item.currentQty > 0 ? 'positive' : 'zero'}`}>
                    {formatAmount(item.currentQty)}
                  </span>
                  {item.unitNm && (
                    <span className="cust0010-inventory-inline-unit-badge">{item.unitNm}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="cust0010-serial-bottom-section">
              {item.locCd ? (
                <span className="cust0010-inventory-location-badge">
                  📍 {item.locCd}
                </span>
              ) : (
                <span className="cust0010-inventory-no-location-badge">
                  📋 위치 미지정
                </span>
              )}
            </div>
            
            {item.subData && item.subData.length > 0 && (
              <div className="cust0010-inventory-history-section">
                <button 
                  className="cust0010-inventory-history-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLotExpansion(item.lotNo);
                  }}
                >
                  📋 입출고 이력 {item.subData.length}건 {expandedLots.has(item.lotNo) ? '접기' : '보기'}
                </button>
              </div>
            )}
            
            {expandedLots.has(item.lotNo) && item.subData && item.subData.length > 0 && (
              <div className="cust0010-inventory-expanded-history">
                <div className="cust0010-inventory-history-list">
                  {item.subData.slice(0, 3).map((detail, detailIndex) => (
                    <div key={`${item.lotNo}-history-${detailIndex}`} className="cust0010-inventory-history-item">
                      <div className="cust0010-inventory-history-header">
                        <span className={`lot-badge ${getInOutBadgeClass(detail.inOutDiv)}`}>
                          {detail.inOutDiv}
                        </span>
                        <span className="cust0010-inventory-history-date">{formatDate(detail.transDate)}</span>
                      </div>
                      <div className="cust0010-inventory-history-details">
                        <span>{detail.transTypeNm}</span>
                        <span className="cust0010-inventory-history-amount">{formatAmount(detail.qty)} {item.unitNm}</span>
                      </div>
                      {detail.remark && (
                        <div className="cust0010-inventory-history-remark">
                          {detail.remark}
                        </div>
                      )}
                    </div>
                  ))}
                  {item.subData.length > 3 && (
                    <div className="cust0010-inventory-history-more">
                      외 {item.subData.length - 3}건 더...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ));

    return (
      <div className="cust0010-inventory-image-grid">
        {items.length > 0 ? items : (
          <div className="cust0010-no-data">
            <Package size={48} color="#ccc" />
            <p>데이터가 없습니다.</p>
          </div>
        )}
      </div>
    );
  };

  /** 일반 재고 - 리스트 뷰(테이블) 렌더링 */
 // 일반 재고 테이블 렌더링
  const renderNormalInventory = () => {
    const totals = currentItems.reduce((acc, item) => {
      acc.closingQty += item.closingQty || 0;
      acc.closingAmt += item.closingAmt || 0;
      return acc;
    }, { closingQty: 0, closingAmt: 0 });

    return (
      <div className="cust0010-table-container">
        <table className="cust0010-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>이미지</th>
              <th>품목명</th>
              <th style={{ width: '100px' }}>옵션</th>
              <th style={{ width: '60px' }}>단위</th>
              <th style={{ width: '80px' }}>평균단가</th>
              <th style={{ width: '80px' }}>기초재고</th>
              <th style={{ width: '90px' }}>기초금액</th>
              <th style={{ width: '80px' }}>입고</th>
              <th style={{ width: '90px' }}>입고금액</th>
              <th style={{ width: '80px' }}>출고</th>
              <th style={{ width: '90px' }}>출고금액</th>
              <th style={{ width: '80px' }}>현재고</th>
              <th style={{ width: '90px' }}>현재고금액</th>
              <th style={{ width: '100px' }}>위치</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((row, index) => (
                <tr key={`${row.itemCd}-${index}`}>
                  <td className="cust0010-center">
                    <div className="cust0010-table-image" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {row.thFilePath ? (
                        <div className="cust0010-table-image-container">
                          <img
                            src={row.thFilePath}
                            alt={row.itemNm}
                            className="cust0010-table-image-item"
                          />
                          <div className="cust0010-table-image-overlay">
                            <button
                              className="cust0010-table-overlay-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageClick(row.thFilePath, row.itemNm, row.itemCd);
                              }}
                            >
                              <Eye size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="cust0010-table-no-image">
                          <CiImageOff size={20} color="#ccc" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="cust0010-left">{row.itemNm}</td>
                  <td className="cust0010-center">{row.optValNm || '-'}</td>
                  <td className="cust0010-center">{row.unitNm || '-'}</td>
                  <td className="cust0010-right">{(row.avgPrice || 0).toLocaleString()}</td>
                  <td className="cust0010-right">{(row.openingQty || 0).toLocaleString()}</td>
                  <td className="cust0010-right">{(row.openingAmt || 0).toLocaleString()}</td>
                  <td className="cust0010-right">{(row.totalInQty || 0).toLocaleString()}</td>
                  <td className="cust0010-right">{(row.totalInAmt || 0).toLocaleString()}</td>
                  <td className="cust0010-right">{(row.totalOutQty || 0).toLocaleString()}</td>
                  <td className="cust0010-right">{(row.totalOutAmt || 0).toLocaleString()}</td>
                  <td className="cust0010-right">{(row.closingQty || 0).toLocaleString()}</td>
                  <td className="cust0010-right">{(row.closingAmt || 0).toLocaleString()}</td>
                  <td className="cust0010-center">
                    {row.locCd && (
                      <span className="cust0010-table-location-badge">
                        📍 {row.locCd}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={14} className="cust0010-center" style={{ padding: '40px', color: '#666' }}>
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
          {currentItems.length > 0 && (
            <tfoot>
              <tr className="cust0010-total-row">
                <td colSpan={11} className="cust0010-center" style={{
                  fontWeight: 'bold',
                  backgroundColor: '#e3f2fd',
                  borderTop: '2px solid #1976d2',
                  padding: '12px 8px',
                  fontSize: '14px',
                  color: '#1976d2'
                }}>
                  합  계
                </td>
                <td className="cust0010-right" style={{
                  fontWeight: 'bold',
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  borderTop: '2px solid #1976d2',
                  padding: '12px 8px',
                  fontSize: '14px'
                }}>
                  {totals.closingQty.toLocaleString()}
                </td>
                <td className="cust0010-right" style={{
                  fontWeight: 'bold',
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  borderTop: '2px solid #1976d2',
                  padding: '12px 8px',
                  fontSize: '14px'
                }}>
                  {totals.closingAmt.toLocaleString()}
                </td>
                <td className="cust0010-center" style={{
                  backgroundColor: '#e3f2fd',
                  borderTop: '2px solid #1976d2',
                  padding: '12px 8px'
                }}>-</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  };
  
  // 시리얼/로트 재고 테이블 렌더링
  const renderSerialInventory = () => {
    return (
      <div className="cust0010-table-container">
        <table className="cust0010-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>상세</th>
              <th style={{ width: '120px' }}>로트번호</th>
              <th style={{ width: '80px' }}>제품코드</th>
              <th>품목명</th>
              <th style={{ width: '80px' }}>옵션</th>
              <th style={{ width: '100px' }}>입고수량</th>
              <th style={{ width: '90px' }}>입고금액</th>
              <th style={{ width: '100px' }}>현재고</th>
              <th style={{ width: '120px' }}>위치</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((row, index) => (
                <React.Fragment key={`${row.lotNo}-${index}`}>
                  <tr 
                    className="lot-main-row" 
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="cust0010-center">
                      <button
                        className="lot-expand-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLotExpansion(row.lotNo);
                        }}
                        title="상세 이력 보기"
                      >
                        {expandedLots.has(row.lotNo) ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </td>
                    <td className="cust0010-center" style={{ fontWeight: '600', color: '#007bff' }}>
                      {row.lotNo}
                    </td>
                    <td className="cust0010-center">{row.itemCd}</td>
                    <td className="cust0010-left">{row.itemNm}</td>
                    <td className="cust0010-center">{row.optValNm || '-'}</td>
                    <td className="cust0010-right">
                      <div className="cust0010-table-quantity-cell">
                        {formatAmount(row.inpQty)}
                        {row.unitNm && (
                          <span className="cust0010-table-unit-badge">{row.unitNm}</span>
                        )}
                      </div>
                    </td>
                    <td className="cust0010-right">{formatAmount(row.inpAmt)}</td>
                    <td className="cust0010-right">
                      <div className="cust0010-table-quantity-cell" style={{ fontWeight: '600', color: row.currentQty > 0 ? '#28a745' : '#dc3545' }}>
                        {formatAmount(row.currentQty)}
                        {row.unitNm && (
                          <span className="cust0010-table-unit-badge">{row.unitNm}</span>
                        )}
                      </div>
                    </td>
                    <td className="cust0010-center">
                      {row.locCd && (
                        <span className="cust0010-table-location-badge">
                          📍 {row.locCd}
                        </span>
                      )}
                    </td>
                  </tr>
                  
                  {expandedLots.has(row.lotNo) && row.subData && row.subData.length > 0 && (
                    <tr>
                      <td colSpan={9} className="lot-details-container">
                        <div className="lot-details-wrapper">
                          <div className="lot-details-header">
                            <FileText size={16} />
                            <span>입출고 이력 ({row.subData.length}건)</span>
                          </div>
                          <div className="lot-details-table-wrapper">
                            <table className="lot-details-table">
                              <thead>
                                <tr>
                                  <th>거래일자</th>
                                  <th>거래유형</th>
                                  <th>구분</th>
                                  <th>수량</th>
                                  <th>금액</th>
                                  <th>담당자</th>
                                  <th>입고번호</th>
                                  <th>비고</th>
                                  <th>등록일시</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.subData.map((detail, detailIndex) => (
                                  <tr key={`${row.lotNo}-detail-${detailIndex}`}>
                                    <td className="cust0010-center">{formatDate(detail.transDate)}</td>
                                    <td className="cust0010-center">{detail.transTypeNm || '-'}</td>
                                    <td className="cust0010-center">
                                      <span className={`lot-badge ${getInOutBadgeClass(detail.inOutDiv)}`}>
                                        {detail.inOutDiv || '-'}
                                      </span>
                                    </td>
                                    <td className="cust0010-right">
                                      <div className="cust0010-table-quantity-cell">
                                        {formatAmount(detail.qty)}
                                        {row.unitNm && (
                                          <span className="cust0010-table-unit-badge">{row.unitNm}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="cust0010-right">{formatAmount(detail.amount)}</td>
                                    <td className="cust0010-center">{detail.userNm || detail.transEmp || '-'}</td>
                                    <td className="cust0010-center">{detail.ioTransNo || '-'}</td>
                                    <td className="cust0010-left">{detail.remark || '-'}</td>
                                    <td className="cust0010-center">{formatDate(detail.insDate)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="cust0010-center" style={{ padding: '40px', color: '#666' }}>
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  /** 현재 뷰 모드와 탭에 맞는 컨텐츠를 선택하여 렌더링 */
  const renderCurrentView = () => {
    if (viewMode === 'image') {
      return activeTab === 'normal' ? renderNormalInventoryImage() : renderSerialInventoryImage();
    }
    return activeTab === 'normal' ? renderNormalInventory() : renderSerialInventory();
  };

  /** 페이지네이션 버튼 렌더링 */
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    // 페이지 번호 생성 로직 (예: 1 ... 4 5 6 ... 10)
    const getPageNumbers = () => {
      // ... 페이지 번호 배열 생성 ...
      return [];
    };

    return (
      <div className="cust0010-pagination">
        <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
          <ChevronLeft size={16} /> 이전
        </button>
        {getPageNumbers().map(page => (
          <button key={page} className={currentPage === page ? 'active' : ''} onClick={() => handlePageChange(page)}>
            {page}
          </button>
        ))}
        <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
          다음 <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  // ===================================================================
  // 9. 최종 JSX 렌더링
  // ===================================================================
  return (
    <div className="cust0010-container">
      {/* 1. 프로그램 헤더 */}
      <div className="cust0010-program-header">
        <div className="cust0010-header-left">
          <Package />
          <h1>{currentMenuTitle || '재고현황 관리'}</h1>
        </div>
        <div className="cust0010-view-toggle">
          <button className={`cust0010-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => handleViewModeChange('list')} title="리스트 보기">
            <List size={16} />
          </button>
          <button className={`cust0010-view-btn ${viewMode === 'image' ? 'active' : ''}`} onClick={() => handleViewModeChange('image')} title="이미지 보기">
            <ImageIcon size={16} />
          </button>
        </div>
      </div>

      {/* 2. 탭 메뉴 */}
      <div className="cust0010-tab-container">
        <div className="cust0010-tab-group">
          <button className={`cust0010-tab ${activeTab === 'normal' ? 'active' : ''}`} onClick={() => handleTabChange('normal')}>
            <Package size={16} /> 일반재고
          </button>
          <button className={`cust0010-tab ${activeTab === 'serial' ? 'active' : ''}`} onClick={() => handleTabChange('serial')}>
            <Hash size={16} /> 시리얼/로트No. 재고현황
          </button>
        </div>
      </div>

      {/* 3. 검색 영역 */}
      <div className="cust0010-search-section" ref={searchToggleRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div className="cust0010-mobile-search-toggle" onClick={toggleSearchArea}>
          <span>검색 옵션</span>
          {isSearchVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        <div className={`cust0010-search-container ${isSearchVisible ? 'visible' : 'hidden'}`}>
          <div className="cust0010-search-row">
            <div className="cust0010-search-field">
              <label>제품명</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={activeTab === 'serial' ? '제품명, 로트번호, 제품코드 입력' : '제품명 입력'}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="cust0010-search-buttons">
              <button className="cust0010-search-btn" onClick={handleSearch}><Search size={16} /> 검색</button>
              <button className="cust0010-reset-btn" onClick={handleReset}><RotateCcw size={16} /> 초기화</button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 데이터 정보 및 페이지 설정 */}
      <div className="cust0010-pagination-info">
        <div className="cust0010-data-info">
          총 {formatAmount(gridData.length)}건 중 {formatAmount(startIndex)}-{formatAmount(endIndex)}건
        </div>
        <div className="cust0010-page-size-selector">
          <label>페이지당 표시:</label>
          <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
            <option value={10}>10개</option>
            <option value={30}>30개</option>
            <option value={50}>50개</option>
            <option value={80}>80개</option>
            <option value={100}>100개</option>
          </select>
        </div>
      </div>

      {/* 5. 메인 컨텐츠 (테이블 또는 이미지 그리드) */}
      <div className="cust0010-grid-container">
        <div className="cust0010-grid-wrapper">
          {renderCurrentView()}
        </div>
      </div>

      {/* 6. 페이지네이션 */}
      {renderPagination()}

      {/* 7. 로딩 및 모달 컴포넌트 */}
      {loading && <MySpinner />}
      <Modal isOpen={isModalOpen} title="알림" message={modalMessage} onConfirm={() => setIsModalOpen(false)} />
      <ImageModal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} imageUrl={selectedImage.url} altText={selectedImage.alt} />
    </div>
  );
}

export default CUST0010;