import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Package2, Archive, Hash, Search, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../common/Modal';
import { useMenu } from '../../context/MenuContext';
import { useInventoryApi } from '../../hooks'; // 커스텀 훅 사용
import './CUST0010.css';
import MySpinner from '../common/MySpinner'; 

function CUST0010() {
  // 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [activeTab, setActiveTab] = useState('normal'); // 'normal', 'option', 'serial'
  const [itemName, setItemName] = useState('');
  const [gridData, setGridData] = useState([]);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // 메뉴 컨텍스트에서 현재 메뉴 타이틀 가져오기
  const { currentMenuTitle } = useMenu();
  
  // API 커스텀 훅 사용
  const { 
    loading, 
    error, 
    getNormalInventory, 
    getOptionInventory, 
    getSerialInventory,
    clearError 
  } = useInventoryApi();

  // 샘플 데이터 - 실제로는 API에서 가져옴 (useMemo로 최적화)
  const sampleData = useMemo(() => ({
    normal: [
      {
        itemCd: "000001",
        itemNm: "TFR-CV 3C 2.5SQ (골드)",
        spec: "TFR-CV 3C 2.5SQ",
        unit: "M",
        currentStock: 3461,
        availableStock: 3461,
        purchaseQty: 0,
        locationQty: 0,
        shortageQty: 0
      },
      {
        itemCd: "000001",
        itemNm: "TFR-CV 3C 2.5SQ (실버)",
        spec: "TFR-CV 3C 2.5SQ",
        unit: "M", 
        currentStock: 1000,
        availableStock: 1000,
        purchaseQty: 0,
        locationQty: 0,
        shortageQty: 0
      },
      {
        itemCd: "000002",
        itemNm: "TFR-GV(접지선) 6SQ(실버)",
        spec: "TFR-GV 6SQ",
        unit: "M",
        currentStock: 500,
        availableStock: 500,
        purchaseQty: 0,
        locationQty: 0,
        shortageQty: 0
      },
      {
        itemCd: "000003",
        itemNm: "HFIX 2.5SQ(1.78mm)(실버)외",
        spec: "HFIX 2.5SQ",
        unit: "롤",
        currentStock: 5,
        availableStock: 5,
        purchaseQty: 0,
        locationQty: 0,
        shortageQty: 0
      }
    ],
    option: [
      {
        itemCd: "000002",
        itemNm: "삼정전원 6W 주력직(오각)",
        optionCode: "1-B(파랑)",
        optionName: "파랑",
        spec: "6W",
        unit: "EA",
        currentStock: 2570,
        availableStock: 2570,
        price: 15.4,
        locationInfo: "A구역"
      },
      {
        itemCd: "000002", 
        itemNm: "삼정전원 6W 주력직(오각)",
        optionCode: "1-R(빨강)",
        optionName: "빨강",
        spec: "6W",
        unit: "EA",
        currentStock: 700,
        availableStock: 700,
        price: 15.4,
        locationInfo: "A구역"
      },
      {
        itemCd: "000003",
        itemNm: "삼정전원 6W 주력직",
        optionCode: "1-G(초록)",
        optionName: "초록",
        spec: "6W",
        unit: "EA", 
        currentStock: 330,
        availableStock: 330,
        price: 15.4,
        locationInfo: "B구역"
      }
    ],
    serial: [
      {
        itemCd: "000001",
        itemNm: "TFR-CV 3C 6SQ (실버)",
        serialNo: "2-도료/Z1 04 13:07:22",
        lotNo: "LOT001",
        spec: "3C 6SQ",
        unit: "M",
        currentStock: 1000,
        availableStock: 1000,
        manufactureDate: "2023-08-15",
        expiryDate: "2025-08-15",
        locationInfo: "창고A/1층/001"
      },
      {
        itemCd: "000001",
        itemNm: "TFR-CV 3C 6SQ (실버)", 
        serialNo: "2-도료/Z1 11 09:19:04",
        lotNo: "LOT002",
        spec: "3C 6SQ",
        unit: "M",
        currentStock: 1400,
        availableStock: 1400,
        manufactureDate: "2023-08-20", 
        expiryDate: "2025-08-20",
        locationInfo: "창고A/1층/002"
      },
      {
        itemCd: "000002",
        itemNm: "TFR-CV 3C 6SQ (골드)",
        serialNo: "2-도료/Z1 11 10:17:16",
        lotNo: "LOT003",
        spec: "3C 6SQ",
        unit: "M",
        currentStock: 900,
        availableStock: 900,
        manufactureDate: "2023-08-25",
        expiryDate: "2025-08-25", 
        locationInfo: "창고A/2층/001"
      }
    ]

}),[]);

// 제품코드별 그룹화 함수
const getGroupedData = useMemo(() => {
  const data = sampleData[activeTab] || [];
  const grouped = {};
  
  data.forEach(item => {
    if (!grouped[item.itemCd]) {
      grouped[item.itemCd] = {
        items: [],
        totals: {
          currentStock: 0,
          availableStock: 0,
          purchaseQty: 0,
          locationQty: 0,
          shortageQty: 0
        }
      };
    }
    
    grouped[item.itemCd].items.push(item);
    grouped[item.itemCd].totals.currentStock += item.currentStock || 0;
    grouped[item.itemCd].totals.availableStock += item.availableStock || 0;
    grouped[item.itemCd].totals.purchaseQty += item.purchaseQty || 0;
    grouped[item.itemCd].totals.locationQty += item.locationQty || 0;
    grouped[item.itemCd].totals.shortageQty += item.shortageQty || 0;
  });
  
  return grouped;
}, [sampleData, activeTab]);

  // 페이지네이션 계산
  const { currentItems, totalPages, startIndex, endIndex } = useMemo(() => {
    const data = sampleData[activeTab] || [];
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const currentItems = data.slice(startIdx, endIdx);
    const totalPages = Math.ceil(data.length / itemsPerPage);
    
    return {
      currentItems,
      totalPages,
      startIndex: startIdx + 1,
      endIndex: Math.min(endIdx, data.length)
    };
  }, [activeTab, currentPage, itemsPerPage]);

  // 탭 변경 시 페이지 초기화
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // 검색 초기화
  const handleReset = () => {
    setItemName('');
    setCurrentPage(1);
  };

  // 커스텀 훅을 사용한 데이터 조회
  const fetchData = useCallback(async () => {
    try {
      // 검색 파라미터 설정
      const searchParams = {
        itemName: itemName.trim(),
        page: currentPage,
        pageSize: itemsPerPage
      };
      
      let response;
      // 탭에 따른 적절한 API 호출
      switch (activeTab) {
        case 'normal':
          response = await getNormalInventory(searchParams);
          break;
        case 'option':
          response = await getOptionInventory(searchParams);
          break;
        case 'serial':
          response = await getSerialInventory(searchParams);
          break;
        default:
          response = await getNormalInventory(searchParams);
      }
      
      // API 응답 처리
      if (response && response.data) {
        setGridData(response.data);
      } else {
        // API 응답이 비어있으면 기존 샘플 데이터 사용
        setGridData(sampleData[activeTab] || []);
      }

    } catch (error) {
      console.error('데이터 조회 실패:', error);
      
      // API 에러 발생 시 기존 샘플 데이터를 fallback으로 사용
      setGridData(sampleData[activeTab] || []);
      
      // 에러 메시지 표시 (원하는 경우 주석 해제)
      // setIsModalOpen(true);
      // setModalMessage(`데이터 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }, [activeTab, itemName, currentPage, itemsPerPage, getNormalInventory, getOptionInventory, getSerialInventory, sampleData]);

  // 검색 버튼 클릭
  const handleSearch = () => {
    fetchData();
  };

  // 탭 변경 시 데이터 새로고침
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 행 클릭 처리
  const handleRowClick = (item) => {
    console.log('선택된 아이템:', item);
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

  // 일반 재고 테이블
const renderNormalInventory = () => {
  const groupedData = getGroupedData;
  const rows = [];
  
  Object.entries(groupedData).forEach(([itemCd, group]) => {
    // 개별 행들 추가
    group.items.forEach((row, index) => {
      rows.push(
        <tr key={`${row.itemCd}-${index}`} onClick={() => handleRowClick(row)}>
          <td className="cust0010-center">{row.itemCd}</td>
          <td className="cust0010-left">{row.itemNm}</td>
          <td className="cust0010-center">{row.spec}</td>
          <td className="cust0010-center">{row.unit}</td>
          <td className="cust0010-right">{row.currentStock.toLocaleString()}</td>
          <td className="cust0010-right">{row.availableStock.toLocaleString()}</td>
          <td className="cust0010-right">{row.purchaseQty.toLocaleString()}</td>
          <td className="cust0010-right">{row.locationQty.toLocaleString()}</td>
          <td className="cust0010-right">{row.shortageQty.toLocaleString()}</td>
        </tr>
      );
    });
    
    // 합계 행 추가 (2개 이상의 항목이 있을 때만)
    if (group.items.length > 1) {
      rows.push(
        <tr key={`${itemCd}-subtotal`} className="cust0010-subtotal-row">
          <td 
            colSpan={2} 
            className="cust0010-center" 
            style={{ fontWeight: 'bold', backgroundColor: '#f0f9ff' }}
          >
            {itemCd} : {group.items[0].itemNm} 계
          </td>
          <td className="cust0010-center" style={{ backgroundColor: '#f0f9ff' }}>-</td>
          <td className="cust0010-center" style={{ backgroundColor: '#f0f9ff' }}>-</td>
          <td className="cust0010-right" style={{ fontWeight: 'bold', backgroundColor: '#f0f9ff' }}>
            {group.totals.currentStock.toLocaleString()}
          </td>
          <td className="cust0010-right" style={{ fontWeight: 'bold', backgroundColor: '#f0f9ff' }}>
            {group.totals.availableStock.toLocaleString()}
          </td>
          <td className="cust0010-right" style={{ fontWeight: 'bold', backgroundColor: '#f0f9ff' }}>
            {group.totals.purchaseQty.toLocaleString()}
          </td>
          <td className="cust0010-right" style={{ fontWeight: 'bold', backgroundColor: '#f0f9ff' }}>
            {group.totals.locationQty.toLocaleString()}
          </td>
          <td className="cust0010-right" style={{ fontWeight: 'bold', backgroundColor: '#f0f9ff' }}>
            {group.totals.shortageQty.toLocaleString()}
          </td>
        </tr>
      );
    }
  });

  return (
    <div className="cust0010-table-container">
      <table className="cust0010-table">
        <thead>
          <tr>
            <th style={{ width: '120px' }}>제품코드</th>
            <th>품목명</th>
            <th style={{ width: '100px' }}>규격</th>
            <th style={{ width: '60px' }}>단위</th>
            <th style={{ width: '80px' }}>현재고</th>
            <th style={{ width: '80px' }}>가용수량</th>
            <th style={{ width: '80px' }}>구매량</th>
            <th style={{ width: '80px' }}>위치량</th>
            <th style={{ width: '80px' }}>할당부족</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  );
};

  // 옵션 재고 테이블
const renderOptionInventory = () => {
  const groupedData = getGroupedData;
  const rows = [];
  
  Object.entries(groupedData).forEach(([itemCd, group]) => {
    // 개별 행들 추가
    group.items.forEach((row, index) => {
      rows.push(
        <tr key={`${row.itemCd}-${row.optionCode}-${index}`} onClick={() => handleRowClick(row)}>
          <td className="cust0010-center">{row.itemCd}</td>
          <td className="cust0010-left">{row.itemNm}</td>
          <td className="cust0010-center">{row.optionCode}</td>
          <td className="cust0010-center">{row.optionName}</td>
          <td className="cust0010-center">{row.unit}</td>
          <td className="cust0010-right">{row.currentStock.toLocaleString()}</td>
          <td className="cust0010-right">{row.availableStock.toLocaleString()}</td>
          <td className="cust0010-right">{row.price}</td>
          <td className="cust0010-center">{row.locationInfo}</td>
        </tr>
      );
    });
    
    // 합계 행 추가 (2개 이상의 항목이 있을 때만)
    if (group.items.length > 1) {
      rows.push(
        <tr key={`${itemCd}-subtotal`} className="cust0010-subtotal-row">
          <td 
            colSpan={2} 
            className="cust0010-center" 
            style={{ fontWeight: 'bold', backgroundColor: '#f0f9ff' }}
          >
            {itemCd} : {group.items[0].itemNm} 계
          </td>
          <td className="cust0010-center" style={{ backgroundColor: '#f0f9ff' }}>-</td>
          <td className="cust0010-center" style={{ backgroundColor: '#f0f9ff' }}>-</td>
          <td className="cust0010-center" style={{ backgroundColor: '#f0f9ff' }}>-</td>
          <td className="cust0010-right" style={{ fontWeight: 'bold', backgroundColor: '#f0f9ff' }}>
            {group.totals.currentStock.toLocaleString()}
          </td>
          <td className="cust0010-right" style={{ fontWeight: 'bold', backgroundColor: '#f0f9ff' }}>
            {group.totals.availableStock.toLocaleString()}
          </td>
          <td className="cust0010-center" style={{ backgroundColor: '#f0f9ff' }}>-</td>
          <td className="cust0010-center" style={{ backgroundColor: '#f0f9ff' }}>-</td>
        </tr>
      );
    }
  });

  return (
    <div className="cust0010-table-container">
      <table className="cust0010-table">
        <thead>
          <tr>
            <th style={{ width: '120px' }}>제품코드</th>
            <th>품목명</th>
            <th style={{ width: '120px' }}>옵션코드</th>
            <th style={{ width: '100px' }}>옵션명</th>
            <th style={{ width: '60px' }}>단위</th>
            <th style={{ width: '80px' }}>현재고</th>
            <th style={{ width: '80px' }}>가용수량</th>
            <th style={{ width: '80px' }}>단가</th>
            <th style={{ width: '120px' }}>위치정보</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  );
};

  // 시리얼/로트 재고 테이블
const renderSerialInventory = () => {
  const groupedData = getGroupedData;
  const rows = [];
  
  Object.entries(groupedData).forEach(([itemCd, group]) => {
    // 개별 행들 추가
    group.items.forEach((row, index) => {
      rows.push(
        <tr key={`${row.itemCd}-${row.serialNo}-${index}`} onClick={() => handleRowClick(row)}>
          <td className="cust0010-center">{row.itemCd}</td>
          <td className="cust0010-left">{row.itemNm}</td>
          <td className="cust0010-center">{row.serialNo}</td>
          <td className="cust0010-center">{row.lotNo}</td>
          <td className="cust0010-center">{row.unit}</td>
          <td className="cust0010-right">{row.currentStock.toLocaleString()}</td>
          <td className="cust0010-right">{row.availableStock.toLocaleString()}</td>
          <td className="cust0010-center">{row.manufactureDate}</td>
          <td className="cust0010-center">{row.expiryDate}</td>
          <td className="cust0010-center">{row.locationInfo}</td>
        </tr>
      );
    });
    
    // 합계 행 추가 (2개 이상의 항목이 있을 때만)
    if (group.items.length > 1) {
      rows.push(
        <tr key={`${itemCd}-subtotal`} className="cust0010-subtotal-row">
          <td 
            colSpan={2} 
            className="cust0010-center" 
            style={{ fontWeight: 'bold', backgroundColor: '#f0f9ff' }}
          >
            {itemCd} : {group.items[0].itemNm} 계
          </td>
          <td className="cust0010-center" style={{ backgroundColor: '#f0f9ff' }}>-</td>
          <td className="cust0010-center" style={{ backgroundColor: '#f0f9ff' }}>-</td>
          <td className="cust0010-center" style={{ backgroundColor: '#f0f9ff' }}>-</td>
          <td className="cust0010-right" style={{ fontWeight: 'bold', backgroundColor: '#f0f9ff' }}>
            {group.totals.currentStock.toLocaleString()}
          </td>
          <td className="cust0010-right" style={{ fontWeight: 'bold', backgroundColor: '#f0f9ff' }}>
            {group.totals.availableStock.toLocaleString()}
          </td>
          <td className="cust0010-center" style={{ backgroundColor: '#f0f9ff' }}>-</td>
          <td className="cust0010-center" style={{ backgroundColor: '#f0f9ff' }}>-</td>
          <td className="cust0010-center" style={{ backgroundColor: '#f0f9ff' }}>-</td>
        </tr>
      );
    }
  });

  return (
    <div className="cust0010-table-container">
      <table className="cust0010-table">
        <thead>
          <tr>
            <th style={{ width: '120px' }}>제품코드</th>
            <th>품목명</th>
            <th style={{ width: '150px' }}>시리얼번호</th>
            <th style={{ width: '80px' }}>로트번호</th>
            <th style={{ width: '60px' }}>단위</th>
            <th style={{ width: '80px' }}>현재고</th>
            <th style={{ width: '80px' }}>가용수량</th>
            <th style={{ width: '100px' }}>제조일자</th>
            <th style={{ width: '100px' }}>유통기한</th>
            <th style={{ width: '120px' }}>위치정보</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  );
};

  // 현재 탭에 따른 테이블 렌더링
  const renderCurrentTable = () => {
    switch (activeTab) {
      case 'normal':
        return renderNormalInventory();
      case 'option':
        return renderOptionInventory();
      case 'serial':
        return renderSerialInventory();
      default:
        return renderNormalInventory();
    }
  };

  return (
    <div className="cust0010-container">
      {/* 프로그램 헤더 */}
      <div className="cust0010-program-header">
        <div className="cust0010-header-left">
          <Package2 className="w-6 h-6" />
          <h1>{currentMenuTitle || '재고현황 관리'}</h1>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="cust0010-tab-container">
        <button
          className={`cust0010-tab ${activeTab === 'normal' ? 'active' : ''}`}
          onClick={() => handleTabChange('normal')}
        >
          <Package2 size={16} />
          일반재고
        </button>
        <button
          className={`cust0010-tab ${activeTab === 'option' ? 'active' : ''}`}
          onClick={() => handleTabChange('option')}
        >
          <Archive size={16} />
          옵션재고현황
        </button>
        <button
          className={`cust0010-tab ${activeTab === 'serial' ? 'active' : ''}`}
          onClick={() => handleTabChange('serial')}
        >
          <Hash size={16} />
          시리얼/로트No. 재고현황
        </button>
      </div>

      {/* 검색 영역 */}
      <div className="cust0010-search-container">
        <div className="cust0010-search-row">
          <div className="cust0010-search-field">
            <label>제품명</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="제품명 입력"
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

      {/* 페이지네이션 정보 및 설정 */}
      <div className="cust0010-pagination-info">
        <div className="cust0010-data-info">
          전체 {(sampleData[activeTab] || []).length.toLocaleString()}건 중 {(sampleData[activeTab] || []).length > 0 ? startIndex.toLocaleString() : 0}-{endIndex.toLocaleString()}건 표시
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

      {/* 모달 */}
      <Modal
        isOpen={isModalOpen}
        title="알림"
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default CUST0010;