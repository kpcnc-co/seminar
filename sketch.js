// 스케치 업로드 기능 스크립트

// SeminarPlanningApp 클래스에 스케치 관련 메서드들을 추가
Object.assign(SeminarPlanningApp.prototype, {
    
    // 스케치 업로드 추가
    addSketchUpload() {
        const container = document.getElementById('sketchUploadContainer');
        
        // 현재 실제로 존재하는 스케치 개수 확인 (메인 컨테이너만)
        const existingSketches = container.querySelectorAll('div[data-sketch-index]');
        const currentCount = existingSketches.length;
        
        // 기존 인덱스들을 확인하여 연속된 인덱스 찾기
        const existingIndices = Array.from(existingSketches).map(sketch => 
            parseInt(sketch.getAttribute('data-sketch-index'))
        ).sort((a, b) => a - b);
        
        // 연속된 인덱스 중 가장 작은 빈 인덱스 찾기
        let nextIndex = 0;
        for (let i = 0; i < existingIndices.length; i++) {
            if (existingIndices[i] !== i) {
                nextIndex = i;
                break;
            }
            nextIndex = i + 1;
        }
        
        const sketchDiv = document.createElement('div');
        sketchDiv.className = 'border border-gray-200 rounded-lg p-4';
        sketchDiv.setAttribute('data-sketch-index', nextIndex);
        
        sketchDiv.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-md font-medium text-gray-700 flex items-center">
                    <i class="fas fa-image text-orange-500 mr-2"></i>
                    스케치 업로드
                </h3>
                <button type="button" class="removeSketchBtn bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center" data-sketch-index="${nextIndex}">
                    <i class="fas fa-trash mr-1"></i>삭제
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
        
        this.showSuccessToast('스케치 업로드가 추가되었습니다.');
    },
    
    // 스케치 업로드 삭제
    removeSketchUpload(sketchIndex) {
        const container = document.getElementById('sketchUploadContainer');
        const existingSketches = container.querySelectorAll('[data-sketch-index]');
        const currentCount = existingSketches.length;
        
        // 스케치가 1개 이하인 경우 삭제하지 않음
        if (currentCount <= 1) {
            this.showErrorToast('최소 1개의 스케치 업로드는 유지되어야 합니다.');
            return;
        }
        
        // 해당 인덱스의 스케치 찾기
        const targetSketch = container.querySelector(`[data-sketch-index="${sketchIndex}"]`);
        if (targetSketch) {
            targetSketch.remove();
            this.showSuccessToast('스케치 업로드가 삭제되었습니다.');
        }
        
        // 스케치 버튼 상태 업데이트
        this.toggleQuickSaveSketchButton();
    },

    // 메인 파일 업로드 처리
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
            
            // 파일 미리보기 표시
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewImg = document.getElementById(`mainPreviewImage${sketchIndex}`);
                const fileName = document.getElementById(`mainFileName${sketchIndex}`);
                const previewDiv = document.getElementById(`mainFilePreview${sketchIndex}`);
                const uploadArea = document.getElementById(`mainFileUploadArea${sketchIndex}`);
                
                if (previewImg && fileName && previewDiv && uploadArea) {
                    previewImg.src = e.target.result;
                    fileName.textContent = file.name;
                    previewDiv.classList.remove('hidden');
                    uploadArea.classList.add('hidden');
                }
            };
            reader.readAsDataURL(file);
            
            // 스케치 빠른 저장 버튼 상태 업데이트
            this.toggleQuickSaveSketchButton();
        }
    },

    // 메인 파일 제거
    removeMainFile(sketchIndex) {
        document.getElementById(`mainSketchFile${sketchIndex}`).value = '';
        document.getElementById(`mainFilePreview${sketchIndex}`).classList.add('hidden');
        document.getElementById(`mainFileUploadArea${sketchIndex}`).classList.remove('hidden');
        
        // 스케치 빠른 저장 버튼 상태 업데이트
        this.toggleQuickSaveSketchButton();
    },

    // 메인 파일 다운로드
    downloadMainFile(sketchIndex) {
        try {
            const previewImg = document.getElementById(`mainPreviewImage${sketchIndex}`);
            const fileName = document.getElementById(`mainFileName${sketchIndex}`);
            
            if (!previewImg || !previewImg.src) {
                this.showErrorToast('다운로드할 파일이 없습니다.');
                return;
            }
            
            // 이미지를 Blob으로 변환하여 다운로드
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = previewImg.naturalWidth;
            canvas.height = previewImg.naturalHeight;
            
            ctx.drawImage(previewImg, 0, 0);
            
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName.textContent || `sketch_${sketchIndex}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showSuccessToast('파일이 다운로드되었습니다.');
            });
            
        } catch (error) {
            console.error('파일 다운로드 오류:', error);
            this.showErrorToast('파일 다운로드 중 오류가 발생했습니다.');
        }
    },

    // 메인화면 스케치 데이터 가져오기
    getMainSketchData() {
        const sketches = [];
        const container = document.getElementById('sketchUploadContainer');
        
        // 실제로 DOM에 존재하는 스케치 요소만 찾기 (메인 컨테이너만)
        const sketchElements = container.querySelectorAll('div[data-sketch-index]');
        
        sketchElements.forEach(sketchElement => {
            const sketchIndex = sketchElement.getAttribute('data-sketch-index');
            const titleInput = sketchElement.querySelector('input[type="text"]');
            const fileInput = sketchElement.querySelector('input[type="file"]');
            const previewImg = sketchElement.querySelector('img');
            const fileName = sketchElement.querySelector('p[id^="mainFileName"]');
            
            const title = titleInput ? titleInput.value : '';
            const file = fileInput ? fileInput.files[0] : null;
            const imageData = previewImg ? previewImg.src : '';
            const fileNameText = fileName ? fileName.textContent : '';
            
            // 제목이나 파일이 있는 경우만 추가
            if (title || file || imageData) {
                sketches.push({
                    index: parseInt(sketchIndex),
                    title: title,
                    fileName: fileNameText,
                    imageData: imageData,
                    file: file
                });
            }
        });
        
        return sketches;
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
            
            // 현재 스케치 데이터 수집
            const currentSketches = this.getMainSketchData();
            
            // 기존 실시결과 데이터 조회
            const existingResult = await loadResultDataByKey(session, datetime);
            
            // 실시결과 데이터 업데이트 또는 생성
            const resultData = {
                session: session,
                datetime: datetime,
                mainContent: existingResult?.mainContent || '',
                futurePlan: existingResult?.futurePlan || '',
                sketches: currentSketches
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
    }
});

// 스케치 관련 이벤트 바인딩
document.addEventListener('DOMContentLoaded', function() {
    // 스케치 업로드 추가 버튼
    const addSketchUploadBtn = document.getElementById('addSketchUpload');
    if (addSketchUploadBtn && window.seminarApp) {
        addSketchUploadBtn.addEventListener('click', () => window.seminarApp.addSketchUpload());
    }
    
    // 스케치 관련 이벤트 위임
    document.addEventListener('click', (e) => {
        // 스케치 삭제 버튼
        if (e.target.closest('.removeSketchBtn')) {
            const removeBtn = e.target.closest('.removeSketchBtn');
            const sketchIndex = removeBtn.getAttribute('data-sketch-index');
            if (window.seminarApp) {
                window.seminarApp.removeSketchUpload(parseInt(sketchIndex));
            }
        }
        // 파일 업로드 영역 클릭
        else if (e.target.closest('[id^="mainFileUploadArea"]')) {
            const uploadArea = e.target.closest('[id^="mainFileUploadArea"]');
            const sketchIndex = uploadArea.id.replace('mainFileUploadArea', '');
            const fileInput = document.getElementById(`mainSketchFile${sketchIndex}`);
            if (fileInput) fileInput.click();
        }
        // 파일 다운로드 버튼
        else if (e.target.closest('[id^="mainDownloadFile"]')) {
            const downloadBtn = e.target.closest('[id^="mainDownloadFile"]');
            const sketchIndex = downloadBtn.id.replace('mainDownloadFile', '');
            if (window.seminarApp) {
                window.seminarApp.downloadMainFile(parseInt(sketchIndex));
            }
        }
        // 파일 제거 버튼
        else if (e.target.closest('[id^="mainRemoveFile"]')) {
            const removeBtn = e.target.closest('[id^="mainRemoveFile"]');
            const sketchIndex = removeBtn.id.replace('mainRemoveFile', '');
            if (window.seminarApp) {
                window.seminarApp.removeMainFile(parseInt(sketchIndex));
            }
        }
    });
    
    // 파일 업로드 이벤트 위임
    document.addEventListener('change', (e) => {
        if (e.target.matches('[id^="mainSketchFile"]')) {
            const fileInput = e.target;
            const sketchIndex = fileInput.id.replace('mainSketchFile', '');
            if (window.seminarApp) {
                window.seminarApp.handleMainFileUpload(e, parseInt(sketchIndex));
            }
        }
    });
});
