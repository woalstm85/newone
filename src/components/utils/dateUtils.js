/**
 * dateUtils.js - 날짜 관련 유틸리티 함수
 * 
 * 주요 기능:
 * 1. 날짜 포맷 변환 (Date ↔ String)
 * 2. 날짜 범위 계산 (오늘, 당월, 전월, 올해)
 * 3. input[type="date"]용 날짜 포맷팅
 * 
 * 날짜 형식:
 * - dateString: YYYYMMDD (8자리 숫자)
 * - 화면 표시: YYYY.MM.DD
 * - input value: YYYY-MM-DD
 */

/**
 * Date 객체를 YYYYMMDD 문자열로 변환
 * 
 * @param {Date} date - 변환할 Date 객체
 * @returns {string} YYYYMMDD 형식의 날짜 문자열
 * 
 * 사용 예:
 * formatDateString(new Date('2025-09-30')) => '20250930'
 */
export const formatDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * YYYYMMDD 문자열을 input[type="date"]용 YYYY-MM-DD로 변환
 * 
 * @param {string} dateString - YYYYMMDD 형식의 날짜 문자열
 * @returns {string} YYYY-MM-DD 형식의 날짜 문자열 (input value용)
 * 
 * 사용 예:
 * formatDateToInputValue('20250930') => '2025-09-30'
 */
export const formatDateToInputValue = (dateString) => {
  if (!dateString || dateString.length !== 8) return '';
  return `${dateString.substring(0,4)}-${dateString.substring(4,6)}-${dateString.substring(6,8)}`;
};

/**
 * YYYYMMDD 문자열을 화면 표시용 YYYY.MM.DD로 변환
 * 
 * @param {string} dateString - YYYYMMDD 형식의 날짜 문자열
 * @returns {string} YYYY.MM.DD 형식의 날짜 문자열 (화면 표시용)
 * 
 * 사용 예:
 * formatDate('20250930') => '2025.09.30'
 */
export const formatDate = (dateString) => {
  if (!dateString || dateString.length !== 8) return '';
  try {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${year}.${month}.${day}`;
  } catch {
    return '';
  }
};

/**
 * 당월 1일 날짜 구하기
 * 
 * @returns {string} 당월 1일의 YYYYMMDD 형식 문자열
 * 
 * 사용 예:
 * getFirstDayOfMonth() => '20250901' (2025년 9월 기준)
 */
export const getFirstDayOfMonth = () => {
  const date = new Date();
  return formatDateString(new Date(date.getFullYear(), date.getMonth(), 1));
};

/**
 * 빠른 날짜 범위 설정
 * 미리 정의된 기간별 시작일/종료일 반환
 * 
 * @param {string} type - 날짜 범위 타입
 *   - 'today': 오늘
 *   - 'month': 당월 (1일 ~ 오늘)
 *   - 'prevmonth': 전월 (전월 1일 ~ 전월 말일)
 *   - 'year': 올해 (1월 1일 ~ 12월 31일)
 * @returns {Object} { startDate, endDate } - YYYYMMDD 형식
 * 
 * 사용 예:
 * getDateRange('month') => { startDate: '20250901', endDate: '20250930' }
 */
export const getDateRange = (type) => {
  const today = new Date();
  let startDate, endDate;

  switch(type) {
    case 'today':
      // 오늘
      startDate = formatDateString(today);
      endDate = formatDateString(today);
      break;
      
    case 'month':
      // 당월 (1일 ~ 오늘)
      startDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}01`;
      endDate = formatDateString(today);
      break;
      
    case 'prevmonth':
      // 전월 (전월 1일 ~ 전월 말일)
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      startDate = formatDateString(prevMonth);
      endDate = formatDateString(new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0));
      break;
      
    case 'year':
      // 올해 (1월 1일 ~ 12월 31일)
      startDate = `${today.getFullYear()}0101`;
      endDate = `${today.getFullYear()}1231`;
      break;
      
    default:
      // 기본값: 오늘
      startDate = formatDateString(today);
      endDate = formatDateString(today);
  }

  return { startDate, endDate };
};
