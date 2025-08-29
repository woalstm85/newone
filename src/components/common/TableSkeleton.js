import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// ✨ columns와 rows를 props로 받도록 변경 (rows는 기본값 10으로 설정)
function TableSkeleton({ columns, rows = 10 }) {

  // ✨ 전달받은 rows 개수만큼 스켈레톤 행 생성
  const skeletonRows = Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={rowIndex}>
      {/* ✨ 전달받은 columns 개수만큼 스켈레톤 셀 생성 */}
      {columns.map((_, colIndex) => (
        <td key={colIndex}><Skeleton height={20} /></td>
      ))}
    </tr>
  ));

  return (
    <SkeletonTheme baseColor="#e9ecef" highlightColor="#f8f9fa">
      {/* cust0010-table 클래스는 그대로 사용하거나 더 범용적인 이름으로 변경 가능 */}
      <table className="cust0010-table">
        <thead>
          <tr>
            {/* ✨ 전달받은 columns 정보로 헤더를 동적으로 생성 */}
            {columns.map((col, index) => (
              <th key={index} style={col.style}>{col.Header}</th>
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