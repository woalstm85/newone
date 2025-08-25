
export const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };
  
  export const formatDateToInputValue = (dateString) => {
    if (!dateString || dateString.length !== 8) return '';
    return `${dateString.substring(0,4)}-${dateString.substring(4,6)}-${dateString.substring(6,8)}`;
  };
  
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
  
  // 당월 1일 구하는 함수
  export const getFirstDayOfMonth = () => {
    const date = new Date();
    return formatDateString(new Date(date.getFullYear(), date.getMonth(), 1));
  };
  
  // 빠른 날짜 설정을 위한 유틸 함수
  export const getDateRange = (type) => {
    const today = new Date();
    let startDate, endDate;
  
    switch(type) {
      case 'today':
        startDate = formatDateString(today);
        endDate = formatDateString(today);
        break;
      case 'month':
        startDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}01`;
        endDate = formatDateString(today);
        break;
      case 'prevmonth':
        const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        startDate = formatDateString(prevMonth);
        endDate = formatDateString(new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0));
        break;
      case 'year':
        startDate = `${today.getFullYear()}0101`;
        endDate = `${today.getFullYear()}1231`;
        break;
      default:
        startDate = formatDateString(today);
        endDate = formatDateString(today);
    }
  
    return { startDate, endDate };
  };