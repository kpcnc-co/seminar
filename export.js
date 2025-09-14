// PDF 내보내기 기능 스크립트

// SeminarPlanningApp 클래스에 PDF 내보내기 관련 메서드들을 추가
Object.assign(SeminarPlanningApp.prototype, {
    
    // PDF 내보내기 (메인)
    exportToPDF() {
        try {
            this.showLoading(true);
            
            this.waitForPDFMake().then(() => {
                this.exportToPDFWithPDFMake();
            }).catch(() => {
                this.exportToPDFWithHTML();
            });
            
        } catch (error) {
            this.showErrorToast(`PDF 내보내기 실패: ${error.message}`);
            this.showLoading(false);
        }
    },

    // PDFMake 라이브러리 로딩 대기
    waitForPDFMake() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100;
            
            const checkPDFMake = () => {
                attempts++;
                
                if (window.pdfMake && window.pdfMake.fonts) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('PDFMake 로딩 시간 초과'));
                } else {
                    setTimeout(checkPDFMake, 100);
                }
            };
            
            checkPDFMake();
        });
    },

    // PDFMake를 사용한 PDF 생성
    exportToPDFWithPDFMake() {
        try {
            if (!window.pdfMake) {
                this.exportToPDFWithHTML();
                return;
            }
            
            if (!window.pdfMake.fonts) {
                this.exportToPDFWithHTML();
                return;
            }
            
            // 안전한 텍스트 처리 함수
            const safeText = (text) => {
                if (!text) return '';
                return String(text).replace(/[^\x00-\x7F]/g, ''); // ASCII만 유지
            };
            
            // 현재 데이터 수집
            this.collectFormData();
            
            // PDF 문서 정의
            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [40, 60, 40, 60],
                content: [
                    // 제목
                    {
                        text: '전사 신기술 세미나 실행계획',
                        style: 'header',
                        alignment: 'center',
                        margin: [0, 0, 0, 20]
                    },
                    
                    // 기본 정보
                    {
                        table: {
                            widths: ['*', '*'],
                            body: [
                                [
                                    { text: '회차', style: 'tableHeader' },
                                    { text: safeText(this.currentData.session), style: 'tableCell' }
                                ],
                                [
                                    { text: '목적', style: 'tableHeader' },
                                    { text: safeText(this.currentData.objective), style: 'tableCell' }
                                ],
                                [
                                    { text: '일시', style: 'tableHeader' },
                                    { text: safeText(this.currentData.datetime), style: 'tableCell' }
                                ],
                                [
                                    { text: '장소', style: 'tableHeader' },
                                    { text: safeText(this.currentData.location), style: 'tableCell' }
                                ],
                                [
                                    { text: '참석자', style: 'tableHeader' },
                                    { text: safeText(this.currentData.attendees), style: 'tableCell' }
                                ]
                            ]
                        },
                        layout: 'lightHorizontalLines',
                        margin: [0, 0, 0, 20]
                    },
                    
                    // 시간 계획
                    {
                        text: '시간 계획',
                        style: 'subheader',
                        margin: [0, 0, 0, 10]
                    },
                    this.generateTimeScheduleTable(),
                    
                    // 참석자 명단
                    {
                        text: '참석자 명단',
                        style: 'subheader',
                        margin: [0, 20, 0, 10]
                    },
                    this.generateAttendeeTable()
                ],
                styles: {
                    header: {
                        fontSize: 18,
                        bold: true,
                        color: '#1f2937'
                    },
                    subheader: {
                        fontSize: 14,
                        bold: true,
                        color: '#374151'
                    },
                    tableHeader: {
                        fontSize: 10,
                        bold: true,
                        color: '#1f2937',
                        fillColor: '#f3f4f6'
                    },
                    tableCell: {
                        fontSize: 10,
                        color: '#374151'
                    }
                }
            };
            
            // PDF 생성 및 다운로드
            pdfMake.createPdf(docDefinition).download(`세미나실행계획_${this.currentData.session}_${this.getCurrentDateString()}.pdf`);
            
            this.showLoading(false);
            this.showSuccessToast('PDF가 성공적으로 생성되었습니다.');
            
        } catch (error) {
            console.error('PDFMake PDF 생성 오류:', error);
            this.exportToPDFWithHTML();
        }
    },

    // 시간 계획 테이블 생성
    generateTimeScheduleTable() {
        if (!this.currentData.timeSchedule || this.currentData.timeSchedule.length === 0) {
            return { text: '시간 계획이 없습니다.', style: 'tableCell' };
        }
        
        const tableBody = [
            [
                { text: '유형', style: 'tableHeader' },
                { text: '내용', style: 'tableHeader' },
                { text: '시간', style: 'tableHeader' },
                { text: '담당자', style: 'tableHeader' }
            ]
        ];
        
        this.currentData.timeSchedule.forEach(item => {
            tableBody.push([
                { text: this.safeText(item.type), style: 'tableCell' },
                { text: this.safeText(item.content), style: 'tableCell' },
                { text: this.safeText(item.time), style: 'tableCell' },
                { text: this.safeText(item.responsible), style: 'tableCell' }
            ]);
        });
        
        return {
            table: {
                widths: ['*', '*', '*', '*'],
                body: tableBody
            },
            layout: 'lightHorizontalLines'
        };
    },

    // 참석자 테이블 생성
    generateAttendeeTable() {
        if (!this.currentData.attendeeList || this.currentData.attendeeList.length === 0) {
            return { text: '참석자 명단이 없습니다.', style: 'tableCell' };
        }
        
        const tableBody = [
            [
                { text: '번호', style: 'tableHeader' },
                { text: '성명', style: 'tableHeader' },
                { text: '직급', style: 'tableHeader' },
                { text: '소속', style: 'tableHeader' },
                { text: '업무', style: 'tableHeader' },
                { text: '참석', style: 'tableHeader' }
            ]
        ];
        
        this.currentData.attendeeList.forEach((item, index) => {
            tableBody.push([
                { text: String(index + 1), style: 'tableCell' },
                { text: this.safeText(item.name), style: 'tableCell' },
                { text: this.safeText(item.position), style: 'tableCell' },
                { text: this.safeText(item.department), style: 'tableCell' },
                { text: this.safeText(item.work), style: 'tableCell' },
                { text: this.safeText(item.attendance), style: 'tableCell' }
            ]);
        });
        
        return {
            table: {
                widths: ['auto', '*', '*', '*', '*', 'auto'],
                body: tableBody
            },
            layout: 'lightHorizontalLines'
        };
    },

    // HTML to PDF 방식
    exportToPDFWithHTML() {
        try {
            const htmlContent = this.generatePDFHTML();
            
            // 새 창에서 HTML 열기
            const newWindow = window.open('', '_blank');
            if (!newWindow) {
                this.showErrorToast('팝업이 차단되었습니다. 브라우저에서 팝업을 허용해주세요.');
                this.showLoading(false);
                return;
            }
            
            newWindow.document.write(htmlContent);
            newWindow.document.close();
            
            this.showLoading(false);
            this.showSuccessToast('PDF용 HTML이 새 창에서 열렸습니다. 브라우저의 인쇄 기능을 사용하여 PDF로 저장하세요.');
            
        } catch (error) {
            console.error('HTML PDF 생성 오류:', error);
            this.showErrorToast('PDF 생성 중 오류가 발생했습니다.');
            this.showLoading(false);
        }
    },

    // PDF용 HTML 생성
    generatePDFHTML() {
        const today = new Date();
        const dateString = today.toLocaleDateString('ko-KR');
        
        // 현재 데이터 수집
        this.collectFormData();
        
        let timeScheduleHTML = '';
        if (this.currentData.timeSchedule && this.currentData.timeSchedule.length > 0) {
            timeScheduleHTML = this.currentData.timeSchedule.map(item => `
                <tr>
                    <td>${this.escapeHtml(item.type || '')}</td>
                    <td>${this.escapeHtml(item.content || '')}</td>
                    <td>${this.escapeHtml(item.time || '')}</td>
                    <td>${this.escapeHtml(item.responsible || '')}</td>
                </tr>
            `).join('');
        }
        
        let attendeeHTML = '';
        if (this.currentData.attendeeList && this.currentData.attendeeList.length > 0) {
            attendeeHTML = this.currentData.attendeeList.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${this.escapeHtml(item.name || '')}</td>
                    <td>${this.escapeHtml(item.position || '')}</td>
                    <td>${this.escapeHtml(item.department || '')}</td>
                    <td>${this.escapeHtml(item.work || '')}</td>
                    <td>${this.escapeHtml(item.attendance || '')}</td>
                </tr>
            `).join('');
        }
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>전사 신기술 세미나 실행계획</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { text-align: center; color: #1f2937; margin-bottom: 30px; }
                    h2 { color: #374151; margin-top: 30px; margin-bottom: 15px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
                    th { background-color: #f3f4f6; font-weight: bold; }
                    .info-table { margin-bottom: 30px; }
                    .info-table td:first-child { background-color: #f9fafb; font-weight: bold; width: 120px; }
                </style>
            </head>
            <body>
                <h1>전사 신기술 세미나 실행계획</h1>
                
                <table class="info-table">
                    <tr><td>회차</td><td>${this.escapeHtml(this.currentData.session || '')}</td></tr>
                    <tr><td>목적</td><td>${this.escapeHtml(this.currentData.objective || '')}</td></tr>
                    <tr><td>일시</td><td>${this.escapeHtml(this.currentData.datetime || '')}</td></tr>
                    <tr><td>장소</td><td>${this.escapeHtml(this.currentData.location || '')}</td></tr>
                    <tr><td>참석자</td><td>${this.escapeHtml(this.currentData.attendees || '')}</td></tr>
                </table>
                
                <h2>시간 계획</h2>
                <table>
                    <thead>
                        <tr>
                            <th>유형</th>
                            <th>내용</th>
                            <th>시간</th>
                            <th>담당자</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${timeScheduleHTML}
                    </tbody>
                </table>
                
                <h2>참석자 명단</h2>
                <table>
                    <thead>
                        <tr>
                            <th>번호</th>
                            <th>성명</th>
                            <th>직급</th>
                            <th>소속</th>
                            <th>업무</th>
                            <th>참석</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attendeeHTML}
                    </tbody>
                </table>
                
                <div style="margin-top: 50px; text-align: center; color: #6b7280;">
                    <p>생성일: ${dateString}</p>
                </div>
            </body>
            </html>
        `;
    },

    // 실시결과 PDF 내보내기
    async exportResultToPDF() {
        try {
            this.showLoading(true);
            
            // 현재 세미나 정보 가져오기
            const sessionSelect = document.getElementById('sessionSelect').value;
            const sessionInput = document.getElementById('sessionInput').value;
            const session = sessionSelect || sessionInput;
            const datetime = document.getElementById('datetime').value;
            
            if (!session || !datetime) {
                this.showErrorToast('먼저 세미나 정보를 입력해주세요.');
                this.showLoading(false);
                return;
            }
            
            let resultData = await loadResultDataByKey(session, datetime);
            
            if (!resultData) {
                this.showErrorToast('실시결과 데이터가 없습니다.');
                this.showLoading(false);
                return;
            }
            
            this.waitForPDFMake().then(() => {
                this.exportResultToPDFWithPDFMake(resultData);
            }).catch(() => {
                this.exportResultToPDFWithHTML(resultData);
            });
            
        } catch (error) {
            console.error('PDF 실시결과 내보내기 오류:', error);
            this.showErrorToast('PDF 실시결과 내보내기 중 오류가 발생했습니다.');
            this.showLoading(false);
        }
    },

    // PDFMake를 사용한 실시결과 PDF 생성
    exportResultToPDFWithPDFMake(resultData) {
        try {
            if (!window.pdfMake) {
                this.exportResultToPDFWithHTML(resultData);
                return;
            }
            
            // 현재 세미나 정보
            const session = resultData.session;
            const datetime = resultData.datetime;
            
            // PDF 문서 정의
            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [40, 60, 40, 60],
                content: [
                    // 제목
                    {
                        text: '전사 신기술 세미나 실시결과',
                        style: 'header',
                        alignment: 'center',
                        margin: [0, 0, 0, 20]
                    },
                    
                    // 기본 정보
                    {
                        table: {
                            widths: ['*', '*'],
                            body: [
                                [
                                    { text: '회차', style: 'tableHeader' },
                                    { text: this.safeText(session), style: 'tableCell' }
                                ],
                                [
                                    { text: '일시', style: 'tableHeader' },
                                    { text: this.safeText(datetime), style: 'tableCell' }
                                ]
                            ]
                        },
                        layout: 'lightHorizontalLines',
                        margin: [0, 0, 0, 20]
                    },
                    
                    // 주요 내용
                    {
                        text: '주요 내용',
                        style: 'subheader',
                        margin: [0, 0, 0, 10]
                    },
                    {
                        text: this.safeText(resultData.mainContent || ''),
                        style: 'content',
                        margin: [0, 0, 0, 20]
                    },
                    
                    // 향후 계획
                    {
                        text: '향후 계획',
                        style: 'subheader',
                        margin: [0, 0, 0, 10]
                    },
                    {
                        text: this.safeText(resultData.futurePlan || ''),
                        style: 'content'
                    }
                ],
                styles: {
                    header: {
                        fontSize: 18,
                        bold: true,
                        color: '#1f2937'
                    },
                    subheader: {
                        fontSize: 14,
                        bold: true,
                        color: '#374151'
                    },
                    tableHeader: {
                        fontSize: 10,
                        bold: true,
                        color: '#1f2937',
                        fillColor: '#f3f4f6'
                    },
                    tableCell: {
                        fontSize: 10,
                        color: '#374151'
                    },
                    content: {
                        fontSize: 11,
                        color: '#374151',
                        lineHeight: 1.5
                    }
                }
            };
            
            // PDF 생성 및 다운로드
            pdfMake.createPdf(docDefinition).download(`세미나실시결과_${session}_${this.getCurrentDateString()}.pdf`);
            
            this.showLoading(false);
            this.showSuccessToast('실시결과 PDF가 성공적으로 생성되었습니다.');
            
        } catch (error) {
            console.error('PDFMake 실시결과 PDF 생성 오류:', error);
            this.exportResultToPDFWithHTML(resultData);
        }
    },

    // HTML to PDF 방식으로 실시결과 내보내기
    exportResultToPDFWithHTML(resultData) {
        try {
            const htmlContent = this.generateResultPDFHTML(resultData);
            
            // 새 창에서 HTML 열기
            const newWindow = window.open('', '_blank');
            if (!newWindow) {
                this.showErrorToast('팝업이 차단되었습니다. 브라우저에서 팝업을 허용해주세요.');
                this.showLoading(false);
                return;
            }
            
            newWindow.document.write(htmlContent);
            newWindow.document.close();
            
            this.showLoading(false);
            this.showSuccessToast('실시결과 PDF용 HTML이 새 창에서 열렸습니다. 브라우저의 인쇄 기능을 사용하여 PDF로 저장하세요.');
            
        } catch (error) {
            console.error('HTML 실시결과 PDF 생성 오류:', error);
            this.showErrorToast('실시결과 PDF 생성 중 오류가 발생했습니다.');
            this.showLoading(false);
        }
    },

    // 실시결과 PDF용 HTML 생성
    generateResultPDFHTML(resultData) {
        const today = new Date();
        const dateString = today.toLocaleDateString('ko-KR');
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>전사 신기술 세미나 실시결과</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { text-align: center; color: #1f2937; margin-bottom: 30px; }
                    h2 { color: #374151; margin-top: 30px; margin-bottom: 15px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
                    th { background-color: #f3f4f6; font-weight: bold; }
                    .info-table { margin-bottom: 30px; }
                    .info-table td:first-child { background-color: #f9fafb; font-weight: bold; width: 120px; }
                    .content { line-height: 1.6; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1>전사 신기술 세미나 실시결과</h1>
                
                <table class="info-table">
                    <tr><td>회차</td><td>${this.escapeHtml(resultData.session || '')}</td></tr>
                    <tr><td>일시</td><td>${this.escapeHtml(resultData.datetime || '')}</td></tr>
                </table>
                
                <h2>주요 내용</h2>
                <div class="content">${this.escapeHtml(resultData.mainContent || '')}</div>
                
                <h2>향후 계획</h2>
                <div class="content">${this.escapeHtml(resultData.futurePlan || '')}</div>
                
                <div style="margin-top: 50px; text-align: center; color: #6b7280;">
                    <p>생성일: ${dateString}</p>
                </div>
            </body>
            </html>
        `;
    },

    // 안전한 텍스트 처리
    safeText(text) {
        if (!text) return '';
        return String(text).replace(/[^\x00-\x7F]/g, ''); // ASCII만 유지
    }
});

// PDF 내보내기 버튼 이벤트 바인딩
document.addEventListener('DOMContentLoaded', function() {
    // 실행계획 PDF 내보내기 버튼
    const exportPDFBtn = document.getElementById('exportPDF');
    if (exportPDFBtn && window.seminarApp) {
        exportPDFBtn.addEventListener('click', () => window.seminarApp.exportToPDF());
    }
    
    // 실시결과 PDF 내보내기 버튼
    const exportResultPDFBtn = document.getElementById('exportResultPDF');
    if (exportResultPDFBtn && window.seminarApp) {
        exportResultPDFBtn.addEventListener('click', () => window.seminarApp.exportResultToPDF());
    }
});
