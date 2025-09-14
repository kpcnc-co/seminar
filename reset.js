// 초기화 기능 스크립트

// SeminarPlanningApp 클래스에 초기화 관련 메서드들을 추가
Object.assign(SeminarPlanningApp.prototype, {
    
    // 폼 초기화 (초기화 버튼 클릭 시)
    resetForm() {
        try {
            // 입력 필드만 초기화 (기존 데이터는 유지)
            this.clearInputFields();
            
            // 시간 계획과 참석자 명단에 1행씩 자동 추가
            this.addTimeRow();
            this.addAttendeeRow();
            
            // 스케치 초기화 (스케치1, 스케치2만 남기고 나머지 제거)
            this.resetSketches();
            
            // 원본 회차/일시 초기화
            this.originalSession = null;
            this.originalDatetime = null;
            
            this.showSuccessToast('모든 입력 필드가 초기화되고 기본 행이 추가되었습니다.');
        } catch (error) {
            console.error('폼 초기화 오류:', error);
            this.showErrorToast('초기화 중 오류가 발생했습니다.');
        }
    },

    // 입력 필드만 초기화 (기존 데이터 유지)
    clearInputFields() {
        // 회차 필드 초기화
        document.getElementById('sessionSelect').value = '';
        document.getElementById('sessionInput').value = '';
        document.getElementById('sessionSelect').style.display = 'block';
        document.getElementById('sessionInput').classList.add('hidden');
        
        // 기본 정보 필드 초기화
        document.getElementById('objective').value = '';
        document.getElementById('datetime').value = '';
        document.getElementById('location').value = '';
        document.getElementById('attendees').value = '';
        
        // 테이블 입력 필드 초기화
        this.clearTableInputs();
        
        // 실시결과 입력 항목 초기화
        this.clearResultInputs();
        
        // 세미나 스케치 업로드 항목 초기화
        this.resetSketches();
        
        // 현재 데이터의 입력 필드 값만 초기화 (저장된 데이터는 유지)
        this.currentData.session = '';
        this.currentData.objective = '';
        this.currentData.datetime = '';
        this.currentData.location = '';
        this.currentData.attendees = '';
    },

    // 테이블 그리드 완전 삭제 (초기화)
    clearTableInputs() {
        // 시간 계획 테이블 그리드 완전 삭제
        const timeTableBody = document.getElementById('timeTableBody');
        timeTableBody.innerHTML = '';
        
        // 참석자 테이블 그리드 완전 삭제
        const attendeeTableBody = document.getElementById('attendeeTableBody');
        attendeeTableBody.innerHTML = '';
        
        // 현재 데이터의 테이블 데이터도 초기화
        this.currentData.timeSchedule = [];
        this.currentData.attendeeList = [];
    },
    
    // 실시결과 입력 항목 초기화
    clearResultInputs() {
        // 주요 내용 초기화
        const mainContentElement = document.getElementById('mainResultContent');
        if (mainContentElement) {
            mainContentElement.value = '';
        }
        
        // 향후 계획 초기화
        const futurePlanElement = document.getElementById('mainResultFuturePlan');
        if (futurePlanElement) {
            futurePlanElement.value = '';
        }
        
        // PDF 실시결과 내보내기 버튼 숨기기
        this.toggleExportResultPDFButton();
    },

    // 메인 화면 초기화
    initializeMainForm() {
        // 현재 데이터 초기화
        this.currentData = {
            session: '',
            objective: '',
            datetime: '',
            location: '',
            attendees: '',
            timeSchedule: [],
            attendeeList: [],
            sketches: []
        };
        
        // Firebase 문서 ID 초기화
        this.currentDocumentId = null;
        
        // 원본 회차/일시 초기화
        this.originalSession = null;
        this.originalDatetime = null;
        
        // 폼 필드 초기화
        document.getElementById('sessionSelect').value = '';
        document.getElementById('sessionInput').value = '';
        document.getElementById('sessionSelect').style.display = 'block';
        document.getElementById('sessionInput').classList.add('hidden');
        document.getElementById('objective').value = '';
        document.getElementById('datetime').value = '';
        document.getElementById('location').value = '';
        document.getElementById('attendees').value = '';
        
        // 테이블 초기화
        document.getElementById('timeTableBody').innerHTML = '';
        document.getElementById('attendeeTableBody').innerHTML = '';
        
        // 기본 행 추가 (직접 생성)
        this.addDefaultRows();
        
        // 스케치 초기화 (스케치0, 스케치1만 남기고 나머지 제거)
        this.resetSketches();
        
        // 실시결과 필드 초기화
        const mainResultContent = document.getElementById('mainResultContent');
        const mainResultFuturePlan = document.getElementById('mainResultFuturePlan');
        if (mainResultContent) mainResultContent.value = '';
        if (mainResultFuturePlan) mainResultFuturePlan.value = '';
        
        // PDF 실시결과 내보내기 버튼 숨기기
        this.toggleExportResultPDFButton();
    },

    // 메인화면 실시결과 폼 초기화
    clearMainResultForm() {
        // 실시결과 필드 초기화
        const mainResultContent = document.getElementById('mainResultContent');
        const mainResultFuturePlan = document.getElementById('mainResultFuturePlan');
        if (mainResultContent) mainResultContent.value = '';
        if (mainResultFuturePlan) mainResultFuturePlan.value = '';
        
        // PDF 실시결과 내보내기 버튼 숨기기
        this.toggleExportResultPDFButton();
    },

    // 스케치 초기화
    resetSketches() {
        const container = document.getElementById('sketchUploadContainer');
        const existingSketches = container.querySelectorAll('[data-sketch-index]');
        
        // 모든 스케치를 먼저 제거
        existingSketches.forEach(sketch => {
            sketch.remove();
        });
        
        // currentData의 스케치 데이터는 초기화하지 않음 (실제 데이터 유지)
    },

    // 스케치 초기화 (기본 스케치 추가하지 않음)
    resetSketchesWithoutDefault() {
        const container = document.getElementById('sketchUploadContainer');
        const existingSketches = container.querySelectorAll('[data-sketch-index]');
        
        // 모든 스케치를 먼저 제거
        existingSketches.forEach(sketch => {
            sketch.remove();
        });
        
        // currentData의 스케치 데이터는 초기화하지 않음 (실제 데이터 유지)
    }
});

// 초기화 버튼 이벤트 바인딩
document.addEventListener('DOMContentLoaded', function() {
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn && window.seminarApp) {
        resetBtn.addEventListener('click', () => window.seminarApp.resetForm());
    }
});
