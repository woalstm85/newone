// PDF 생성 유틸리티 (jsPDF 라이브러리 사용)
export const generateQuotePDF = (quote) => {
  // jsPDF 라이브러리가 없는 경우 폴백 처리
  if (typeof window.jsPDF === 'undefined') {
    console.warn('jsPDF 라이브러리가 로드되지 않았습니다. HTML 템플릿으로 대체합니다.');
    return generateQuoteHTML(quote);
  }

  const { jsPDF } = window.jsPDF;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // 한글 폰트 설정 (웹폰트 또는 기본 폰트 사용)
  doc.setFont('helvetica');
  
  let y = 20;
  const lineHeight = 7;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // 제목
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('견적서', pageWidth / 2, y, { align: 'center' });
  y += lineHeight * 2;

  // 견적 기본 정보
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`견적번호: ${quote.quoteNumber}`, margin, y);
  doc.text(`발행일: ${new Date().toLocaleDateString('ko-KR')}`, pageWidth - margin, y, { align: 'right' });
  y += lineHeight;
  doc.text(`상태: ${quote.status}`, margin, y);
  doc.text(`유효기한: ${new Date(quote.validUntil).toLocaleDateString('ko-KR')}`, pageWidth - margin, y, { align: 'right' });
  y += lineHeight * 2;

  // 구분선
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += lineHeight;

  // 고객 정보
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('고객 정보', margin, y);
  y += lineHeight;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`회사명: ${quote.customerInfo.companyName}`, margin, y);
  y += lineHeight;
  doc.text(`담당자: ${quote.customerInfo.contactPerson}`, margin, y);
  y += lineHeight;
  doc.text(`연락처: ${quote.customerInfo.phone}`, margin, y);
  y += lineHeight;
  doc.text(`이메일: ${quote.customerInfo.email}`, margin, y);
  y += lineHeight;
  doc.text(`주소: ${quote.customerInfo.address}`, margin, y);
  y += lineHeight * 2;

  // 상품 정보
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('상품 정보', margin, y);
  y += lineHeight;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`상품명: ${quote.product.itemNm}`, margin, y);
  y += lineHeight;
  doc.text(`상품코드: ${quote.product.itemCd}`, margin, y);
  y += lineHeight;
  doc.text(`단가: ${quote.product.unitPrice.toLocaleString()}원`, margin, y);
  y += lineHeight;
  doc.text(`수량: ${quote.quantity.toLocaleString()}개`, margin, y);
  y += lineHeight * 2;

  // 견적 상세 - 간단한 테이블 형태
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('견적 상세', margin, y);
  y += lineHeight;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const details = [
    ['소계', `${quote.quoteDetails.subtotal.toLocaleString()}원`],
    [`할인 (${quote.quoteDetails.discountRate}%)`, `-${quote.quoteDetails.discountAmount.toLocaleString()}원`],
    [`부가세 (${quote.quoteDetails.taxRate}%)`, `${quote.quoteDetails.taxAmount.toLocaleString()}원`],
    ['배송비', `${quote.quoteDetails.shippingCost.toLocaleString()}원`]
  ];

  details.forEach(([label, value]) => {
    doc.text(label, margin, y);
    doc.text(value, pageWidth - margin, y, { align: 'right' });
    y += lineHeight;
  });

  // 총 금액
  y += lineHeight;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('총 금액', margin, y);
  doc.text(`${quote.quoteDetails.totalAmount.toLocaleString()}원`, pageWidth - margin, y, { align: 'right' });
  y += lineHeight * 2;

  // 거래 조건
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('거래 조건', margin, y);
  y += lineHeight;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`결제 조건: ${quote.quoteDetails.paymentTerms}`, margin, y);
  y += lineHeight;
  doc.text(`납품 조건: ${quote.quoteDetails.deliveryTerms}`, margin, y);
  y += lineHeight;
  doc.text(`보증 조건: ${quote.quoteDetails.warranty}`, margin, y);
  y += lineHeight * 2;

  // 공급업체 정보
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('공급업체 정보', margin, y);
  y += lineHeight;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`회사명: ${quote.supplierInfo.companyName}`, margin, y);
  y += lineHeight;
  doc.text(`담당자: ${quote.supplierInfo.contactPerson}`, margin, y);
  y += lineHeight;
  doc.text(`연락처: ${quote.supplierInfo.phone}`, margin, y);
  y += lineHeight;
  doc.text(`이메일: ${quote.supplierInfo.email}`, margin, y);

  // PDF 저장
  doc.save(`${quote.quoteNumber}.pdf`);
};

// HTML 템플릿으로 견적서 생성 (PDF 라이브러리가 없을 때 사용)
export const generateQuoteHTML = (quote) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${quote.quoteNumber}</title>
      <style>
        body {
          font-family: 'Malgun Gothic', Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin: 0;
        }
        .quote-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .info-item {
          display: flex;
          gap: 10px;
        }
        .info-label {
          font-weight: bold;
          color: #64748b;
          min-width: 80px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .table th,
        .table td {
          border: 1px solid #e2e8f0;
          padding: 12px;
          text-align: left;
        }
        .table th {
          background: #f1f5f9;
          font-weight: bold;
        }
        .table .amount {
          text-align: right;
        }
        .total-row {
          background: #eff6ff;
          font-weight: bold;
          font-size: 16px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #64748b;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">견적서</h1>
        </div>

        <div class="quote-info">
          <div>
            <strong>견적번호:</strong> ${quote.quoteNumber}<br>
            <strong>상태:</strong> <span style="color: ${quote.statusColor}">${quote.status}</span>
          </div>
          <div>
            <strong>발행일:</strong> ${new Date().toLocaleDateString('ko-KR')}<br>
            <strong>유효기한:</strong> ${new Date(quote.validUntil).toLocaleDateString('ko-KR')}
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">고객 정보</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">회사명:</span>
              <span>${quote.customerInfo.companyName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">담당자:</span>
              <span>${quote.customerInfo.contactPerson}</span>
            </div>
            <div class="info-item">
              <span class="info-label">연락처:</span>
              <span>${quote.customerInfo.phone}</span>
            </div>
            <div class="info-item">
              <span class="info-label">이메일:</span>
              <span>${quote.customerInfo.email}</span>
            </div>
          </div>
          <div class="info-item" style="margin-top: 15px;">
            <span class="info-label">주소:</span>
            <span>${quote.customerInfo.address}</span>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">상품 정보</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">상품명:</span>
              <span>${quote.product.itemNm}</span>
            </div>
            <div class="info-item">
              <span class="info-label">상품코드:</span>
              <span>${quote.product.itemCd}</span>
            </div>
            <div class="info-item">
              <span class="info-label">단가:</span>
              <span>${quote.product.unitPrice.toLocaleString()}원</span>
            </div>
            <div class="info-item">
              <span class="info-label">수량:</span>
              <span>${quote.quantity.toLocaleString()}개</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">견적 상세</h2>
          <table class="table">
            <thead>
              <tr>
                <th>항목</th>
                <th class="amount">금액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>소계</td>
                <td class="amount">${quote.quoteDetails.subtotal.toLocaleString()}원</td>
              </tr>
              <tr>
                <td>할인 (${quote.quoteDetails.discountRate}%)</td>
                <td class="amount">-${quote.quoteDetails.discountAmount.toLocaleString()}원</td>
              </tr>
              <tr>
                <td>부가세 (${quote.quoteDetails.taxRate}%)</td>
                <td class="amount">${quote.quoteDetails.taxAmount.toLocaleString()}원</td>
              </tr>
              <tr>
                <td>배송비</td>
                <td class="amount">${quote.quoteDetails.shippingCost.toLocaleString()}원</td>
              </tr>
              <tr class="total-row">
                <td>총 금액</td>
                <td class="amount">${quote.quoteDetails.totalAmount.toLocaleString()}원</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2 class="section-title">거래 조건</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">결제 조건:</span>
              <span>${quote.quoteDetails.paymentTerms}</span>
            </div>
            <div class="info-item">
              <span class="info-label">납품 조건:</span>
              <span>${quote.quoteDetails.deliveryTerms}</span>
            </div>
            <div class="info-item">
              <span class="info-label">보증 조건:</span>
              <span>${quote.quoteDetails.warranty}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">공급업체 정보</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">회사명:</span>
              <span>${quote.supplierInfo.companyName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">담당자:</span>
              <span>${quote.supplierInfo.contactPerson}</span>
            </div>
            <div class="info-item">
              <span class="info-label">연락처:</span>
              <span>${quote.supplierInfo.phone}</span>
            </div>
            <div class="info-item">
              <span class="info-label">이메일:</span>
              <span>${quote.supplierInfo.email}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>본 견적서는 ${new Date(quote.validUntil).toLocaleDateString('ko-KR')}까지 유효합니다.</p>
          <p>문의사항이 있으시면 언제든지 연락주시기 바랍니다.</p>
        </div>
      </div>

      <script>
        // 자동으로 인쇄 대화상자 표시 (선택사항)
        // window.print();
      </script>
    </body>
    </html>
  `;

  // 새 창에서 HTML 열기
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  return printWindow;
};

export default { generateQuotePDF, generateQuoteHTML };
