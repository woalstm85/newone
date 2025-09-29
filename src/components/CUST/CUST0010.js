import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Package, Hash, List, ImageIcon, Search, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Eye, FileText } from 'lucide-react';
import { CiImageOff } from 'react-icons/ci';
import Modal from '../common/Modal';
import ImageModal from '../common/ImageModal';
import { useMenu } from '../../context/MenuContext';
import { inventoryAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './CUST0010.css';
import MySpinner from '../common/MySpinner';

function CUST0010() {
  // 1. 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [activeTab, setActiveTab] = useState('normal'); // 'normal', 'serial'
  const [viewMode, setViewMode] = useState('image'); // 'list' 또는 'image'
  const [itemName, setItemName] = useState('');
  const [gridData, setGridData] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '', alt: '' });
  const [expandedLots, setExpandedLots] = useState(new Set());
  
  // 2. 참조 및 상수
  const searchToggleRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  const { currentMenuTitle } = useMenu();
  const { globalState } = useAuth();

  // 3. 이벤트 핸들러 및 로직
  
  // 이미지 확대 보기
  const handleImageClick = (imageUrl, itemName) => {
    if (imageUrl) {
      setSelectedImage({
        url: imageUrl,
        alt: `${itemName || ''} `
      });
      setIsImageModalOpen(true);
    }
  };

  // 스와이프 제스처 처리
  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientY); };
  const onTouchMove = (e) => { setTouchEnd(e.targetTouches[0].clientY); };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isDownSwipe && !isSearchVisible) {
      setIsSearchVisible(true);
    }
    else if (isUpSwipe && isSearchVisible) {
      setIsSearchVisible(false);
    }
  };

  // 검색 영역 외부 클릭 시 닫기 (모바일)
  const handleClickOutside = useCallback((event) => {
    if (searchToggleRef.current && !searchToggleRef.current.contains(event.target)) {
      if (window.innerWidth <= 768 && isSearchVisible) {
        setIsSearchVisible(false);
      }
    }
  }, [isSearchVisible]);

  // 페이지네이션 계산
  const { currentItems, totalPages, startIndex, endIndex } = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const currentItems = gridData.slice(startIdx, endIdx);
    const totalPages = Math.ceil(gridData.length / itemsPerPage);

    return {
      currentItems,
      totalPages,
      startIndex: startIdx + 1,
      endIndex: Math.min(endIdx, gridData.length)
    };
  }, [gridData, currentPage, itemsPerPage]);

  // 탭 변경 시 상태 초기화
  const handleTabChange = (tab) => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setCurrentPage(1);
    setGridData([]);
  };

  // 검색 조건 초기화
  const handleReset = () => {
    setItemName('');
    setCurrentPage(1);
  };

  // API 데이터 조회
  const fetchData = useCallback(async () => {
    if (!globalState.G_USER_ID) {
      setModalMessage('로그인이 필요합니다.');
      setIsModalOpen(true);
      return;
    }

    try {
      setLoading(true);

      let response;
      switch (activeTab) {
        case 'normal':
          response = await inventoryAPI.getCompanyInventory(globalState.G_USER_ID);
          break;
        case 'serial':
          response = await inventoryAPI.getLotInventory(globalState.G_USER_ID);
          break;
        default:
          response = await inventoryAPI.getCompanyInventory(globalState.G_USER_ID);
      }

      if (response && Array.isArray(response)) {
        let filteredData = response;
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

  // 검색 실행
  const handleSearch = () => {
    setCurrentPage(1);
    fetchData();
    if (window.innerWidth <= 768) {
      setIsSearchVisible(false);
    }
  };

  // 검색 영역 토글
  const toggleSearchArea = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  // 뷰 모드 변경
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 페이지 크기 변경
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };
  
  // 로트 이력 확장/축소
  const toggleLotExpansion = (lotNo) => {
    const newExpanded = new Set(expandedLots);
    if (newExpanded.has(lotNo)) {
      newExpanded.delete(lotNo);
    } else {
      newExpanded.add(lotNo);
    }
    setExpandedLots(newExpanded);
  };
  
  // 날짜 포맷팅
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
  
  // 금액 포맷팅
  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '0';
    return new Intl.NumberFormat('ko-KR').format(amount);
  };
  
  // 입출고 구분에 따른 배지 색상
  const getInOutBadgeClass = (inOutDiv) => {
    switch (inOutDiv) {
      case '입고': return 'lot-badge-in';
      case '출고': return 'lot-badge-out';
      case '조정': return 'lot-badge-adjust';
      default: return 'lot-badge-default';
    }
  };

  // 페이지 번호 생성
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // 4. 라이프사이클 및 렌더링
  
  // 외부 클릭 이벤트 리스너 등록
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    fetchData();
  }, [activeTab, globalState.G_USER_ID, fetchData]);

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
                  <td className="cust0010-center">{row.locCd || '-'}</td>
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
              <th style={{ width: '60px' }}>단위</th>
              <th style={{ width: '80px' }}>입고수량</th>
              <th style={{ width: '90px' }}>입고금액</th>
              <th style={{ width: '80px' }}>현재고</th>
              <th style={{ width: '80px' }}>창고</th>
              <th style={{ width: '100px' }}>위치</th>
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
                    <td className="cust0010-center">{row.unitNm || '-'}</td>
                    <td className="cust0010-right">{formatAmount(row.inpQty)}</td>
                    <td className="cust0010-right">{formatAmount(row.inpAmt)}</td>
                    <td className="cust0010-right" style={{ fontWeight: '600', color: row.currentQty > 0 ? '#28a745' : '#dc3545' }}>
                      {formatAmount(row.currentQty)}
                    </td>
                    <td className="cust0010-center">{row.whNm || '-'}</td>
                    <td className="cust0010-center">{row.locCd || '-'}</td>
                  </tr>
                  
                  {expandedLots.has(row.lotNo) && row.subData && row.subData.length > 0 && (
                    <tr>
                      <td colSpan={13} className="lot-details-container">
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
                                    <td className="cust0010-right">{formatAmount(detail.qty)}</td>
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
                <td colSpan={13} className="cust0010-center" style={{ padding: '40px', color: '#666' }}>
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

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
            <span className="cust0010-inventory-lot-number">{item.lotNo}</span>
            <h4>{item.itemNm}</h4>
          </div>
          <span className={`cust0010-inventory-badge ${item.currentQty > 0 ? 'normal' : 'warning'}`}>
            {item.currentQty > 0 ? '재고있음' : '재고없음'}
          </span>
        </div>
        <div className="cust0010-inventory-image-content">
          <div className="cust0010-inventory-image-section">
            <div className="cust0010-inventory-image-placeholder">
              <Package size={40} color="#007bff" />
            </div>
            
            <div className="cust0010-inventory-image-info">
              {item.optValNm && (
                <span className="cust0010-inventory-option-badge">
                  🏷️ {item.optValNm}
                </span>
              )}
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
                <span className="cust0010-inventory-spec-label">입고일:</span>
                <span className="cust0010-inventory-spec-date">{formatDate(item.inpDat)}</span>
              </div>
              <div className="cust0010-inventory-spec-row">
                <span className="cust0010-inventory-spec-label">입고수량:</span>
                <span className="cust0010-inventory-spec-value">{formatAmount(item.inpQty)} {item.unitNm}</span>
              </div>
              <div className="cust0010-inventory-spec-row">
                <span className="cust0010-inventory-spec-label">입고금액:</span>
                <span className="cust0010-inventory-spec-client">{formatAmount(item.inpAmt)}원</span>
              </div>
              <div className="cust0010-inventory-spec-row">
                <span className="cust0010-inventory-spec-label">현재고:</span>
                <span className={`cust0010-inventory-spec-value ${item.currentQty > 0 ? 'positive' : 'zero'}`}>
                  {formatAmount(item.currentQty)} {item.unitNm}
                </span>
              </div>
            </div>
            
            {(item.whNm || item.locCd) ? (
              <div className="cust0010-inventory-warehouse-location">
                {item.whNm && item.locCd ? (
                  <span className="cust0010-inventory-warehouse-location-badge">
                    {item.whNm} - {item.locCd}
                  </span>
                ) : item.whNm ? (
                  <span className="cust0010-inventory-warehouse-location-badge">
                    {item.whNm}
                  </span>
                ) : (
                  <span className="cust0010-inventory-warehouse-location-badge">
                    {item.locCd}
                  </span>
                )}
              </div>
            ) : (
              <span className="cust0010-inventory-no-location-badge">
                📍 위치 미지정
              </span>
            )}
            
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

  // 현재 탭/뷰 모드에 따른 콘텐츠 렌더링
  const renderCurrentTable = () => {
    if (viewMode === 'image') {
      return activeTab === 'normal' ? renderNormalInventoryImage() : renderSerialInventoryImage();
    } else {
      return activeTab === 'normal' ? renderNormalInventory() : renderSerialInventory();
    }
  };

  return (
    <div className="cust0010-container">
      <div className="cust0010-program-header">
        <div className="cust0010-header-left">
          <Package className="w-6 h-6" />
          <h1>{currentMenuTitle || '재고현황 관리'}</h1>
        </div>

        {/* 뷰 모드 선택 */}
        <div className="cust0010-view-toggle">
          <button
            className={`cust0010-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('list')}
            title="리스트 보기"
          >
            <List size={16} />
          </button>
          <button
            className={`cust0010-view-btn ${viewMode === 'image' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('image')}
            title="이미지 보기"
          >
            <ImageIcon size={16} />
          </button>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="cust0010-tab-container">
        <div className="cust0010-tab-group">
          <button
            className={`cust0010-tab ${activeTab === 'normal' ? 'active' : ''}`}
            onClick={() => handleTabChange('normal')}
          >
            <Package size={16} />
            일반재고
          </button>
          <button
            className={`cust0010-tab ${activeTab === 'serial' ? 'active' : ''}`}
            onClick={() => handleTabChange('serial')}
          >
            <Hash size={16} />
            시리얼/로트No. 재고현황
          </button>
        </div>
      </div>

      {/* 검색 영역 */}
      <div 
        className="cust0010-search-section"
        ref={searchToggleRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 모바일 검색 토글 버튼 */}
        <div
          className="cust0010-mobile-search-toggle"
          onClick={toggleSearchArea}
        >
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
              <button className="cust0010-search-btn" onClick={handleSearch}>
                <Search size={16} />
                검색
              </button>
              <button className="cust0010-reset-btn" onClick={handleReset}>
                <RotateCcw size={16} />
                초기화
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 페이지네이션 정보 및 설정 */}
      <div className="cust0010-pagination-info">
        <div className="cust0010-data-info">
          전체 {gridData.length.toLocaleString()}건 중 {gridData.length > 0 ? startIndex.toLocaleString() : 0}-{endIndex.toLocaleString()}건 표시
        </div>
        <div className="cust0010-page-size-selector">
          <label>페이지당 표시:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
          >
            <option value={10}>10개</option>
            <option value={30}>30개</option>
            <option value={50}>50개</option>
            <option value={80}>80개</option>
            <option value={100}>100개</option>
          </select>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="cust0010-grid-container">
        <div className="cust0010-grid-wrapper">
          {renderCurrentTable()}
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="cust0010-pagination">
          <button
            className="cust0010-page-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            이전
          </button>

          {getPageNumbers().map(page => (
            <button
              key={page}
              className={`cust0010-page-number ${currentPage === page ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="cust0010-page-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* 로딩 표시 */}
      {loading && <MySpinner />}

      {/* 기본 모달 */}
      <Modal
        isOpen={isModalOpen}
        title="알림"
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
      />

      {/* 이미지 모달 */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
        altText={selectedImage.alt}
        showControls={true}
        showDownload={true}
      />
    </div>
  );
}

export default CUST0010;