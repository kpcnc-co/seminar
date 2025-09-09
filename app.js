// 전사 신기술 세미나 실행계획 웹앱 메인 JavaScript

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
        
        // 라이브러리 로딩 상태 확인 및 초기화
        this.initializeApp().catch(error => {
            console.error('앱 초기화 오류:', error);
        });
    }
    
    async initializeApp() {
        await this.checkLibraries();
        await this.init();
    }

    

    // 간단한 라이브러리 상태 확인
    async checkLibraries() {
        console.log('🔍 내보내기 라이브러리 상태 확인 중...');
        
        // exportLibraries 객체가 준비될 때까지 대기
        let attempts = 0;
        const maxAttempts = 30; // 최대 3초 대기
        
        while (attempts < maxAttempts) {
            if (window.exportLibraries) {
                console.log('✅ 내보내기 라이브러리 상태 확인 완료');
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (attempts === maxAttempts) {
            console.warn('⚠️ 내보내기 라이브러리 상태 확인 시간 초과');
        }
        
        // 라이브러리 상태 출력
        if (window.exportLibraries) {
            console.log('📊 내보내기 라이브러리 상태:', window.exportLibraries);
        }
    }
    
    // 라이브러리 존재 여부 확인 (간단한 방식)
    getLibrary(name) {
        if (window.exportLibraries && window.exportLibraries[name]) {
            return true;
        }
        
        // 특별한 경우들 처리
        if (name === 'jsPDF' && (window.jsPDF || window.jspdf?.jsPDF)) {
            return true;
        }
        if (name === 'saveAs' && window.saveAs) {
            return true;
        }
        
        return false;
    }

    // 라이브러리 인스턴스 반환 (간단한 방식)
    getLibraryInstance(name) {
        // exportLibraries 상태 확인
        if (window.exportLibraries && !window.exportLibraries[name]) {
            console.warn(`⚠️ ${name} 라이브러리가 로드되지 않았습니다.`);
            return null;
        }
        
        // 특별한 경우들 처리
        if (name === 'jsPDF') {
            if (window.jsPDF) {
                console.log(`🎯 ${name} 라이브러리 (window.jsPDF) 접근 성공`);
                return window.jsPDF;
            }
            if (window.jspdf?.jsPDF) {
                console.log(`🎯 ${name} 라이브러리 (window.jspdf.jsPDF) 접근 성공`);
                return window.jspdf.jsPDF;
            }
        }
        
        if (name === 'saveAs' && window.saveAs) {
            console.log(`🎯 ${name} 라이브러리 (window.saveAs) 접근 성공`);
            return window.saveAs;
        }
        
        console.error(`❌ ${name} 라이브러리를 찾을 수 없습니다.`);
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
        // 초기화 버튼
        document.getElementById('resetBtn').addEventListener('click', () => this.resetForm());
        
        // 저장 버튼
        document.getElementById('saveBtn').addEventListener('click', () => this.saveData());
        
        // 삭제 버튼
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteData());
        
        // 일괄삭제 버튼
        //document.getElementById('bulkDeleteBtn').addEventListener('click', () => this.bulkDeleteData());
        
        // 조회 버튼
        document.getElementById('loadBtn').addEventListener('click', () => this.showSearchModal());
        
        
        // 시간 계획 행 추가
        document.getElementById('addTimeRow').addEventListener('click', () => this.addTimeRow());
        
        // 참석자 행 추가
        document.getElementById('addAttendeeRow').addEventListener('click', () => this.addAttendeeRow());
        
        // 참석자 전체 삭제
        const deleteAllBtn = document.getElementById('deleteAllAttendees');
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', () => this.deleteAllAttendees());
        }
        
        // 참석전체 Y 처리 버튼
        document.getElementById('selectAllAttendees').addEventListener('click', () => this.selectAllAttendees());
        
        
        // 내보내기 버튼들
        document.getElementById('exportPDF').addEventListener('click', () => this.exportToPDF());
        document.getElementById('exportResultPDF').addEventListener('click', () => this.exportResultToPDF());
        
        
        // 메인화면 실시결과 스케치 이벤트
        document.getElementById('mainSketchFile0').addEventListener('change', (e) => this.handleMainFileUpload(e, 0));
        document.getElementById('mainRemoveFile0').addEventListener('click', () => this.removeMainFile(0));
        document.getElementById('mainDownloadFile0').addEventListener('click', () => this.downloadMainFile(0));
        document.getElementById('mainFileUploadArea0').addEventListener('click', () => document.getElementById('mainSketchFile0').click());
        
        document.getElementById('mainSketchFile1').addEventListener('change', (e) => this.handleMainFileUpload(e, 1));
        document.getElementById('mainRemoveFile1').addEventListener('click', () => this.removeMainFile(1));
        document.getElementById('mainDownloadFile1').addEventListener('click', () => this.downloadMainFile(1));
        document.getElementById('mainFileUploadArea1').addEventListener('click', () => document.getElementById('mainSketchFile1').click());
        
        // 스케치 업로드 추가 버튼
        document.getElementById('addSketchUpload').addEventListener('click', () => this.addSketchUpload());
        
        // 스케치 삭제 버튼 (이벤트 위임)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.removeSketchBtn')) {
                const removeBtn = e.target.closest('.removeSketchBtn');
                const sketchIndex = removeBtn.getAttribute('data-sketch-index');
                console.log('삭제 버튼 클릭됨, data-sketch-index:', sketchIndex);
                this.removeSketchUpload(parseInt(sketchIndex));
            }
        });
        
        // 메인화면 실시결과 저장 버튼
        //document.getElementById('saveMainResultBtn').addEventListener('click', () => this.saveMainResultData());
             
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
        // 기본 정보 입력 필드들
        const basicFields = ['objective', 'location', 'attendees'];
        basicFields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.currentData[field] = e.target.value;
                });
            }
        });
        
        // 일시 필드에 대한 특별한 처리
        const datetimeElement = document.getElementById('datetime');
        if (datetimeElement) {
            datetimeElement.addEventListener('input', (e) => {
                this.currentData.datetime = e.target.value;
                this.validateDateTimeFormat(e.target);
            });
            
            datetimeElement.addEventListener('blur', (e) => {
                this.validateDateTimeFormat(e.target);
            });
        }
        
        // 주요 내용 필드에 대한 특별한 처리 (PDF 실시결과 내보내기 버튼 제어)
        const mainContentElement = document.getElementById('mainResultContent');
        if (mainContentElement) {
            mainContentElement.addEventListener('input', (e) => {
                this.toggleExportResultPDFButton();
            });
            
            mainContentElement.addEventListener('blur', (e) => {
                this.toggleExportResultPDFButton();
            });
        }
    }
    
    // PDF 실시결과 내보내기 버튼 표시/숨김 제어
    toggleExportResultPDFButton() {
        const mainContentElement = document.getElementById('mainResultContent');
        const exportResultPDFButton = document.getElementById('exportResultPDF');
        
        if (mainContentElement && exportResultPDFButton) {
            const hasContent = mainContentElement.value.trim().length > 0;
            
            if (hasContent) {
                exportResultPDFButton.style.display = 'flex';
            } else {
                exportResultPDFButton.style.display = 'none';
            }
        }
    }
    
    // 빠른 저장 버튼 상태 관리
    toggleQuickSaveButtons() {
        const mainContentElement = document.getElementById('mainResultContent');
        const quickSaveResultBtn = document.getElementById('quickSaveResultBtn');
        
        if (mainContentElement && quickSaveResultBtn) {
            const hasContent = mainContentElement.value.trim().length > 0;
            
            if (hasContent) {
                quickSaveResultBtn.style.display = 'flex';
            } else {
                quickSaveResultBtn.style.display = 'none';
            }
        }
    }
    
    // 스케치 빠른 저장 버튼 상태 관리
    toggleQuickSaveSketchButton() {
        const quickSaveSketchBtn = document.getElementById('quickSaveSketchBtn');
        
        if (quickSaveSketchBtn) {
            // 스케치 정보가 변경되었는지 확인
            const hasSketchChanges = this.hasSketchChanges();
            
            if (hasSketchChanges) {
                quickSaveSketchBtn.style.display = 'flex';
            } else {
                quickSaveSketchBtn.style.display = 'none';
            }
        }
    }
    
    // 스케치 정보 변경 여부 확인
    hasSketchChanges() {
        const container = document.getElementById('sketchUploadContainer');
        const sketchElements = container.querySelectorAll('[data-sketch-number]');
        
        let hasCurrentChanges = false;
        
        sketchElements.forEach((sketchElement) => {
            const sketchNumber = sketchElement.getAttribute('data-sketch-number');
            const title = document.getElementById(`mainSketchTitle${sketchNumber}`)?.value.trim() || '';
            const file = document.getElementById(`mainSketchFile${sketchNumber}`)?.files[0];
            
            if (title.length > 0 || file) {
                hasCurrentChanges = true;
            }
        });
        
        // currentData에 스케치 정보가 있는지 확인 (조회된 데이터가 있는 경우)
        const hasExistingSketchData = this.currentData && this.currentData.sketches && this.currentData.sketches.length > 0;
        
        // 현재 변경사항이 있거나 기존 스케치 데이터가 있으면 활성화
        return hasCurrentChanges || hasExistingSketchData;
    }
    
    // 일시 형식 검증
    validateDateTimeFormat(element) {
        const value = element.value.trim();
        if (!value) {
            element.classList.remove('border-red-500', 'border-green-500');
            element.classList.add('border-gray-300');
            return;
        }
        
        // 다양한 날짜 형식 지원
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,  // 2025-08-10T14:00
            /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,  // 2025-08-10 14:00
            /^\d{4}-\d{2}-\d{2}$/,              // 2025-08-10
            /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/, // 2025/08/10 14:00
            /^\d{4}\/\d{2}\/\d{2}$/             // 2025/08/10
        ];
        
        const isValidFormat = datePatterns.some(pattern => pattern.test(value));
        const isValidDate = !isNaN(new Date(value).getTime());
        
        if (isValidFormat && isValidDate) {
            element.classList.remove('border-red-500');
            element.classList.add('border-green-500');
        } else {
            element.classList.remove('border-green-500');
            element.classList.add('border-red-500');
        }
    }

    async loadInitialData() {
        try {
            console.log('loadInitialData 시작');
            
            // loadData 함수가 정의되어 있는지 확인
            if (typeof window.loadData !== 'function') {
                console.warn('loadData 함수가 정의되지 않았습니다. firebase-config.js가 로드되었는지 확인하세요.');
                return;
            }
            
            // Firebase에서 저장된 데이터 불러오기
            console.log('Firebase에서 데이터 로드 시작...');
            const result = await window.loadData();
            console.log('Firebase 로드 결과:', result);
            
            if (result.success) {
                // Firebase에서 가져온 데이터에서 id 필드 제거
                const { id, ...dataWithoutId } = result.data;
                this.currentData = dataWithoutId;
                this.currentDocumentId = result.id; // Firebase 문서 ID 저장
                console.log('currentData 설정 완료:', this.currentData);
                console.log('currentDocumentId:', this.currentDocumentId);
                console.log('timeSchedule 원본 데이터:', this.currentData.timeSchedule);
                console.log('attendeeList 원본 데이터:', this.currentData.attendeeList);
                console.log('attendeeList 상세 데이터:');
                this.currentData.attendeeList.forEach((item, index) => {
                    console.log(`  [${index}] name: ${item.name}, attendance: ${item.attendance}`);
                });
                console.log('timeSchedule 타입:', typeof this.currentData.timeSchedule);
                console.log('attendeeList 타입:', typeof this.currentData.attendeeList);
                console.log('objective 값:', this.currentData.objective);
                console.log('datetime 값:', this.currentData.datetime);
                console.log('location 값:', this.currentData.location);
                console.log('attendees 값:', this.currentData.attendees);
                
                console.log('populateForm 호출 시작...');
                await this.populateForm();
                console.log('populateForm 호출 완료');
                
                console.log('Firebase에서 데이터를 성공적으로 불러왔습니다.');
            } else {
                console.log('저장된 데이터가 없습니다:', result.message);
            }
        } catch (error) {
            console.error('초기 데이터 로드 오류:', error);
        }
    }

    async populateForm() {
        console.log('populateForm 시작 - currentData:', this.currentData);
        console.log('currentData 타입:', typeof this.currentData);
        console.log('currentData 키들:', Object.keys(this.currentData || {}));
        console.log('attendeeList 존재 여부:', 'attendeeList' in (this.currentData || {}));
        console.log('timeSchedule 존재 여부:', 'timeSchedule' in (this.currentData || {}));
        console.log('populateForm에서 objective 값:', this.currentData.objective);
        console.log('populateForm에서 datetime 값:', this.currentData.datetime);
        console.log('populateForm에서 location 값:', this.currentData.location);
        console.log('populateForm에서 attendees 값:', this.currentData.attendees);
        
        // currentData가 null이거나 undefined인 경우 처리
        if (!this.currentData) {
            console.error('currentData가 null 또는 undefined입니다.');
            return;
        }
        
        // 데이터 구조 정규화만 실행 (마이그레이션 제거)
        this.normalizeDataStructure();
        
        // 기본 정보 채우기 (목표 포함)
        console.log('기본 정보 채우기 시작...');
        
        // 회차 필드 특별 처리
        if (this.currentData.session) {
            console.log('회차 필드 처리 중...');
            this.populateSessionField();
        }
        
        // 각 필드별로 직접 매핑
        const fieldMappings = [
            { key: 'objective', id: 'objective' },
            { key: 'datetime', id: 'datetime' },
            { key: 'location', id: 'location' },
            { key: 'attendees', id: 'attendees' }
        ];
        
        fieldMappings.forEach(mapping => {
            const value = this.currentData[mapping.key];
            const element = document.getElementById(mapping.id);
            
            console.log(`필드 매핑: ${mapping.key} -> ${mapping.id}, 값: "${value}", 요소:`, element);
            
            if (element) {
                if (value !== undefined && value !== null && value !== '') {
                    element.value = value;
                    console.log(`값 설정 완료: ${mapping.key} = "${value}"`);
                } else {
                    console.log(`값이 비어있어서 설정하지 않음: ${mapping.key} = "${value}"`);
                }
            } else {
                console.log(`요소를 찾을 수 없음: ${mapping.key}`, element);
            }
        });

        // 시간 계획 테이블 채우기
        console.log('시간 계획 테이블 채우기 시작...');
        this.populateTimeTable();
        console.log('시간 계획 테이블 채우기 완료');
        
        // 참석자 테이블 채우기
        console.log('참석자 테이블 채우기 시작...');
        this.populateAttendeeTable();
        console.log('참석자 테이블 채우기 완료');
        
        // 실시결과 데이터도 함께 로드 (목표 포함)
        await this.loadMainResultData();
        
        // 스케치 정보가 있으면 표시 (loadMainResultData 후에)
        if (this.currentData.sketches && this.currentData.sketches.length > 0) {
            console.log('🖼️ currentData에서 스케치 정보 발견, 표시:', this.currentData.sketches);
            this.populateMainResultForm({ sketches: this.currentData.sketches });
        }
        
        // PDF 실시결과 내보내기 버튼 상태 초기화
        this.toggleExportResultPDFButton();
        
        // 빠른 저장 버튼 상태 초기화
        this.toggleQuickSaveButtons();
        
        console.log('populateForm 완료');
    }

    addDefaultRows() {
        // 기본 시간 계획 행 추가 (직접 생성, addTimeRow() 호출하지 않음)
        if (this.currentData.timeSchedule.length === 0) {
            const tbody = document.getElementById('timeTableBody');
            const row = document.createElement('tr');
            row.className = 'table-row-hover';
            row.innerHTML = `
                <td class="px-4 py-3 border-b">
                    <select class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" data-index="0" data-field="type">
                        <option value="">선택</option>
                        <option value="발표">발표</option>
                        <option value="토의">토의</option>
                        <option value="정리">정리</option>
                        <option value="석식">석식</option>
                        <option value="보고">보고</option>
                    </select>
                </td>
                <td class="px-4 py-3 border-b">
                    <textarea class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
                              placeholder="주요 내용을 입력하세요 (엔터로 줄바꿈)" 
                              rows="2"
                              data-index="0" data-field="content"></textarea>
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="시간을 입력하세요 (예: 16:00)" 
                           data-index="0" data-field="time">
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="담당자를 입력하세요" 
                           data-index="0" data-field="responsible">
                </td>
                <td class="px-4 py-3 border-b">
                    <button onclick="app.removeTimeRow(0)" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
            
            // 이벤트 리스너 추가 (모바일 환경 고려)
            this.bindTimeRowEvents(row, 0);
            
            // 데이터 구조에 기본 행 추가
            this.currentData.timeSchedule[0] = {
                type: '',
                content: '',
                time: '',
                responsible: ''
            };
        }
        
        // 기본 참석자 행 추가 (직접 생성, addAttendeeRow() 호출하지 않음)
        if (this.currentData.attendeeList.length === 0) {
            const tbody = document.getElementById('attendeeTableBody');
            const row = document.createElement('tr');
            row.className = 'table-row-hover';
            row.innerHTML = `
                <td class="px-4 py-3 border-b text-center">1</td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="성명을 입력하세요" 
                           data-index="0" data-field="name">
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="직급을 입력하세요" 
                           data-index="0" data-field="position">
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="소속을 입력하세요" 
                           data-index="0" data-field="department">
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="업무를 입력하세요" 
                           data-index="0" data-field="work">
                </td>
                <td class="px-4 py-3 border-b">
                    <select class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            data-index="0" data-field="attendance">
                        <option value="Y">Y</option>
                        <option value="N" selected>N</option>
                    </select>
                </td>
                <td class="px-4 py-3 border-b">
                    <button onclick="app.removeAttendeeRow(0)" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
            
            // 이벤트 리스너 추가 (모바일 환경 고려)
            this.bindAttendeeRowEvents(row, 0);
            
            // 데이터 구조에 기본 행 추가
            this.currentData.attendeeList[0] = {
                name: '',
                position: '',
                department: '',
                work: '',
                attendance: 'N'  // 기본값 N으로 설정
            };
        }
    }

    addTimeRow() {
        const tbody = document.getElementById('timeTableBody');
        const rowCount = tbody.children.length;
        
        const row = document.createElement('tr');
        row.className = 'table-row-hover';
        row.innerHTML = `
            <td class="px-4 py-3 border-b">
                <select class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" data-index="${rowCount}" data-field="type">
                    <option value="">선택</option>
                    <option value="발표">발표</option>
                    <option value="토의">토의</option>
                    <option value="정리">정리</option>
                    <option value="석식">석식</option>
                    <option value="보고">보고</option>
                </select>
            </td>
            <td class="px-4 py-3 border-b">
                <textarea class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
                          placeholder="주요 내용을 입력하세요 (엔터로 줄바꿈)" 
                          rows="2"
                          data-index="${rowCount}" data-field="content"></textarea>
            </td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="시간을 입력하세요 (예: 16:00)" 
                       data-index="${rowCount}" data-field="time">
            </td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="담당자를 입력하세요" 
                       data-index="${rowCount}" data-field="responsible">
            </td>
            <td class="px-4 py-3 border-b">
                <button onclick="app.removeTimeRow(${rowCount})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // 이벤트 리스너 추가 (모바일 환경 고려)
        this.bindTimeRowEvents(row, rowCount);
        
        // 데이터 구조에 새 행 추가
        this.currentData.timeSchedule[rowCount] = {
            type: '',
            content: '',
            time: '',
            responsible: ''
        };
    }

    addAttendeeRow() {
        const tbody = document.getElementById('attendeeTableBody');
        const rowCount = tbody.children.length;
        
        const row = document.createElement('tr');
        row.className = 'table-row-hover';
        row.innerHTML = `
            <td class="px-4 py-3 border-b text-center">${rowCount + 1}</td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="성명을 입력하세요" 
                       data-field="name">
            </td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="직급을 입력하세요" 
                       data-field="position">
            </td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="소속을 입력하세요" 
                       data-field="department">
            </td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="업무를 입력하세요" 
                       data-field="work">
            </td>
            <td class="px-4 py-3 border-b">
                <select class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        data-field="attendance">
                    <option value="Y">Y</option>
                    <option value="N" selected>N</option>
                </select>
            </td>
            <td class="px-4 py-3 border-b">
                <button onclick="app.removeAttendeeRow(${rowCount})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // 이벤트 리스너 추가 (모바일 환경 고려)
        this.bindAttendeeRowEvents(row, rowCount);
        
        // 직접입력 토글 이벤트는 bindAttendeeRowEvents에서 처리됨
        
        // 데이터 구조에 새 행 추가
        this.currentData.attendeeList[rowCount] = {
            name: '',
            position: '',
            department: '',
            work: '',
            attendance: 'N'  // 기본값 N으로 설정
        };
    }

    // 참석전체 Y 처리 함수
    selectAllAttendees() {
        console.log('참석전체 Y 처리 시작');
        
        const tbody = document.getElementById('attendeeTableBody');
        const rows = tbody.children;
        
        let updatedCount = 0;
        
        // 모든 참석자 행의 참석여부를 'Y'로 변경
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const attendanceSelect = row.querySelector('select[data-field="attendance"]');
            
            if (attendanceSelect) {
                attendanceSelect.value = 'Y';
                updatedCount++;
                
                // 데이터 구조도 업데이트
                if (this.currentData.attendeeList[i]) {
                    this.currentData.attendeeList[i].attendance = 'Y';
                }
            }
        }
        
        console.log(`참석전체 Y 처리 완료: ${updatedCount}명 업데이트`);
        
        // 성공 메시지 표시
        this.showSuccessToast(`${updatedCount}명의 참석여부가 'Y'로 변경되었습니다.`);
    }

    updateTimeSchedule(index, field, value) {
        if (this.currentData.timeSchedule[index]) {
            this.currentData.timeSchedule[index][field] = value;
        }
    }

    updateAttendeeList(index, field, value) {
        if (this.currentData.attendeeList[index]) {
            this.currentData.attendeeList[index][field] = value;
            console.log(`참석자 데이터 업데이트: index=${index}, field=${field}, value=${value}`);
            console.log(`업데이트 후 참석자 데이터:`, this.currentData.attendeeList[index]);
            
            // 참석여부 변경 시 즉시 저장 (백그라운드)
            if (field === 'attendance') {
                this.saveDataQuietly();
            }
        }
    }
    

    removeTimeRow(index) {
        const tbody = document.getElementById('timeTableBody');
        if (tbody.children.length > 1) {
            tbody.children[index].remove();
            this.currentData.timeSchedule.splice(index, 1);
            this.reorderTimeRows();
        }
    }

    removeAttendeeRow(index) {
        const tbody = document.getElementById('attendeeTableBody');
        if (tbody.children.length > 1) {
            tbody.children[index].remove();
            this.currentData.attendeeList.splice(index, 1);
            this.reorderAttendeeRows();
        }
    }

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
    }

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
    }

    reorderAttendeeRows() {
        const tbody = document.getElementById('attendeeTableBody');
        Array.from(tbody.children).forEach((row, index) => {
            // 번호 업데이트
            const numberCell = row.children[0];
            numberCell.textContent = index + 1;
            
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
                input.onchange = (e) => {
                    this.updateAttendeeList(index, this.getFieldName(input), e.target.value);
                };
            });
            
            const deleteBtn = row.querySelector('button');
            deleteBtn.onclick = () => this.removeAttendeeRow(index);
        });
    }

    getFieldName(input) {
        const placeholder = input.placeholder;
        if (placeholder.includes('성명')) return 'name';
        if (placeholder.includes('직급')) return 'position';
        if (placeholder.includes('소속')) return 'department';
        if (placeholder.includes('업무')) return 'work';
        if (placeholder.includes('주요 내용')) return 'content';
        if (placeholder.includes('시간')) return 'time';
        if (placeholder.includes('담당자')) return 'responsible';
        return '';
    }

    populateTimeTable() {
        const tbody = document.getElementById('timeTableBody');
        tbody.innerHTML = '';
        
        console.log('시간 계획 데이터:', this.currentData.timeSchedule);
        console.log('시간 계획 데이터 타입:', typeof this.currentData.timeSchedule);
        console.log('시간 계획 데이터 길이:', this.currentData.timeSchedule ? this.currentData.timeSchedule.length : 'undefined');
        console.log('시간 계획 데이터가 배열인가?', Array.isArray(this.currentData.timeSchedule));
        console.log('시간 계획 데이터 키들:', this.currentData.timeSchedule ? Object.keys(this.currentData.timeSchedule) : 'undefined');
        
        if (!this.currentData.timeSchedule) {
            console.error('시간 계획 데이터가 undefined입니다.');
            return;
        }
        
        if (this.currentData.timeSchedule.length === 0) {
            console.log('시간 계획 데이터가 비어있습니다.');
            return;
        }
        
        console.log('시간 계획 테이블 렌더링 시작...');
        
        this.currentData.timeSchedule.forEach((item, index) => {
            console.log(`시간 계획 아이템 처리 중: index=${index}, item=`, item);
            
            // 직접 행 생성 (addTimeRow() 호출하지 않음)
            const row = document.createElement('tr');
            row.className = 'table-row-hover';
            row.innerHTML = `
                <td class="px-4 py-3 border-b">
                    <select class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" data-index="${index}" data-field="type">
                        <option value="">선택</option>
                        <option value="발표">발표</option>
                        <option value="토의">토의</option>
                        <option value="정리">정리</option>
                        <option value="석식">석식</option>
                        <option value="보고">보고</option>
                    </select>
                </td>
                <td class="px-4 py-3 border-b">
                    <textarea class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
                              placeholder="주요 내용을 입력하세요 (엔터로 줄바꿈)" 
                              rows="2"
                              data-index="${index}" data-field="content"></textarea>
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="시간을 입력하세요 (예: 16:00)" 
                           data-index="${index}" data-field="time">
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="담당자를 입력하세요" 
                           data-index="${index}" data-field="responsible">
                </td>
                <td class="px-4 py-3 border-b">
                    <button onclick="app.removeTimeRow(${index})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
            console.log(`시간 계획 행 추가됨: index=${index}, type=${item.type}`);
            
            // 데이터 채우기 (모바일 환경 고려)
            const inputs = row.querySelectorAll('input, select, textarea');
            console.log(`시간 계획 입력 요소들:`, inputs);
            
            // select 요소 (type)
            const typeSelect = row.querySelector('select[data-field="type"]');
            if (typeSelect && item.type !== undefined && item.type !== null) {
                typeSelect.value = item.type;
                console.log(`시간 계획 select 값 설정: ${item.type}`);
                // 모바일에서 select 값이 제대로 설정되도록 강제 업데이트
                setTimeout(() => {
                    typeSelect.value = item.type;
                }, 10);
            }
            
            // textarea 요소 (content)
            const contentTextarea = row.querySelector('textarea[data-field="content"]');
            if (contentTextarea && item.content !== undefined && item.content !== null) {
                contentTextarea.value = item.content;
                contentTextarea.textContent = item.content;
                console.log(`시간 계획 textarea 값 설정: ${item.content}`);
            }
            
            // input 요소 (time)
            const timeInput = row.querySelector('input[data-field="time"]');
            if (timeInput && item.time !== undefined && item.time !== null) {
                timeInput.value = item.time;
                timeInput.setAttribute('value', item.time);
                console.log(`시간 계획 time 값 설정: ${item.time}`);
            }
            
            // input 요소 (responsible)
            const responsibleInput = row.querySelector('input[data-field="responsible"]');
            if (responsibleInput && item.responsible !== undefined && item.responsible !== null) {
                responsibleInput.value = item.responsible;
                responsibleInput.setAttribute('value', item.responsible);
                console.log(`시간 계획 responsible 값 설정: ${item.responsible}`);
            }
            
            // 이벤트 리스너 추가 (모바일 환경 고려)
            this.bindTimeRowEvents(row, index);
            
            console.log(`시간 계획 행 추가됨: index=${index}, type=${item.type}`);
            console.log(`시간 계획 행 DOM 요소:`, row);
        });
        
        console.log('시간 계획 테이블 렌더링 완료. 총 행 수:', tbody.children.length);
        console.log('tbody 자식 요소들:', tbody.children);
    }
    
    // 시간 계획 행 이벤트 바인딩 (모바일 환경 고려)
    bindTimeRowEvents(row, index) {
        const inputs = row.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            // 모바일에서 input 이벤트가 제대로 작동하도록 여러 이벤트 리스너 추가
            input.addEventListener('input', (e) => {
                this.updateTimeSchedule(index, input.dataset.field, e.target.value);
            });
            input.addEventListener('change', (e) => {
                this.updateTimeSchedule(index, input.dataset.field, e.target.value);
            });
            input.addEventListener('blur', (e) => {
                this.updateTimeSchedule(index, input.dataset.field, e.target.value);
            });
        });
    }
    
    // 참석자 행 이벤트 바인딩 (모바일 환경 고려)
    bindAttendeeRowEvents(row, index) {
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach(input => {
            const fieldName = input.dataset.field;
            // 모바일에서 input 이벤트가 제대로 작동하도록 여러 이벤트 리스너 추가
            input.addEventListener('input', (e) => {
                this.updateAttendeeList(index, fieldName, e.target.value);
            });
            input.addEventListener('change', (e) => {
                this.updateAttendeeList(index, fieldName, e.target.value);
            });
            input.addEventListener('blur', (e) => {
                this.updateAttendeeList(index, fieldName, e.target.value);
            });
        });
    }

    // 데이터 구조 정규화 (Firebase 데이터 호환성)
    normalizeDataStructure() {
        console.log('데이터 구조 정규화 시작');
        
        // timeSchedule 정규화
        if (this.currentData.timeSchedule) {
            if (typeof this.currentData.timeSchedule === 'object' && !Array.isArray(this.currentData.timeSchedule)) {
                console.log('timeSchedule을 객체에서 배열로 변환');
                // Object.values() 대신 키 순서대로 배열 생성
                const keys = Object.keys(this.currentData.timeSchedule).sort((a, b) => parseInt(a) - parseInt(b));
                this.currentData.timeSchedule = keys.map(key => this.currentData.timeSchedule[key]);
                console.log('변환된 timeSchedule:', this.currentData.timeSchedule);
            } else if (Array.isArray(this.currentData.timeSchedule)) {
                console.log('timeSchedule은 이미 배열입니다:', this.currentData.timeSchedule.length, '개 항목');
            }
        } else {
            console.log('timeSchedule이 없습니다. 빈 배열로 초기화');
            this.currentData.timeSchedule = [];
        }
        
        // attendeeList 정규화
        if (this.currentData.attendeeList) {
            if (typeof this.currentData.attendeeList === 'object' && !Array.isArray(this.currentData.attendeeList)) {
                console.log('attendeeList를 객체에서 배열로 변환');
                // Object.values() 대신 키 순서대로 배열 생성
                const keys = Object.keys(this.currentData.attendeeList).sort((a, b) => parseInt(a) - parseInt(b));
                this.currentData.attendeeList = keys.map(key => this.currentData.attendeeList[key]);
                console.log('변환된 attendeeList:', this.currentData.attendeeList);
            } else if (Array.isArray(this.currentData.attendeeList)) {
                console.log('attendeeList는 이미 배열입니다:', this.currentData.attendeeList.length, '개 항목');
            }
        } else {
            console.log('attendeeList가 없습니다. 빈 배열로 초기화');
            this.currentData.attendeeList = [];
        }
        
        console.log('데이터 구조 정규화 완료');
        console.log('정규화 후 timeSchedule:', this.currentData.timeSchedule);
        console.log('정규화 후 attendeeList:', this.currentData.attendeeList);
        console.log('정규화 후 attendeeList 상세:');
        this.currentData.attendeeList.forEach((item, index) => {
            console.log(`  [${index}] name: ${item.name}, attendance: ${item.attendance}`);
        });
    }


    populateAttendeeTable() {
        const tbody = document.getElementById('attendeeTableBody');
        tbody.innerHTML = '';
        
        
        console.log('참석자 데이터 전체:', this.currentData.attendeeList);
        console.log('참석자 데이터 타입:', typeof this.currentData.attendeeList);
        console.log('참석자 데이터 길이:', this.currentData.attendeeList ? this.currentData.attendeeList.length : 'undefined');
        console.log('참석자 데이터가 배열인가?', Array.isArray(this.currentData.attendeeList));
        console.log('참석자 데이터 키들:', this.currentData.attendeeList ? Object.keys(this.currentData.attendeeList) : 'undefined');
        
        if (!this.currentData.attendeeList) {
            console.error('참석자 데이터가 undefined입니다.');
            return;
        }
        
        if (this.currentData.attendeeList.length === 0) {
            console.log('참석자 데이터가 비어있습니다.');
            return;
        }
        
        console.log('참석자 테이블 렌더링 시작...');
        
        this.currentData.attendeeList.forEach((item, index) => {
            console.log(`참석자 아이템 처리 중: index=${index}, item=`, item);
            console.log(`참석여부 확인: index=${index}, name=${item.name}, attendance=${item.attendance}`);
            
            // 직접 행 생성 (addAttendeeRow() 호출하지 않음)
            const row = document.createElement('tr');
            row.className = 'table-row-hover';
            row.innerHTML = `
                <td class="px-4 py-3 border-b text-center">${index + 1}</td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="성명을 입력하세요" 
                           data-field="name"
                           onchange="app.updateAttendeeList(${index}, 'name', this.value)">
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="직급을 입력하세요" 
                           data-field="position">
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="소속을 입력하세요" 
                           data-field="department"
                           onchange="app.updateAttendeeList(${index}, 'department', this.value)">
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="업무를 입력하세요" 
                           data-field="work">
                </td>
                <td class="px-4 py-3 border-b">
                    <select class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            data-field="attendance"
                            onchange="app.updateAttendeeList(${index}, 'attendance', this.value)">
                        <option value="Y" ${item.attendance === 'Y' ? 'selected' : ''}>Y</option>
                        <option value="N" ${(item.attendance === 'N' || !item.attendance) ? 'selected' : ''}>N</option>
                    </select>
                </td>
                <td class="px-4 py-3 border-b">
                    <button onclick="app.removeAttendeeRow(${index})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
            
            // 데이터 채우기 (모바일 환경 고려)
            const nameInput = row.querySelector('input[data-field="name"]');
            
            if (nameInput && item.name !== undefined && item.name !== null) {
                nameInput.value = item.name;
                nameInput.setAttribute('value', item.name);
                console.log(`참석자 name 값 설정: ${item.name}`);
            }
            
            // 직급 필드 처리 (텍스트 입력)
            const positionInput = row.querySelector('[data-field="position"]');
            if (positionInput) {
                positionInput.value = item.position || '';
                positionInput.setAttribute('value', item.position || '');
            }
            
            // 소속 필드 처리 (텍스트 입력)
            const departmentInput = row.querySelector('[data-field="department"]');
            if (departmentInput) {
                departmentInput.value = item.department || '';
                departmentInput.setAttribute('value', item.department || '');
            }
            
            // 업무 필드 처리 (텍스트 입력)
            const workInput = row.querySelector('[data-field="work"]');
            if (workInput) {
                workInput.value = item.work || '';
                workInput.setAttribute('value', item.work || '');
            }
            
            // 참석여부 필드 처리
            const attendanceSelect = row.querySelector('select[data-field="attendance"]');
            if (attendanceSelect) {
                // 참석여부 값이 있으면 해당 값으로 설정, 없으면 기본값 'N'으로 설정
                const attendanceValue = (item.attendance !== undefined && item.attendance !== null && item.attendance !== '') ? item.attendance : 'N';
                console.log(`참석여부 값 설정: index=${index}, attendanceValue=${attendanceValue}, item.attendance=${item.attendance}`);
                
                // 강제로 value 설정
                attendanceSelect.value = attendanceValue;
                
                // 모든 옵션의 selected 속성 제거
                const options = attendanceSelect.querySelectorAll('option');
                options.forEach(option => {
                    option.removeAttribute('selected');
                    option.selected = false;
                });
                
                // 해당 값의 옵션에 selected 속성 추가
                const targetOption = attendanceSelect.querySelector(`option[value="${attendanceValue}"]`);
                if (targetOption) {
                    targetOption.setAttribute('selected', 'selected');
                    targetOption.selected = true;
                }
                
                // 다시 한번 value 설정
                attendanceSelect.value = attendanceValue;
                
                console.log(`참석여부 설정: index=${index}, value=${attendanceValue}, item.attendance=${item.attendance}`);
                
                // 참석여부 값이 제대로 설정되었는지 확인
                setTimeout(() => {
                    console.log(`참석여부 확인: index=${index}, 실제값=${attendanceSelect.value}, 예상값=${attendanceValue}`);
                }, 100);
            }
            
            // 이벤트 리스너 추가 (모바일 환경 고려)
            this.bindAttendeeRowEvents(row, index);
            
            // 직접입력 토글 이벤트는 bindAttendeeRowEvents에서 처리됨
            
            // 행을 tbody에 추가
            tbody.appendChild(row);
            console.log(`참석자 행 추가됨: index=${index}, name=${item.name}`);
            console.log(`참석자 행 DOM 요소:`, row);
        });
        
        console.log('참석자 테이블 렌더링 완료. 총 행 수:', tbody.children.length);
        console.log('tbody 자식 요소들:', tbody.children);
    }

    async saveData() {
        try {
            // 필요한 함수들이 정의되어 있는지 확인
            if (typeof window.saveData !== 'function' || typeof window.updateData !== 'function') {
                this.showErrorToast('필요한 함수들이 정의되지 않았습니다. firebase-config.js가 로드되었는지 확인하세요.');
                return;
            }
            
            this.showLoading(true);
            
            // 현재 폼 데이터 수집
            this.collectFormData();
            
            // 회차와 일시가 모두 입력되었는지 확인
            if (!this.currentData.session || !this.currentData.datetime) {
                this.showErrorToast('회차와 일시를 모두 입력해주세요.');
                return;
            }
            
            // 회차 + 일시를 키값으로 사용
            const keyValue = `${this.currentData.session}_${this.currentData.datetime}`;
            
            // 기존 데이터에서 동일한 키값을 가진 데이터 찾기
            const existingData = await this.findExistingDataByKey(keyValue);
            
            let result;
            
            if (existingData) {
                // 기존 데이터가 있으면 수정
                console.log('기존 데이터 발견, 수정 처리:', existingData.id);
                
                if (useLocalStorage) {
                    result = this.saveToLocalStorage(this.currentData, existingData.id);
                } else {
                    result = await window.updateData(existingData.id, this.currentData);
                }
                
                if (result.success) {
                    this.currentDocumentId = existingData.id;
                    this.showSuccessToast(`${this.currentData.session} 세미나 데이터가 수정되었습니다.`);
                }
            } else {
                // 기존 데이터가 없으면 새로 등록
                console.log('새 데이터 등록 처리');
                
                if (useLocalStorage) {
                    result = this.saveToLocalStorage(this.currentData);
                } else {
                    result = await window.saveData(this.currentData);
                }
                
                if (result.success && result.id) {
                    this.currentDocumentId = result.id;
                    this.showSuccessToast(`${this.currentData.session} 세미나 데이터가 새로 등록되었습니다.`);
                }
            }
            
            if (!result.success) {
                this.showErrorToast(result.message);
            } else {
                // 기본 데이터 저장 성공 시 실시결과 데이터도 저장
                console.log('📝 기본 데이터 저장 완료, 실시결과 데이터 저장 시작');
                await this.saveMainResultData(true); // skipLoading = true
                
                // 스케치 정보도 함께 저장
                console.log('🖼️ 스케치 정보 저장 시작');
                await this.saveSketchData(true); // skipLoading = true
            }
            
        } catch (error) {
            console.error('저장 오류:', error);
            this.showErrorToast('저장 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    // 조용한 저장 (로딩 표시 없음)
    async saveDataQuietly() {
        try {
            // 필요한 함수들이 정의되어 있는지 확인
            if (typeof window.saveData !== 'function' || typeof window.updateData !== 'function') {
                console.warn('필요한 함수들이 정의되지 않았습니다.');
                return;
            }
            
            // 현재 폼 데이터 수집
            this.collectFormData();
            
            // 회차와 일시가 모두 입력되었는지 확인
            if (!this.currentData.session || !this.currentData.datetime) {
                console.warn('회차와 일시를 모두 입력해주세요.');
                return;
            }
            
            // 회차 + 일시를 키값으로 사용
            const keyValue = `${this.currentData.session}_${this.currentData.datetime}`;
            
            // 기존 데이터에서 동일한 키값을 가진 데이터 찾기
            const existingData = await this.findExistingDataByKey(keyValue);
            
            let result;
            
            if (existingData) {
                // 기존 데이터가 있으면 수정
                console.log('참석여부 변경 - 기존 데이터 수정:', existingData.id);
                
                if (useLocalStorage) {
                    result = this.saveToLocalStorage(this.currentData, existingData.id);
                } else {
                    result = await window.updateData(existingData.id, this.currentData);
                }
                
                if (result.success) {
                    this.currentDocumentId = existingData.id;
                    console.log('참석여부 변경 저장 완료');
                }
            } else {
                // 기존 데이터가 없으면 새로 등록
                console.log('참석여부 변경 - 새 데이터 등록');
                
                if (useLocalStorage) {
                    result = this.saveToLocalStorage(this.currentData);
                } else {
                    result = await window.saveData(this.currentData);
                }
                
                if (result.success && result.id) {
                    this.currentDocumentId = result.id;
                    console.log('참석여부 변경 저장 완료');
                }
            }
            
            if (!result.success) {
                console.error('참석여부 변경 저장 실패:', result.message);
            }
            
        } catch (error) {
            console.error('참석여부 변경 저장 오류:', error);
        }
    }
    
    // 회차 + 일시 키값으로 기존 데이터 찾기
    async findExistingDataByKey(keyValue) {
        try {
            if (useLocalStorage) {
                // 로컬 스토리지에서 모든 세미나 데이터 찾기
                const allData = this.getAllLocalStorageData();
                
                for (const item of allData) {
                    if (item.data.session && item.data.datetime) {
                        const existingKey = `${item.data.session}_${item.data.datetime}`;
                        if (existingKey === keyValue) {
                            return { id: item.id, data: item.data };
                        }
                    }
                }
                return null;
            } else {
                // Firebase에서 데이터 찾기
                const snapshot = await db.collection('seminarPlans').get();
                
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    if (data.session && data.datetime) {
                        const existingKey = `${data.session}_${data.datetime}`;
                        if (existingKey === keyValue) {
                            return { id: doc.id, data: data };
                        }
                    }
                }
                return null;
            }
        } catch (error) {
            console.error('기존 데이터 찾기 오류:', error);
            return null;
        }
    }
    
    // 로컬 스토리지에서 모든 세미나 데이터 가져오기
    getAllLocalStorageData() {
        try {
            const data = localStorage.getItem('seminarPlans');
            if (data) {
                return JSON.parse(data);
            }
            return [];
        } catch (error) {
            console.error('로컬 스토리지 데이터 읽기 오류:', error);
            return [];
        }
    }
    
    // 로컬 스토리지에 세미나 데이터 저장/업데이트
    saveToLocalStorage(seminarData, id = null) {
        try {
            let allData = this.getAllLocalStorageData();
            
            if (id) {
                // 기존 데이터 업데이트
                const index = allData.findIndex(item => item.id === id);
                if (index !== -1) {
                    allData[index].data = seminarData;
                    allData[index].updatedAt = new Date().toISOString();
                } else {
                    // ID가 있지만 데이터를 찾을 수 없는 경우 새로 추가
                    allData.push({
                        id: id,
                        data: seminarData,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }
            } else {
                // 새 데이터 추가
                const newId = 'local_' + Date.now();
                allData.push({
                    id: newId,
                    data: seminarData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            
            localStorage.setItem('seminarPlans', JSON.stringify(allData));
            return { success: true, id: id || 'local_' + Date.now() };
        } catch (error) {
            console.error('로컬 스토리지 저장 오류:', error);
            return { success: false, message: error.message };
        }
    }



    async loadData() {
        try {
            this.showLoading(true);
            
            const result = await window.loadData();
            
            if (result.success) {
                // Firebase에서 가져온 데이터에서 id 필드 제거
                const { id, ...dataWithoutId } = result.data;
                this.currentData = dataWithoutId;
                this.currentDocumentId = result.id; // Firebase 문서 ID 저장
                
                console.log('📋 loadData로 로드된 데이터:', this.currentData);
                console.log('📋 스케치 정보:', this.currentData.sketches);
                
                await this.populateForm();
                
                this.showSuccessToast('Firebase에서 데이터를 성공적으로 불러왔습니다.');
            } else {
                this.showErrorToast(result.message);
            }
        } catch (error) {
            console.error('불러오기 오류:', error);
            this.showErrorToast('데이터 불러오기 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    collectFormData() {
        // 기본 정보 수집
        this.currentData.session = this.currentData.session || '';
        this.currentData.objective = document.getElementById('objective').value;
        this.currentData.datetime = document.getElementById('datetime').value;
        this.currentData.location = document.getElementById('location').value;
        this.currentData.attendees = document.getElementById('attendees').value;
        
        // 시간 계획 데이터 수집
        const timeRows = document.getElementById('timeTableBody').children;
        this.currentData.timeSchedule = [];
        
        Array.from(timeRows).forEach(row => {
            const inputs = row.querySelectorAll('input, select, textarea');
            this.currentData.timeSchedule.push({
                type: inputs[0]?.value || '',
                content: inputs[1]?.value || '',
                time: inputs[2]?.value || '',
                responsible: inputs[3]?.value || ''
            });
        });
        
        // 참석자 데이터 수집
        const attendeeRows = document.getElementById('attendeeTableBody').children;
        this.currentData.attendeeList = [];
        
        Array.from(attendeeRows).forEach((row, index) => {
            // data-field 속성을 사용하여 정확한 요소 선택
            const nameInput = row.querySelector('input[data-field="name"]');
            const positionInput = row.querySelector('[data-field="position"]');
            const departmentInput = row.querySelector('[data-field="department"]');
            const workInput = row.querySelector('[data-field="work"]');
            const attendanceSelect = row.querySelector('select[data-field="attendance"]');
            
            const position = positionInput ? positionInput.value : '';
            const department = departmentInput ? departmentInput.value : '';
            const work = workInput ? workInput.value : '';
            const attendance = attendanceSelect?.value || 'N';
            
            console.log(`참석자 데이터 수집: index=${index}, name=${nameInput?.value}, attendance=${attendance}`);
            
            this.currentData.attendeeList.push({
                name: nameInput?.value || '',
                position: position,
                department: department,
                work: work,
                attendance: attendance
            });
        });
        
        // 스케치 정보 수집
        this.currentData.sketches = this.getMainSketchData();
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
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
    }
    
    // 조회 모달 닫기
    closeSearchModal() {
        const modal = document.getElementById('searchModal');
        modal.classList.add('hidden');
        
        // 메인 화면 스크롤 복원
        document.body.style.overflow = '';
    }

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
    }



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
                
                console.log('📊 조회된 데이터:', sortedData);
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
    }


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
            row.className = 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 group';
            row.onclick = () => this.loadSeminarDetailByKey(item.session, item.datetime);
            
            // 모바일 호환성을 위한 데이터 처리
            const session = this.ensureStringValue(item.session) || '미입력';
            const datetime = this.ensureStringValue(item.datetime) || '미입력';
            const objective = this.ensureStringValue(item.objective) || '미입력';
            const location = this.ensureStringValue(item.location) || '미입력';
            const attendees = this.ensureStringValue(item.attendees) || '미입력';
            
            // 회차는 읽기 전용으로 표시
            const sessionBadge = session === '미입력' ? 
                '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">미입력</span>' :
                `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${this.escapeHtml(session)}</span>`;
            
            row.innerHTML = `
                <td class="px-6 py-4 w-40">
                    ${sessionBadge}
                </td>
                <td class="px-4 py-4 w-48">
                    <div class="flex items-center space-x-2 group-hover:text-blue-600 transition-colors duration-200">
                        <i class="fas fa-calendar-alt text-blue-400 group-hover:text-blue-600"></i>
                        <span class="font-medium text-sm">${this.escapeHtml(datetime)}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="max-w-xs">
                        <p class="text-gray-800 truncate group-hover:text-gray-900 transition-colors duration-200" title="${this.escapeHtml(objective)}">
                            ${this.escapeHtml(objective)}
                        </p>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-map-marker-alt text-red-400"></i>
                        <span class="text-gray-700">${this.escapeHtml(location)}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-users text-green-400"></i>
                        <span class="text-gray-700">${this.escapeHtml(attendees)}</span>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // 회차_일시 키값으로 세미나 상세 정보 로드
    async loadSeminarDetailByKey(session, datetime) {
        try {
            this.showLoading(true);
            console.log('🔍 세미나 상세 정보 로드 시작, 회차:', session, '일시:', datetime);
            
            // 회차_일시 키값 생성
            const keyValue = `${session}_${datetime}`;
            
            // 키값으로 기존 데이터 찾기
            const existingData = await this.findExistingDataByKey(keyValue);
            console.log('📊 조회 결과:', existingData);
            
            if (existingData) {
                // 모달 닫기
                this.closeSearchModal();
                
                // 데이터 유효성 검사 및 정규화
                const normalizedData = {
                    ...existingData.data,
                    session: this.ensureStringValue(existingData.data.session),
                    objective: this.ensureStringValue(existingData.data.objective),
                    datetime: this.ensureStringValue(existingData.data.datetime),
                    location: this.ensureStringValue(existingData.data.location),
                    attendees: this.ensureStringValue(existingData.data.attendees),
                    timeSchedule: Array.isArray(existingData.data.timeSchedule) ? existingData.data.timeSchedule.map(item => ({
                        type: this.ensureStringValue(item.type),
                        content: this.ensureStringValue(item.content),
                        time: this.ensureStringValue(item.time),
                        responsible: this.ensureStringValue(item.responsible)
                    })) : [],
                    attendeeList: Array.isArray(existingData.data.attendeeList) ? existingData.data.attendeeList.map(item => ({
                        name: this.ensureStringValue(item.name),
                        position: this.ensureStringValue(item.position),
                        department: this.ensureStringValue(item.department),
                        work: this.ensureStringValue(item.work),
                        attendance: item.attendance || 'N' // 참석여부 추가 (ensureStringValue 제거)
                    })) : [],
                    sketches: existingData.data.sketches || [] // 스케치 정보 추가
                };
                
                console.log('📋 정규화된 세미나 데이터:', normalizedData);
                console.log('📋 시간 계획 데이터:', normalizedData.timeSchedule);
                console.log('📋 참석자 데이터:', normalizedData.attendeeList);
                console.log('📋 스케치 데이터:', normalizedData.sketches);
                
                // 참석여부 상세 로그
                if (normalizedData.attendeeList && normalizedData.attendeeList.length > 0) {
                    console.log('📋 참석여부 상세 확인:');
                    normalizedData.attendeeList.forEach((attendee, idx) => {
                        console.log(`  [${idx}] ${attendee.name}: attendance=${attendee.attendance}`);
                    });
                }
                
                // 메인 화면에 데이터 로드
                this.currentData = normalizedData;
                this.currentDocumentId = existingData.id; // 찾은 데이터의 ID 사용
                console.log('📋 currentData 설정 완료:', this.currentData);
                
                await this.populateForm();
                console.log('📋 폼 채우기 완료');
                
                // 스케치 버튼 상태 확인
                setTimeout(() => {
                    this.toggleQuickSaveSketchButton();
                }, 100);
                
                this.showSuccessToast(`${session} 세미나 계획을 불러왔습니다.`);
            } else {
                console.error('❌ 세미나 조회 실패: 해당 회차와 일시의 데이터를 찾을 수 없습니다.');
                this.showErrorToast('해당 회차와 일시의 세미나 계획을 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('❌ 상세 정보 로드 오류:', error);
            this.showErrorToast('상세 정보 로드 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    // 세미나 상세 정보 로드 (기존 ID 기반 - 호환성 유지)
    async loadSeminarDetail(id) {
        try {
            this.showLoading(true);
            console.log('🔍 세미나 상세 정보 로드 시작, ID:', id);
            
            // Firebase에서 해당 문서 조회
            const result = await this.getSeminarById(id);
            console.log('📊 조회 결과:', result);
            
            if (result.success) {
                // 모달 닫기
                this.closeSearchModal();
                
                // 데이터 유효성 검사 및 정규화
                const normalizedData = {
                    ...result.data,
                    session: this.ensureStringValue(result.data.session),
                    objective: this.ensureStringValue(result.data.objective),
                    datetime: this.ensureStringValue(result.data.datetime),
                    location: this.ensureStringValue(result.data.location),
                    attendees: this.ensureStringValue(result.data.attendees),
                    timeSchedule: Array.isArray(result.data.timeSchedule) ? result.data.timeSchedule.map(item => ({
                        type: this.ensureStringValue(item.type),
                        content: this.ensureStringValue(item.content),
                        time: this.ensureStringValue(item.time),
                        responsible: this.ensureStringValue(item.responsible)
                    })) : [],
                    attendeeList: Array.isArray(result.data.attendeeList) ? result.data.attendeeList.map(item => ({
                        name: this.ensureStringValue(item.name),
                        position: this.ensureStringValue(item.position),
                        department: this.ensureStringValue(item.department),
                        work: this.ensureStringValue(item.work),
                        attendance: item.attendance || 'N' // 참석여부 추가
                    })) : []
                };
                
                console.log('📋 정규화된 세미나 데이터:', normalizedData);
                console.log('📋 시간 계획 데이터:', normalizedData.timeSchedule);
                console.log('📋 참석자 데이터:', normalizedData.attendeeList);
                
                // 메인 화면에 데이터 로드
                this.currentData = normalizedData;
                this.currentDocumentId = id; // 매개변수로 받은 id 사용
                console.log('📋 currentData 설정 완료:', this.currentData);
                
                await this.populateForm();
                console.log('📋 폼 채우기 완료');
                
                this.showSuccessToast('세미나 계획을 불러왔습니다.');
            } else {
                console.error('❌ 세미나 조회 실패:', result.message);
                this.showErrorToast(result.message);
            }
        } catch (error) {
            console.error('❌ 상세 정보 로드 오류:', error);
            this.showErrorToast('상세 정보 로드 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    // ID로 세미나 조회
    async getSeminarById(id) {
        try {
            if (useLocalStorage) {
                const allData = this.getAllLocalStorageData();
                const seminar = allData.find(item => item.id === id);
                
                if (seminar) {
                    console.log('📁 로컬 스토리지에서 로드된 데이터:', seminar.data);
                    return { success: true, data: seminar.data, id: seminar.id };
                } else {
                    return { success: false, message: '해당 세미나 계획을 찾을 수 없습니다.' };
                }
            } else {
                // Firebase에서 특정 문서 조회
                const doc = await db.collection('seminarPlans').doc(id).get();
                if (doc.exists) {
                    const docData = doc.data();
                    console.log('🔥 Firebase에서 로드된 데이터:', docData);
                    return { success: true, data: docData, id: doc.id };
                } else {
                    return { success: false, message: '해당 세미나 계획을 찾을 수 없습니다.' };
                }
            }
        } catch (error) {
            console.error('세미나 조회 오류:', error);
            return { success: false, message: '세미나 조회 중 오류가 발생했습니다: ' + error.message };
        }
    }

    // 새 세미나 등록
    addNewSeminar() {
        try {
            // 모달 닫기
            this.closeSearchModal();
            
            // 메인 화면 초기화
            this.initializeMainForm();
            
            this.showSuccessToast('새 세미나 등록을 위한 화면이 준비되었습니다.');
        } catch (error) {
            console.error('새 세미나 등록 화면 전환 오류:', error);
            this.showErrorToast('화면 전환 중 오류가 발생했습니다.');
        }
    }

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
            attendeeList: []
        };
        
        // Firebase 문서 ID 초기화
        this.currentDocumentId = null;
        
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
        
        // PDF 실시결과 내보내기 버튼 숨기기
        this.toggleExportResultPDFButton();
    }

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
        } else {
            selectElement.style.display = 'block';
            inputElement.classList.add('hidden');
            this.currentData.session = '';
        }
    }

    // 회차 직접 입력 값 업데이트
    updateSessionValue(value) {
        this.currentData.session = value;
    }

    // 회차 필드 데이터 채우기
    populateSessionField() {
        console.log('populateSessionField 시작');
        console.log('currentData.session:', this.currentData.session);
        
        const selectElement = document.getElementById('sessionSelect');
        const inputElement = document.getElementById('sessionInput');
        
        console.log('selectElement:', selectElement);
        console.log('inputElement:', inputElement);
        
        if (this.currentData.session) {
            // HTML에서 정의된 모든 회차 옵션들
            const sessionOptions = [
                '제 1회', '제 2회', '제 3회', '제 4회', '제 5회', '제 6회', '제 7회', '제 8회', '제 9회', '제10회',
                '제11회', '제12회', '제13회', '제14회', '제15회', '제16회', '제17회', '제18회', '제19회', '제20회'
            ];
            
            if (sessionOptions.includes(this.currentData.session)) {
                // 미리 정의된 옵션인 경우
                console.log('미리 정의된 옵션으로 설정:', this.currentData.session);
                selectElement.value = this.currentData.session;
                selectElement.style.display = 'block';
                inputElement.classList.add('hidden');
            } else {
                // 직접 입력된 값인 경우
                console.log('직접 입력된 값으로 설정:', this.currentData.session);
                selectElement.value = '직접입력';
                selectElement.style.display = 'none';
                inputElement.value = this.currentData.session;
                inputElement.classList.remove('hidden');
            }
        } else {
            // 빈 값인 경우
            console.log('빈 값으로 설정');
            selectElement.value = '';
            selectElement.style.display = 'block';
            inputElement.value = '';
            inputElement.classList.add('hidden');
        }
        
        console.log('populateSessionField 완료');
    }

    // 폼 초기화 (사용자 요청)
    resetForm() {
        try {
            // 입력 필드만 초기화 (기존 데이터는 유지)
            this.clearInputFields();
            
            // 시간 계획과 참석자 명단에 1행씩 자동 추가
            this.addTimeRow();
            this.addAttendeeRow();
            
            // 스케치 초기화 (스케치1, 스케치2만 남기고 나머지 제거)
            this.resetSketches();
            
            this.showSuccessToast('모든 입력 필드가 초기화되고 기본 행이 추가되었습니다.');
        } catch (error) {
            console.error('폼 초기화 오류:', error);
            this.showErrorToast('초기화 중 오류가 발생했습니다.');
        }
    }

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
        this.clearSketchInputs();
        
        // 현재 데이터의 입력 필드 값만 초기화 (저장된 데이터는 유지)
        this.currentData.session = '';
        this.currentData.objective = '';
        this.currentData.datetime = '';
        this.currentData.location = '';
        this.currentData.attendees = '';
    }

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
    }
    
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
    }
    
    // 세미나 스케치 업로드 항목 초기화
    clearSketchInputs() {
        // 스케치 1 초기화
        this.clearSketchInput(1);
        
        // 스케치 2 초기화
        this.clearSketchInput(2);
        
        // 스케치 빠른 저장 버튼 상태 업데이트
        this.toggleQuickSaveSketchButton();
    }
    
    // 개별 스케치 입력 초기화
    clearSketchInput(sketchNumber) {
        // 스케치 제목 초기화
        const titleElement = document.getElementById(`mainSketchTitle${sketchNumber}`);
        if (titleElement) {
            titleElement.value = '';
        }
        
        // 스케치 파일 초기화
        const fileElement = document.getElementById(`mainSketchFile${sketchNumber}`);
        if (fileElement) {
            fileElement.value = '';
        }
        
        // 파일 미리보기 숨기기
        const previewElement = document.getElementById(`mainFilePreview${sketchNumber}`);
        if (previewElement) {
            previewElement.classList.add('hidden');
        }
        
        // 파일 업로드 영역 표시
        const uploadAreaElement = document.getElementById(`mainFileUploadArea${sketchNumber}`);
        if (uploadAreaElement) {
            uploadAreaElement.classList.remove('hidden');
        }
        
        // 미리보기 이미지 초기화
        const previewImageElement = document.getElementById(`mainPreviewImage${sketchNumber}`);
        if (previewImageElement) {
            previewImageElement.src = '';
        }
        
        // 파일명 초기화
        const fileNameElement = document.getElementById(`mainFileName${sketchNumber}`);
        if (fileNameElement) {
            fileNameElement.textContent = '';
        }
    }

    // 모바일 호환성을 위한 헬퍼 메서드들
    
    // 문자열 값 보장
    ensureStringValue(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value.trim();
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'boolean') return value.toString();
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }
    
    
    // HTML 이스케이프 (XSS 방지 및 모바일 호환)
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 일시별 정렬
    sortByDatetime() {
        const tbody = document.getElementById('searchResultBody');
        const rows = Array.from(tbody.children);
        
        // 정렬 방향 토글
        if (!this.sortDirection) this.sortDirection = 'asc';
        else this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        
        rows.sort((a, b) => {
            const aText = a.children[1].textContent;
            const bText = b.children[1].textContent;
            
            if (aText.includes('조회된 결과가 없습니다')) return 1;
            if (bText.includes('조회된 결과가 없습니다')) return -1;
            
            const aDate = new Date(aText);
            const bDate = new Date(bText);
            
            if (this.sortDirection === 'asc') {
                return aDate - bDate;
            } else {
                return bDate - aDate;
            }
        });
        
        // 정렬된 행들을 다시 추가
        rows.forEach(row => tbody.appendChild(row));
        
        // 정렬 방향 표시 업데이트
        const header = document.querySelector('th[onclick="app.sortByDatetime()"]');
        const icon = header.querySelector('.fas.fa-sort');
        if (icon) {
            icon.className = this.sortDirection === 'asc' ? 'fas fa-sort-up text-blue-600' : 'fas fa-sort-down text-blue-600';
        }
        
        // 정렬 완료 토스트 표시
        const direction = this.sortDirection === 'asc' ? '오름차순' : '내림차순';
        this.showSuccessToast(`일시 기준 ${direction}으로 정렬되었습니다.`);
    }



    exportToPDF() {
        try {
            this.showLoading(true);
            
            // PDFMake 라이브러리 로딩 대기 및 확인
            this.waitForPDFMake().then(() => {
                console.log('✅ PDFMake 라이브러리 사용');
                this.exportToPDFWithPDFMake();
            }).catch(() => {
                console.log('🔄 PDFMake 로딩 실패, HTML to PDF 방식 사용');
                this.exportToPDFWithHTML();
            }).finally(() => {
                // 로딩 상태 해제는 각 함수에서 처리
            });
            
        } catch (error) {
            console.error('PDF 내보내기 오류:', error);
            this.showErrorToast(`PDF 내보내기 실패: ${error.message}`);
            this.showLoading(false);
        }
    }

    // PDFMake 라이브러리 로딩 대기
    waitForPDFMake() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100; // 10초 대기 (100ms * 100)
            
            const checkPDFMake = () => {
                attempts++;
                
                if (window.pdfMake && window.pdfMake.fonts) {
                    console.log('✅ PDFMake 라이브러리 로딩 확인 완료');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('⚠️ PDFMake 로딩 시간 초과 (10초)');
                    reject(new Error('PDFMake 로딩 시간 초과'));
                } else {
                    setTimeout(checkPDFMake, 100);
                }
            };
            
            checkPDFMake();
        });
    }

    // PDFMake를 사용한 PDF 생성 (한국어 완벽 지원)
    exportToPDFWithPDFMake() {
        try {
            // PDFMake 라이브러리 로딩 확인
            if (!window.pdfMake) {
                console.warn('⚠️ PDFMake 라이브러리가 로드되지 않았습니다. HTML to PDF 방식으로 전환합니다.');
                this.exportToPDFWithHTML();
                return;
            }
            
            // PDFMake 폰트 확인
            if (!window.pdfMake.fonts) {
                console.warn('⚠️ PDFMake 폰트가 로드되지 않았습니다. HTML to PDF 방식으로 전환합니다.');
                this.exportToPDFWithHTML();
                return;
            }
            
            console.log('✅ PDFMake 라이브러리 로드 완료');
            console.log('📋 사용 가능한 폰트:', Object.keys(window.pdfMake.fonts));
            
            // 안전한 텍스트 처리 함수
            const safeText = (text) => {
                if (!text) return '';
                return String(text).replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
            };
            
            // 일시 텍스트 그대로 사용
            const formatDateTime = (dateTime) => {
                return dateTime || '';
            };
            
            // 주요 내용 형식 변환 함수 (PDFMake용)
            const formatContentForPDF = (content) => {
                if (!content) return '';
                const text = String(content);
                
                // '- ' 문자를 기준으로 분할
                const parts = text.split('- ');
                if (parts.length <= 1) return text;
                
                let result = parts[0]; // 첫 번째 부분
                
                // 나머지 부분들을 다음 라인에 추가
                for (let i = 1; i < parts.length; i++) {
                    if (parts[i].trim()) {
                        result += '\n- ' + parts[i];
                    }
                }
                
                return result;
            };
            
            // PDF 문서 정의
            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [40, 60, 40, 60],
                defaultStyle: {
                    fontSize: 10
                },
                footer: function(currentPage, pageCount) {
                    return {
                        text: `- ${currentPage} -`,
                        alignment: 'center',
                        fontSize: 10,
                        margin: [0, 10, 0, 0]
                    };
                },
                content: [
                    // 제목
                    {
                        text: safeText(this.currentData.session) || '전사 신기술 세미나 실행계획',
                        style: 'header',
                        alignment: 'center',
                        margin: [0, 0, 0, 10]
                    },
                    // 현재 일자
                    {
                        text: this.getCurrentDateString(),
                        alignment: 'right',
                        fontSize: 10,
                        margin: [0, 0, 0, 20]
                    },
                    
                    // 기본 정보
                    { text: '1. 목표', style: 'sectionHeader', margin: [0, 0, 0, 5] },
                    { text: '　　□ ' + (safeText(this.currentData.objective) || '미입력'), style: 'tableCell', margin: [0, 0, 0, 10] },
                    
                    { text: '2. 일시/장소', style: 'sectionHeader', margin: [0, 0, 0, 5] },
                    { text: '　　□ ' + ((formatDateTime(safeText(this.currentData.datetime)) || '미입력') + ' / ' + (safeText(this.currentData.location) || '미입력')), style: 'tableCell', margin: [0, 0, 0, 10] },
                    
                    { text: '3. 참석 대상', style: 'sectionHeader', margin: [0, 0, 0, 5] },
                    { text: '　　□ ' + (safeText(this.currentData.attendees) || '미입력'), style: 'tableCell', margin: [0, 0, 0, 20] }
                ],
                styles: {
                    header: {
                        fontSize: 18,
                        bold: true
                    },
                    sectionHeader: {
                        fontSize: 14,
                        bold: true,
                        color: '#2c3e50'
                    },
                    tableHeader: {
                        fontSize: 10,
                        bold: true,
                        fillColor: '#ecf0f1'
                    },
                    tableCell: {
                        fontSize: 10
                    }
                }
            };

            // 시간 계획 테이블 추가
            if (this.currentData.timeSchedule && this.currentData.timeSchedule.length > 0) {
                const timeScheduleRows = [
                    [
                        { text: '구분', style: 'tableHeader' },
                        { text: '주요 내용', style: 'tableHeader' },
                        { text: '시간', style: 'tableHeader' },
                        { text: '담당', style: 'tableHeader' }
                    ]
                ];

                // 구분 값 병합 처리를 위한 데이터 준비
                const processedSchedule = this.processTimeScheduleForMerging(this.currentData.timeSchedule);

                processedSchedule.forEach((item, index) => {
                    const row = [
                        { text: safeText(item.type) || '', style: 'tableCell' },
                        { text: formatContentForPDF(safeText(item.content)) || '', style: 'tableCell' },
                        { text: safeText(item.time) || '', style: 'tableCell' },
                        { text: safeText(item.responsible) || '', style: 'tableCell' }
                    ];

                    // 병합이 필요한 경우 rowspan 설정
                    if (item.rowspan && item.rowspan > 1) {
                        row[0].rowSpan = item.rowspan;
                    }

                    timeScheduleRows.push(row);
                });

                docDefinition.content.push(
                    { text: '4. 시간 계획', style: 'sectionHeader', margin: [0, 20, 0, 10] },
                    {
                        table: {
                            widths: ['auto', '*', 'auto', 'auto'],
                            body: timeScheduleRows
                        },
                        margin: [0, 0, 0, 10]
                    },
                    { text: '- 이 상 –', alignment: 'right', fontSize: 10, margin: [0, 0, 0, 20] }
                );
            }

            // 참석자 명단 테이블 추가
            if (this.currentData.attendeeList && this.currentData.attendeeList.length > 0) {
                const attendeeRows = [
                    [
                        { text: 'No', style: 'tableHeader' },
                        { text: '성명', style: 'tableHeader' },
                        { text: '직급', style: 'tableHeader' },
                        { text: '소속', style: 'tableHeader' },
                        { text: '업무', style: 'tableHeader' }
                    ]
                ];

                this.currentData.attendeeList.forEach((item, index) => {
                    attendeeRows.push([
                        { text: (index + 1).toString(), style: 'tableCell' },
                        { text: safeText(item.name) || '', style: 'tableCell' },
                        { text: safeText(item.position) || '', style: 'tableCell' },
                        { text: safeText(item.department) || '', style: 'tableCell' },
                        { text: safeText(item.work) || '', style: 'tableCell' }
                    ]);
                });

                docDefinition.content.push(
                    { text: '', pageBreak: 'before' },
                    { text: '[별첨] 세미나 참석 명단', style: 'sectionHeader', margin: [0, 20, 0, 10] },
                    {
                        table: {
                            widths: [20, 'auto', 'auto', 'auto', '*'],
                            body: attendeeRows
                        }
                    }
                );
            }

            // 한국어 파일명 생성
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const fileName = `${year}${month}${day} 전사 신기술 세미나 실행계획.pdf`;

            // PDF 생성 및 다운로드
            try {
                const pdfDoc = pdfMake.createPdf(docDefinition);
                pdfDoc.download(fileName);
                this.showSuccessToast('PDF가 성공적으로 내보내졌습니다. (PDFMake 사용)');
                this.showLoading(false); // 성공 시 로딩 해제
            } catch (pdfError) {
                console.error('PDFMake PDF 생성 오류:', pdfError);
                this.showLoading(false); // 오류 시 로딩 해제
                throw new Error(`PDF 생성 실패: ${pdfError.message}`);
            }
            
        } catch (error) {
            console.error('PDFMake PDF 생성 오류:', error);
            console.log('🔄 HTML to PDF 방식으로 대체');
            this.showLoading(false); // 오류 시 로딩 해제
            this.exportToPDFWithHTML();
        }
    }

    // HTML to PDF 방식 (새 탭 열어 인쇄 대화상자)
    exportToPDFWithHTML() {
        try {
            console.log('🔄 HTML to PDF 방식으로 실행계획 PDF 생성 (새 탭)');
            
            // HTML 콘텐츠 생성
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
            
            // 문서 제목 설정(저장 시 기본 파일명으로 사용)
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            newWindow.document.title = `${year}${month}${day} 전사 신기술 세미나 실행계획.pdf`;
            
            // 인쇄 대화상자 호출
            setTimeout(() => {
                newWindow.print();
                this.showSuccessToast('인쇄 대화상자가 열렸습니다. "PDF로 저장"을 선택하세요.');
            }, 500);
        } catch (error) {
            console.error('HTML to PDF 오류:', error);
            this.showErrorToast(`PDF 내보내기 실패: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    // 대체 PDF 내보내기 방법 (HTML to PDF)
    exportToPDFAlternative() {
        try {
            console.log('🔄 대체 실행계획 내보내기 (새 탭)');
            
            const htmlContent = this.generatePDFHTML();
            const newWindow = window.open('', '_blank');
            if (!newWindow) {
                this.showErrorToast('팝업이 차단되었습니다. 브라우저에서 팝업을 허용해주세요.');
                this.showLoading(false);
                return;
            }
            newWindow.document.write(htmlContent);
            newWindow.document.close();
            
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            newWindow.document.title = `${year}${month}${day} 전사 신기술 세미나 실행계획.pdf`;
            
            setTimeout(() => {
                newWindow.print();
                this.showSuccessToast('인쇄 대화상자가 열렸습니다. "PDF로 저장"을 선택하세요.');
            }, 500);
        } catch (error) {
            console.error('대체 PDF 내보내기 오류:', error);
            this.showErrorToast(`PDF 내보내기 실패: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    // PDF용 HTML 콘텐츠 생성 (한국어 완벽 지원)
    generatePDFHTML() {
        const today = new Date();
        const dateString = today.toLocaleDateString('ko-KR');
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const fileName = `${year}${month}${day} 전사 신기술 세미나 실행계획`;
        
        // 안전한 텍스트 처리 함수
        const safeText = (text) => {
            if (!text || text.trim() === '') return '미입력';
            return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };
        
        // 일시 텍스트 그대로 사용
        const formatDateTime = (dateTime) => {
            return dateTime || '';
        };
        
        // 목표 필드에서 □ 문자를 만나면 다음 라인으로 처리하는 함수 (HTML용)
        const formatObjectiveHTML = (objective) => {
            if (!objective) return '';
            const text = String(objective);
            
            // □ 문자를 기준으로 분할
            const parts = text.split('□');
            if (parts.length <= 1) return text;
            
            let result = parts[0]; // 첫 번째 부분
            
            // 나머지 부분들을 4칸 들여쓰기와 함께 추가
            for (let i = 1; i < parts.length; i++) {
                if (i == 1 && parts[i].trim()) {
                    result += '　　□ ' + parts[i]; // 4칸 들여쓰기
                }
                if (i !=1 && parts[i].trim()) {
                    result += '<br>　　□ ' + parts[i]; // 4칸 들여쓰기
                }
            }
            
            return result;
        };
        
        // 주요 내용 형식 변환 함수 (HTML용)
        const formatContentHTML = (content) => {
            if (!content) return '';
            const text = String(content);
            
            // '- ' 문자를 기준으로 분할
            const parts = text.split('- ');
            if (parts.length <= 1) return text;
            
            let result = parts[0]; // 첫 번째 부분
            
            // 나머지 부분들을 다음 라인에 추가
            for (let i = 1; i < parts.length; i++) {
                if (parts[i].trim()) {
                    result += '<br>- ' + parts[i];
                }
            }
            
            return result;
        };
        
        let html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>전사 신기술 세미나 실행계획</title>
    <meta name="author" content="(주)경포씨엔씨">
    <meta name="description" content="전사 신기술 세미나 실행계획서">
    <meta name="keywords" content="세미나, 실행계획, KPCNC">
    <meta name="robots" content="noindex, nofollow">
    <meta name="generator" content="">
    <style>
        @page {
            size: A4;
            margin: 2cm;
            @top-center {
                content: " ";
            }
            @bottom-center {
                content: "- " counter(page) " -";
                font-size: 10px;
                margin-top: 10px;
            }
        }
        * {
            font-family: '맑은 고딕', 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans CJK KR', sans-serif !important;
        }
        body {
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
            color: #2c3e50;
        }
        .section {
            margin-bottom: 25px;
        }
        .section h2 {
            font-size: 16px;
            font-weight: bold;
            color: #34495e;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .info-item {
            margin: 8px 0;
            font-size: 12px;
            display: flex;
            align-items: flex-start;
        }
        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 80px;
            flex-shrink: 0;
        }
        .info-content {
            margin: 5px 0 15px 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
            font-size: 12px;
            white-space: pre-line;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
        }
        th, td {
            border: 1px solid #bdc3c7;
            padding: 6px;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #ecf0f1;
            font-weight: bold;
        }
        .center-align {
            text-align: center;
        }
        .time-schedule-table {
            width: 100%;
        }
        .time-schedule-table th:nth-child(1),
        .time-schedule-table td:nth-child(1) {
            width: auto;
            min-width: 60px;
            max-width: 80px;
        }
        .time-schedule-table th:nth-child(2),
        .time-schedule-table td:nth-child(2) {
            width: 100%;
        }
        .time-schedule-table th:nth-child(3),
        .time-schedule-table td:nth-child(3) {
            width: auto;
            min-width: 60px;
            max-width: 80px;
        }
        .time-schedule-table th:nth-child(4),
        .time-schedule-table td:nth-child(4) {
            width: auto;
            min-width: 60px;
            max-width: 80px;
        }
        .attendee-table {
            width: 100%;
        }
        .attendee-table th,
        .attendee-table td {
            width: 20%;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 10px;
            color: #7f8c8d;
            border-top: 1px solid #bdc3c7;
            padding-top: 10px;
        }
        @media print {
            body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${safeText(this.currentData.session)} 전사 신기술 세미나 실행계획 </h1>
        <div style="text-align: right; margin-top: 10px; font-size: 12px;">${this.getCurrentDateString()}</div>
    </div>
    
    <div class="section">
        <h2>1. 목표</h2>
        <p class="info-content">${formatObjectiveHTML(safeText(this.currentData.objective))}</p>
        
        <h2>2. 일시/장소</h2>
        <p class="info-content">　　□ ${formatDateTime(safeText(this.currentData.datetime))} / ${safeText(this.currentData.location)}</p>
        
        <h2>3. 참석 대상</h2>
        <p class="info-content">　　□ ${safeText(this.currentData.attendees)}</p>
    </div>
`;

        // 시간 계획 테이블
        if (this.currentData.timeSchedule && this.currentData.timeSchedule.length > 0) {
            html += `
    <div class="section">
        <h2>4. 시간 계획</h2>
        <table class="time-schedule-table">
            <thead>
                <tr>
                    <th class="center-align">구분</th>
                    <th>주요 내용</th>
                    <th class="center-align">시간</th>
                    <th class="center-align">담당</th>
                </tr>
            </thead>
            <tbody>
`;
            // 구분 값 병합 처리를 위한 데이터 준비
            const processedSchedule = this.processTimeScheduleForMerging(this.currentData.timeSchedule);
            
            processedSchedule.forEach((item, index) => {
                // 병합된 행인지 확인
                if (item.isMergedRow) {
                    // 병합된 행은 구분 컬럼을 제외하고 나머지만 표시
                    html += `
                <tr>
                    <td>${formatContentHTML(safeText(item.content))}</td>
                    <td class="center-align">${safeText(item.time)}</td>
                    <td class="center-align">${safeText(item.responsible)}</td>
                </tr>
`;
                } else {
                    // 일반 행 또는 병합의 첫 번째 행
                    const typeCell = item.rowspan && item.rowspan > 1 ? 
                        `<td class="center-align" rowspan="${item.rowspan}">${safeText(item.type)}</td>` :
                        `<td class="center-align">${safeText(item.type)}</td>`;
                    
                    html += `
                <tr>
                    ${typeCell}
                    <td>${formatContentHTML(safeText(item.content))}</td>
                    <td class="center-align">${safeText(item.time)}</td>
                    <td class="center-align">${safeText(item.responsible)}</td>
                </tr>
`;
                }
            });
            html += `
            </tbody>
        </table>
        <div style="text-align: right; margin-top: 10px; font-size: 12px;">– 이 상 –</div>
    </div>
`;
            }
            
            // 참석자 명단 테이블
        if (this.currentData.attendeeList && this.currentData.attendeeList.length > 0) {
            html += `
    <div class="section" style="page-break-before: always;">
        <h2>[별첨] 세미나 참석 명단</h2>
        <table class="attendee-table">
            <thead>
                <tr>
                    <th class="center-align">No</th>
                    <th class="center-align">성명</th>
                    <th class="center-align">직급</th>
                    <th class="center-align">소속</th>
                    <th class="center-align">업무</th>
                </tr>
            </thead>
            <tbody>
`;
            this.currentData.attendeeList.forEach((item, index) => {
                html += `
                <tr>
                    <td class="center-align">${index + 1}</td>
                    <td class="center-align">${safeText(item.name)}</td>
                    <td class="center-align">${safeText(item.position)}</td>
                    <td class="center-align">${safeText(item.department)}</td>
                    <td class="center-align">${safeText(item.work)}</td>
                </tr>
`;
            });
            html += `
            </tbody>
        </table>
    </div>
`;
        }

        html += `
</body>
</html>
`;

        return html;
    }

    // 시간 계획 데이터를 병합 처리하는 함수
    processTimeScheduleForMerging(timeSchedule) {
        if (!timeSchedule || timeSchedule.length === 0) return [];
        
        const processed = [];
        let currentType = null;
        let currentGroup = [];
        
        timeSchedule.forEach((item, index) => {
            const itemType = item.type || '';
            
            if (itemType === currentType && currentType !== '') {
                // 같은 구분 값이면 그룹에 추가
                currentGroup.push(item);
            } else {
                // 다른 구분 값이면 이전 그룹 처리 후 새 그룹 시작
                if (currentGroup.length > 0) {
                    this.addMergedGroupToProcessed(processed, currentGroup);
                }
                currentGroup = [item];
                currentType = itemType;
            }
        });
        
        // 마지막 그룹 처리
        if (currentGroup.length > 0) {
            this.addMergedGroupToProcessed(processed, currentGroup);
        }
        
        return processed;
    }
    
    // 병합된 그룹을 처리된 배열에 추가하는 함수
    addMergedGroupToProcessed(processed, group) {
        if (group.length === 1) {
            // 그룹에 항목이 하나면 병합하지 않음
            processed.push({ ...group[0], rowspan: 1 });
        } else {
            // 그룹에 항목이 여러 개면 첫 번째 항목에 rowspan 설정
            processed.push({ ...group[0], rowspan: group.length });
            
            // 나머지 항목들은 구분 컬럼만 빈 값으로 설정하고 나머지는 그대로 유지
            for (let i = 1; i < group.length; i++) {
                processed.push({ 
                    ...group[i], 
                    type: '', 
                    rowspan: 1,
                    isMergedRow: true  // 병합된 행임을 표시
                });
            }
        }
    }

    // 현재 일자를 반환하는 함수 (예: 2025. 7. 15(화))
    getCurrentDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekday = weekdays[today.getDay()];
        
        return `${year}. ${month}. ${day}(${weekday})`;
    }

    // UTF-8 텍스트를 안전하게 처리하는 함수 (한국어/영어 모두 지원)
    ensureUTF8Text(text) {
        if (!text) return '';
        
        // UTF-8 인코딩을 보장하고 안전한 문자만 허용
        return String(text)
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 제어 문자 제거
            .replace(/[\uFEFF]/g, '') // BOM 제거
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width 문자 제거
            .trim();
    }

    // 기존 함수명 유지 (호환성)
    ensureKoreanText(text) {
        return this.ensureUTF8Text(text);
    }

    // UTF-8 텍스트를 PDF에 맞게 분할하는 헬퍼 함수 (한국어/영어 모두 지원)
    splitUTF8TextToFit(text, maxWidth) {
        if (!text) return [''];
        
        const safeText = this.ensureUTF8Text(text);
        if (!safeText) return [''];
        
        // UTF-8 텍스트를 문자 단위로 처리
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < safeText.length; i++) {
            const char = safeText[i];
            const testLine = currentLine + char;
            
            // 대략적인 문자 폭 계산 (한글은 2배 폭으로 계산)
            const charWidth = this.getCharWidth(char);
            const lineWidth = this.getLineWidth(currentLine) + charWidth;
            
            if (lineWidth <= maxWidth) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = char;
                } else {
                    lines.push(char);
                }
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [''];
    }

    // 기존 함수명 유지 (호환성)
    splitKoreanTextToFit(text, maxWidth) {
        return this.splitUTF8TextToFit(text, maxWidth);
    }

    // 문자 폭 계산 (한글은 2배 폭)
    getCharWidth(char) {
        const code = char.charCodeAt(0);
        // 한글 범위: 0xAC00-0xD7AF, 0x1100-0x11FF, 0x3130-0x318F
        if ((code >= 0xAC00 && code <= 0xD7AF) || 
            (code >= 0x1100 && code <= 0x11FF) || 
            (code >= 0x3130 && code <= 0x318F)) {
            return 2; // 한글은 2배 폭
        }
        return 1; // 영문, 숫자, 특수문자는 1배 폭
    }

    // 라인 폭 계산
    getLineWidth(line) {
        if (!line) return 0;
        return line.split('').reduce((width, char) => width + this.getCharWidth(char), 0);
    }

    // PDF용 텍스트 분할 함수 (한국어 지원)
    splitTextForPDF(text, maxWidth) {
        if (!text) return [''];
        
        const safeText = String(text);
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < safeText.length; i++) {
            const char = safeText[i];
            const testLine = currentLine + char;
            
            // 대략적인 문자 폭 계산
            const charWidth = this.getCharWidth(char);
            const lineWidth = this.getLineWidth(currentLine) + charWidth;
            
            if (lineWidth <= maxWidth) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = char;
                } else {
                    lines.push(char);
                }
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [''];
    }

    // 기존 텍스트 분할 함수 (호환성 유지)
    splitTextToFit(text, maxWidth) {
        if (!text) return [''];
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            if (testLine.length * 2.5 <= maxWidth) { // 대략적인 폰트 크기 계산
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    lines.push(word);
                }
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [''];
    }

    // 엑셀 내보내기 (전체 데이터)
    async exportToExcel() {
        try {
            this.showLoading(true);
            
            // 전체 데이터 조회
            const result = await loadAllPlans();
            
            if (!result.success) {
                this.showErrorToast('데이터를 불러오는데 실패했습니다.');
                return;
            }
            
            const allData = result.data;
            
            if (allData.length === 0) {
                this.showErrorToast('내보낼 데이터가 없습니다.');
                return;
            }
            
            // 엑셀 워크북 생성
            const wb = XLSX.utils.book_new();
            
            // 업로드 가능한 형식으로 단일 시트 생성
            const uploadableSheet = this.createUploadableExcelSheet(allData);
            XLSX.utils.book_append_sheet(wb, uploadableSheet, '전체데이터');
            
            // 각 세미나 데이터를 개별 시트로 추가 (상세 보기용)
            allData.forEach((seminar, index) => {
                const sheetName = `세미나${index + 1}`;
                const ws = this.createExcelSheet(seminar);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });
            
            // 전체 요약 시트 추가
            const summarySheet = this.createSummarySheet(allData);
            XLSX.utils.book_append_sheet(wb, summarySheet, '전체요약');
            
            // 파일명 생성
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const fileName = `${year}${month}${day}_전사신기술세미나_전체데이터.xlsx`;
            
            // 엑셀 파일 다운로드
            XLSX.writeFile(wb, fileName);
            
            this.showSuccessToast('엑셀 파일이 성공적으로 다운로드되었습니다.');
            
        } catch (error) {
            console.error('엑셀 내보내기 오류:', error);
            this.showErrorToast(`엑셀 내보내기 실패: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    // 개별 세미나 데이터를 엑셀 시트로 변환 (업로드 가능한 형식)
    createExcelSheet(seminar) {
        const data = [];
        
        // 헤더
        data.push(['전사 신기술 세미나 실행계획']);
        data.push([]);
        
        // 기본 정보
        data.push(['1. 기본 정보']);
        data.push(['회차', seminar.session || '']);
        data.push(['목표', seminar.objective || '']);
        data.push(['일시', seminar.datetime || '']);
        data.push(['장소', seminar.location || '']);
        data.push(['참석 대상', seminar.attendees || '']);
        data.push([]);
        
        // 시간 계획
        if (seminar.timeSchedule && seminar.timeSchedule.length > 0) {
            data.push(['2. 시간 계획']);
            data.push(['구분', '주요 내용', '시간', '담당']);
            
            seminar.timeSchedule.forEach(item => {
                data.push([
                    item.type || '',
                    item.content || '',
                    item.time || '',
                    item.responsible || ''
                ]);
            });
            data.push([]);
        }
        
        // 참석자 명단
        if (seminar.attendeeList && seminar.attendeeList.length > 0) {
            data.push(['3. 참석자 명단']);
            data.push(['No', '성명', '직급', '소속', '업무']);
            
            seminar.attendeeList.forEach((item, index) => {
                data.push([
                    index + 1,
                    item.name || '',
                    item.position || '',
                    item.department || '',
                    item.work || ''
                ]);
            });
        }
        
        return XLSX.utils.aoa_to_sheet(data);
    }
    
    // 업로드 가능한 형식으로 엑셀 시트 생성 (단일 시트)
    createUploadableExcelSheet(allData) {
        const data = [];
        
        // 각 세미나 데이터를 순차적으로 추가
        allData.forEach((seminar, seminarIndex) => {
            // 세미나 구분선
            if (seminarIndex > 0) {
                data.push([]);
                data.push(['='.repeat(50)]);
                data.push([]);
            }
            
            // 헤더
            data.push(['전사 신기술 세미나 실행계획']);
            data.push([]);
            
            // 기본 정보
            data.push(['1. 기본 정보']);
            data.push(['회차', seminar.session || '']);
            data.push(['목표', seminar.objective || '']);
            data.push(['일시', seminar.datetime || '']);
            data.push(['장소', seminar.location || '']);
            data.push(['참석 대상', seminar.attendees || '']);
            data.push([]);
            
            // 시간 계획
            if (seminar.timeSchedule && seminar.timeSchedule.length > 0) {
                data.push(['2. 시간 계획']);
                data.push(['구분', '주요 내용', '시간', '담당']);
                
                seminar.timeSchedule.forEach(item => {
                    data.push([
                        item.type || '',
                        item.content || '',
                        item.time || '',
                        item.responsible || ''
                    ]);
                });
                data.push([]);
            }
            
            // 참석자 명단
            if (seminar.attendeeList && seminar.attendeeList.length > 0) {
                data.push(['3. 참석자 명단']);
                data.push(['No', '성명', '직급', '소속', '업무']);
                
                seminar.attendeeList.forEach((item, index) => {
                    data.push([
                        index + 1,
                        item.name || '',
                        item.position || '',
                        item.department || '',
                        item.work || ''
                    ]);
                });
            }
        });
        
        return XLSX.utils.aoa_to_sheet(data);
    }
    
    // 전체 요약 시트 생성
    createSummarySheet(allData) {
        const data = [];
        
        // 헤더
        data.push(['전사 신기술 세미나 전체 요약']);
        data.push([]);
        
        // 요약 테이블 헤더
        data.push(['회차', '일시', '목표', '장소', '참석 대상', '시간계획 수', '참석자 수']);
        
        // 각 세미나 요약 정보
        allData.forEach(seminar => {
            data.push([
                seminar.session || '',
                seminar.datetime || '',
                seminar.objective || '',
                seminar.location || '',
                seminar.attendees || '',
                seminar.timeSchedule ? seminar.timeSchedule.length : 0,
                seminar.attendeeList ? seminar.attendeeList.length : 0
            ]);
        });
        
        return XLSX.utils.aoa_to_sheet(data);
    }

    // 파일 업로드 트리거
    triggerFileUpload() {
        const fileInput = document.getElementById('fileInput');
        fileInput.click();
    }

    // 파일 업로드 처리
    async handleFileUpload(event) {
        const file = event.target.files[0];
        
        if (!file) {
            return;
        }
        
        // 파일 확장자 검증
        const allowedExtensions = ['.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
            this.showErrorToast('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
            return;
        }
        
        try {
            this.showLoading(true);
            
            // 파일 읽기
            const data = await this.readExcelFile(file);
            
            if (data && Array.isArray(data)) {
                console.log('📁 엑셀 파일 읽기 성공, 데이터 길이:', data.length);
                console.log('📊 원본 데이터 (처음 10행):', data.slice(0, 10));
                
                // 먼저 단일 세미나 형식으로 파싱 시도
                const singleSeminar = this.parseExcelData(data);
                console.log('📊 단일 세미나 파싱 결과:', singleSeminar);
                console.log('📊 단일 세미나 유효성 검사 - 회차:', singleSeminar.session, '일시:', singleSeminar.datetime);
                
                // 단일 세미나가 유효한지 확인 (회차와 일시가 있는지)
                if (singleSeminar.session && singleSeminar.datetime) {
                    console.log('✅ 단일 세미나 데이터로 인식');
                    
                    // 키값 기반으로 기존 데이터 확인 및 저장/수정
                    const keyValue = `${singleSeminar.session}_${singleSeminar.datetime}`;
                    const existingData = await this.findExistingDataByKey(keyValue);
                    
                    if (existingData) {
                        // 기존 데이터가 있으면 수정
                        console.log('📝 기존 데이터 수정:', existingData.id);
                        if (useLocalStorage) {
                            this.saveToLocalStorage(singleSeminar, existingData.id);
                        } else {
                            await window.updateData(existingData.id, singleSeminar);
                        }
                        this.showSuccessToast('기존 세미나 데이터가 수정되었습니다.');
                    } else {
                        // 기존 데이터가 없으면 새로 등록
                        console.log('➕ 새로운 데이터 등록');
                        if (useLocalStorage) {
                            this.saveToLocalStorage(singleSeminar);
                        } else {
                            await window.saveData(singleSeminar);
                        }
                        this.showSuccessToast('새로운 세미나 데이터가 등록되었습니다.');
                    }
                    
                    // 폼에 데이터 로드
                    await this.loadDataFromExcel(singleSeminar);
                } else {
                    // 다중 세미나 형식으로 파싱 시도
                    console.log('🔄 다중 세미나 형식으로 파싱 시도');
                    const seminars = this.parseMultipleExcelData(data);
                    console.log('📊 다중 세미나 파싱 결과:', seminars);
                    
                    if (seminars.length > 1) {
                        // 여러 세미나 데이터인 경우 일괄 저장
                        console.log('✅ 다중 세미나 데이터로 인식, 일괄 저장');
                        await this.saveMultipleSeminars(seminars);
                        this.showSuccessToast(`${seminars.length}개의 세미나 데이터가 성공적으로 업로드되었습니다.`);
                    } else if (seminars.length === 1) {
                        // 단일 세미나 데이터인 경우 키값 기반으로 저장/수정
                        console.log('✅ 다중 파싱에서 단일 세미나 발견');
                        
                        const seminar = seminars[0];
                        const keyValue = `${seminar.session}_${seminar.datetime}`;
                        const existingData = await this.findExistingDataByKey(keyValue);
                        
                        if (existingData) {
                            // 기존 데이터가 있으면 수정
                            console.log('📝 기존 데이터 수정:', existingData.id);
                            if (useLocalStorage) {
                                this.saveToLocalStorage(seminar, existingData.id);
                            } else {
                                await window.updateData(existingData.id, seminar);
                            }
                            this.showSuccessToast('기존 세미나 데이터가 수정되었습니다.');
                        } else {
                            // 기존 데이터가 없으면 새로 등록
                            console.log('➕ 새로운 데이터 등록');
                            if (useLocalStorage) {
                                this.saveToLocalStorage(seminar);
                            } else {
                                await window.saveData(seminar);
                            }
                            this.showSuccessToast('새로운 세미나 데이터가 등록되었습니다.');
                        }
                        
                        // 폼에 데이터 로드
                        await this.loadDataFromExcel(seminar);
                    } else {
                        console.error('❌ 유효한 세미나 데이터를 찾을 수 없음');
                        console.error('❌ 단일 세미나 파싱 결과:', singleSeminar);
                        console.error('❌ 다중 세미나 파싱 결과:', seminars);
                        this.showErrorToast('유효한 세미나 데이터를 찾을 수 없습니다. 파일 형식을 확인해주세요.');
                    }
                }
            } else if (data && !Array.isArray(data)) {
                console.error('❌ 읽어온 데이터가 배열이 아님:', typeof data, data);
                this.showErrorToast('엑셀 파일 형식이 올바르지 않습니다.');
            } else {
                this.showErrorToast('엑셀 파일을 읽는데 실패했습니다.');
            }
            
        } catch (error) {
            console.error('파일 업로드 오류:', error);
            this.showErrorToast(`파일 업로드 실패: ${error.message}`);
        } finally {
            this.showLoading(false);
            // 파일 입력 초기화
            event.target.value = '';
        }
    }

    // 엑셀 파일 읽기
    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // 첫 번째 시트의 데이터 읽기
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('파일 읽기 실패'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    // 엑셀 데이터 파싱 (단일 세미나)
    parseExcelData(data) {
        console.log('📊 단일 세미나 파싱 시작, 데이터 길이:', data.length);
        const seminarData = {
            session: '',
            objective: '',
            datetime: '',
            location: '',
            attendees: '',
            timeSchedule: [],
            attendeeList: []
        };
        
        let currentSection = '';
        let timeScheduleStart = false;
        let attendeeListStart = false;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;
            
            const firstCell = row[0] ? String(row[0]).trim() : '';
            
            // 디버깅을 위한 로그 (처음 20행만)
            if (i < 20) {
                console.log(`단일 파싱 행 ${i}: "${firstCell}"`);
            }
            
            // 섹션 구분
            if (firstCell.includes('1. 기본 정보')) {
                currentSection = 'basic';
                console.log('📋 기본 정보 섹션 시작');
                continue;
            } else if (firstCell.includes('2. 시간 계획')) {
                currentSection = 'timeSchedule';
                timeScheduleStart = true;
                console.log('📋 시간 계획 섹션 시작');
                continue;
            } else if (firstCell.includes('3. 참석자 명단')) {
                currentSection = 'attendeeList';
                attendeeListStart = true;
                timeScheduleStart = false;
                console.log('📋 참석자 명단 섹션 시작');
                continue;
            }
            
            // 기본 정보 파싱
            if (currentSection === 'basic') {
                if (firstCell === '회차' && row[1]) {
                    seminarData.session = String(row[1]).trim();
                    console.log('📋 회차 파싱:', seminarData.session);
                } else if (firstCell === '목표' && row[1]) {
                    seminarData.objective = String(row[1]).trim();
                    console.log('📋 목표 파싱:', seminarData.objective);
                } else if (firstCell === '일시' && row[1]) {
                    seminarData.datetime = String(row[1]).trim();
                    console.log('📋 일시 파싱:', seminarData.datetime);
                } else if (firstCell === '장소' && row[1]) {
                    seminarData.location = String(row[1]).trim();
                    console.log('📋 장소 파싱:', seminarData.location);
                } else if (firstCell === '참석 대상' && row[1]) {
                    seminarData.attendees = String(row[1]).trim();
                    console.log('📋 참석 대상 파싱:', seminarData.attendees);
                }
            }
            
            // 시간 계획 파싱
            if (currentSection === 'timeSchedule' && timeScheduleStart) {
                // 헤더 행 건너뛰기
                if (firstCell === '구분') {
                    continue;
                }
                
                // 빈 행이면 시간 계획 섹션 종료
                if (!firstCell) {
                    timeScheduleStart = false;
                    continue;
                }
                
                seminarData.timeSchedule.push({
                    type: firstCell,
                    content: row[1] ? String(row[1]).trim() : '',
                    time: row[2] ? String(row[2]).trim() : '',
                    responsible: row[3] ? String(row[3]).trim() : ''
                });
            }
            
            // 참석자 명단 파싱
            if (currentSection === 'attendeeList' && attendeeListStart) {
                // 헤더 행 건너뛰기
                if (firstCell === 'No') {
                    continue;
                }
                
                // 빈 행이면 참석자 명단 섹션 종료
                if (!firstCell) {
                    attendeeListStart = false;
                    continue;
                }
                
                // No 컬럼이 있는 경우와 없는 경우 모두 처리
                let nameIndex = 1, positionIndex = 2, departmentIndex = 3, workIndex = 4;
                
                // 첫 번째 컬럼이 숫자인 경우 (No 컬럼이 있는 경우)
                if (!isNaN(parseInt(firstCell))) {
                    nameIndex = 1;
                    positionIndex = 2;
                    departmentIndex = 3;
                    workIndex = 4;
                } else {
                    // 첫 번째 컬럼이 이름인 경우 (No 컬럼이 없는 경우)
                    nameIndex = 0;
                    positionIndex = 1;
                    departmentIndex = 2;
                    workIndex = 3;
                }
                
                const attendee = {
                    name: row[nameIndex] ? String(row[nameIndex]).trim() : '',
                    position: row[positionIndex] ? String(row[positionIndex]).trim() : '',
                    department: row[departmentIndex] ? String(row[departmentIndex]).trim() : '',
                    work: row[workIndex] ? String(row[workIndex]).trim() : ''
                };
                
                console.log('👥 참석자 파싱 (단일):', attendee, '행 번호:', i);
                seminarData.attendeeList.push(attendee);
            }
        }
        
        console.log('📊 단일 세미나 파싱 완료:', seminarData);
        return seminarData;
    }
    
    // 엑셀 데이터 파싱 (여러 세미나 - 업로드용)
    parseMultipleExcelData(data) {
        console.log('📊 엑셀 데이터 파싱 시작, 총 행 수:', data.length);
        const seminars = [];
        let currentSeminar = null;
        let currentSection = '';
        let timeScheduleStart = false;
        let attendeeListStart = false;
        let isFirstSeminar = true;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;
            
            const firstCell = row[0] ? String(row[0]).trim() : '';
            
            // 디버깅을 위한 로그 (처음 100행만)
            if (i < 100) {
                console.log(`행 ${i}: "${firstCell}"`);
            }
            
            // 새로운 세미나 시작 (구분선 또는 헤더)
            const isSeparator = firstCell.startsWith('=') && firstCell.length >= 20;
            const isHeader = firstCell === '전사 신기술 세미나 실행계획';
            const isLongSeparator = firstCell.includes('=') && firstCell.length >= 30; // 더 긴 구분선도 감지
            
            // 구분선 감지 로그
            if (firstCell.startsWith('=')) {
                console.log(`🔍 구분선 후보 행 ${i}: "${firstCell}" (길이: ${firstCell.length})`);
            }
            
            if (isSeparator || isHeader || isLongSeparator) {
                console.log('🆕 새로운 세미나 시작 감지:', {
                    firstCell: firstCell,
                    rowNumber: i,
                    isSeparator: isSeparator,
                    isHeader: isHeader,
                    isLongSeparator: isLongSeparator,
                    currentSeminar: currentSeminar ? currentSeminar.session : 'null'
                });
                
                if (currentSeminar && currentSeminar.session) {
                    seminars.push(currentSeminar);
                    console.log('✅ 세미나 데이터 추가:', currentSeminar.session, '총 세미나 수:', seminars.length);
                }
                
                currentSeminar = {
                    session: '',
                    objective: '',
                    datetime: '',
                    location: '',
                    attendees: '',
                    timeSchedule: [],
                    attendeeList: []
                };
                currentSection = '';
                timeScheduleStart = false;
                attendeeListStart = false;
                isFirstSeminar = false;
                continue;
            }
            
            if (!currentSeminar) continue;
            
            // 섹션 구분
            if (firstCell.includes('1. 기본 정보')) {
                currentSection = 'basic';
                continue;
            } else if (firstCell.includes('2. 시간 계획')) {
                currentSection = 'timeSchedule';
                timeScheduleStart = true;
                continue;
            } else if (firstCell.includes('3. 참석자 명단')) {
                currentSection = 'attendeeList';
                attendeeListStart = true;
                timeScheduleStart = false;
                continue;
            }
            
            // 기본 정보 파싱
            if (currentSection === 'basic') {
                if (firstCell === '회차' && row[1]) {
                    currentSeminar.session = String(row[1]).trim();
                    console.log('📋 회차 파싱:', currentSeminar.session, '행 번호:', i);
                } else if (firstCell === '목표' && row[1]) {
                    currentSeminar.objective = String(row[1]).trim();
                    console.log('📋 목표 파싱:', currentSeminar.objective, '행 번호:', i);
                } else if (firstCell === '일시' && row[1]) {
                    currentSeminar.datetime = String(row[1]).trim();
                    console.log('📋 일시 파싱:', currentSeminar.datetime, '행 번호:', i);
                } else if (firstCell === '장소' && row[1]) {
                    currentSeminar.location = String(row[1]).trim();
                    console.log('📋 장소 파싱:', currentSeminar.location, '행 번호:', i);
                } else if (firstCell === '참석 대상' && row[1]) {
                    currentSeminar.attendees = String(row[1]).trim();
                    console.log('📋 참석 대상 파싱:', currentSeminar.attendees, '행 번호:', i);
                }
            }
            
            // 시간 계획 파싱
            if (currentSection === 'timeSchedule' && timeScheduleStart) {
                if (firstCell === '구분') continue;
                if (!firstCell) {
                    timeScheduleStart = false;
                    continue;
                }
                
                currentSeminar.timeSchedule.push({
                    type: firstCell,
                    content: row[1] ? String(row[1]).trim() : '',
                    time: row[2] ? String(row[2]).trim() : '',
                    responsible: row[3] ? String(row[3]).trim() : ''
                });
            }
            
            // 참석자 명단 파싱
            if (currentSection === 'attendeeList' && attendeeListStart) {
                if (firstCell === 'No') continue;
                if (!firstCell) {
                    attendeeListStart = false;
                    continue;
                }
                
                // No 컬럼이 있는 경우와 없는 경우 모두 처리
                let nameIndex = 1, positionIndex = 2, departmentIndex = 3, workIndex = 4;
                
                // 첫 번째 컬럼이 숫자인 경우 (No 컬럼이 있는 경우)
                if (!isNaN(parseInt(firstCell))) {
                    nameIndex = 1;
                    positionIndex = 2;
                    departmentIndex = 3;
                    workIndex = 4;
                } else {
                    // 첫 번째 컬럼이 이름인 경우 (No 컬럼이 없는 경우)
                    nameIndex = 0;
                    positionIndex = 1;
                    departmentIndex = 2;
                    workIndex = 3;
                }
                
                const attendee = {
                    name: row[nameIndex] ? String(row[nameIndex]).trim() : '',
                    position: row[positionIndex] ? String(row[positionIndex]).trim() : '',
                    department: row[departmentIndex] ? String(row[departmentIndex]).trim() : '',
                    work: row[workIndex] ? String(row[workIndex]).trim() : ''
                };
                
                console.log('👥 참석자 파싱:', attendee, '행 번호:', i);
                currentSeminar.attendeeList.push(attendee);
            }
        }
        
        // 마지막 세미나 추가
        if (currentSeminar && currentSeminar.session) {
            seminars.push(currentSeminar);
            console.log('✅ 마지막 세미나 데이터 추가:', currentSeminar.session, '총 세미나 수:', seminars.length);
        } else if (currentSeminar) {
            console.log('⚠️ 마지막 세미나 데이터가 불완전함:', currentSeminar);
        }
        
        console.log('📊 파싱 완료, 총 세미나 수:', seminars.length);
        console.log('📊 파싱된 세미나 목록:', seminars.map(s => ({ session: s.session, datetime: s.datetime })));
        seminars.forEach((seminar, index) => {
            console.log(`세미나 ${index + 1}:`, seminar.session, seminar.datetime);
        });
        
        return seminars;
    }

    // 여러 세미나 데이터 일괄 저장
    async saveMultipleSeminars(seminars) {
        try {
            let successCount = 0;
            let errorCount = 0;
            
            for (const seminar of seminars) {
                try {
                    // 회차와 일시가 모두 있는지 확인
                    if (!seminar.session || !seminar.datetime) {
                        console.warn('회차 또는 일시가 없는 세미나 데이터 건너뛰기:', seminar);
                        errorCount++;
                        continue;
                    }
                    
                    // 회차 + 일시를 키값으로 사용
                    const keyValue = `${seminar.session}_${seminar.datetime}`;
                    
                    // 기존 데이터에서 동일한 키값을 가진 데이터 찾기
                    const existingData = await this.findExistingDataByKey(keyValue);
                    
                    let result;
                    
                    if (existingData) {
                        // 기존 데이터가 있으면 수정
                        if (useLocalStorage) {
                            result = this.saveToLocalStorage(seminar, existingData.id);
                        } else {
                            result = await window.updateData(existingData.id, seminar);
                        }
                    } else {
                        // 기존 데이터가 없으면 새로 등록
                        if (useLocalStorage) {
                            result = this.saveToLocalStorage(seminar);
                        } else {
                            result = await window.saveData(seminar);
                        }
                    }
                    
                    if (result.success) {
                        successCount++;
                        console.log(`세미나 데이터 저장 성공: ${seminar.session}`);
                    } else {
                        errorCount++;
                        console.error(`세미나 데이터 저장 실패: ${seminar.session}`, result.message);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`세미나 데이터 저장 오류: ${seminar.session}`, error);
                }
            }
            
            console.log(`일괄 저장 완료: 성공 ${successCount}건, 실패 ${errorCount}건`);
            
        } catch (error) {
            console.error('여러 세미나 데이터 일괄 저장 오류:', error);
            throw error;
        }
    }

    // 엑셀 데이터를 폼에 로드
    async loadDataFromExcel(data) {
        // 현재 데이터 업데이트
        this.currentData = data;
        this.currentDocumentId = null; // 새 데이터이므로 ID 초기화
        
        // 폼 필드 업데이트
        await this.populateForm();
    }

    // 일괄삭제 메서드 (모든 데이터 삭제)
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
    }

    // 데이터 삭제 메서드
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
                const result = await window.deleteData(this.currentDocumentId);
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
                        attendeeList: []
                    };
                    this.currentDocumentId = null;
                    
                    // 폼 초기화
                    this.initializeMainForm();
                } else {
                    this.showErrorToast(`데이터 삭제 실패: ${result.error}`);
                }
            } else {
                // 로컬 스토리지에서 데이터 삭제
                localStorage.removeItem('seminarData');
                this.showSuccessToast('데이터가 성공적으로 삭제되었습니다.');
                
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
            }
        } catch (error) {
            console.error('데이터 삭제 오류:', error);
            this.showErrorToast(`데이터 삭제 실패: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }









    // PDF 실시결과 내보내기
    async exportResultToPDF() {
        try {
            this.showLoading(true);
            
            // 현재 세미나 정보 가져오기
            const sessionSelect = document.getElementById('sessionSelect').value;
            const sessionInput = document.getElementById('sessionInput').value;
            const session = sessionSelect || sessionInput;
            const datetime = document.getElementById('datetime').value;
            
            console.log('🔍 세미나 정보 조회:', { session, datetime });
            
            if (!session || !datetime) {
                this.showErrorToast('먼저 세미나 정보를 입력해주세요.');
                this.showLoading(false);
                return;
            }
            
            // 실시결과 데이터 조회
            const resultData = await loadResultDataByKey(session, datetime);
            console.log('📊 조회된 실시결과 데이터:', resultData);
            
            console.log('✅ 찾은 실시결과 데이터:', resultData);
            
            // 실시결과 데이터가 없어도 메인화면 데이터로 PDF 생성
            if (!resultData) {
                console.log('⚠️ 실시결과 데이터가 없음. 메인화면 데이터로 PDF 생성');
                const mainResultData = this.getMainResultData();
                resultData = {
                    session: session,
                    datetime: datetime,
                    objective: mainResultData.objective || '목표가 등록되지 않았습니다.',
                    mainContent: mainResultData.mainContent || '실시결과가 등록되지 않았습니다.',
                    futurePlan: mainResultData.futurePlan || '향후 계획이 등록되지 않았습니다.',
                    sketches: mainResultData.sketches.map(sketch => ({
                        title: sketch.title,
                        imageData: null, // 파일은 나중에 처리
                        fileName: sketch.file.name
                    }))
                };
            }
            
            // PDFMake 라이브러리 로딩 대기 및 확인
            this.waitForPDFMake().then(() => {
                console.log('✅ PDFMake 라이브러리 사용 (실시결과)');
                this.exportResultToPDFWithPDFMake(resultData);
            }).catch(() => {
                console.log('🔄 PDFMake 로딩 실패, HTML to PDF 방식 사용 (실시결과)');
                this.exportResultToPDFWithHTML(resultData);
            }).finally(() => {
                // 로딩 상태 해제는 각 함수에서 처리
            });
            
        } catch (error) {
            console.error('PDF 실시결과 내보내기 오류:', error);
            this.showErrorToast('PDF 실시결과 내보내기 중 오류가 발생했습니다.');
            this.showLoading(false);
        }
    }

    // PDFMake를 사용한 실시결과 PDF 생성
    exportResultToPDFWithPDFMake(resultData) {
        try {
            // PDFMake 라이브러리 로딩 확인
            if (!window.pdfMake) {
                console.warn('⚠️ PDFMake 라이브러리가 로드되지 않았습니다. HTML to PDF 방식으로 전환합니다.');
                this.exportResultToPDFWithHTML(resultData);
                return;
            }
            
            console.log('✅ PDFMake 라이브러리 로드 완료 (실시결과)');
            
            // 현재 세미나 정보
            const session = resultData.session;
            const datetime = resultData.datetime;
            const location = document.getElementById('location').value || '미입력';
            const attendeeTarget = document.getElementById('attendees').value || '미입력';
            
            // PDF 문서 정의
            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [40, 60, 40, 60],
                footer: function(currentPage, pageCount) {
                    return {
                        text: `- ${currentPage} -`,
                        alignment: 'center',
                        fontSize: 10,
                        margin: [0, 10, 0, 0]
                    };
                },
                content: [
                    // 제목
                    {
                        text: `${session} 전사 신기술 세미나 실시 결과`,
                        fontSize: 18,
                        bold: true,
                        alignment: 'center',
                        margin: [0, 0, 0, 30]
                    },
                    
                    // 1. 개요
                    {
                        text: '1. 개요',
                        fontSize: 14,
                        bold: true,
                        margin: [0, 0, 0, 10]
                    },
                    {
                        columns: [
                            {
                                text: '　　□ 일시/장소:',
                                width: 'auto'
                            },
                            {
                                text: `${datetime} / ${location}`,
                                width: '*'
                            }
                        ],
                        margin: [0, 0, 0, 5]
                    },
                    {
                        columns: [
                            {
                                text: '　　□ 참석 인력:',
                                width: 'auto'
                            },
                            {
                                text: attendeeTarget,
                                width: '*'
                            }
                        ],
                        margin: [0, 0, 0, 20]
                    },
                    
                    // 2. 주요 내용
                    {
                        text: '2. 주요 내용',
                        fontSize: 14,
                        bold: true,
                        margin: [0, 0, 0, 10]
                    },
                    {
                        text: this.parseMainContent(resultData.mainContent),
                        margin: [0, 0, 0, 20],
                        preserveLeadingSpaces: true
                    },
                    
                    // 3. 향후 계획
                    {
                        text: '3. 향후 계획',
                        fontSize: 14,
                        bold: true,
                        margin: [0, 0, 0, 10]
                    },
                    {
                        text: this.parseMainContent(resultData.futurePlan),
                        margin: [0, 0, 0, 20],
                        preserveLeadingSpaces: true
                    }
                ],
                styles: {
                    header: {
                        fontSize: 16,
                        bold: true,
                        margin: [0, 0, 0, 10]
                    }
                }
            };
            
            // 참석자 명단 데이터 가져오기 (참석여부가 Y인 대상만)
            const attendeeList = this.getAttendeeData().filter(attendee => attendee.attendance === 'Y');
            
            // 참석자 명단 추가 (새 페이지)
            if (attendeeList && attendeeList.length > 0) {
                const attendeeTable = {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', '*', '*', '*'],
                        body: [
                            [
                                { text: 'No', alignment: 'center' },
                                { text: '성명', alignment: 'center' },
                                { text: '직급', alignment: 'center' },
                                { text: '소속', alignment: 'center' },
                                { text: '업무', alignment: 'left' }
                            ],
                            ...attendeeList.map((attendee, index) => [
                                { text: (index + 1).toString(), alignment: 'center' },
                                { text: attendee.name || '미입력', alignment: 'center' },
                                { text: attendee.position || '미입력', alignment: 'center' },
                                { text: attendee.department || '미입력', alignment: 'center' },
                                { text: attendee.work || '미입력', alignment: 'left' }
                            ])
                        ]
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 0, 0, 20]
                };
                
                docDefinition.content.push(
                    { text: '', pageBreak: 'before' },
                    { text: '[별첨 1] 세미나 참석명단', style: 'header' },
                    attendeeTable
                );
            }
            
            // 스케치 추가 (새 페이지, 첨부형식)
            if (resultData.sketches && resultData.sketches.length > 0) {
                docDefinition.content.push(
                    { text: '', pageBreak: 'before' },
                    { text: '[별첨 2] 세미나 스케치', style: 'header' },
                );
                
                resultData.sketches.forEach((sketch, index) => {
                    if (sketch.title && sketch.imageData) {
                        docDefinition.content.push(
                            {
                                text: `${index + 1}. ${sketch.title}`,
                                fontSize: 11,
                                bold: true,
                                margin: [0, 10, 0, 5]
                            },
                            {
                                image: sketch.imageData,
                                width: 400,
                                alignment: 'center',
                                margin: [0, 0, 0, 20]
                            }
                        );
                    }
                });
            }
            
            // PDF 생성 및 다운로드
            const currentDate = new Date();
            const dateString = currentDate.getFullYear().toString() + 
                              (currentDate.getMonth() + 1).toString().padStart(2, '0') + 
                              currentDate.getDate().toString().padStart(2, '0');
            pdfMake.createPdf(docDefinition).download(`${dateString} 전사 신기술 세미나 실시결과.pdf`);
            this.showSuccessToast('PDF 실시결과가 성공적으로 생성되었습니다.');
            this.showLoading(false);
            
        } catch (error) {
            console.error('PDFMake 실시결과 PDF 생성 오류:', error);
            this.showLoading(false);
            this.exportResultToPDFWithHTML(resultData);
        }
    }

    // HTML to PDF 방식으로 실시결과 내보내기 (새 탭 열어 인쇄 대화상자)
    exportResultToPDFWithHTML(resultData) {
        try {
            console.log('🔄 HTML to PDF 방식으로 실시결과 PDF 생성 (새 탭)');
            
            // HTML 콘텐츠 생성
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
            
            // 문서 제목 설정(저장 시 기본 파일명으로 사용)
            const currentDate = new Date();
            const dateString = currentDate.getFullYear().toString() + 
                              (currentDate.getMonth() + 1).toString().padStart(2, '0') + 
                              currentDate.getDate().toString().padStart(2, '0');
            newWindow.document.title = `${dateString} 전사 신기술 세미나 실시결과.pdf`;
            
            // 인쇄 대화상자 호출(사용자는 PDF로 저장 선택)
            setTimeout(() => {
                newWindow.print();
                this.showSuccessToast('인쇄 대화상자가 열렸습니다. "PDF로 저장"을 선택하세요.');
            }, 500);
        } catch (error) {
            console.error('HTML to PDF 실시결과 내보내기 오류:', error);
            this.showErrorToast('PDF 실시결과 내보내기 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    // 주요 내용 텍스트 파싱 함수
    parseMainContent(text) {
        if (!text) return '미입력';
        
        console.log('원본 텍스트:', text);
        
        // 텍스트를 줄바꿈으로 분리
        const lines = text.split('\n');
        const result = [];
        
        for (let line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            // □ 로 시작하는 경우 (공백 포함)
            if (trimmedLine.startsWith('□ ')) {
                const content = trimmedLine.substring(2).trim();
                result.push(`　　□ ${content}`);
            }
            // - 로 시작하는 경우 (공백 포함)
            else if (trimmedLine.startsWith('- ')) {
                const content = trimmedLine.substring(2).trim();
                result.push(`　　　　- ${content}`);
            }
            // □ 로 시작하는 경우 (공백 없음)
            else if (trimmedLine.startsWith('□')) {
                const content = trimmedLine.substring(1).trim();
                result.push(`　　${content}`);
            }
            // - 로 시작하는 경우 (공백 없음)
            else if (trimmedLine.startsWith('-')) {
                const content = trimmedLine.substring(1).trim();
                result.push(`　　　　- ${content}`);
            }
            // 일반 텍스트인 경우
            else {
                result.push(`　　□ ${trimmedLine}`);
            }
        }
        
        console.log('파싱 결과:', result);
        return result.join('\n');
    }

    // 참석자 데이터 가져오기
    getAttendeeData() {
        const attendeeRows = document.querySelectorAll('#attendeeTableBody tr');
        const attendees = [];
        
        attendeeRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) { // 참석여부 컬럼 추가로 6개 컬럼
                const name = cells[1].querySelector('input')?.value || '';
                
                // 직급 필드 처리 (select 또는 input)
                let position = '';
                const positionSelect = cells[2].querySelector('select');
                const positionInput = cells[2].querySelector('input');
                
                if (positionSelect) {
                    position = positionSelect.value || '';
                    if (position === '직접입력') {
                        const customPosition = cells[2].querySelector('input[data-field="position-custom"]')?.value || '';
                        position = customPosition;
                    }
                } else if (positionInput) {
                    position = positionInput.value || '';
                }
                
                // 소속 필드 처리 (select 또는 input)
                let department = '';
                const departmentSelect = cells[3].querySelector('select');
                const departmentInput = cells[3].querySelector('input');
                
                if (departmentSelect) {
                    department = departmentSelect.value || '';
                    if (department === '직접입력') {
                        const customDepartment = cells[3].querySelector('input[data-field="department-custom"]')?.value || '';
                        department = customDepartment;
                    }
                } else if (departmentInput) {
                    department = departmentInput.value || '';
                }
                
                // 업무 필드 처리 (select 또는 input)
                let work = '';
                const workSelect = cells[4].querySelector('select');
                const workInput = cells[4].querySelector('input');
                
                if (workSelect) {
                    work = workSelect.value || '';
                    if (work === '직접입력') {
                        const customWork = cells[4].querySelector('input[data-field="work-custom"]')?.value || '';
                        work = customWork;
                    }
                } else if (workInput) {
                    work = workInput.value || '';
                }
                
                const attendance = cells[5].querySelector('select')?.value || 'N'; // 참석여부 값 가져오기
                
                if (name.trim()) {
                    attendees.push({
                        name: name.trim(),
                        position: position.trim(),
                        department: department.trim(),
                        work: work.trim(),
                        attendance: attendance // 참석여부 필드 추가
                    });
                }
            }
        });
        
        return attendees;
    }

    // 스케치 업로드 추가
    addSketchUpload() {
        const container = document.getElementById('sketchUploadContainer');
        
        // 현재 스케치 개수 확인 (단순하게)
        const currentCount = container.children.length;
        
        console.log('addSketchUpload 호출됨, 현재 개수:', currentCount);
        
        // 최대 10개까지만 추가 가능
        if (currentCount >= 10) {
            this.showErrorToast('최대 10개의 스케치만 추가할 수 있습니다.');
            return;
        }
        
        // 다음 인덱스는 현재 개수
        const nextIndex = currentCount;
        
        const sketchDiv = document.createElement('div');
        sketchDiv.className = 'border border-gray-200 rounded-lg p-4';
        sketchDiv.setAttribute('data-sketch-index', nextIndex);
        
        sketchDiv.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-md font-medium text-gray-700 flex items-center">
                    <i class="fas fa-image text-orange-500 mr-2"></i>
                    스케치 업로드
                </h3>
                <button type="button" class="removeSketchBtn bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200" data-sketch-index="${nextIndex}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="space-y-3">
                <div>
                    <label class="block mb-2">
                        <span class="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-xs font-semibold shadow-sm">
                            <i class="fas fa-heading mr-2"></i>업로드 제목
                        </span>
                    </label>
                    <input type="text" id="mainSketchTitle${nextIndex}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="스케치 제목을 입력하세요">
                </div>
                <div>
                    <label class="block mb-2">
                        <span class="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-xs font-semibold shadow-sm">
                            <i class="fas fa-file-image mr-2"></i>이미지 파일
                        </span>
                    </label>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors duration-200">
                        <input type="file" id="mainSketchFile${nextIndex}" accept="image/*" class="hidden">
                        <div id="mainFileUploadArea${nextIndex}" class="cursor-pointer">
                            <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                            <p class="text-gray-600 text-sm mb-1">클릭하여 이미지를 선택하세요</p>
                            <p class="text-xs text-gray-500">JPG, PNG, GIF 파일만 업로드 가능합니다</p>
                        </div>
                        <div id="mainFilePreview${nextIndex}" class="hidden mt-3">
                            <img id="mainPreviewImage${nextIndex}" class="max-w-full max-h-32 mx-auto rounded-lg shadow-md">
                            <p id="mainFileName${nextIndex}" class="text-xs text-gray-600 mt-2"></p>
                            <div class="mt-2 flex justify-center space-x-2">
                                <button type="button" id="mainDownloadFile${nextIndex}" class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center">
                                    <i class="fas fa-download mr-1"></i>파일 다운로드
                                </button>
                                <button type="button" id="mainRemoveFile${nextIndex}" class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center">
                                    <i class="fas fa-trash mr-1"></i>파일 제거
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(sketchDiv);
        
        // 이벤트 리스너 추가
        this.bindSketchEvents(nextIndex);
        
        // 데이터 구조에 추가
        if (!this.currentData.sketches) {
            this.currentData.sketches = [];
        }
        this.currentData.sketches[nextIndex] = {
            title: '',
            imageData: '',
            fileName: ''
        };
        
        this.showSuccessToast('스케치 업로드가 추가되었습니다.');
    }
    
    // 스케치 업로드 삭제
    removeSketchUpload(sketchIndex) {
        console.log('removeSketchUpload 호출됨, sketchIndex:', sketchIndex);
        
        const container = document.getElementById('sketchUploadContainer');
        const currentCount = container.children.length;
        
        // 최소 1개는 유지
        if (currentCount <= 1) {
            this.showErrorToast('최소 1개의 스케치는 유지해야 합니다.');
            return;
        }
        
        if (confirm('스케치 업로드를 삭제하시겠습니까?')) {
            const sketchDiv = container.querySelector(`[data-sketch-index="${sketchIndex}"]`);
            if (sketchDiv) {
                console.log(`스케치 인덱스 ${sketchIndex} 삭제 시작`);
                sketchDiv.remove();
                
                // 데이터에서도 제거
                if (this.currentData.sketches && this.currentData.sketches[sketchIndex]) {
                    this.currentData.sketches[sketchIndex] = null;
                }
                
                this.showSuccessToast('스케치 업로드가 삭제되었습니다.');
            } else {
                console.log(`스케치 인덱스 ${sketchIndex}을 찾을 수 없음`);
            }
        }
    }
    
    
    // 스케치 이벤트 바인딩
    bindSketchEvents(sketchIndex) {
        // 파일 업로드 이벤트
        const fileInput = document.getElementById(`mainSketchFile${sketchIndex}`);
        const uploadArea = document.getElementById(`mainFileUploadArea${sketchIndex}`);
        const removeBtn = document.getElementById(`mainRemoveFile${sketchIndex}`);
        const downloadBtn = document.getElementById(`mainDownloadFile${sketchIndex}`);
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleMainFileUpload(e, sketchIndex));
        }
        
        if (uploadArea) {
            uploadArea.addEventListener('click', () => fileInput.click());
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeMainFile(sketchIndex));
        }
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadMainFile(sketchIndex));
        }
    }

    // 메인화면 파일 업로드 처리
    handleMainFileUpload(event, sketchIndex) {
        const file = event.target.files[0];
        if (file) {
            // 파일 타입 검증
            if (!file.type.startsWith('image/')) {
                this.showErrorToast('이미지 파일만 업로드 가능합니다.');
                return;
            }
            
            // 파일 크기 검증 (5MB 제한)
            if (file.size > 5 * 1024 * 1024) {
                this.showErrorToast('파일 크기는 5MB 이하여야 합니다.');
                return;
            }
            
            // 파일 미리보기
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById(`mainPreviewImage${sketchIndex}`).src = e.target.result;
                document.getElementById(`mainFileName${sketchIndex}`).textContent = file.name;
                document.getElementById(`mainFilePreview${sketchIndex}`).classList.remove('hidden');
                document.getElementById(`mainFileUploadArea${sketchIndex}`).classList.add('hidden');
                
                // 스케치 빠른 저장 버튼 상태 업데이트
                this.toggleQuickSaveSketchButton();
            };
            reader.readAsDataURL(file);
        }
    }

    // 메인화면 파일 제거
    removeMainFile(sketchIndex) {
        document.getElementById(`mainSketchFile${sketchIndex}`).value = '';
        document.getElementById(`mainFilePreview${sketchIndex}`).classList.add('hidden');
        document.getElementById(`mainFileUploadArea${sketchIndex}`).classList.remove('hidden');
        
        // 스케치 빠른 저장 버튼 상태 업데이트
        this.toggleQuickSaveSketchButton();
    }

    // 메인화면 스케치 파일 다운로드
    downloadMainFile(sketchIndex) {
        try {
            const previewImg = document.getElementById(`mainPreviewImage${sketchIndex}`);
            const fileName = document.getElementById(`mainFileName${sketchIndex}`);
            
            if (!previewImg || !previewImg.src) {
                this.showErrorToast('다운로드할 이미지가 없습니다.');
                return;
            }
            
            // Base64 이미지 데이터에서 파일명 추출
            const displayFileName = fileName ? fileName.textContent : `스케치${sketchNumber}.jpg`;
            
            // Base64 데이터를 Blob으로 변환
            const base64Data = previewImg.src;
            const byteCharacters = atob(base64Data.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            
            // 다운로드 링크 생성
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = displayFileName;
            
            // 다운로드 실행
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // URL 해제
            window.URL.revokeObjectURL(url);
            
            this.showSuccessToast(`${displayFileName} 파일이 다운로드되었습니다.`);
            
        } catch (error) {
            console.error('파일 다운로드 오류:', error);
            this.showErrorToast('파일 다운로드 중 오류가 발생했습니다.');
        }
    }

    // 메인화면 실시결과 데이터 가져오기
    getMainResultData() {
        return {
            mainContent: document.getElementById('mainResultContent').value.trim(),
            futurePlan: document.getElementById('mainResultFuturePlan').value.trim(),
            sketches: this.getMainSketchData()
        };
    }

    // 메인화면 스케치 데이터 가져오기
    getMainSketchData() {
        const sketches = [];
        const container = document.getElementById('sketchUploadContainer');
        const sketchElements = container.querySelectorAll('[data-sketch-number]');
        
        sketchElements.forEach((sketchElement, index) => {
            const sketchNumber = sketchElement.getAttribute('data-sketch-number');
            const title = document.getElementById(`mainSketchTitle${sketchNumber}`)?.value.trim() || '';
            const file = document.getElementById(`mainSketchFile${sketchNumber}`)?.files[0];
            const previewImg = document.getElementById(`mainPreviewImage${sketchNumber}`);
            
            if (title && (file || previewImg?.src)) {
                sketches.push({
                    title: title,
                    imageData: previewImg?.src || null,
                    fileName: file?.name || '업로드된 이미지'
                });
            }
        });
        
        return sketches;
    }

    // 메인화면 실시결과 데이터 로드
    async loadMainResultData() {
        try {
            const session = document.getElementById('sessionSelect').value || document.getElementById('sessionInput').value;
            const datetime = document.getElementById('datetime').value;
            
            console.log('🔍 메인화면 실시결과 데이터 로드 시도:', { session, datetime });
            
            // 세미나 정보가 없어도 currentData에서 스케치 정보를 확인
            if (!session || !datetime) {
                console.log('⚠️ 세미나 정보가 없지만 currentData에서 스케치 정보 확인');
                
                // currentData에 스케치 정보가 있으면 표시
                if (this.currentData && this.currentData.sketches && this.currentData.sketches.length > 0) {
                    console.log('✅ currentData에서 스케치 정보 발견:', this.currentData.sketches);
                    this.populateMainResultForm({ sketches: this.currentData.sketches });
                    return;
                }
                
                console.log('ℹ️ currentData에도 스케치 정보가 없음, 기존 상태 유지');
                // this.clearMainResultForm(); // 주석 처리하여 기존 스케치 유지
                return;
            }
            
            // 특정 회차_일시의 실시결과 데이터 조회
            const resultData = await loadResultDataByKey(session, datetime);
            console.log('📊 조회된 실시결과 데이터:', resultData);
            console.log('📊 resultData.objective:', resultData ? resultData.objective : 'null');
            
            if (resultData) {
                console.log('✅ 기존 실시결과 데이터 발견, 메인화면에 로드:', resultData);
                this.populateMainResultForm(resultData);
            } else {
                console.log('ℹ️ 기존 실시결과 데이터가 없음, currentData에서 스케치 정보 확인');
                
                // currentData에 스케치 정보가 있으면 표시
                if (this.currentData && this.currentData.sketches && this.currentData.sketches.length > 0) {
                    console.log('✅ currentData에서 스케치 정보 발견:', this.currentData.sketches);
                    this.populateMainResultForm({ sketches: this.currentData.sketches });
                } else {
                    console.log('ℹ️ currentData에도 스케치 정보가 없음, 폼 초기화');
                    this.clearMainResultForm();
                }
            }
            
        } catch (error) {
            console.error('메인화면 실시결과 데이터 로드 오류:', error);
            this.clearMainResultForm();
        }
    }

    // 메인화면 실시결과 폼에 데이터 채우기
    populateMainResultForm(resultData) {
        console.log('📝 메인화면 폼에 데이터 채우기:', resultData);
        
        try {
            // 주요 내용, 향후 계획 채우기
            const mainContentEl = document.getElementById('mainResultContent');
            const futurePlanEl = document.getElementById('mainResultFuturePlan');
            
            if (mainContentEl) {
                if (Object.prototype.hasOwnProperty.call(resultData, 'mainContent')) {
                    // 값이 존재(빈 문자열 포함)하면 해당 값 반영
                    mainContentEl.value = resultData.mainContent || '';
                    if (resultData.mainContent) {
                        console.log('✅ 주요 내용 설정 (실시결과 데이터):', resultData.mainContent);
                    } else {
                        console.log('ℹ️ 실시결과 데이터에 주요 내용이 비어있음, 빈 값 반영');
                    }
                } else {
                    // partial 업데이트 시 기존 값 유지
                    console.log('↩️ 주요 내용 키가 없어 기존 값 유지');
                }
                // PDF 실시결과 내보내기 버튼 상태 업데이트
                this.toggleExportResultPDFButton();
            }
            
            if (futurePlanEl) {
                if (Object.prototype.hasOwnProperty.call(resultData, 'futurePlan')) {
                    // 값이 존재(빈 문자열 포함)하면 해당 값 반영
                    futurePlanEl.value = resultData.futurePlan || '';
                    if (resultData.futurePlan) {
                        console.log('✅ 향후 계획 설정 (실시결과 데이터):', resultData.futurePlan);
                    } else {
                        console.log('ℹ️ 실시결과 데이터에 향후 계획이 비어있음, 빈 값 반영');
                    }
                } else {
                    // partial 업데이트 시 기존 값 유지
                    console.log('↩️ 향후 계획 키가 없어 기존 값 유지');
                }
            }
            
            // 스케치 데이터 처리
            if (resultData.sketches && resultData.sketches.length > 0) {
                console.log('🖼️ 스케치 데이터 처리:', resultData.sketches);
                
                // 기존 동적 스케치들 모두 제거 (스케치 1, 2 제외)
                const container = document.getElementById('sketchUploadContainer');
                const existingSketches = container.querySelectorAll('[data-sketch-number]');
                
                // 스케치 3번부터 모두 제거
                existingSketches.forEach(sketch => {
                    const sketchNumber = parseInt(sketch.getAttribute('data-sketch-number'));
                    if (sketchNumber > 2) {
                        sketch.remove();
                    }
                });
                
                // 필요한 만큼 스케치 추가 (순차적으로)
                for (let i = 2; i < resultData.sketches.length; i++) {
                    this.addSketchUpload();
                }
                
                // 스케치 데이터 설정
                resultData.sketches.forEach((sketch, index) => {
                    if (sketch) {
                        const sketchNumber = index + 1;
                        const titleEl = document.getElementById(`mainSketchTitle${sketchNumber}`);
                        
                        if (titleEl) {
                            titleEl.value = sketch.title || '';
                            console.log(`✅ 스케치 ${sketchNumber} 제목 설정:`, sketch.title);
                        }
                        
                        if (sketch.imageData) {
                            // Base64 이미지 표시
                            const previewImg = document.getElementById(`mainPreviewImage${sketchNumber}`);
                            const fileName = document.getElementById(`mainFileName${sketchNumber}`);
                            const preview = document.getElementById(`mainFilePreview${sketchNumber}`);
                            const uploadArea = document.getElementById(`mainFileUploadArea${sketchNumber}`);
                            
                            if (previewImg) previewImg.src = sketch.imageData;
                            if (fileName) fileName.textContent = sketch.fileName || '업로드된 이미지';
                            if (preview) preview.classList.remove('hidden');
                            if (uploadArea) uploadArea.classList.add('hidden');
                            
                            console.log(`✅ 스케치 ${sketchNumber} 이미지 표시`);
                        }
                    }
                });
            } else {
                // 스케치가 없으면 초기화
                console.log('ℹ️ 스케치 데이터가 없어 스케치 필드 초기화');
                this.clearMainSketchFields();
            }
            
            console.log('✅ 메인화면 폼 데이터 채우기 완료');
            
            // 스케치 버튼 상태 확인
            setTimeout(() => {
                this.toggleQuickSaveSketchButton();
            }, 100);
            
        } catch (error) {
            console.error('메인화면 폼 데이터 채우기 오류:', error);
        }
    }

    // 메인화면 실시결과 폼 초기화
    clearMainResultForm() {
        // 목표, 주요 내용, 향후 계획은 기본 정보이므로 클리어하지 않음
        // 스케치만 초기화
        this.clearMainSketchFields();
    }

    // 메인화면 스케치 필드 초기화
    clearMainSketchFields() {
        const container = document.getElementById('sketchUploadContainer');
        const sketchElements = container.querySelectorAll('[data-sketch-number]');
        
        sketchElements.forEach((sketchElement) => {
            const sketchNumber = sketchElement.getAttribute('data-sketch-number');
            
            // 제목 초기화
            const titleInput = document.getElementById(`mainSketchTitle${sketchNumber}`);
            if (titleInput) titleInput.value = '';
            
            // 파일 초기화
            const fileInput = document.getElementById(`mainSketchFile${sketchNumber}`);
            if (fileInput) fileInput.value = '';
            
            // 미리보기 숨기기
            const preview = document.getElementById(`mainFilePreview${sketchNumber}`);
            if (preview) preview.classList.add('hidden');
            
            // 업로드 영역 보이기
            const uploadArea = document.getElementById(`mainFileUploadArea${sketchNumber}`);
            if (uploadArea) uploadArea.classList.remove('hidden');
        });
    }

    // 스케치 초기화 (스케치1, 스케치2만 남기고 나머지 제거)
    resetSketches() {
        const container = document.getElementById('sketchUploadContainer');
        const existingSketches = container.querySelectorAll('[data-sketch-number]');
        
        // 스케치3부터 모든 동적 스케치 제거
        existingSketches.forEach(sketch => {
            const sketchNumber = parseInt(sketch.getAttribute('data-sketch-number'));
            if (sketchNumber > 2) {
                console.log(`스케치 ${sketchNumber} 제거`);
                sketch.remove();
            }
        });
        
        // 스케치1, 스케치2의 내용만 초기화
        for (let i = 1; i <= 2; i++) {
            const titleInput = document.getElementById(`mainSketchTitle${i}`);
            if (titleInput) titleInput.value = '';
            
            const fileInput = document.getElementById(`mainSketchFile${i}`);
            if (fileInput) fileInput.value = '';
            
            const preview = document.getElementById(`mainFilePreview${i}`);
            if (preview) preview.classList.add('hidden');
            
            const uploadArea = document.getElementById(`mainFileUploadArea${i}`);
            if (uploadArea) uploadArea.classList.remove('hidden');
        }
        
        // 데이터에서도 동적 스케치 제거
        if (this.currentData.sketches) {
            this.currentData.sketches = this.currentData.sketches.slice(0, 2);
        }
        
        console.log('스케치 초기화 완료: 스케치1, 스케치2만 유지');
    }

    // 메인화면 실시결과 저장
    async saveMainResultData(skipLoading = false) {
        try {
            if (!skipLoading) {
                this.showLoading(true);
            }
            
            // 현재 세미나 정보 가져오기
            const session = document.getElementById('sessionSelect').value || document.getElementById('sessionInput').value;
            const datetime = document.getElementById('datetime').value;
            
            if (!session || !datetime) {
                this.showErrorToast('먼저 세미나 정보를 입력해주세요.');
                if (!skipLoading) {
                    this.showLoading(false);
                }
                return;
            }
            
            const mainContent = document.getElementById('mainResultContent').value.trim();
            const futurePlan = document.getElementById('mainResultFuturePlan').value.trim();
            
            // 스케치 1 정보
            const sketchTitle1 = document.getElementById('mainSketchTitle1').value.trim();
            const sketchFile1 = document.getElementById('mainSketchFile1').files[0];
            
            // 스케치 2 정보
            const sketchTitle2 = document.getElementById('mainSketchTitle2').value.trim();
            const sketchFile2 = document.getElementById('mainSketchFile2').files[0];
            
            // 실시결과 입력 항목과 스케치 정보는 필수값이 아니므로 유효성 검사 제거
            // 공백값으로도 저장 가능
            
            // 기존 실시결과 데이터 조회
            const existingResult = await loadResultDataByKey(session, datetime);
            
            // 실시결과 데이터 구성 (기존 스케치 데이터로 초기화)
            const resultData = {
                session: session,
                datetime: datetime,
                mainContent: mainContent || '', // 공백값도 저장 가능
                futurePlan: futurePlan || '', // 공백값도 저장 가능
                sketches: existingResult && existingResult.sketches ? [...existingResult.sketches] : []
            };
            
            // 스케치 1 처리
            if (sketchFile1) {
                // 새 파일이 업로드된 경우
                const uploadResult = await uploadImage(sketchFile1, '');
                if (uploadResult.success) {
                    const sketch1Data = {
                        title: sketchTitle1,
                        imageData: uploadResult.url,
                        fileName: sketchFile1.name
                    };
                    // 기존 스케치 1이 있으면 교체, 없으면 추가
                    if (resultData.sketches.length > 0) {
                        resultData.sketches[0] = sketch1Data;
                    } else {
                        resultData.sketches.push(sketch1Data);
                    }
                } else {
                    this.showErrorToast(`스케치 1 업로드 실패: ${uploadResult.message}`);
                    this.showLoading(false);
                    return;
                }
            } else if (sketchTitle1 && resultData.sketches.length > 0) {
                // 새 파일은 없지만 제목이 변경된 경우 (기존 스케치 1의 제목만 업데이트)
                resultData.sketches[0].title = sketchTitle1;
            }
            
            // 스케치 2 처리
            if (sketchFile2) {
                // 새 파일이 업로드된 경우
                const uploadResult = await uploadImage(sketchFile2, '');
                if (uploadResult.success) {
                    const sketch2Data = {
                        title: sketchTitle2,
                        imageData: uploadResult.url,
                        fileName: sketchFile2.name
                    };
                    // 기존 스케치 2가 있으면 교체, 없으면 추가
                    if (resultData.sketches.length > 1) {
                        resultData.sketches[1] = sketch2Data;
                    } else if (resultData.sketches.length === 1) {
                        resultData.sketches.push(sketch2Data);
                    } else {
                        resultData.sketches.push(sketch2Data);
                    }
                } else {
                    this.showErrorToast(`스케치 2 업로드 실패: ${uploadResult.message}`);
                    this.showLoading(false);
                    return;
                }
            } else if (sketchTitle2 && resultData.sketches.length > 1) {
                // 새 파일은 없지만 제목이 변경된 경우 (기존 스케치 2의 제목만 업데이트)
                resultData.sketches[1].title = sketchTitle2;
            }
            
            // 데이터 저장
            const result = await saveResultData(resultData);
            
            if (result.success) {
                this.showSuccessToast('메인화면 실시결과가 성공적으로 저장되었습니다.');
            } else {
                this.showErrorToast(result.message);
            }
            
        } catch (error) {
            console.error('메인화면 실시결과 저장 오류:', error);
            this.showErrorToast('메인화면 실시결과 저장 중 오류가 발생했습니다.');
        } finally {
            if (!skipLoading) {
                this.showLoading(false);
            }
        }
    }
    
    // 스케치 정보만 저장하는 함수
    async saveSketchData() {
        try {
            this.showLoading(true);
            
            // 현재 세미나 정보 가져오기
            const session = document.getElementById('sessionSelect').value || document.getElementById('sessionInput').value;
            const datetime = document.getElementById('datetime').value;
            
            if (!session || !datetime) {
                this.showErrorToast('먼저 세미나 정보를 입력해주세요.');
                this.showLoading(false);
                return;
            }
            
            // 스케치 1 정보
            const sketchTitle1 = document.getElementById('mainSketchTitle1').value.trim();
            const sketchFile1 = document.getElementById('mainSketchFile1').files[0];
            
            // 스케치 2 정보
            const sketchTitle2 = document.getElementById('mainSketchTitle2').value.trim();
            const sketchFile2 = document.getElementById('mainSketchFile2').files[0];
            
            // 스케치 정보는 필수값이 아니므로 유효성 검사 제거
            // 공백값으로도 저장 가능 (스케치 정보를 모두 지우고 저장하는 경우)
            
            // 기존 실시결과 데이터 조회
            const existingResult = await loadResultDataByKey(session, datetime);
            
            // 스케치 데이터만 구성
            const sketchData = {
                session: session,
                datetime: datetime,
                sketches: existingResult && existingResult.sketches ? [...existingResult.sketches] : []
            };
            
            // 현재 변경사항 확인
            const hasCurrentChanges = sketchFile1 || sketchFile2 || sketchTitle1 || sketchTitle2;
            const hasExistingSketchData = this.currentData && this.currentData.sketches && this.currentData.sketches.length > 0;
            
            // 스케치 정보가 없는 경우 공백으로 저장
            // 현재 변경사항이 없고 기존 스케치 데이터가 있는 경우, 모든 스케치를 삭제하는 것으로 간주
            // 또는 스케치 정보를 모두 지우고 저장하는 경우도 허용
            if (!hasCurrentChanges) {
                sketchData.sketches = []; // 빈 배열로 설정하여 모든 스케치 삭제 또는 공백 저장
            }
            
            // 스케치 1 처리
            if (sketchFile1) {
                // 새 파일이 업로드된 경우
                const uploadResult = await uploadImage(sketchFile1, '');
                if (uploadResult.success) {
                    const sketch1Data = {
                        title: sketchTitle1,
                        imageData: uploadResult.url,
                        fileName: sketchFile1.name
                    };
                    // 기존 스케치 1이 있으면 교체, 없으면 추가
                    if (sketchData.sketches.length > 0) {
                        sketchData.sketches[0] = sketch1Data;
                    } else {
                        sketchData.sketches.push(sketch1Data);
                    }
                } else {
                    this.showErrorToast(`스케치 1 업로드 실패: ${uploadResult.message}`);
                    this.showLoading(false);
                    return;
                }
            } else if (sketchTitle1 && sketchData.sketches.length > 0) {
                // 새 파일은 없지만 제목이 변경된 경우 (기존 스케치 1의 제목만 업데이트)
                sketchData.sketches[0].title = sketchTitle1;
            }
            
            // 스케치 2 처리
            if (sketchFile2) {
                // 새 파일이 업로드된 경우
                const uploadResult = await uploadImage(sketchFile2, '');
                if (uploadResult.success) {
                    const sketch2Data = {
                        title: sketchTitle2,
                        imageData: uploadResult.url,
                        fileName: sketchFile2.name
                    };
                    // 기존 스케치 2가 있으면 교체, 없으면 추가
                    if (sketchData.sketches.length > 1) {
                        sketchData.sketches[1] = sketch2Data;
                    } else if (sketchData.sketches.length === 1) {
                        sketchData.sketches.push(sketch2Data);
                    } else {
                        sketchData.sketches.push(sketch2Data);
                    }
                } else {
                    this.showErrorToast(`스케치 2 업로드 실패: ${uploadResult.message}`);
                    this.showLoading(false);
                    return;
                }
            } else if (sketchTitle2 && sketchData.sketches.length > 1) {
                // 새 파일은 없지만 제목이 변경된 경우 (기존 스케치 2의 제목만 업데이트)
                sketchData.sketches[1].title = sketchTitle2;
            }
            
            // 스케치 데이터만 저장
            const result = await saveResultData(sketchData);
            
            if (result.success) {
                if (sketchData.sketches.length === 0) {
                    this.showSuccessToast('세미나 스케치 정보가 공백으로 저장되었습니다.');
                } else {
                    this.showSuccessToast('세미나 스케치가 성공적으로 저장되었습니다.');
                }
                // 스케치 저장 후 버튼 상태 업데이트
                this.toggleQuickSaveSketchButton();
            } else {
                this.showErrorToast(result.message);
            }
            
        } catch (error) {
            console.error('스케치 저장 오류:', error);
            this.showErrorToast('스케치 저장 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    // 실시결과 PDF용 HTML 콘텐츠 생성
    generateResultPDFHTML(resultData) {
        const session = resultData.session;
        const datetime = resultData.datetime;
        const location = document.getElementById('location').value || '미입력';
        const attendeeTarget = document.getElementById('attendees').value || '미입력';
        
        // 안전한 텍스트 처리 함수
        const safeText = (text) => {
            if (!text || text.trim() === '') return '미입력';
            return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };
        
        // 참석자 명단 데이터 가져오기 (참석여부가 Y인 대상만)
        const attendeeList = this.getAttendeeData().filter(attendee => attendee.attendance === 'Y');
        
        // 참석자 명단 HTML 생성
        let attendeeTableHTML = '';
        if (attendeeList && attendeeList.length > 0) {
            attendeeTableHTML = `
                <div style="page-break-before: always;">
                    <h2>[별첨 1] 세미나 참석명단</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <thead>
                            <tr style="background-color: #f5f5f5;">
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">No</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">성명</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">직급</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">소속</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">업무</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${attendeeList.map((attendee, index) => `
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${safeText(attendee.name)}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${safeText(attendee.position)}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${safeText(attendee.department)}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${safeText(attendee.work)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // 스케치 HTML 생성 (첨부형식)
        let sketchHTML = '';
        if (resultData.sketches && resultData.sketches.length > 0) {
            sketchHTML = `
                <div style="page-break-before: always;">
                    <h2>[별첨 2] 세미나 스케치</h2>
                    <div style="margin: 20px 0;">
                        ${resultData.sketches.map((sketch, index) => {
                            if (sketch.title && sketch.imageData) {
                                return `
                                    <div style="margin: 15px 0; border: 1px solid #ddd; padding: 10px;">
                                        <p style="font-size: 11px; margin: 0 0 10px 0; font-weight: bold;">
                                            ${index + 1}. ${safeText(sketch.title)}
                                        </p>
                                        <img src="${sketch.imageData}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />
                                    </div>
                                `;
                            }
                            return '';
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <title>전사 신기술 세미나 실시결과</title>
                <meta name="author" content="(주)경포씨엔씨">
                <meta name="description" content="전사 신기술 세미나 실시결과">
                <meta name="keywords" content="세미나, 실시결과, KPCNC">
                <meta name="robots" content="noindex, nofollow">
                <meta name="generator" content="">
                <style>
                    @page {
                        size: A4;
                        margin: 2cm;
                        @top-center {
                            content: " ";
                        }
                        @bottom-center {
                            content: "- " counter(page) " -";
                            font-size: 10px;
                            margin-top: 10px;
                        }
                    }
                    * {
                        font-family: '맑은 고딕', 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans CJK KR', sans-serif !important;
                    }
                    body {
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        font-size: 12px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 20px;
                    }
                    .header h1 {
                        font-size: 24px;
                        font-weight: bold;
                        margin: 0;
                        color: #2c3e50;
                    }
                    .section {
                        margin-bottom: 25px;
                    }
                    .section h2 {
                        font-size: 16px;
                        font-weight: bold;
                        color: #34495e;
                        padding-bottom: 5px;
                        margin-bottom: 15px;
                    }
                    .info-item {
                        margin: 8px 0;
                        font-size: 12px;
                        display: flex;
                        align-items: flex-start;
                    }
                    .info-label {
                        font-weight: bold;
                        display: inline-block;
                        width: 80px;
                        flex-shrink: 0;
                    }
                    .info-content {
                        margin: 5px 0 15px 0;
                        word-wrap: break-word;
                        overflow-wrap: break-word;
                        font-size: 12px;
                        white-space: pre-line;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                        font-size: 11px;
                    }
                    th, td {
                        border: 1px solid #bdc3c7;
                        padding: 6px;
                        text-align: left;
                        vertical-align: top;
                    }
                    th {
                        background-color: #ecf0f1;
                        font-weight: bold;
                    }
                    .center-align {
                        text-align: center;
                    }
                    .time-schedule-table {
                        width: 100%;
                    }
                    .time-schedule-table th:nth-child(1),
                    .time-schedule-table td:nth-child(1) {
                        width: auto;
                        min-width: 60px;
                        max-width: 80px;
                    }
                    .time-schedule-table th:nth-child(2),
                    .time-schedule-table td:nth-child(2) {
                        width: 100%;
                    }
                    .time-schedule-table th:nth-child(3),
                    .time-schedule-table td:nth-child(3) {
                        width: auto;
                        min-width: 60px;
                        max-width: 80px;
                    }
                    .time-schedule-table th:nth-child(4),
                    .time-schedule-table td:nth-child(4) {
                        width: auto;
                        min-width: 60px;
                        max-width: 80px;
                    }
                    .attendee-table {
                        width: 100%;
                    }
                    .attendee-table th,
                    .attendee-table td {
                        width: 20%;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 40px;
                        font-size: 10px;
                        color: #7f8c8d;
                        border-top: 1px solid #bdc3c7;
                        padding-top: 10px;
                    }
                    @media print {
                        body { 
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${safeText(this.currentData.session)} 전사 신기술 세미나 실시 결과</h1>
                    <div style="text-align: right; margin-top: 10px; font-size: 12px;">${this.getCurrentDateString()}</div>
                </div>  
                <div class="section">
                    <h2>1. 개요</h2>
                    <p class="info-content">　　□ 일시/장소: ${safeText(datetime)} / ${safeText(location)}</p>
                    <p class="info-content">　　□ 참석 인력: ${safeText(attendeeTarget)}</p>
                    
                    <h2>2. 주요 내용</h2>
                    <p class="info-content" style="white-space: pre-line;">${safeText(this.parseMainContent(resultData.mainContent))}</p>
                    
                    <h2>3. 향후 계획</h2>
                    <p class="info-content" style="white-space: pre-line;">${safeText(this.parseMainContent(resultData.futurePlan))}</p>
                </div> 
                
                ${attendeeTableHTML}
                ${sketchHTML}
            </body>
            </html>
        `;
    }
}

// 앱 초기화
let app;
document.addEventListener('DOMContentLoaded', async function() {
    app = new SeminarPlanningApp();
    // app.initializeApp()은 constructor에서 자동으로 호출됩니다
    
    // 전역 함수로 노출 (HTML에서 호출하기 위해)
    window.app = app;
});