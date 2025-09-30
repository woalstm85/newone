/**
 * TableSkeleton.js - 테이블 로딩 스켈레톤
 * 
 * 주요 기능:
 * 1. 데이터 로딩 중 테이블 구조 미리보기
 * 2. 동적인 컬럼 및 행 개수 지원
 * 3. react-loading-skeleton 라이브러리 사용
 * 
 * Props:
 * - columns: 컬럼 정의 배열 (각 항목에 Header, style 포함)
 * - rows: 표시할 행 개수 (기본값: 10)
 * 
 * columns 구조:
 * [
 *   { Header: '제품코드', style: { width: '120px' } },
 *   { Header: '제품명', style: { width: '200px' } },
 *   ...
 * ]
 * 
 * 사용 예:
 * {loading ? (
 *   <TableSkeleton 
 *     columns={tableColumns} 
 *     rows={10} 
 *   />
 * ) : (
 *   <Table data={data} />
 * )}
 */

import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function TableSkeleton({ columns, rows = 10 }) {

  /**
   * 스켈레톤 행 생성
   * 지정된 rows 개수만큼 행을 생성하고
   * 각 행은 columns 개수만큼 셀을 포함
   */
  const skeletonRows = Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={rowIndex}>
      {columns.map((_, colIndex) => (
        <td key={colIndex}>
          <Skeleton height={20} />
        </td>
      ))}
    </tr>
  ));

  return (
    <SkeletonTheme baseColor="#e9ecef" highlightColor="#f8f9fa">
      <table className="cust0010-table">
        <thead>
          <tr>
            {/* 전달받은 columns 정보로 헤더 동적 생성 */}
            {columns.map((col, index) => (
              <th key={index} style={col.style}>
                {col.Header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skeletonRows}
        </tbody>
      </table>
    </SkeletonTheme>
  );
}

export default TableSkeleton;
