// 전사 신기술 세미나 실행계획 웹앱 기본 클래스

class SeminarPlanningApp {
    constructor() {
        this.currentData = {
            session: '',
            objective: '',
            datetime: '',
            location: '',
            attendees: '',
            timeSchedule: [],
            attendeeList: []
        };
        
        this.currentDocumentId = null; // Firebase 문서 ID 저장
        this.originalSession = null; // 원본 회차 저장
        this.originalDatetime = null; // 원본 일시 저장
        
        // 라이브러리 로딩 상태 확인 및 초기화
        this.initializeApp().catch(error => {
            console.error('앱 초기화 오류:', error);
        });
    }
    
    async initializeApp() {
        await this.checkLibraries();
        await this.init();
    }

    // 라이브러리 상태 확인
    async checkLibraries() {
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
            if (window.exportLibraries) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }
    
    // 라이브러리 존재 여부 확인
    getLibrary(name) {
        if (window.exportLibraries && window.exportLibraries[name]) {
            return true;
        }
        
        if (name === 'jsPDF' && (window.jsPDF || window.jspdf?.jsPDF)) {
            return true;
        }
        if (name === 'saveAs' && window.saveAs) {
            return true;
        }
        
        return false;
    }

    // 라이브러리 인스턴스 반환
    getLibraryInstance(name) {
        if (window.exportLibraries && !window.exportLibraries[name]) {
            return null;
        }
        
        if (name === 'jsPDF') {
            if (window.jsPDF) return window.jsPDF;
            if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
        }
        
        if (name === 'saveAs' && window.saveAs) {
            return window.saveAs;
        }
        
        return null;
    }

    async init() {
        this.bindEvents();
        await this.loadInitialData();
        this.addDefaultRows();
        
        // 초기화 시 스케치 버튼 상태 확인
        setTimeout(() => {
            this.toggleQuickSaveSketchButton();
        }, 100);
    }

    bindEvents() {
        // 입력 필드 변경 감지
        this.bindInputEvents();
        
        // 세미나 정보 변경 시 실시결과 데이터 자동 로드
        this.bindResultDataEvents();
    }

    bindResultDataEvents() {
        // 세미나 정보 변경 시 실시결과 데이터 자동 로드
        const sessionSelect = document.getElementById('sessionSelect');
        const sessionInput = document.getElementById('sessionInput');
        const datetime = document.getElementById('datetime');
        
        if (sessionSelect) {
            sessionSelect.addEventListener('change', () => {
                setTimeout(() => this.loadMainResultData(), 100);
            });
        }
        
        if (sessionInput) {
            sessionInput.addEventListener('change', () => {
                setTimeout(() => this.loadMainResultData(), 100);
            });
        }
        
        if (datetime) {
            datetime.addEventListener('change', () => {
                setTimeout(() => this.loadMainResultData(), 100);
            });
        }
    }

    bindInputEvents() {
        // 입력 필드 변경 감지
        const fields = ['session', 'objective', 'datetime', 'location', 'attendees'];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.updateCurrentData(field, e.target.value);
                });
            }
        });
        
        // 날짜 형식 검증
        const datetimeElement = document.getElementById('datetime');
        if (datetimeElement) {
            datetimeElement.addEventListener('input', (e) => {
                this.validateDateTimeFormat(e.target);
            });
            
            datetimeElement.addEventListener('blur', (e) => {
                this.validateDateTimeFormat(e.target);
            });
        }
        
        // 메인 결과 내용 변경 감지
        const mainContentElement = document.getElementById('mainResultContent');
        if (mainContentElement) {
            mainContentElement.addEventListener('input', (e) => {
                this.toggleExportResultPDFButton();
                this.toggleQuickSaveButtons();
            });
            
            mainContentElement.addEventListener('blur', (e) => {
                this.toggleExportResultPDFButton();
                this.toggleQuickSaveButtons();
            });
        }
    }

    toggleExportResultPDFButton() {
        // 메인 결과 내용이 있을 때만 PDF 내보내기 버튼 활성화
        const mainContentElement = document.getElementById('mainResultContent');
        const exportResultPDFButton = document.getElementById('exportResultPDF');
        
        if (mainContentElement && exportResultPDFButton) {
            const hasContent = mainContentElement.value.trim().length > 0;
            exportResultPDFButton.disabled = !hasContent;
        }
    }

    toggleQuickSaveButtons() {
        // 메인 결과 내용이 있을 때만 빠른 저장 버튼 활성화
        const mainContentElement = document.getElementById('mainResultContent');
        const quickSaveResultBtn = document.getElementById('quickSaveResultBtn');
        
        if (mainContentElement && quickSaveResultBtn) {
            const hasContent = mainContentElement.value.trim().length > 0;
            quickSaveResultBtn.disabled = !hasContent;
        }
    }

    toggleQuickSaveSketchButton() {
        // 스케치 변경사항이 있을 때만 빠른 저장 버튼 활성화
        const quickSaveSketchBtn = document.getElementById('quickSaveSketchBtn');
        
        if (quickSaveSketchBtn) {
            const hasSketchChanges = this.hasSketchChanges();
            quickSaveSketchBtn.disabled = !hasSketchChanges;
        }
    }

    hasSketchChanges() {
        // 스케치 변경사항 확인
        const container = document.getElementById('sketchUploadContainer');
        if (!container) return false;
        
        const sketchItems = container.querySelectorAll('.sketch-item');
        for (let item of sketchItems) {
            const title = item.querySelector('input[type="text"]')?.value || '';
            const file = item.querySelector('input[type="file"]')?.files[0];
            
            if (title.length > 0 || file) {
                return true;
            }
        }
        
        return false;
    }

    validateDateTimeFormat(element) {
        const value = element.value;
        if (!value) {
            element.style.borderColor = '';
            return;
        }
        
        // YYYY-MM-DD HH:MM 형식 검증
        const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
        const isValidFormat = regex.test(value);
        
        // 날짜 유효성 검증
        const [datePart, timePart] = value.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute] = timePart.split(':').map(Number);
        
        const date = new Date(year, month - 1, day, hour, minute);
        const isValidDate = date.getFullYear() === year && 
                           date.getMonth() === month - 1 && 
                           date.getDate() === day &&
                           date.getHours() === hour &&
                           date.getMinutes() === minute;
        
        if (isValidFormat && isValidDate) {
            element.style.borderColor = '';
        } else {
            element.style.borderColor = '#ff4444';
        }
    }

    async loadInitialData() {
        // 초기 데이터 로드
        if (typeof window.loadData !== 'function') {
            console.warn('loadData 함수가 정의되지 않았습니다.');
            return;
        }
        
        try {
            const result = await window.loadData();
            if (result.success) {
                this.currentData = result.data;
                this.currentDocumentId = result.id;
                this.originalSession = this.currentData.session;
                this.originalDatetime = this.currentData.datetime;
                this.populateForm();
            }
        } catch (error) {
            console.error('초기 데이터 로드 오류:', error);
        }
    }

    populateForm() {
        // 폼에 데이터 채우기
        if (!this.currentData) {
            return;
        }
        
        // 세션 필드 채우기
        if (this.currentData.session) {
            this.populateSessionField();
        }
        
        // 기본 필드들 채우기
        const fields = ['objective', 'datetime', 'location', 'attendees'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            const value = this.currentData[field];
            if (element && value !== undefined && value !== null && value !== '') {
                element.value = value;
            }
        });
        
        // 테이블 데이터 채우기
        this.populateTimeTable();
        this.populateAttendeeTable();
    }

    addDefaultRows() {
        // 기본 행 추가
        if (this.currentData.timeSchedule.length === 0) {
            this.currentData.timeSchedule = [
                {
                    type: '',
                    content: '',
                    time: '',
                    responsible: ''
                }
            ];
        }
        
        if (this.currentData.attendeeList.length === 0) {
            this.currentData.attendeeList = [
                {
                    name: '',
                    position: '',
                    department: '',
                    work: '',
                    attendance: 'Y'
                }
            ];
        }
        
        this.populateTimeTable();
        this.populateAttendeeTable();
    }

    // 현재 데이터 업데이트
    updateCurrentData(field, value) {
        if (this.currentData && field) {
            this.currentData[field] = value;
        }
    }

    // 공통 유틸리티 메서드들
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            if (show) {
                spinner.classList.remove('hidden');
            } else {
                spinner.classList.add('hidden');
            }
        }
    }

    showSuccessToast(message) {
        const toast = document.getElementById('successToast');
        const messageSpan = toast.querySelector('span');
        messageSpan.textContent = message;
        
        toast.classList.remove('translate-x-full');
        toast.classList.add('slide-in-right');
        
        setTimeout(() => {
            toast.classList.add('translate-x-full');
        }, 3000);
    }

    showErrorToast(message) {
        // 에러 토스트는 성공 토스트를 재사용하여 표시
        const toast = document.getElementById('successToast');
        const messageSpan = toast.querySelector('span');
        const icon = toast.querySelector('i');
        
        messageSpan.textContent = message;
        icon.className = 'fas fa-exclamation-circle mr-2';
        toast.classList.remove('bg-green-500');
        toast.classList.add('bg-red-500');
        
        toast.classList.remove('translate-x-full');
        toast.classList.add('slide-in-right');
        
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            // 원래 스타일로 복원
            icon.className = 'fas fa-check-circle mr-2';
            toast.classList.remove('bg-red-500');
            toast.classList.add('bg-green-500');
        }, 3000);
    }

    ensureStringValue(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value.trim();
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'boolean') return value.toString();
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }

    escapeHtml(text) {
        // HTML 이스케이프
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getCurrentDateString() {
        // 현재 날짜 문자열 반환
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    ensureUTF8Text(text) {
        // UTF-8 텍스트 보장
        if (typeof text !== 'string') {
            return String(text);
        }
        return text;
    }

    ensureKoreanText(text) {
        // 한국어 텍스트 보장
        return this.ensureUTF8Text(text);
    }
}
