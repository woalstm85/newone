// 견적 데이터 생성 유틸리티
export const generateQuoteData = () => {
  const companies = [
    '㈜대한건설', '㈜삼성전자', '㈜현대중공업', '㈜LG화학', '㈜포스코',
    '㈜SK하이닉스', '㈜한화시스템', '㈜두산중공업', '㈜GS건설', '㈜대우조선해양',
    '㈜롯데케미칼', '㈜금호타이어', '㈜효성', '㈜코오롱', '㈜태영건설',
    '㈜대림산업', '㈜쌍용건설', '㈜현대건설', '㈜삼성물산', '㈜SK건설'
  ];

  const contacts = [
    '김철수', '이미영', '정대수', '최윤정', '박민호',
    '장수연', '오세진', '한지영', '문태호', '권영미',
    '임도현', '배서연', '조현우', '신유진', '강민석',
    '송하늘', '유정훈', '윤서아', '홍태영', '서미나'
  ];

  const products = [
    { itemCd: '001846', itemNm: '프리미엄 스테인리스 볼트', basePrice: 25000 },
    { itemCd: '001828', itemNm: '산업용 알루미늄 프로파일', basePrice: 180000 },
    { itemCd: '001210', itemNm: '특수강 가공품', basePrice: 850000 },
    { itemCd: '000633', itemNm: '고강도 카본 파이버', basePrice: 1200000 },
    { itemCd: '000592', itemNm: '정밀 베어링 세트', basePrice: 450000 },
    { itemCd: '001838', itemNm: '산업용 센서 모듈', basePrice: 320000 },
    { itemCd: '001826', itemNm: '고성능 모터 드라이브', basePrice: 680000 },
    { itemCd: '000641', itemNm: '내열성 세라믹 부품', basePrice: 520000 },
    { itemCd: '000622', itemNm: '초경량 복합소재', basePrice: 890000 },
    { itemCd: '000569', itemNm: '고정밀 가공 툴', basePrice: 750000 }
  ];

  const statuses = [
    { name: '대기중', color: '#ffc107', weight: 0.3 },
    { name: '검토중', color: '#17a2b8', weight: 0.25 },
    { name: '승인됨', color: '#28a745', weight: 0.25 },
    { name: '거절됨', color: '#dc3545', weight: 0.2 }
  ];

  const quotes = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-09-05');

  for (let i = 1; i <= 50; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const contact = contacts[Math.floor(Math.random() * contacts.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    
    // 가중치를 고려한 상태 선택
    const random = Math.random();
    let cumulativeWeight = 0;
    let selectedStatus = statuses[0];
    
    for (const status of statuses) {
      cumulativeWeight += status.weight;
      if (random <= cumulativeWeight) {
        selectedStatus = status;
        break;
      }
    }

    const requestDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    const quantity = Math.floor(Math.random() * 1000) + 50;
    const unitPrice = product.basePrice + (Math.random() * 100000 - 50000);
    const subtotal = Math.floor(quantity * unitPrice);
    const discountRate = Math.floor(Math.random() * 10);
    const discountAmount = Math.floor(subtotal * discountRate / 100);
    const taxAmount = Math.floor((subtotal - discountAmount) * 0.1);
    const shippingCost = Math.floor(Math.random() * 500000);
    const totalAmount = subtotal - discountAmount + taxAmount + shippingCost;

    // 히스토리 생성
    const history = [
      {
        action: '견적 요청',
        date: requestDate.toISOString(),
        user: contact,
        comment: '신규 견적 요청'
      }
    ];

    if (selectedStatus.name !== '대기중') {
      const responseDate = new Date(requestDate.getTime() + Math.random() * 86400000 * 3); // 0-3일 후
      history.push({
        action: '견적 검토 시작',
        date: responseDate.toISOString(),
        user: '박영희',
        comment: '견적 검토를 시작합니다'
      });

      if (selectedStatus.name === '승인됨') {
        const approvalDate = new Date(responseDate.getTime() + Math.random() * 86400000 * 2); // 0-2일 후
        history.push({
          action: '견적 승인',
          date: approvalDate.toISOString(),
          user: '박영희',
          comment: '견적이 승인되었습니다'
        });
      } else if (selectedStatus.name === '거절됨') {
        const rejectionDate = new Date(responseDate.getTime() + Math.random() * 86400000 * 2);
        history.push({
          action: '견적 거절',
          date: rejectionDate.toISOString(),
          user: '박영희',
          comment: '조건이 맞지 않아 견적을 거절합니다'
        });
      }
    }

    const quote = {
      quoteId: `QT-2024-${String(i).padStart(3, '0')}`,
      quoteNumber: `견적서-${requestDate.toISOString().slice(0, 10).replace(/-/g, '')}-${String(i).padStart(3, '0')}`,
      status: selectedStatus.name,
      statusColor: selectedStatus.color,
      requestDate: requestDate.toISOString(),
      responseDate: history.length > 1 ? history[1].date : null,
      validUntil: new Date(requestDate.getTime() + 86400000 * 14).toISOString(), // 14일 후
      product: {
        itemCd: product.itemCd,
        itemNm: product.itemNm,
        filePath: `/images/products/${product.itemCd}.jpg`,
        unitPrice: Math.floor(unitPrice),
        currency: 'KRW'
      },
      quantity,
      totalAmount,
      customerInfo: {
        companyName: company,
        contactPerson: contact,
        phone: `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        email: `${contact.toLowerCase()}@${company.replace(/㈜/, '').toLowerCase()}.co.kr`,
        address: `서울시 ${['강남구', '서초구', '종로구', '중구', '영등포구'][Math.floor(Math.random() * 5)]} ${Math.floor(Math.random() * 999) + 1}`,
        requestDate: new Date(requestDate.getTime() + Math.random() * 86400000 * 30).toISOString().slice(0, 10),
        notes: ['긴급 주문입니다.', '품질 검사서 포함 요청', '정확한 치수로 제작 필요', '품질 인증서 첨부 요청', ''][Math.floor(Math.random() * 5)]
      },
      supplierInfo: {
        companyName: '뉴원산업㈜',
        contactPerson: '박영희',
        phone: '02-555-1234',
        email: 'sales@newone.co.kr'
      },
      quoteDetails: {
        unitPrice: Math.floor(unitPrice),
        quantity,
        subtotal,
        discountRate,
        discountAmount,
        taxRate: 10,
        taxAmount,
        shippingCost,
        totalAmount,
        paymentTerms: ['선불 50%, 납품 후 50%', '월말 정산', '현금', '선불 30%, 납품 후 70%'][Math.floor(Math.random() * 4)],
        deliveryTerms: [`주문 후 ${Math.floor(Math.random() * 20) + 5}일`],
        warranty: [`제품 보증 ${Math.floor(Math.random() * 3) + 1}년`]
      },
      history
    };

    quotes.push(quote);
  }

  return quotes.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
};

export default { generateQuoteData };
