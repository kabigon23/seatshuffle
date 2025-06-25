class DeskManager {
    constructor() {
        this.desks = [];
        this.deskCount = 20;
        this.isDragging = false;
        this.draggedDesk = null;
        this.dragOffset = { x: 0, y: 0 };
        this.inputMode = 'number'; // 'number' 또는 'name'
        this.teacherDesk = null; // 교탁 객체
        this.isDraggingTeacherDesk = false; // 교탁 드래그 상태
        this.layoutType = 'individual'; // 'individual', 'group', 'team-vertical', 'team-horizontal'
        this.appMode = localStorage.getItem('seatshuffleAppMode') || 'normal'; // 'normal' | 'gender'
        
        this.init();
    }
    
    init() {
        this.classroom = document.getElementById('classroom');
        this.deskCountElement = document.getElementById('deskCount');
        this.decreaseBtn = document.getElementById('decreaseBtn');
        this.increaseBtn = document.getElementById('increaseBtn');
        this.randomizeBtn = document.getElementById('randomizeBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // 상태 정보 요소들 - 오류 방지
        this.currentDeskCountElement = document.getElementById('currentDeskCount');
        this.currentStudentCountElement = document.getElementById('currentStudentCount');
        
        // 디버깅: 요소가 제대로 찾아졌는지 확인
        if (!this.currentDeskCountElement || !this.currentStudentCountElement) {
            console.error('상태 정보 요소를 찾을 수 없습니다:', {
                deskCount: !!this.currentDeskCountElement,
                studentCount: !!this.currentStudentCountElement
            });
        }
        
        // 배치 방식 선택
        this.individualBtn = document.getElementById('individualBtn');
        this.groupBtn = document.getElementById('groupBtn');
        this.teamVerticalBtn = document.getElementById('teamVerticalBtn');
        this.teamHorizontalBtn = document.getElementById('teamHorizontalBtn');
        
        // 입력 방식 선택
        this.numberModeBtn = document.getElementById('numberModeBtn');
        this.nameModeBtn = document.getElementById('nameModeBtn');
        this.numberInputSection = document.getElementById('numberInputSection');
        this.nameInputSection = document.getElementById('nameInputSection');
        
        // 출석번호 입력
        this.lastNumberInput = document.getElementById('lastNumber');
        this.excludeNumbersInput = document.getElementById('excludeNumbers');
        
        // 이름 입력
        this.nameListTextarea = document.getElementById('nameList');
        this.saveNamesBtn = document.getElementById('saveNamesBtn');
        this.clearNamesBtn = document.getElementById('clearNamesBtn');
        
        this.maleNumbersInput = document.getElementById('maleNumbers');
        this.femaleNumbersInput = document.getElementById('femaleNumbers');
        this.maleNamesInput = document.getElementById('maleNames');
        this.femaleNamesInput = document.getElementById('femaleNames');
        this.genderNumberInputSection = document.getElementById('genderNumberInputSection');
        this.genderNameInputSection = document.getElementById('genderNameInputSection');
        this.statusInfoNormal = document.getElementById('statusInfoNormal');
        this.statusInfoGender = document.getElementById('statusInfoGender');
        
        this.saveGenderNumbersBtn = document.getElementById('saveGenderNumbersBtn');
        this.clearGenderNumbersBtn = document.getElementById('clearGenderNumbersBtn');
        this.saveGenderNamesBtn = document.getElementById('saveGenderNamesBtn');
        this.clearGenderNamesBtn = document.getElementById('clearGenderNamesBtn');
        
        this.bindEvents();
        this.createDesks();
        this.loadNamesFromStorage(); // 저장된 이름 불러오기
        
        // 페이지 로드 시 자동으로 교탁 생성
        this.createInitialTeacherDesk();
        
        // 초기 상태 정보 업데이트
        this.updateStatusInfo();
        
        // 디버깅: 초기화 완료 로그
        console.log('DeskManager 초기화 완료');

        this.modeToggleBtn = document.getElementById('modeToggleBtn');
        if (this.modeToggleBtn) {
            this.modeToggleBtn.addEventListener('click', () => this.toggleAppMode());
            this.updateModeToggleBtn();
        }

        this.updateModeUI();
    }
    
    createInitialTeacherDesk() {
        // 교탁 생성
        const teacherDeskElement = document.createElement('div');
        teacherDeskElement.className = 'teacher-desk';
        teacherDeskElement.textContent = '👨‍🏫 교탁';
        teacherDeskElement.dataset.type = 'teacher';
        
        // 기본 위치 설정 (교실 상단 중앙)
        const classroomRect = this.classroom.getBoundingClientRect();
        const x = (classroomRect.width - 120) / 2;
        const y = 20;
        
        teacherDeskElement.style.left = x + 'px';
        teacherDeskElement.style.top = y + 'px';
        
        this.classroom.appendChild(teacherDeskElement);
        
        this.teacherDesk = {
            element: teacherDeskElement,
            x: x,
            y: y
        };
        
        // 교탁 추가 후 책상 배치 재조정
        this.repositionDesks();
    }
    
    bindEvents() {
        this.randomizeBtn.addEventListener('click', () => this.randomizeSeats());
        this.resetBtn.addEventListener('click', () => this.resetDesks());
        
        // 배치 방식 선택 이벤트
        this.individualBtn.addEventListener('click', () => this.switchLayout('individual'));
        this.groupBtn.addEventListener('click', () => this.switchLayout('group'));
        this.teamVerticalBtn.addEventListener('click', () => this.switchLayout('team-vertical'));
        this.teamHorizontalBtn.addEventListener('click', () => this.switchLayout('team-horizontal'));
        this.addDeskBtn = document.getElementById('addDeskBtn');
        this.addDeskBtn.addEventListener('click', () => this.addDesk());
        
        // 입력 방식 선택 이벤트
        this.numberModeBtn.addEventListener('click', () => this.switchInputMode('number'));
        this.nameModeBtn.addEventListener('click', () => this.switchInputMode('name'));
        
        // 출석번호 입력 이벤트
        this.lastNumberInput.addEventListener('input', () => this.validateInput());
        this.excludeNumbersInput.addEventListener('input', () => this.validateInput());
        
        // 이름 입력 이벤트
        this.nameListTextarea.addEventListener('input', () => this.validateInput());
        this.saveNamesBtn.addEventListener('click', () => this.saveNamesToStorage());
        this.clearNamesBtn.addEventListener('click', () => this.clearNames());

        // 남녀 구별 모드 입력 이벤트
        if (this.maleNumbersInput) this.maleNumbersInput.addEventListener('input', () => this.validateInput());
        if (this.femaleNumbersInput) this.femaleNumbersInput.addEventListener('input', () => this.validateInput());
        if (this.maleNamesInput) this.maleNamesInput.addEventListener('input', () => this.validateInput());
        if (this.femaleNamesInput) this.femaleNamesInput.addEventListener('input', () => this.validateInput());
        
        if (this.saveGenderNumbersBtn) this.saveGenderNumbersBtn.addEventListener('click', () => this.saveGenderNumbersToStorage());
        if (this.clearGenderNumbersBtn) this.clearGenderNumbersBtn.addEventListener('click', () => this.clearGenderNumbers());
        if (this.saveGenderNamesBtn) this.saveGenderNamesBtn.addEventListener('click', () => this.saveNamesToStorage());
        if (this.clearGenderNamesBtn) this.clearGenderNamesBtn.addEventListener('click', () => { 
            this.maleNamesInput.value = ''; 
            this.femaleNamesInput.value = ''; 
            this.validateInput(); 
            this.showMessage('🗑️ 이름 목록을 지웠습니다!', 'info');
        });
        
        // 드래그 이벤트
        this.classroom.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
        
        // 터치 이벤트 (모바일 지원)
        this.classroom.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        document.addEventListener('touchend', () => this.handleTouchEnd());
        
        // PDF 저장 버튼 이벤트 바인딩
        this.downloadPdfBtn = document.getElementById('downloadPdfBtn');
        if (this.downloadPdfBtn) {
            this.downloadPdfBtn.addEventListener('click', () => this.downloadClassroomAsPdf());
        }

        this.saveLayoutBtn = document.getElementById('saveLayoutBtn');
        this.loadLayoutBtn = document.getElementById('loadLayoutBtn');
        if (this.saveLayoutBtn) {
            this.saveLayoutBtn.addEventListener('click', () => this.saveLayoutToStorage());
        }
        if (this.loadLayoutBtn) {
            this.loadLayoutBtn.addEventListener('click', () => this.loadLayoutFromStorage());
        }
    }
    
    switchLayout(layoutType) {
        this.layoutType = layoutType;
        
        // 버튼 활성화 상태 변경
        this.individualBtn.classList.toggle('active', layoutType === 'individual');
        this.groupBtn.classList.toggle('active', layoutType === 'group');
        this.teamVerticalBtn.classList.toggle('active', layoutType === 'team-vertical');
        this.teamHorizontalBtn.classList.toggle('active', layoutType === 'team-horizontal');
        
        // 책상 개수 업데이트
        switch (layoutType) {
            case 'individual':
                this.deskCount = 20;
                break;
            case 'group':
                this.deskCount = 18;
                break;
            case 'team-vertical':
            case 'team-horizontal':
                this.deskCount = 24;
                break;
        }
        
        // 자리 초기화(텍스트 제거)
        this.resetDesks();
        
        // 책상 재생성 (교탁은 유지)
        this.createDesks();
        this.validateInput();
        this.updateStatusInfo();
    }
    
    updateDeskInfo() {
        const deskInfo = document.querySelector('.desk-info span');
        switch (this.layoutType) {
            case 'individual':
                deskInfo.textContent = '📚 책상 배치: 4행 5열 (총 20개)';
                break;
            case 'group':
                deskInfo.textContent = '📚 책상 배치: 분단형 (총 18개)';
                break;
            case 'team-vertical':
                deskInfo.textContent = '📚 책상 배치: 모둠형(세로, 2x2 3행2열, 총 24개)';
                break;
            case 'team-horizontal':
                deskInfo.textContent = '📚 책상 배치: 모둠형(가로, 2x2 2행3열, 총 24개)';
                break;
        }
    }
    
    switchInputMode(mode) {
        this.inputMode = mode;
        this.numberModeBtn.classList.toggle('active', mode === 'number');
        this.nameModeBtn.classList.toggle('active', mode === 'name');
        this.updateModeUI();
        this.validateInput();
        this.updateStatusInfo();
    }
    
    updateModeUI() {
        if (this.appMode === 'gender') {
            this.numberInputSection.style.display = 'none';
            this.nameInputSection.style.display = 'none';
            this.genderNumberInputSection.style.display = this.inputMode === 'number' ? 'flex' : 'none';
            this.genderNameInputSection.style.display = this.inputMode === 'name' ? 'flex' : 'none';
            this.statusInfoNormal.style.display = 'none';
            this.statusInfoGender.style.display = '';
            // 안내문 제어
            const footerNormal = document.getElementById('footerNormal');
            const footerGender = document.getElementById('footerGender');
            if (footerNormal) footerNormal.style.display = 'none';
            if (footerGender) footerGender.style.display = '';
        } else {
            this.numberInputSection.style.display = this.inputMode === 'number' ? 'flex' : 'none';
            this.nameInputSection.style.display = this.inputMode === 'name' ? 'flex' : 'none';
            this.genderNumberInputSection.style.display = 'none';
            this.genderNameInputSection.style.display = 'none';
            this.statusInfoNormal.style.display = '';
            this.statusInfoGender.style.display = 'none';
            // 안내문 제어
            const footerNormal = document.getElementById('footerNormal');
            const footerGender = document.getElementById('footerGender');
            if (footerNormal) footerNormal.style.display = '';
            if (footerGender) footerGender.style.display = 'none';
        }
    }
    
    validateInput() {
        if (this.appMode === 'gender') {
            let maleCount = 0, femaleCount = 0;
            if (this.inputMode === 'number') {
                const males = this.maleNumbersInput.value.split(',').map(s => s.trim()).filter(s => s);
                const females = this.femaleNumbersInput.value.split(',').map(s => s.trim()).filter(s => s);
                maleCount = males.length;
                femaleCount = females.length;
            } else {
                const males = this.maleNamesInput.value.split(',').map(s => s.trim()).filter(s => s);
                const females = this.femaleNamesInput.value.split(',').map(s => s.trim()).filter(s => s);
                maleCount = males.length;
                femaleCount = females.length;
            }
            const maleDeskCount = this.desks.filter(d => d.element.classList.contains('desk-male')).length;
            const femaleDeskCount = this.desks.filter(d => d.element.classList.contains('desk-female')).length;
            // 경고 및 버튼 비활성화
            if (maleCount !== maleDeskCount || femaleCount !== femaleDeskCount) {
                this.showMessage(`⚠️ 남학생(${maleCount})/남자책상(${maleDeskCount}), 여학생(${femaleCount})/여자책상(${femaleDeskCount}) 수가 일치하지 않습니다!`, 'warning', true);
                this.randomizeBtn.disabled = true;
                this.randomizeBtn.style.opacity = '0.5';
            } else {
                this.showMessage('✅ 남학생/여학생 수와 책상 수가 일치합니다!', 'success');
                this.randomizeBtn.disabled = false;
                this.randomizeBtn.style.opacity = '1';
            }
            this.updateStatusInfo();
            return { maleCount, femaleCount, maleDeskCount, femaleDeskCount };
        } else {
            this.updateStatusInfo();
            return this.inputMode === 'number' ? this.validateAttendanceNumbers() : this.validateNameList();
        }
    }
    
    validateAttendanceNumbers() {
        const lastNumber = parseInt(this.lastNumberInput.value) || 0;
        const excludeText = this.excludeNumbersInput.value.trim();
        
        // 제외할 번호들 파싱
        let excludeNumbers = [];
        if (excludeText) {
            excludeNumbers = excludeText.split(',')
                .map(num => parseInt(num.trim()))
                .filter(num => !isNaN(num) && num > 0 && num <= lastNumber);
        }
        
        // 중복 제거
        excludeNumbers = [...new Set(excludeNumbers)];
        
        // 실제 출석번호 개수 계산
        const actualAttendanceCount = lastNumber - excludeNumbers.length;
        
        // 책상 수와 비교
        if (actualAttendanceCount !== this.deskCount) {
            this.showMessage(`⚠️ 경고: 출석번호 개수(${actualAttendanceCount})와 책상 개수(${this.deskCount})가 일치하지 않습니다!`, 'warning', true);
            this.randomizeBtn.disabled = true;
            this.randomizeBtn.style.opacity = '0.5';
        } else {
            this.showMessage(`✅ 출석번호 개수(${actualAttendanceCount})와 책상 개수(${this.deskCount})가 일치합니다!`, 'success');
            this.randomizeBtn.disabled = false;
            this.randomizeBtn.style.opacity = '1';
        }
        
        return { lastNumber, excludeNumbers, actualAttendanceCount };
    }
    
    validateNameList() {
        const nameText = this.nameListTextarea.value.trim();
        // 개행 또는 쉼표(,) 모두를 구분자로 사용
        const names = nameText ? nameText.split(/\n|,/).map(name => name.trim()).filter(name => name) : [];
        
        if (names.length !== this.deskCount) {
            this.showMessage(`⚠️ 경고: 이름 개수(${names.length})와 책상 개수(${this.deskCount})가 일치하지 않습니다!`, 'warning', true);
            this.randomizeBtn.disabled = true;
            this.randomizeBtn.style.opacity = '0.5';
        } else {
            this.showMessage(`✅ 이름 개수(${names.length})와 책상 개수(${this.deskCount})가 일치합니다!`, 'success');
            this.randomizeBtn.disabled = false;
            this.randomizeBtn.style.opacity = '1';
        }
        
        return { names, count: names.length };
    }
    
    saveNamesToStorage() {
        if (this.appMode === 'gender') {
            const maleNames = this.maleNamesInput.value.trim();
            const femaleNames = this.femaleNamesInput.value.trim();
            localStorage.setItem('classroomNames_gender', JSON.stringify({ maleNames, femaleNames }));
        } else {
            const names = this.nameListTextarea.value.trim();
            localStorage.setItem('classroomNames', names);
        }
        this.showMessage('💾 이름 목록이 저장되었습니다!', 'success');
    }
    
    loadNamesFromStorage() {
        if (this.appMode === 'gender') {
            const savedNumbers = localStorage.getItem('classroomNumbers_gender');
            if (savedNumbers) {
                try {
                    const { maleNumbers, femaleNumbers } = JSON.parse(savedNumbers);
                    this.maleNumbersInput.value = maleNumbers || '';
                    this.femaleNumbersInput.value = femaleNumbers || '';
                } catch (e) { console.error('남녀 출석번호 불러오기 오류', e); }
            }
            // 이름
            const savedData = localStorage.getItem('classroomNames_gender');
            if (savedData) {
                try {
                    const { maleNames, femaleNames } = JSON.parse(savedData);
                    this.maleNamesInput.value = maleNames || '';
                    this.femaleNamesInput.value = femaleNames || '';
                    this.showMessage('📂 저장된 이름 목록을 불러왔습니다!', 'success');
                    this.validateInput();
                } catch (e) {
                    console.error('이름 불러오기 오류', e);
                }
            }
        } else {
            const savedNames = localStorage.getItem('classroomNames');
            if (savedNames !== null) {
                this.nameListTextarea.value = savedNames;
                this.showMessage('📂 저장된 이름 목록을 불러왔습니다!', 'success');
                this.validateInput();
            }
        }
    }
    
    clearNames() {
        this.nameListTextarea.value = '';
        this.showMessage('🗑️ 이름 목록을 지웠습니다!', 'info');
        this.validateInput();
    }
    
    createDesks() {
        // 책상만 삭제 (교탁은 남김)
        this.classroom.querySelectorAll('.desk').forEach(d => d.remove());
        this.desks = [];
        const classroomRect = this.classroom.getBoundingClientRect();
        const deskWidth = 80;
        const deskHeight = 60;
        const padding = 20;
        const spacing = 20; // 책상 간 간격
        // 교탁 바로 아래 위치 (교탁 높이 80px + 간격 40px로 증가)
        const topOffset = 140;
        switch (this.layoutType) {
            case 'individual':
                this.createIndividualLayout(classroomRect, deskWidth, deskHeight, spacing, topOffset);
                break;
            case 'group':
                this.createGroupLayout(classroomRect, deskWidth, deskHeight, spacing, topOffset);
                break;
            case 'team-vertical':
                this.createTeamLayoutVertical(classroomRect, deskWidth, deskHeight, spacing, topOffset);
                break;
            case 'team-horizontal':
                this.createTeamLayoutHorizontal(classroomRect, deskWidth, deskHeight, spacing, topOffset);
                break;
        }
    }
    
    createIndividualLayout(classroomRect, deskWidth, deskHeight, spacing, topOffset) {
        const cols = 5;
        const rows = 4;
        const totalDesks = this.deskCount;
        const groupWidth = cols * deskWidth + (cols - 1) * spacing;
        const startX = (classroomRect.width - groupWidth) / 2;
        const startY = topOffset;
        for (let i = 0; i < totalDesks; i++) {
            const desk = document.createElement('div');
            desk.className = 'desk';
            desk.dataset.index = i;
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (deskWidth + spacing);
            const y = startY + row * (deskHeight + spacing);
            desk.style.left = x + 'px';
            desk.style.top = y + 'px';
            // 남녀모드 성별 패턴 적용
            if (this.appMode === 'gender') {
                // 홀수줄: 남 여 남 여 남 / 짝수줄: 여 남 여 남 여
                if (row % 2 === 0) {
                    desk.classList.add(col % 2 === 0 ? 'desk-male' : 'desk-female');
                } else {
                    desk.classList.add(col % 2 === 0 ? 'desk-female' : 'desk-male');
                }
            }
            this.classroom.appendChild(desk);
            this.desks.push({
                element: desk,
                x: x,
                y: y,
                number: null,
                name: null
            });
            this.addDeskContextMenuEvent(desk);
        }
    }
    
    createGroupLayout(classroomRect, deskWidth, deskHeight, spacing, topOffset) {
        const groupCols = 2;
        const groupRows = 3;
        const totalGroups = 3;
        const totalDesks = this.deskCount;
        const groupWidth = groupCols * deskWidth + (groupCols - 1) * spacing;
        const groupHeight = groupRows * deskHeight + (groupRows - 1) * spacing;
        const groupSpacing = 60;
        const totalWidth = totalGroups * groupWidth + (totalGroups - 1) * groupSpacing;
        const startX = (classroomRect.width - totalWidth) / 2;
        const startY = topOffset;
        let deskIndex = 0;
        for (let group = 0; group < totalGroups; group++) {
            const groupStartX = startX + group * (groupWidth + groupSpacing);
            for (let row = 0; row < groupRows; row++) {
                for (let col = 0; col < groupCols; col++) {
                    if (deskIndex >= totalDesks) return;
                    const desk = document.createElement('div');
                    desk.className = 'desk';
                    desk.dataset.index = deskIndex;
                    const x = groupStartX + col * (deskWidth + spacing);
                    const y = startY + row * (deskHeight + spacing);
                    desk.style.left = x + 'px';
                    desk.style.top = y + 'px';
                    // 남녀모드 성별 패턴 적용: 왼쪽줄 남, 오른쪽줄 여
                    if (this.appMode === 'gender') {
                        desk.classList.add(col === 0 ? 'desk-male' : 'desk-female');
                    }
                    this.classroom.appendChild(desk);
                    this.desks.push({
                        element: desk,
                        x: x,
                        y: y,
                        number: null,
                        name: null
                    });
                    this.addDeskContextMenuEvent(desk);
                    deskIndex++;
                }
            }
        }
    }
    
    createTeamLayoutVertical(classroomRect, deskWidth, deskHeight, spacing, topOffset) {
        const groupCols = 2;
        const groupRows = 2;
        const totalGroups = 6;
        const innerSpacing = 10;
        const groupWidth = groupCols * deskWidth + (groupCols - 1) * innerSpacing;
        const groupHeight = groupRows * deskHeight + (groupRows - 1) * innerSpacing;
        const groupSpacing = 60;
        const rowSpacing = 80;
        const groupsPerRow = 2;
        const totalWidth = groupsPerRow * groupWidth + (groupsPerRow - 1) * groupSpacing;
        const startX = (classroomRect.width - totalWidth) / 2;
        const startY = topOffset;
        let deskIndex = 0;
        for (let row = 0; row < 3; row++) {
            const rowStartY = startY + row * (groupHeight + rowSpacing);
            for (let groupInRow = 0; groupInRow < 2; groupInRow++) {
                const groupStartX = startX + groupInRow * (groupWidth + groupSpacing);
                for (let deskRow = 0; deskRow < groupRows; deskRow++) {
                    for (let deskCol = 0; deskCol < groupCols; deskCol++) {
                        if (deskIndex >= this.deskCount) return;
                        const desk = document.createElement('div');
                        desk.className = 'desk';
                        desk.dataset.index = deskIndex;
                        const x = groupStartX + deskCol * (deskWidth + innerSpacing);
                        const y = rowStartY + deskRow * (deskHeight + innerSpacing);
                        desk.style.left = x + 'px';
                        desk.style.top = y + 'px';
                        // 남녀모드 성별 패턴 적용: 왼쪽 남, 오른쪽 여
                        if (this.appMode === 'gender') {
                            desk.classList.add(deskCol === 0 ? 'desk-male' : 'desk-female');
                        }
                        this.classroom.appendChild(desk);
                        this.desks.push({
                            element: desk,
                            x: x,
                            y: y,
                            number: null,
                            name: null
                        });
                        this.addDeskContextMenuEvent(desk);
                        deskIndex++;
                    }
                }
            }
        }
    }
    
    createTeamLayoutHorizontal(classroomRect, deskWidth, deskHeight, spacing, topOffset) {
        const groupCols = 2;
        const groupRows = 2;
        const totalGroups = 6;
        const innerSpacing = 10;
        const groupWidth = groupCols * deskWidth + (groupCols - 1) * innerSpacing;
        const groupHeight = groupRows * deskHeight + (groupRows - 1) * innerSpacing;
        const groupSpacing = 60;
        const rowSpacing = 80;
        const groupsPerRow = 3;
        const totalWidth = groupsPerRow * groupWidth + (groupsPerRow - 1) * groupSpacing;
        const startX = (classroomRect.width - totalWidth) / 2;
        const startY = topOffset;
        let deskIndex = 0;
        for (let row = 0; row < 2; row++) {
            const rowStartY = startY + row * (groupHeight + rowSpacing);
            for (let groupInRow = 0; groupInRow < 3; groupInRow++) {
                const groupStartX = startX + groupInRow * (groupWidth + groupSpacing);
                for (let deskRow = 0; deskRow < groupRows; deskRow++) {
                    for (let deskCol = 0; deskCol < groupCols; deskCol++) {
                        if (deskIndex >= this.deskCount) return;
                        const desk = document.createElement('div');
                        desk.className = 'desk';
                        desk.dataset.index = deskIndex;
                        const x = groupStartX + deskCol * (deskWidth + innerSpacing);
                        const y = rowStartY + deskRow * (deskHeight + innerSpacing);
                        desk.style.left = x + 'px';
                        desk.style.top = y + 'px';
                        // 남녀모드 성별 패턴 적용: 왼쪽 남, 오른쪽 여
                        if (this.appMode === 'gender') {
                            desk.classList.add(deskCol === 0 ? 'desk-male' : 'desk-female');
                        }
                        this.classroom.appendChild(desk);
                        this.desks.push({
                            element: desk,
                            x: x,
                            y: y,
                            number: null,
                            name: null
                        });
                        this.addDeskContextMenuEvent(desk);
                        deskIndex++;
                    }
                }
            }
        }
    }
    
    randomizeSeats() {
        const validation = this.validateInput();
        if (this.appMode === 'gender') {
            const { maleCount, femaleCount, maleDeskCount, femaleDeskCount } = validation;
            if (maleCount !== maleDeskCount || femaleCount !== femaleDeskCount) {
                this.showMessage('❌ 남학생/여학생 수와 책상 수가 일치하지 않습니다!', 'error');
                return;
            }
            const maleDesks = this.desks.filter(d => d.element.classList.contains('desk-male'));
            const femaleDesks = this.desks.filter(d => d.element.classList.contains('desk-female'));
            let males, females;
            if (this.inputMode === 'number') {
                males = this.maleNumbersInput.value.split(',').map(s => s.trim()).filter(s => s);
                females = this.femaleNumbersInput.value.split(',').map(s => s.trim()).filter(s => s);
            } else {
                males = this.maleNamesInput.value.split(',').map(s => s.trim()).filter(s => s);
                females = this.femaleNamesInput.value.split(',').map(s => s.trim()).filter(s => s);
            }
            // 섞기
            for (let i = males.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [males[i], males[j]] = [males[j], males[i]]; }
            for (let i = females.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [females[i], females[j]] = [females[j], females[i]]; }
            // 할당
            maleDesks.forEach((desk, index) => { desk.element.textContent = males[index]; desk.element.classList.add('assigned'); setTimeout(() => desk.element.classList.remove('assigned'), 600); });
            femaleDesks.forEach((desk, index) => { desk.element.textContent = females[index]; desk.element.classList.add('assigned'); setTimeout(() => desk.element.classList.remove('assigned'), 600); });
            this.showMessage(`🎉 자리 배치가 완료되었습니다! (남:${males.length}명, 여:${females.length}명)`, 'success');
        } else {
            // 일반 모드 자리배치
            if (this.inputMode === 'number') {
                const { lastNumber, excludeNumbers, actualAttendanceCount } = validation;
                // 출석번호 목록 생성 (1~lastNumber 중 제외번호 빼고)
                let numbers = [];
                for (let i = 1; i <= lastNumber; i++) {
                    if (!excludeNumbers.includes(i)) numbers.push(i);
                }
                // 섞기
                for (let i = numbers.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
                }
                // 책상에 할당
                this.desks.forEach((desk, idx) => {
                    desk.element.textContent = numbers[idx] !== undefined ? numbers[idx] : '';
                    desk.element.classList.add('assigned');
                    setTimeout(() => desk.element.classList.remove('assigned'), 600);
                });
                this.showMessage(`🎉 자리 배치가 완료되었습니다! (${numbers.length}명)`, 'success');
            } else {
                const { names } = validation;
                // 섞기
                for (let i = names.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [names[i], names[j]] = [names[j], names[i]];
                }
                // 책상에 할당
                this.desks.forEach((desk, idx) => {
                    desk.element.textContent = names[idx] !== undefined ? names[idx] : '';
                    desk.element.classList.add('assigned');
                    setTimeout(() => desk.element.classList.remove('assigned'), 600);
                });
                this.showMessage(`🎉 자리 배치가 완료되었습니다! (${names.length}명)`, 'success');
            }
        }
    }
    
    resetDesks() {
        this.desks.forEach(desk => {
            desk.number = null;
            desk.name = null;
            desk.element.textContent = '';
            desk.element.classList.remove('assigned');
        });
        
        this.showMessage('🔄 자리가 초기화되었습니다!', 'info');
    }
    
    handleMouseDown(e) {
        const desk = e.target.closest('.desk');
        const teacherDesk = e.target.closest('.teacher-desk');
        
        if (desk) {
            e.preventDefault();
            this.startDragging(desk, e.clientX, e.clientY);
        } else if (teacherDesk) {
            e.preventDefault();
            this.startDraggingTeacherDesk(e.clientX, e.clientY);
        }
    }
    
    handleMouseMove(e) {
        if (this.isDragging && this.draggedDesk) {
            e.preventDefault();
            requestAnimationFrame(() => {
                this.updateDragPosition(e.clientX, e.clientY);
            });
        } else if (this.isDraggingTeacherDesk && this.teacherDesk) {
            e.preventDefault();
            requestAnimationFrame(() => {
                this.updateTeacherDeskPosition(e.clientX, e.clientY);
            });
        }
    }
    
    handleMouseUp() {
        if (this.isDragging) {
            this.stopDragging();
        }
        if (this.isDraggingTeacherDesk) {
            this.stopDraggingTeacherDesk();
        }
    }
    
    handleTouchStart(e) {
        const touch = e.touches[0];
        const desk = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.desk');
        const teacherDesk = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.teacher-desk');
        
        if (desk) {
            e.preventDefault();
            this.startDragging(desk, touch.clientX, touch.clientY);
        } else if (teacherDesk) {
            e.preventDefault();
            this.startDraggingTeacherDesk(touch.clientX, touch.clientY);
        }
    }
    
    handleTouchMove(e) {
        if (this.isDragging && this.draggedDesk) {
            e.preventDefault();
            const touch = e.touches[0];
            requestAnimationFrame(() => {
                this.updateDragPosition(touch.clientX, touch.clientY);
            });
        } else if (this.isDraggingTeacherDesk && this.teacherDesk) {
            e.preventDefault();
            const touch = e.touches[0];
            requestAnimationFrame(() => {
                this.updateTeacherDeskPosition(touch.clientX, touch.clientY);
            });
        }
    }
    
    handleTouchEnd() {
        if (this.isDragging) {
            this.stopDragging();
        }
        if (this.isDraggingTeacherDesk) {
            this.stopDraggingTeacherDesk();
        }
    }
    
    startDragging(deskElement, clientX, clientY) {
        // dataset.index 대신 DOM 요소를 직접 사용하여 책상 찾기
        const desk = this.desks.find(d => d.element === deskElement);
        
        if (!desk) return;
        
        this.isDragging = true;
        this.draggedDesk = desk;
        desk.element.classList.add('dragging');
        
        // 드래그 중에는 transition 비활성화
        desk.element.style.transition = 'none';
        
        const rect = desk.element.getBoundingClientRect();
        this.dragOffset.x = clientX - rect.left;
        this.dragOffset.y = clientY - rect.top;
    }
    
    updateDragPosition(clientX, clientY) {
        if (!this.draggedDesk) return;
        
        const classroomRect = this.classroom.getBoundingClientRect();
        const deskWidth = 80;
        const deskHeight = 60;
        
        // 마우스 커서 위치에서 오프셋을 빼서 정확한 위치 계산
        let newX = clientX - classroomRect.left - this.dragOffset.x;
        let newY = clientY - classroomRect.top - this.dragOffset.y;
        
        // 경계 제한
        newX = Math.max(0, Math.min(newX, classroomRect.width - deskWidth));
        newY = Math.max(0, Math.min(newY, classroomRect.height - deskHeight));
        
        // left/top으로 직접 위치 설정 (transform 대신)
        this.draggedDesk.element.style.left = newX + 'px';
        this.draggedDesk.element.style.top = newY + 'px';
        
        this.draggedDesk.x = newX;
        this.draggedDesk.y = newY;
    }
    
    stopDragging() {
        if (this.draggedDesk) {
            // 드래그 종료 시 transition 다시 활성화
            this.draggedDesk.element.style.transition = 'all 0.3s ease';
            
            this.draggedDesk.element.classList.remove('dragging');
            this.draggedDesk = null;
        }
        this.isDragging = false;
    }
    
    startDraggingTeacherDesk(clientX, clientY) {
        if (!this.teacherDesk) return;
        
        this.isDraggingTeacherDesk = true;
        this.teacherDesk.element.classList.add('dragging');
        
        // 드래그 중에는 transition 비활성화
        this.teacherDesk.element.style.transition = 'none';
        
        const rect = this.teacherDesk.element.getBoundingClientRect();
        this.dragOffset.x = clientX - rect.left;
        this.dragOffset.y = clientY - rect.top;
    }
    
    updateTeacherDeskPosition(clientX, clientY) {
        if (!this.teacherDesk) return;
        
        const classroomRect = this.classroom.getBoundingClientRect();
        const deskWidth = 120;
        const deskHeight = 80;
        
        // 마우스 커서 위치에서 오프셋을 빼서 정확한 위치 계산
        let newX = clientX - classroomRect.left - this.dragOffset.x;
        let newY = clientY - classroomRect.top - this.dragOffset.y;
        
        // 경계 제한
        newX = Math.max(0, Math.min(newX, classroomRect.width - deskWidth));
        newY = Math.max(0, Math.min(newY, classroomRect.height - deskHeight));
        
        // left/top으로 직접 위치 설정
        this.teacherDesk.element.style.left = newX + 'px';
        this.teacherDesk.element.style.top = newY + 'px';
        
        this.teacherDesk.x = newX;
        this.teacherDesk.y = newY;
    }
    
    stopDraggingTeacherDesk() {
        if (this.teacherDesk) {
            // 드래그 종료 시 transition 다시 활성화
            this.teacherDesk.element.style.transition = 'all 0.3s ease';
            this.teacherDesk.element.classList.remove('dragging');
        }
        this.isDraggingTeacherDesk = false;
    }
    
    showMessage(text, type = 'info', persistent = false) {
        // 기존 메시지 제거 (단, persistent 경고는 유지)
        if (!persistent) {
            const existingMessage = document.querySelector('.message');
            if (existingMessage) {
                existingMessage.remove();
            }
        } else {
            // 이미 같은 경고가 있으면 중복 생성 방지
            const existingWarning = document.querySelector('.message.warning');
            if (existingWarning && existingWarning.textContent === text) return;
        }
        // 새 메시지 생성
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        // 메시지 타입에 따른 색상 설정
        let backgroundColor, textColor;
        switch (type) {
            case 'success': backgroundColor = '#4caf50'; textColor = 'white'; break;
            case 'warning': backgroundColor = '#ff9800'; textColor = 'white'; break;
            case 'error': backgroundColor = '#f44336'; textColor = 'white'; break;
            default: backgroundColor = '#2196f3'; textColor = 'white';
        }
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: ${textColor};
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: bold;
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
            word-wrap: break-word;
        `;
        document.body.appendChild(message);
        // 자동 제거: 경고/에러는 persistent가 아니면 5초, 그 외는 3초
        if (!persistent) {
            const displayTime = (type === 'warning' || type === 'error') ? 5000 : 3000;
            setTimeout(() => {
                message.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => message.remove(), 300);
            }, displayTime);
        }
    }
    
    repositionDesks() {
        const classroomRect = this.classroom.getBoundingClientRect();
        const deskWidth = 80;
        const deskHeight = 60;
        const spacing = 20;
        const topOffset = 140;
        
        // 각 배치 방식에 맞게 재배치
        switch (this.layoutType) {
            case 'individual':
                this.repositionIndividualLayout(classroomRect, deskWidth, deskHeight, spacing, topOffset);
                break;
            case 'group':
                this.repositionGroupLayout(classroomRect, deskWidth, deskHeight, spacing, topOffset);
                break;
            case 'team-vertical':
                this.repositionTeamLayoutVertical(classroomRect, deskWidth, deskHeight, spacing, topOffset);
                break;
            case 'team-horizontal':
                this.repositionTeamLayoutHorizontal(classroomRect, deskWidth, deskHeight, spacing, topOffset);
                break;
        }
    }
    
    repositionIndividualLayout(classroomRect, deskWidth, deskHeight, spacing, topOffset) {
        const cols = 5;
        const rows = 4;
        const groupWidth = cols * deskWidth + (cols - 1) * spacing;
        const startX = (classroomRect.width - groupWidth) / 2;
        const startY = topOffset;
        
        this.desks.forEach((desk, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            const newX = startX + col * (deskWidth + spacing);
            const newY = startY + row * (deskHeight + spacing);
            
            desk.element.style.transition = 'all 0.5s ease';
            desk.element.style.left = newX + 'px';
            desk.element.style.top = newY + 'px';
            
            desk.x = newX;
            desk.y = newY;
        });
        
        setTimeout(() => {
            this.desks.forEach(desk => {
                desk.element.style.transition = '';
            });
        }, 500);
    }
    
    repositionGroupLayout(classroomRect, deskWidth, deskHeight, spacing, topOffset) {
        const groupCols = 2;
        const groupRows = 3;
        const totalGroups = 3;
        const groupWidth = groupCols * deskWidth + (groupCols - 1) * spacing;
        const groupSpacing = 60;
        const totalWidth = totalGroups * groupWidth + (totalGroups - 1) * groupSpacing;
        const startX = (classroomRect.width - totalWidth) / 2;
        const startY = topOffset;
        
        let deskIndex = 0;
        
        for (let group = 0; group < totalGroups; group++) {
            const groupStartX = startX + group * (groupWidth + groupSpacing);
            
            for (let row = 0; row < groupRows; row++) {
                for (let col = 0; col < groupCols; col++) {
                    const desk = this.desks[deskIndex];
                    if (desk) {
                        const x = groupStartX + col * (deskWidth + spacing);
                        const y = startY + row * (deskHeight + spacing);
                        
                        desk.element.style.transition = 'all 0.5s ease';
                        desk.element.style.left = x + 'px';
                        desk.element.style.top = y + 'px';
                        
                        desk.x = x;
                        desk.y = y;
                    }
                    deskIndex++;
                }
            }
        }
        
        setTimeout(() => {
            this.desks.forEach(desk => {
                desk.element.style.transition = '';
            });
        }, 500);
    }
    
    repositionTeamLayoutVertical(classroomRect, deskWidth, deskHeight, spacing, topOffset) {
        const groupCols = 2;
        const groupRows = 2;
        const innerSpacing = 10;
        const groupWidth = groupCols * deskWidth + (groupCols - 1) * innerSpacing;
        const groupHeight = groupRows * deskHeight + (groupRows - 1) * innerSpacing;
        const groupSpacing = 60;
        const rowSpacing = 80;
        const groupsPerRow = 2;
        const startX = (classroomRect.width - (groupsPerRow * groupWidth + (groupsPerRow - 1) * groupSpacing)) / 2;
        const startY = topOffset;
        let deskIndex = 0;
        for (let row = 0; row < 3; row++) {
            const rowStartY = startY + row * (groupHeight + rowSpacing);
            for (let groupInRow = 0; groupInRow < 2; groupInRow++) {
                const groupStartX = startX + groupInRow * (groupWidth + groupSpacing);
                for (let deskRow = 0; deskRow < groupRows; deskRow++) {
                    for (let deskCol = 0; deskCol < groupCols; deskCol++) {
                        const desk = this.desks[deskIndex];
                        if (desk) {
                            const x = groupStartX + deskCol * (deskWidth + innerSpacing);
                            const y = rowStartY + deskRow * (deskHeight + innerSpacing);
                            
                            desk.element.style.transition = 'all 0.5s ease';
                            desk.element.style.left = x + 'px';
                            desk.element.style.top = y + 'px';
                            
                            desk.x = x;
                            desk.y = y;
                        }
                        deskIndex++;
                    }
                }
            }
        }
        
        setTimeout(() => {
            this.desks.forEach(desk => {
                desk.element.style.transition = '';
            });
        }, 500);
    }
    
    repositionTeamLayoutHorizontal(classroomRect, deskWidth, deskHeight, spacing, topOffset) {
        const groupCols = 2;
        const groupRows = 2;
        const innerSpacing = 10;
        const groupWidth = groupCols * deskWidth + (groupCols - 1) * innerSpacing;
        const groupHeight = groupRows * deskHeight + (groupRows - 1) * innerSpacing;
        const groupSpacing = 60;
        const rowSpacing = 80;
        const groupsPerRow = 3;
        const startX = (classroomRect.width - (groupsPerRow * groupWidth + (groupsPerRow - 1) * groupSpacing)) / 2;
        const startY = topOffset;
        let deskIndex = 0;
        for (let row = 0; row < 2; row++) {
            const rowStartY = startY + row * (groupHeight + rowSpacing);
            for (let groupInRow = 0; groupInRow < 3; groupInRow++) {
                const groupStartX = startX + groupInRow * (groupWidth + groupSpacing);
                for (let deskRow = 0; deskRow < groupRows; deskRow++) {
                    for (let deskCol = 0; deskCol < groupCols; deskCol++) {
                        const desk = this.desks[deskIndex];
                        if (desk) {
                            const x = groupStartX + deskCol * (deskWidth + innerSpacing);
                            const y = rowStartY + deskRow * (deskHeight + innerSpacing);
                            
                            desk.element.style.transition = 'all 0.5s ease';
                            desk.element.style.left = x + 'px';
                            desk.element.style.top = y + 'px';
                            
                            desk.x = x;
                            desk.y = y;
                        }
                        deskIndex++;
                    }
                }
            }
        }
        
        setTimeout(() => {
            this.desks.forEach(desk => {
                desk.element.style.transition = '';
            });
        }, 500);
    }

    // 책상 우클릭 삭제 기능
    addDeskContextMenuEvent(deskElement) {
        deskElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.appMode === 'gender') {
                if (deskElement.classList.contains('desk-male')) {
                    deskElement.classList.remove('desk-male');
                    deskElement.classList.add('desk-female');
                } else if (deskElement.classList.contains('desk-female')) {
                    // 삭제
                    deskElement.remove();
                    this.desks = this.desks.filter(d => d.element !== deskElement);
                    this.deskCount = this.desks.length;
                    this.validateInput();
                    this.updateStatusInfo();
                    return;
                } else {
                    deskElement.classList.add('desk-male');
                }
                this.validateInput();
                this.updateStatusInfo();
                return;
            }
            // 일반 모드: 기존 삭제만
            // ... 기존 코드 ...
            if (this.appMode !== 'gender') {
                // 최소 1개는 남기기
                if (this.desks.length <= 1) {
                    this.showMessage('⚠️ 책상은 최소 1개는 남아야 합니다!', 'warning');
                    return;
                }
                deskElement.remove();
                this.desks = this.desks.filter(d => d.element !== deskElement);
                this.deskCount = this.desks.length;
                this.validateInput();
                this.updateStatusInfo();
            }
        });
    }

    // 책상 추가 기능
    addDesk() {
        // 최대 30개 제한
        if (this.desks.length >= 30) {
            this.showMessage('⚠️ 책상은 최대 30개까지 추가할 수 있습니다!', 'warning');
            return;
        }
        
        const deskWidth = 80;
        const deskHeight = 60;
        const spacing = 20;
        
        // 좌측상단에 배치 (교탁 아래쪽)
        const classroomRect = this.classroom.getBoundingClientRect();
        const topOffset = 140; // 교탁 아래 여백
        
        // 기존 책상들의 위치를 확인하여 좌측상단에 빈 공간 찾기
        let x = 50; // 좌측 여백
        let y = topOffset;
        
        // 기존 책상들과 겹치지 않는 위치 찾기
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            let positionOccupied = false;
            
            // 기존 책상들과 겹치는지 확인
            for (const existingDesk of this.desks) {
                const existingX = existingDesk.x;
                const existingY = existingDesk.y;
                
                // 겹치는지 확인 (약간의 여유 공간 포함)
                if (Math.abs(x - existingX) < deskWidth + spacing && 
                    Math.abs(y - existingY) < deskHeight + spacing) {
                    positionOccupied = true;
                    break;
                }
            }
            
            if (!positionOccupied) {
                break; // 빈 공간을 찾았음
            }
            
            // 다음 위치로 이동
            x += deskWidth + spacing;
            if (x > classroomRect.width - deskWidth - 50) {
                x = 50;
                y += deskHeight + spacing;
            }
            
            attempts++;
        }
        
        const newDeskIndex = this.desks.length;
        const desk = document.createElement('div');
        desk.className = 'desk';
        if (this.appMode === 'gender') {
            desk.classList.add('desk-male');
        }
        desk.dataset.index = newDeskIndex;
        desk.style.left = x + 'px';
        desk.style.top = y + 'px';
        this.classroom.appendChild(desk);
        
        const deskData = {
            element: desk,
            x: x,
            y: y,
            number: null,
            name: null
        };
        
        this.desks.push(deskData);
        this.addDeskContextMenuEvent(desk);
        this.deskCount = this.desks.length;
        this.validateInput();
        this.updateStatusInfo();
        
        this.showMessage('➕ 책상이 추가되었습니다!', 'success');
    }

    // 상태 정보 업데이트
    updateStatusInfo() {
        if (this.appMode === 'gender') {
            // 남학생/여학생 수
            let maleCount = 0, femaleCount = 0;
            if (this.inputMode === 'number') {
                const males = this.maleNumbersInput.value.split(',').map(s => s.trim()).filter(s => s);
                const females = this.femaleNumbersInput.value.split(',').map(s => s.trim()).filter(s => s);
                maleCount = males.length;
                femaleCount = females.length;
            } else {
                const males = this.maleNamesInput.value.split(',').map(s => s.trim()).filter(s => s);
                const females = this.femaleNamesInput.value.split(',').map(s => s.trim()).filter(s => s);
                maleCount = males.length;
                femaleCount = females.length;
            }
            // 남/여 책상 수
            const maleDeskCount = this.desks.filter(d => d.element.classList.contains('desk-male')).length;
            const femaleDeskCount = this.desks.filter(d => d.element.classList.contains('desk-female')).length;
            document.getElementById('currentMaleCount').textContent = maleCount;
            document.getElementById('currentFemaleCount').textContent = femaleCount;
            document.getElementById('currentMaleDeskCount').textContent = maleDeskCount;
            document.getElementById('currentFemaleDeskCount').textContent = femaleDeskCount;
        } else {
            // 기존 일반 모드
            // ... 기존 코드 ...
            if (!this.currentDeskCountElement || !this.currentStudentCountElement) return;
            let studentCount = 0;
            if (this.inputMode === 'number') {
                const lastNumber = parseInt(this.lastNumberInput.value) || 0;
                const excludeText = this.excludeNumbersInput.value.trim();
                let excludeNumbers = [];
                if (excludeText) {
                    excludeNumbers = excludeText.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num) && num > 0 && num <= lastNumber);
                }
                excludeNumbers = [...new Set(excludeNumbers)];
                studentCount = lastNumber - excludeNumbers.length;
            } else {
                const nameText = this.nameListTextarea.value.trim();
                if (nameText) {
                    studentCount = nameText.split(/\n|,/).map(name => name.trim()).filter(name => name).length;
                }
            }
            this.currentDeskCountElement.textContent = this.deskCount;
            this.currentStudentCountElement.textContent = studentCount;
        }
    }

    // PDF로 저장 기능
    async downloadClassroomAsPdf() {
        const classroom = document.getElementById('classroom');
        const container = document.querySelector('.container');
        if (!classroom || !container) return;
        const desks = classroom.querySelectorAll('.desk');
        // 전체 배경까지 흰색으로 강제 적용
        document.documentElement.classList.add('force-capture-bg');
        document.body.classList.add('force-capture-bg');
        classroom.classList.add('force-capture-bg');
        container.classList.add('force-capture-bg');
        desks.forEach(desk => desk.classList.add('force-capture-desk'));
        // html2canvas로 캡처
        const canvas = await html2canvas(classroom, {backgroundColor: '#fff'});
        // 캡처 후 원래대로 복구
        document.documentElement.classList.remove('force-capture-bg');
        document.body.classList.remove('force-capture-bg');
        classroom.classList.remove('force-capture-bg');
        container.classList.remove('force-capture-bg');
        desks.forEach(desk => desk.classList.remove('force-capture-desk'));
        const imgData = canvas.toDataURL('image/png');
        // PDF 크기 계산 (A4 기준)
        const pdf = new window.jspdf.jsPDF({orientation: 'landscape', unit: 'mm', format: 'a4'});
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        // 이미지 비율에 맞게 크기 조정
        const imgWidth = pageWidth;
        const imgHeight = canvas.height * (imgWidth / canvas.width);
        const y = (pageHeight - imgHeight) / 2;
        pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);
        pdf.save('자리배치.pdf');
    }

    saveLayoutToStorage() {
        const storageKey = this.appMode === 'gender' ? 'seatshuffleLayout_gender' : 'seatshuffleLayout';
        const teacherDesk = this.teacherDesk ? { x: this.teacherDesk.x, y: this.teacherDesk.y } : null;
        const desks = this.desks.map(desk => {
            let gender = null;
            if (this.appMode === 'gender') {
                if (desk.element.classList.contains('desk-male')) gender = 'male';
                else if (desk.element.classList.contains('desk-female')) gender = 'female';
            }
            return {
                x: desk.x, y: desk.y,
                number: desk.number, name: desk.name,
                gender: gender
            };
        });
        const layoutType = this.layoutType;
        const layoutData = { teacherDesk, desks, layoutType };
        localStorage.setItem(storageKey, JSON.stringify(layoutData));
        this.showMessage('💾 현재 배치가 저장되었습니다!', 'success');
    }

    loadLayoutFromStorage() {
        const storageKey = this.appMode === 'gender' ? 'seatshuffleLayout_gender' : 'seatshuffleLayout';
        const data = localStorage.getItem(storageKey);
        if (!data) {
            this.showMessage('❌ 저장된 배치가 없습니다.', 'error');
            return;
        }
        try {
            const { teacherDesk, desks, layoutType } = JSON.parse(data);
            this.layoutType = layoutType;
            this.individualBtn.classList.toggle('active', layoutType === 'individual');
            this.groupBtn.classList.toggle('active', layoutType === 'group');
            this.teamVerticalBtn.classList.toggle('active', layoutType === 'team-vertical');
            this.teamHorizontalBtn.classList.toggle('active', layoutType === 'team-horizontal');
            this.classroom.querySelectorAll('.desk').forEach(d => d.remove());
            this.desks = [];
            if (this.teacherDesk && this.teacherDesk.element) this.teacherDesk.element.remove();
            if (teacherDesk) {
                const teacherDeskElement = document.createElement('div');
                teacherDeskElement.className = 'teacher-desk';
                teacherDeskElement.textContent = '👨‍🏫 교탁';
                teacherDeskElement.dataset.type = 'teacher';
                teacherDeskElement.style.left = teacherDesk.x + 'px';
                teacherDeskElement.style.top = teacherDesk.y + 'px';
                this.classroom.appendChild(teacherDeskElement);
                this.teacherDesk = { element: teacherDeskElement, x: teacherDesk.x, y: teacherDesk.y };
            } else {
                this.teacherDesk = null;
            }
            desks.forEach((deskData, i) => {
                const desk = document.createElement('div');
                desk.className = 'desk';
                if (this.appMode === 'gender' && deskData.gender) {
                    desk.classList.add(deskData.gender === 'male' ? 'desk-male' : 'desk-female');
                }
                desk.dataset.index = i;
                desk.style.left = deskData.x + 'px';
                desk.style.top = deskData.y + 'px';
                desk.textContent = deskData.number || deskData.name || '';
                this.classroom.appendChild(desk);
                this.desks.push({
                    element: desk,
                    x: deskData.x,
                    y: deskData.y,
                    number: deskData.number,
                    name: deskData.name
                });
                this.addDeskContextMenuEvent(desk);
            });
            this.deskCount = this.desks.length;
            this.validateInput();
            this.updateStatusInfo();
            this.showMessage('📂 저장된 배치를 불러왔습니다!', 'success');
        } catch (e) {
            this.showMessage('❌ 배치 불러오기 오류', 'error');
            console.error('Layout loading error:', e);
        }
    }

    toggleAppMode() {
        this.appMode = this.appMode === 'normal' ? 'gender' : 'normal';
        localStorage.setItem('seatshuffleAppMode', this.appMode);
        this.updateModeToggleBtn();
        // 새 모드에 맞게 전체 UI/데이터 리셋(추후 구현)
        location.reload(); // 임시: 새로고침으로 전체 리셋(실제 구현시 UI만 교체)
    }
    updateModeToggleBtn() {
        if (!this.modeToggleBtn) return;
        if (this.appMode === 'normal') {
            this.modeToggleBtn.textContent = '남녀 모드로 전환';
            this.modeToggleBtn.classList.add('red');
        } else {
            this.modeToggleBtn.textContent = '일반 모드로 전환';
            this.modeToggleBtn.classList.remove('red');
        }
    }

    // 남녀 모드 출석번호 지우기
    clearGenderNumbers() {
        this.maleNumbersInput.value = '';
        this.femaleNumbersInput.value = '';
        this.validateInput();
        this.showMessage('🗑️ 출석번호를 지웠습니다!', 'info');
    }

    saveGenderNumbersToStorage() {
        const maleNumbers = this.maleNumbersInput.value.trim();
        const femaleNumbers = this.femaleNumbersInput.value.trim();
        localStorage.setItem('classroomNumbers_gender', JSON.stringify({ maleNumbers, femaleNumbers }));
        this.showMessage('💾 남녀 출석번호가 저장되었습니다!', 'success');
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 애플리케이션 시작
document.addEventListener('DOMContentLoaded', () => {
    new DeskManager();
}); 