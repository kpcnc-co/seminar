// 테이블 관리 기능 스크립트

// SeminarPlanningApp 클래스에 테이블 관련 메서드들을 추가
Object.assign(SeminarPlanningApp.prototype, {
    
    // 시간 계획 행 추가
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
                <button onclick="seminarApp.removeTimeRow(${rowCount})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
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
    },

    // 참석자 행 추가
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
                <button onclick="seminarApp.removeAttendeeRow(${rowCount})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // 이벤트 리스너 추가 (모바일 환경 고려)
        this.bindAttendeeRowEvents(row, rowCount);
        
        // 데이터 구조에 새 행 추가
        this.currentData.attendeeList[rowCount] = {
            name: '',
            position: '',
            department: '',
            work: '',
            attendance: 'N'
        };
    },

    // 참석자 전체 Y 처리
    selectAllAttendees() {
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
        
        // 성공 메시지 표시
        this.showSuccessToast(`${updatedCount}명의 참석여부가 'Y'로 변경되었습니다.`);
    },

    // 시간 계획 테이블 채우기
    populateTimeTable() {
        const tbody = document.getElementById('timeTableBody');
        tbody.innerHTML = '';
        
        if (!this.currentData.timeSchedule) {
            console.error('시간 계획 데이터가 undefined입니다.');
            return;
        }
        
        if (this.currentData.timeSchedule.length === 0) {
            return;
        }
        
        this.currentData.timeSchedule.forEach((item, index) => {
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
                    <button onclick="seminarApp.removeTimeRow(${index})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
            
            // 데이터 채우기 (모바일 환경 고려)
            const inputs = row.querySelectorAll('input, select, textarea');
            
            // select 요소 (type)
            const typeSelect = row.querySelector('select[data-field="type"]');
            if (typeSelect && item.type !== undefined && item.type !== null) {
                typeSelect.value = item.type;
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
            }
            
            // input 요소 (time)
            const timeInput = row.querySelector('input[data-field="time"]');
            if (timeInput && item.time !== undefined && item.time !== null) {
                timeInput.value = item.time;
                timeInput.setAttribute('value', item.time);
            }
            
            // input 요소 (responsible)
            const responsibleInput = row.querySelector('input[data-field="responsible"]');
            if (responsibleInput && item.responsible !== undefined && item.responsible !== null) {
                responsibleInput.value = item.responsible;
                responsibleInput.setAttribute('value', item.responsible);
            }
            
            // 이벤트 리스너 추가
            this.bindTimeRowEvents(row, index);
        });
    },

    // 참석자 테이블 채우기
    populateAttendeeTable() {
        const tbody = document.getElementById('attendeeTableBody');
        tbody.innerHTML = '';
        
        if (!this.currentData.attendeeList) {
            console.error('참석자 데이터가 undefined입니다.');
            return;
        }
        
        if (this.currentData.attendeeList.length === 0) {
            return;
        }
        
        this.currentData.attendeeList.forEach((item, index) => {
            // 직접 행 생성 (addAttendeeRow() 호출하지 않음)
            const row = document.createElement('tr');
            row.className = 'table-row-hover';
            row.innerHTML = `
                <td class="px-4 py-3 border-b text-center">${index + 1}</td>
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
                        <option value="N">N</option>
                    </select>
                </td>
                <td class="px-4 py-3 border-b">
                    <button onclick="seminarApp.removeAttendeeRow(${index})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
            
            // 데이터 채우기 (모바일 환경 고려)
            const inputs = row.querySelectorAll('input, select');
            
            // 이름 입력
            const nameInput = row.querySelector('input[data-field="name"]');
            if (nameInput && item.name !== undefined && item.name !== null) {
                nameInput.value = item.name;
                nameInput.setAttribute('value', item.name);
            }
            
            // 직책 입력
            const positionInput = row.querySelector('input[data-field="position"]');
            if (positionInput && item.position !== undefined && item.position !== null) {
                positionInput.value = item.position;
                positionInput.setAttribute('value', item.position);
            }
            
            // 부서 입력
            const departmentInput = row.querySelector('input[data-field="department"]');
            if (departmentInput && item.department !== undefined && item.department !== null) {
                departmentInput.value = item.department;
                departmentInput.setAttribute('value', item.department);
            }
            
            // 업무 입력
            const workInput = row.querySelector('input[data-field="work"]');
            if (workInput && item.work !== undefined && item.work !== null) {
                workInput.value = item.work;
                workInput.setAttribute('value', item.work);
            }
            
            // 참석여부 선택
            const attendanceSelect = row.querySelector('select[data-field="attendance"]');
            if (attendanceSelect && item.attendance !== undefined && item.attendance !== null) {
                attendanceSelect.value = item.attendance;
                
                // 참석여부에 따라 옵션 선택
                const targetOption = attendanceSelect.querySelector(`option[value="${item.attendance}"]`);
                if (targetOption) {
                    targetOption.selected = true;
                }
                
                // 모바일에서 select 값이 제대로 설정되도록 강제 업데이트
                setTimeout(() => {
                    attendanceSelect.value = item.attendance;
                }, 10);
            }
            
            // 이벤트 리스너 추가
            this.bindAttendeeRowEvents(row, index);
        });
    },

    // 시간 계획 행 이벤트 바인딩
    bindTimeRowEvents(row, index) {
        const inputs = row.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.onchange = (e) => {
                this.updateTimeSchedule(index, this.getFieldName(input), e.target.value);
            };
        });
        
        const deleteBtn = row.querySelector('button');
        deleteBtn.onclick = () => this.removeTimeRow(index);
    },

    // 참석자 행 이벤트 바인딩
    bindAttendeeRowEvents(row, index) {
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.onchange = (e) => {
                this.updateAttendeeList(index, this.getFieldName(input), e.target.value);
            };
        });
        
        const deleteBtn = row.querySelector('button');
        deleteBtn.onclick = () => this.removeAttendeeRow(index);
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

// 테이블 관련 버튼 이벤트 바인딩
document.addEventListener('DOMContentLoaded', function() {
    // 시간 계획 행 추가 버튼
    const addTimeRowBtn = document.getElementById('addTimeRow');
    if (addTimeRowBtn && window.seminarApp) {
        addTimeRowBtn.addEventListener('click', () => window.seminarApp.addTimeRow());
    }
    
    // 참석자 행 추가 버튼
    const addAttendeeRowBtn = document.getElementById('addAttendeeRow');
    if (addAttendeeRowBtn && window.seminarApp) {
        addAttendeeRowBtn.addEventListener('click', () => window.seminarApp.addAttendeeRow());
    }
    
    // 참석자 전체 Y 처리 버튼
    const selectAllAttendeesBtn = document.getElementById('selectAllAttendees');
    if (selectAllAttendeesBtn && window.seminarApp) {
        selectAllAttendeesBtn.addEventListener('click', () => window.seminarApp.selectAllAttendees());
    }
});
