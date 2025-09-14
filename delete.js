// 삭제 기능 스크립트

// SeminarPlanningApp 클래스에 삭제 관련 메서드들을 추가
Object.assign(SeminarPlanningApp.prototype, {
    
    // 메인 데이터 삭제
    async deleteData() {
        try {
            // 현재 데이터가 있는지 확인
            if (!this.currentData || !this.currentData.datetime) {
                this.showErrorToast('삭제할 데이터가 없습니다.');
                return;
            }

            // 사용자에게 삭제 확인
            if (!confirm(`정말로 "${this.currentData.datetime}" 세미나 계획을 삭제하시겠습니까?`)) {
                return;
            }

            this.showLoading(true);

            // Firebase에서 데이터 삭제
            if (this.currentDocumentId) {
                // 실행계획 데이터 삭제
                const result = await window.deleteData(this.currentDocumentId);
                
                // 실시결과 데이터도 삭제
                if (this.currentData.session && this.currentData.datetime) {
                    const keyValue = `${this.currentData.session}_${this.currentData.datetime}`;
                    
                    try {
                        if (useLocalStorage) {
                            // 로컬 스토리지에서 실시결과 데이터 삭제
                            const existingResults = JSON.parse(localStorage.getItem('seminarResults') || '{}');
                            delete existingResults[keyValue];
                            localStorage.setItem('seminarResults', JSON.stringify(existingResults));
                        } else {
                            // Firebase에서 실시결과 데이터 삭제
                            await db.collection('seminarResults').doc(keyValue).delete();
                        }
                    } catch (error) {
                        console.error('실시결과 데이터 삭제 오류:', error);
                    }
                }
                
                if (result.success) {
                    this.showSuccessToast('데이터가 성공적으로 삭제되었습니다.');
                    
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
                    this.currentDocumentId = null;
                    
                    // 원본 회차/일시 초기화
                    this.originalSession = null;
                    this.originalDatetime = null;
                    
                    // 폼 초기화
                    this.initializeMainForm();
                    
                    // 실시결과 폼도 초기화
                    this.clearMainResultForm();
                } else {
                    this.showErrorToast(`데이터 삭제 실패: ${result.error}`);
                }
            } else {
                // 로컬 스토리지에서 데이터 삭제
                localStorage.removeItem('seminarData');
                
                // 실시결과 데이터도 삭제
                if (this.currentData.session && this.currentData.datetime) {
                    const keyValue = `${this.currentData.session}_${this.currentData.datetime}`;
                    
                    try {
                        const existingResults = JSON.parse(localStorage.getItem('seminarResults') || '{}');
                        delete existingResults[keyValue];
                        localStorage.setItem('seminarResults', JSON.stringify(existingResults));
                    } catch (error) {
                        console.error('실시결과 데이터 삭제 오류:', error);
                    }
                }
                
                this.showSuccessToast('데이터가 성공적으로 삭제되었습니다.');
                
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
                this.currentDocumentId = null;
                
                // 원본 회차/일시 초기화
                this.originalSession = null;
                this.originalDatetime = null;
                
                // 폼 초기화
                this.initializeMainForm();
                
                // 실시결과 폼도 초기화
                this.clearMainResultForm();
            }
        } catch (error) {
            console.error('데이터 삭제 오류:', error);
            this.showErrorToast(`데이터 삭제 실패: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    },

    // 일괄 삭제
    async bulkDeleteData() {
        try {
            // 사용자에게 일괄삭제 확인
            if (!confirm('정말로 모든 세미나 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
                return;
            }

            this.showLoading(true);

            // Firebase에서 모든 데이터 삭제
            if (useLocalStorage) {
                // 로컬 스토리지에서 모든 데이터 삭제
                localStorage.removeItem('seminarPlans');
                this.showSuccessToast('모든 데이터가 성공적으로 삭제되었습니다.');
            } else {
                // Firebase에서 모든 문서 삭제
                const snapshot = await db.collection('seminarPlans').get();
                const batch = db.batch();
                
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                await batch.commit();
                this.showSuccessToast(`총 ${snapshot.docs.length}개의 세미나 데이터가 성공적으로 삭제되었습니다.`);
            }
            
            // 현재 데이터 초기화
            this.currentData = {
                session: '',
                objective: '',
                datetime: '',
                location: '',
                attendees: '',
                timeSchedule: [],
                attendeeList: []
            };
            this.currentDocumentId = null;
            
            // 폼 초기화
            this.initializeMainForm();
            
        } catch (error) {
            console.error('일괄삭제 오류:', error);
            this.showErrorToast('일괄삭제 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    },

    // 시간 계획 행 삭제
    removeTimeRow(index) {
        const tbody = document.getElementById('timeTableBody');
        if (tbody.children.length > 1) {
            tbody.children[index].remove();
            this.currentData.timeSchedule.splice(index, 1);
            this.reorderTimeRows();
        }
    },

    // 참석자 행 삭제
    removeAttendeeRow(index) {
        const tbody = document.getElementById('attendeeTableBody');
        if (tbody.children.length > 1) {
            tbody.children[index].remove();
            this.currentData.attendeeList.splice(index, 1);
            this.reorderAttendeeRows();
        }
    },

    // 참석자 전체 삭제 후 1행 초기화
    deleteAllAttendees() {
        const tbody = document.getElementById('attendeeTableBody');
        // 테이블 비우기
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        // 데이터도 초기화
        this.currentData.attendeeList = [];
        // 1행 추가 (초기값, 참석여부 기본 N)
        this.addAttendeeRow();
        this.showSuccessToast('참석자 명단을 초기화했습니다.');
    },

    // 시간 계획 행 재정렬
    reorderTimeRows() {
        const tbody = document.getElementById('timeTableBody');
        Array.from(tbody.children).forEach((row, index) => {
            const inputs = row.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.onchange = (e) => {
                    this.updateTimeSchedule(index, this.getFieldName(input), e.target.value);
                };
            });
            
            const deleteBtn = row.querySelector('button');
            deleteBtn.onclick = () => this.removeTimeRow(index);
        });
    },

    // 참석자 행 재정렬
    reorderAttendeeRows() {
        const tbody = document.getElementById('attendeeTableBody');
        Array.from(tbody.children).forEach((row, index) => {
            const inputs = row.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.onchange = (e) => {
                    this.updateAttendeeList(index, this.getFieldName(input), e.target.value);
                };
            });
            
            const deleteBtn = row.querySelector('button');
            deleteBtn.onclick = () => this.removeAttendeeRow(index);
        });
    },

    // 필드명 가져오기
    getFieldName(input) {
        const placeholder = input.placeholder;
        if (placeholder.includes('유형')) return 'type';
        if (placeholder.includes('내용')) return 'content';
        if (placeholder.includes('시간')) return 'time';
        if (placeholder.includes('담당자')) return 'responsible';
        if (placeholder.includes('이름')) return 'name';
        if (placeholder.includes('직책')) return 'position';
        if (placeholder.includes('부서')) return 'department';
        if (placeholder.includes('업무')) return 'work';
        if (placeholder.includes('참석')) return 'attendance';
        return 'unknown';
    },

    // 시간 계획 업데이트
    updateTimeSchedule(index, field, value) {
        if (this.currentData.timeSchedule[index]) {
            this.currentData.timeSchedule[index][field] = value;
        }
    },

    // 참석자 목록 업데이트
    updateAttendeeList(index, field, value) {
        if (this.currentData.attendeeList[index]) {
            this.currentData.attendeeList[index][field] = value;
            
            // 참석여부가 변경되면 조용히 저장
            if (field === 'attendance') {
                this.saveDataQuietly();
            }
        }
    }
});

// 삭제 버튼 이벤트 바인딩
document.addEventListener('DOMContentLoaded', function() {
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn && window.seminarApp) {
        deleteBtn.addEventListener('click', () => window.seminarApp.deleteData());
    }
    
    // 참석자 전체 삭제 버튼
    const deleteAllBtn = document.getElementById('deleteAllAttendees');
    if (deleteAllBtn && window.seminarApp) {
        deleteAllBtn.addEventListener('click', () => window.seminarApp.deleteAllAttendees());
    }
});
