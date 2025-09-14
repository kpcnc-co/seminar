// 로드 기능 스크립트

// SeminarPlanningApp 클래스에 로드 관련 메서드들을 추가
Object.assign(SeminarPlanningApp.prototype, {
    
    // 조회 모달 표시
    showSearchModal() {
        const modal = document.getElementById('searchModal');
        modal.classList.remove('hidden');
        
        // 메인 화면 스크롤 방지
        document.body.style.overflow = 'hidden';
        
        // 모달 이벤트 바인딩
        this.bindSearchModalEvents();
        
        // 전체 데이터 조회
        this.searchSeminars();
    },
    
    // 조회 모달 닫기
    closeSearchModal() {
        const modal = document.getElementById('searchModal');
        modal.classList.add('hidden');
        
        // 메인 화면 스크롤 복원
        document.body.style.overflow = '';
    },

    // 조회 모달 이벤트 바인딩
    bindSearchModalEvents() {
        // 모달 닫기
        document.getElementById('closeSearchModal').addEventListener('click', () => {
            this.closeSearchModal();
        });

        // 등록 버튼
        document.getElementById('addNewBtn').addEventListener('click', () => {
            this.addNewSeminar();
        });
    },

    // 세미나 조회 (전체 데이터)
    async searchSeminars() {
        try {
            this.showLoading(true);
            
            const result = await loadAllPlans();
            
            if (result.success) {
                // 데이터 유효성 검사 및 정규화
                const normalizedData = result.data.map(item => ({
                    ...item,
                    session: this.ensureStringValue(item.session),
                    objective: this.ensureStringValue(item.objective),
                    datetime: this.ensureStringValue(item.datetime),
                    location: this.ensureStringValue(item.location),
                    attendees: this.ensureStringValue(item.attendees)
                }));
                
                // 일시를 키값으로 내림차순 정렬
                const sortedData = normalizedData.sort((a, b) => {
                    const dateA = new Date(a.datetime || '1970-01-01');
                    const dateB = new Date(b.datetime || '1970-01-01');
                    return dateB - dateA; // 내림차순 (최신 날짜가 먼저)
                });
                
                this.displaySearchResults(sortedData);
            } else {
                this.showErrorToast(result.message);
            }
        } catch (error) {
            console.error('조회 오류:', error);
            this.showErrorToast('조회 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    },

    // 검색 결과 표시
    displaySearchResults(data) {
        const tbody = document.getElementById('searchResultBody');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-8 py-16 text-center">
                        <div class="flex flex-col items-center space-y-4">
                            <div class="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-search text-3xl text-blue-400"></i>
                            </div>
                            <div class="text-center">
                                <h3 class="text-xl font-semibold text-gray-700 mb-2">조회된 결과가 없습니다</h3>
                                <p class="text-gray-500">새로운 세미나를 등록해보세요</p>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors duration-200';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${this.escapeHtml(item.session || '')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${this.escapeHtml(item.objective || '')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${this.escapeHtml(item.datetime || '')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${this.escapeHtml(item.location || '')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button onclick="seminarApp.loadSelectedData('${item.id}')" 
                            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200">
                        <i class="fas fa-download mr-1"></i>
                        불러오기
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    // 선택된 데이터 로드
    async loadSelectedData(id) {
        try {
            this.showLoading(true);
            
            // Firebase에서 데이터 로드
            const result = await window.loadDataById(id);
            
            if (result.success) {
                // 데이터 정규화
                const normalizedData = this.normalizeDataStructure(result.data);
                
                // 현재 데이터 설정
                this.currentData = normalizedData;
                this.currentDocumentId = id;
                this.originalSession = this.currentData.session;
                this.originalDatetime = this.currentData.datetime;
                
                // 폼에 데이터 채우기
                await this.populateForm();
                
                // 실시결과 데이터도 로드
                await this.loadMainResultData();
                
                // 모달 닫기
                this.closeSearchModal();
                
                this.showSuccessToast('데이터를 성공적으로 불러왔습니다.');
            } else {
                this.showErrorToast(result.message);
            }
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            this.showErrorToast('데이터 로드 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    },

    // 메인 실시결과 데이터 로드
    async loadMainResultData() {
        try {
            const session = document.getElementById('sessionSelect').value || document.getElementById('sessionInput').value;
            const datetime = document.getElementById('datetime').value;
            
            // 세미나 정보가 없어도 currentData에서 스케치 정보를 확인
            if (!session || !datetime) {
                // currentData에 스케치 정보가 있으면 표시
                if (this.currentData && this.currentData.sketches && this.currentData.sketches.length > 0) {
                    this.populateMainResultForm({ sketches: this.currentData.sketches });
                    return;
                }
                return;
            }
            
            // 특정 회차_일시의 실시결과 데이터 조회
            const resultData = await loadResultDataByKey(session, datetime);
            
            if (resultData) {
                this.populateMainResultForm(resultData);
            } else {
                // currentData에 스케치 정보가 있으면 표시
                if (this.currentData && this.currentData.sketches && this.currentData.sketches.length > 0) {
                    this.populateMainResultForm({ sketches: this.currentData.sketches });
                }
            }
            
        } catch (error) {
            console.error('메인화면 실시결과 데이터 로드 오류:', error);
        }
    },

    // 메인화면 실시결과 폼에 데이터 채우기
    populateMainResultForm(resultData) {
        try {
            // 주요 내용, 향후 계획 채우기
            const mainContentEl = document.getElementById('mainResultContent');
            const futurePlanEl = document.getElementById('mainResultFuturePlan');
            
            if (mainContentEl) {
                if (Object.prototype.hasOwnProperty.call(resultData, 'mainContent')) {
                    mainContentEl.value = resultData.mainContent || '';
                }
                this.toggleExportResultPDFButton();
            }
            
            if (futurePlanEl) {
                if (Object.prototype.hasOwnProperty.call(resultData, 'futurePlan')) {
                    futurePlanEl.value = resultData.futurePlan || '';
                }
            }
            
            // 스케치 데이터 처리
            if (resultData.sketches && Array.isArray(resultData.sketches)) {
                const allSketches = resultData.sketches || [];
                
                // 스케치 초기화 먼저 실행 (기본 스케치 추가하지 않음)
                this.resetSketchesWithoutDefault();
                
                // 스케치 개수에 맞춰 스케치 생성
                for (let i = 0; i < allSketches.length; i++) {
                    this.addSketchUpload();
                }
                
                // 스케치 데이터 설정 - DOM 순서대로 설정
                const container = document.getElementById('sketchUploadContainer');
                const sketchElements = container.querySelectorAll('div[data-sketch-index]');
                
                // DOM 인덱스 순서대로 스케치 데이터 설정
                const sortedSketchElements = Array.from(sketchElements).sort((a, b) => {
                    return parseInt(a.getAttribute('data-sketch-index')) - parseInt(b.getAttribute('data-sketch-index'));
                });
                
                sortedSketchElements.forEach((sketchElement, domIndex) => {
                    const actualIndex = sketchElement.getAttribute('data-sketch-index');
                    const sketch = allSketches[domIndex];
                    
                    if (sketch) {
                        const titleInput = sketchElement.querySelector('input[type="text"]');
                        if (titleInput && sketch.title) {
                            titleInput.value = sketch.title;
                        }
                        
                        // 파일 정보 표시
                        if (sketch.fileName) {
                            const fileNameSpan = sketchElement.querySelector('.file-name');
                            if (fileNameSpan) {
                                fileNameSpan.textContent = sketch.fileName;
                                fileNameSpan.style.display = 'block';
                            }
                            
                            const uploadArea = sketchElement.querySelector('[id^="mainFileUploadArea"]');
                            if (uploadArea) {
                                uploadArea.style.display = 'none';
                            }
                        }
                    }
                });
            }
            
            // 스케치 버튼 상태 확인
            setTimeout(() => {
                this.toggleQuickSaveSketchButton();
            }, 100);
            
        } catch (error) {
            console.error('메인화면 폼 데이터 채우기 오류:', error);
        }
    },

    // 새 세미나 등록
    addNewSeminar() {
        try {
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
            
            // 폼 초기화
            this.initializeMainForm();
            
            // 모달 닫기
            this.closeSearchModal();
            
            this.showSuccessToast('새 세미나 등록을 위한 화면이 준비되었습니다.');
        } catch (error) {
            console.error('새 세미나 등록 화면 전환 오류:', error);
            this.showErrorToast('화면 전환 중 오류가 발생했습니다.');
        }
    },

    // 데이터 구조 정규화
    normalizeDataStructure(data) {
        const normalizedData = { ...data };
        
        // 시간 계획 정규화
        if (normalizedData.timeSchedule) {
            normalizedData.timeSchedule = normalizedData.timeSchedule.map(item => ({
                type: this.ensureStringValue(item.type),
                content: this.ensureStringValue(item.content),
                time: this.ensureStringValue(item.time),
                responsible: this.ensureStringValue(item.responsible)
            }));
        }
        
        // 참석자 목록 정규화
        if (normalizedData.attendeeList) {
            normalizedData.attendeeList = normalizedData.attendeeList.map(item => ({
                name: this.ensureStringValue(item.name),
                position: this.ensureStringValue(item.position),
                department: this.ensureStringValue(item.department),
                work: this.ensureStringValue(item.work),
                attendance: this.ensureStringValue(item.attendance) || 'N'
            }));
        }
        
        return normalizedData;
    },

    // 회차 필드 업데이트
    updateSessionField(value) {
        const selectElement = document.getElementById('sessionSelect');
        const inputElement = document.getElementById('sessionInput');
        
        if (value === '직접입력') {
            selectElement.style.display = 'none';
            inputElement.classList.remove('hidden');
            inputElement.focus();
            this.currentData.session = '';
        } else if (value) {
            selectElement.style.display = 'block';
            inputElement.classList.add('hidden');
            this.currentData.session = value;
        }
    },

    // 회차 값 업데이트
    updateSessionValue(value) {
        this.currentData.session = value;
    },

    // 회차 필드 데이터 채우기
    populateSessionField() {
        const selectElement = document.getElementById('sessionSelect');
        const inputElement = document.getElementById('sessionInput');
        
        if (this.currentData.session) {
            const sessionOptions = [
                '제 1회', '제 2회', '제 3회', '제 4회', '제 5회', '제 6회', '제 7회', '제 8회', '제 9회', '제10회',
                '제11회', '제12회', '제13회', '제14회', '제15회', '제16회', '제17회', '제18회', '제19회', '제20회'
            ];
            
            if (sessionOptions.includes(this.currentData.session)) {
                // 선택 옵션에 있는 경우
                selectElement.value = this.currentData.session;
                selectElement.style.display = 'block';
                inputElement.classList.add('hidden');
            } else {
                // 직접 입력된 경우
                selectElement.value = '직접입력';
                selectElement.style.display = 'none';
                inputElement.classList.remove('hidden');
                inputElement.value = this.currentData.session;
            }
        }
    }
});

// 로드 버튼 이벤트 바인딩
document.addEventListener('DOMContentLoaded', function() {
    const loadBtn = document.getElementById('loadBtn');
    if (loadBtn && window.seminarApp) {
        loadBtn.addEventListener('click', () => window.seminarApp.showSearchModal());
    }
});
