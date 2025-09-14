// 저장 기능 스크립트

// SeminarPlanningApp 클래스에 저장 관련 메서드들을 추가
Object.assign(SeminarPlanningApp.prototype, {
    
    // 메인 데이터 저장
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
            
            // 회차나 일시가 변경되었는지 확인
            const sessionChanged = this.originalSession && this.originalSession !== this.currentData.session;
            const datetimeChanged = this.originalDatetime && this.originalDatetime !== this.currentData.datetime;
            const isKeyChanged = sessionChanged || datetimeChanged;
            
            let result;
            
            if (isKeyChanged) {
                // 회차나 일시가 변경된 경우 신규 등록
                if (useLocalStorage) {
                    result = this.saveToLocalStorage(this.currentData);
                } else {
                    result = await window.saveData(this.currentData);
                }
                
                if (result.success && result.id) {
                    this.currentDocumentId = result.id;
                    this.showSuccessToast(`${this.currentData.session} 세미나 데이터가 새로운 회차/일시로 등록되었습니다.`);
                    
                    // 원본 회차/일시 업데이트
                    this.originalSession = this.currentData.session;
                    this.originalDatetime = this.currentData.datetime;
                }
            } else {
                // 회차와 일시가 변경되지 않은 경우 기존 로직 사용
                const keyValue = `${this.currentData.session}_${this.currentData.datetime}`;
                
                // 기존 데이터에서 동일한 키값을 가진 데이터 찾기
                const existingData = await this.findExistingDataByKey(keyValue);
                
                if (existingData) {
                    // 기존 데이터가 있으면 수정
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
                    if (useLocalStorage) {
                        result = this.saveToLocalStorage(this.currentData);
                    } else {
                        result = await window.saveData(this.currentData);
                    }
                    
                    if (result.success && result.id) {
                        this.currentDocumentId = result.id;
                        this.showSuccessToast(`${this.currentData.session} 세미나 데이터가 새로 등록되었습니다.`);
                        
                        // 원본 회차/일시 업데이트
                        this.originalSession = this.currentData.session;
                        this.originalDatetime = this.currentData.datetime;
                    }
                }
            }
            
            if (!result.success) {
                this.showErrorToast(result.message);
            } else {
                // 기본 데이터 저장 성공 시 실시결과 데이터도 저장
                await this.saveMainResultData(true); // skipLoading = true
                
                // 스케치 정보도 함께 저장
                await this.saveSketchData(true); // skipLoading = true
            }
            
        } catch (error) {
            console.error('저장 오류:', error);
            this.showErrorToast('저장 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    },

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
                if (useLocalStorage) {
                    result = this.saveToLocalStorage(this.currentData, existingData.id);
                } else {
                    result = await window.updateData(existingData.id, this.currentData);
                }
                
                if (result.success) {
                    this.currentDocumentId = existingData.id;
                }
            } else {
                // 기존 데이터가 없으면 새로 등록
                if (useLocalStorage) {
                    result = this.saveToLocalStorage(this.currentData);
                } else {
                    result = await window.saveData(this.currentData);
                }
                
                if (result.success && result.id) {
                    this.currentDocumentId = result.id;
                }
            }
            
        } catch (error) {
            console.error('조용한 저장 오류:', error);
        }
    },

    // 폼 데이터 수집
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
    },

    // 로컬 스토리지에 저장
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
    },

    // 모든 로컬 스토리지 데이터 가져오기
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
    },

    // 기존 데이터 찾기
    async findExistingDataByKey(keyValue) {
        try {
            if (useLocalStorage) {
                // 로컬 스토리지에서 찾기
                const allData = this.getAllLocalStorageData();
                for (const item of allData) {
                    if (item.data.session && item.data.datetime) {
                        const existingKey = `${item.data.session}_${item.data.datetime}`;
                        if (existingKey === keyValue) {
                            return item;
                        }
                    }
                }
            } else {
                // Firebase에서 찾기
                const snapshot = await window.getCollectionSnapshot();
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    if (data.session && data.datetime) {
                        const existingKey = `${data.session}_${data.datetime}`;
                        if (existingKey === keyValue) {
                            return { id: doc.id, data: data };
                        }
                    }
                }
            }
            return null;
        } catch (error) {
            console.error('기존 데이터 찾기 오류:', error);
            return null;
        }
    },

    // 실시결과 데이터 저장
    async saveMainResultData(skipLoading = false) {
        try {
            if (!skipLoading) {
                this.showLoading(true);
            }
            
            // 현재 세미나 정보 가져오기
            const session = document.getElementById('sessionSelect')?.value || document.getElementById('sessionInput')?.value || '';
            const datetime = document.getElementById('datetime')?.value || '';
            
            if (!session || !datetime) {
                this.showErrorToast('먼저 세미나 정보를 입력해주세요.');
                return;
            }
            
            // 실시결과 데이터 수집
            const resultData = {
                session: session,
                datetime: datetime,
                mainContent: document.getElementById('mainResultContent')?.value || '',
                futurePlan: document.getElementById('mainResultFuturePlan')?.value || '',
                sketches: this.getMainSketchData()
            };
            
            // Firebase 또는 로컬 스토리지에 저장
            let result;
            if (useLocalStorage) {
                result = this.saveResultToLocalStorage(resultData);
            } else {
                result = await window.saveResultData(resultData);
            }
            
            if (result.success) {
                if (!skipLoading) {
                    this.showSuccessToast('실시결과가 저장되었습니다.');
                }
            } else {
                this.showErrorToast(result.message);
            }
            
        } catch (error) {
            console.error('실시결과 저장 오류:', error);
            this.showErrorToast('실시결과 저장 중 오류가 발생했습니다.');
        } finally {
            if (!skipLoading) {
                this.showLoading(false);
            }
        }
    },

    // 스케치 데이터 저장
    async saveSketchData(skipLoading = false) {
        try {
            if (!skipLoading) {
                this.showLoading(true);
            }
            
            // 현재 세미나 정보 가져오기
            const session = document.getElementById('sessionSelect')?.value || document.getElementById('sessionInput')?.value || '';
            const datetime = document.getElementById('datetime')?.value || '';
            
            if (!session || !datetime) {
                this.showErrorToast('먼저 세미나 정보를 입력해주세요.');
                return;
            }
            
            // 스케치 데이터 수집
            const sketchData = {
                session: session,
                datetime: datetime,
                sketches: this.getMainSketchData()
            };
            
            // Firebase 또는 로컬 스토리지에 저장
            let result;
            if (useLocalStorage) {
                result = this.saveSketchToLocalStorage(sketchData);
            } else {
                result = await window.saveSketchData(sketchData);
            }
            
            if (result.success) {
                if (!skipLoading) {
                    this.showSuccessToast('스케치 정보가 저장되었습니다.');
                }
            } else {
                this.showErrorToast(result.message);
            }
            
        } catch (error) {
            console.error('스케치 저장 오류:', error);
            this.showErrorToast('스케치 저장 중 오류가 발생했습니다.');
        } finally {
            if (!skipLoading) {
                this.showLoading(false);
            }
        }
    },

    // 로컬 스토리지에 실시결과 저장
    saveResultToLocalStorage(resultData) {
        try {
            const key = `result_${resultData.session}_${resultData.datetime}`;
            localStorage.setItem(key, JSON.stringify(resultData));
            return { success: true };
        } catch (error) {
            console.error('로컬 스토리지 실시결과 저장 오류:', error);
            return { success: false, message: error.message };
        }
    },

    // 로컬 스토리지에 스케치 저장
    saveSketchToLocalStorage(sketchData) {
        try {
            const key = `sketch_${sketchData.session}_${sketchData.datetime}`;
            localStorage.setItem(key, JSON.stringify(sketchData));
            return { success: true };
        } catch (error) {
            console.error('로컬 스토리지 스케치 저장 오류:', error);
            return { success: false, message: error.message };
        }
    }
});

// 저장 버튼 이벤트 바인딩
document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn && window.seminarApp) {
        saveBtn.addEventListener('click', () => window.seminarApp.saveData());
    }
});
