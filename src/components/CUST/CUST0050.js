/**
 * CUST0050: 보관이용정산 React 컴포넌트
 * 
 * 주요 기능:
 * - 계약기간 정보 표시
 * - 월 계약금액 표시
 * - 월별 비용 정산 현황표
 * - 계약변경이력
 */
import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, FileText, History } from 'lucide-react';
import { useMenu } from '../../context/MenuContext';
import { useAuth } from '../../context/AuthContext';
import MySpinner from '../common/MySpinner';
import Modal from '../common/Modal';
import './CUST0050.css';

function CUST0050() {
  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  const { currentMenuTitle } = useMenu();
  const { globalState } = useAuth();

  // 샘플 데이터
  const [contractInfo, setContractInfo] = useState({
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    monthlyAmount: 500000
  });

  const [settlementData, setSettlementData] = useState([
    {
      month: '2025.04',
      basicFee: 500000,
      variableAmount: 0,
      discountAmount: 0,
      depositAmount: 500000,
      depositDate: '2025.04.30',
      balance: 0
    },
    {
      month: '2025.05',
      basicFee: 500000,
      variableAmount: 0,
      discountAmount: 0,
      depositAmount: 0,
      depositDate: '-',
      balance: 500000
    },
    {
      month: '2025.06',
      basicFee: 500000,
      variableAmount: 50000,
      discountAmount: 50000,
      depositAmount: 0,
      depositDate: '-',
      balance: 500000
    },
    {
      month: '2025.07',
      basicFee: 500000,
      variableAmount: 0,
      discountAmount: 0,
      depositAmount: 250000,
      depositDate: '2025.07.15',
      balance: 250000
    }
  ]);

  const [contractHistory, setContractHistory] = useState([
    {
      changeDate: '2025-01-01',
      changeType: '신규계약',
      changeContent: '월 계약금액: 500,000원',
      changeBy: '홍길동'
    },
    {
      changeDate: '2025-06-01',
      changeType: '금액변경',
      changeContent: '할인 적용: 50,000원',
      changeBy: '김철수'
    }
  ]);

  /**
   * 숫자를 천단위 구분 형식으로 변환
   */
  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  /**
   * 날짜 포맷팅
   */
  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-';
    return dateString;
  };

  /**
   * 합계 계산
   */
  const calculateTotals = () => {
    return settlementData.reduce((acc, item) => {
      acc.basicFee += item.basicFee || 0;
      acc.variableAmount += item.variableAmount || 0;
      acc.discountAmount += item.discountAmount || 0;
      acc.depositAmount += item.depositAmount || 0;
      acc.balance += item.balance || 0;
      return acc;
    }, {
      basicFee: 0,
      variableAmount: 0,
      discountAmount: 0,
      depositAmount: 0,
      balance: 0
    });
  };

  const totals = calculateTotals();

  return (
    <div className="cust0050-container">
      <div className="cust0050-content-wrapper">
        {/* 프로그램 헤더 */}
        <div className="cust0050-program-header">
        <div className="cust0050-header-left">
          <DollarSign />
          <h1>{currentMenuTitle || '(샘플)보관이용정산'}</h1>
        </div>
      </div>

      {/* 1. 계약기간 정보 */}
      <div className="cust0050-section">
        <div className="cust0050-section-header">
          <Calendar size={20} />
          <h2>계약기간</h2>
        </div>
        <div className="cust0050-contract-period">
          <div className="cust0050-period-item">
            <span className="cust0050-period-label">시작일:</span>
            <span className="cust0050-period-value">{contractInfo.startDate}</span>
          </div>
          <span className="cust0050-period-divider">~</span>
          <div className="cust0050-period-item">
            <span className="cust0050-period-label">종료일:</span>
            <span className="cust0050-period-value">{contractInfo.endDate}</span>
          </div>
        </div>
      </div>

      {/* 2. 월 계약금액 */}
      <div className="cust0050-section">
        <div className="cust0050-section-header">
          <DollarSign size={20} />
          <h2>월 계약금액</h2>
        </div>
        <div className="cust0050-monthly-amount">
          <span className="cust0050-amount-value">
            {formatAmount(contractInfo.monthlyAmount)} 원
          </span>
        </div>
      </div>

      {/* 3. 월별 비용 정산 현황표 */}
      <div className="cust0050-section">
        <div className="cust0050-section-header">
          <FileText size={20} />
          <h2>월별 비용 정산 현황</h2>
        </div>
        <div className="cust0050-table-container">
          <table className="cust0050-table">
            <thead>
              <tr>
                <th>월별</th>
                <th>기본료</th>
                <th>변동금액</th>
                <th>할인금액</th>
                <th>입금금액</th>
                <th>입금일자</th>
                <th>잔액</th>
              </tr>
            </thead>
            <tbody>
              {settlementData.map((row, index) => (
                <tr key={index}>
                  <td className="cust0050-center">{row.month}</td>
                  <td className="cust0050-right">{formatAmount(row.basicFee)}</td>
                  <td className="cust0050-right">{formatAmount(row.variableAmount)}</td>
                  <td className="cust0050-right">{formatAmount(row.discountAmount)}</td>
                  <td className="cust0050-right">{formatAmount(row.depositAmount)}</td>
                  <td className="cust0050-center">{formatDate(row.depositDate)}</td>
                  <td className="cust0050-right cust0050-balance">
                    {formatAmount(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="cust0050-total-row">
                <td className="cust0050-center">합계</td>
                <td className="cust0050-right">{formatAmount(totals.basicFee)}</td>
                <td className="cust0050-right">{formatAmount(totals.variableAmount)}</td>
                <td className="cust0050-right">{formatAmount(totals.discountAmount)}</td>
                <td className="cust0050-right">{formatAmount(totals.depositAmount)}</td>
                <td className="cust0050-center">-</td>
                <td className="cust0050-right cust0050-balance">
                  {formatAmount(totals.balance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4. 계약변경이력 */}
      <div className="cust0050-section">
        <div className="cust0050-section-header">
          <History size={20} />
          <h2>계약변경이력</h2>
        </div>
        <div className="cust0050-table-container">
          <table className="cust0050-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>변경일자</th>
                <th style={{ width: '120px' }}>변경유형</th>
                <th>변경내용</th>
                <th style={{ width: '100px' }}>변경자</th>
              </tr>
            </thead>
            <tbody>
              {contractHistory.length > 0 ? (
                contractHistory.map((row, index) => (
                  <tr key={index}>
                    <td className="cust0050-center">{row.changeDate}</td>
                    <td className="cust0050-center">
                      <span className={`cust0050-change-badge ${row.changeType === '신규계약' ? 'new' : 'modify'}`}>
                        {row.changeType}
                      </span>
                    </td>
                    <td className="cust0050-left">{row.changeContent}</td>
                    <td className="cust0050-center">{row.changeBy}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="cust0050-center" style={{ padding: '40px', color: '#666' }}>
                    변경이력이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 로딩 및 모달 */}
      {loading && <MySpinner />}
      <Modal 
        isOpen={isModalOpen} 
        title="알림" 
        message={modalMessage} 
        onConfirm={() => setIsModalOpen(false)} 
      />
      </div>
    </div>
  );
}

export default CUST0050;
