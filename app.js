// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const userNameDisplay = document.getElementById('user-name-display');
const logoutBtn = document.getElementById('logout-btn');

// Settings Elements
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const confirmNewPasswordInput = document.getElementById('confirm-new-password');
const changePasswordBtn = document.getElementById('change-password-btn');

// Nav Items and Tabs
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');



// Budget Elements
const receiptUploadBox = document.getElementById('receipt-upload-box');
const receiptFileUpload = document.getElementById('receipt-file-upload');
const receiptLoading = document.getElementById('receipt-loading');
const budgetSettingsModal = document.getElementById('budget-settings-modal');
const btnBudgetSettings = document.getElementById('btn-budget-settings');
const budgetSettingsCloseBtn = document.getElementById('budget-settings-close-btn');
const btnSaveBudget = document.getElementById('btn-save-budget');
const budgetInputsContainer = document.getElementById('budget-inputs-container');
const budgetCategoriesContainer = document.getElementById('budget-categories-container');
const btnAiRecommendBudget = document.getElementById('btn-ai-recommend-budget');
const aiBudgetWarning = document.getElementById('ai-budget-warning');
const dashTotalBudget = document.getElementById('dash-total-budget');
const dashTotalSpent = document.getElementById('dash-total-spent');
const dashBudgetProgress = document.getElementById('dash-budget-progress');
const dashBudgetPercent = document.getElementById('dash-budget-percent');
const thisMonthBar = document.getElementById('this-month-bar');

let budgetData = {
    totalBudget: 500000,
    totalSpent: 0,
    categories: [
        { id: 'housing', name: '주거비', limit: 200000, spent: 0 },
        { id: 'food', name: '식비/카페', limit: 150000, spent: 0 },
        { id: 'transport', name: '교통비', limit: 50000, spent: 0 },
        { id: 'shopping', name: '쇼핑', limit: 50000, spent: 0 },
        { id: 'others', name: '기타', limit: 50000, spent: 0 }
    ],
    resetDate: '1'
};
const userPoints = document.getElementById('user-points');
const pointProgressBar = document.getElementById('point-progress-bar');
const pointProgressText = document.getElementById('point-progress-text');

// --- State Variables ---
let currentUser = null;
let totalPoints = 0;
let progressPoints = 0;
let currentLevel = 1;

// LocalStorage DB 처리
const USER_DB_KEY = 'youth_app_users_db';
function loadUsersDB() {
    return JSON.parse(localStorage.getItem(USER_DB_KEY)) || {};
}
function saveUserProgress() {
    if (!currentUser) return;
    const db = loadUsersDB();
    if (db[currentUser]) {
        db[currentUser].totalPoints = totalPoints;
        db[currentUser].progressPoints = progressPoints;
        db[currentUser].currentLevel = currentLevel;
        localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
    }
}

function addPoints(pts) {
    totalPoints += pts;
    progressPoints += pts;
    userPoints.innerText = totalPoints.toLocaleString();

    let leveledUp = false;
    let requiredForNext = currentLevel * 1000;

    while (progressPoints >= requiredForNext) {
        progressPoints -= requiredForNext;
        currentLevel++;
        requiredForNext = currentLevel * 1000;
        leveledUp = true;
    }

    if (leveledUp) {
        document.getElementById('user-tier').innerText = `씨앗 등급 (Lv.${currentLevel})`;
        setTimeout(() => {
            alert(`🎉 축하합니다! 씨앗 등급 Lv.${currentLevel}(으)로 레벨업 하셨습니다! 🎉\n(다음 레벨 등업 요구 점수는 ${requiredForNext}P 입니다.)`);
        }, 100);
    }

    updateProgress();
    saveUserProgress(); // 레벨업/포인트 적립 시 즉시 저장
}

function updateProgress() {
    let requiredForNext = currentLevel * 1000;
    let percentage = (progressPoints / requiredForNext) * 100;
    if (percentage > 100) percentage = 100;

    pointProgressBar.style.transition = "width 0.5s ease-in-out";
    pointProgressBar.style.width = percentage + "%";

    let remaining = requiredForNext - progressPoints;
    pointProgressText.innerText = `다음 Lv.${currentLevel + 1} 등급까지 ${remaining}P 남았어요!`;
}

// 초기 로드시 프로그레스 바 설정
updateProgress();

function validatePassword(pwd) {
    const minLength = pwd.length >= 8;
    const hasLowercase = /[a-z]/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    return minLength && hasLowercase && hasSpecial;
}

// --- Login Logic ---
const passwordErrorDiv = document.getElementById('password-error');

if (passwordInput) {
    passwordInput.addEventListener('input', () => {
        if (passwordErrorDiv) passwordErrorDiv.style.display = 'none';
    });
}

loginBtn.addEventListener('click', () => {
    if (passwordErrorDiv) passwordErrorDiv.style.display = 'none';
    
    const name = usernameInput.value.trim();
    const pwd = passwordInput.value.trim();

    if (name.length === 0 || pwd.length === 0) {
        alert("아이디(UID)와 비밀번호를 모두 입력해주세요!");
        return;
    }

    const db = loadUsersDB();

    if (db[name]) {
        // 기존 가입된 유저
        if (db[name].password !== pwd) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }
        // 데이터 불러오기
        totalPoints = db[name].totalPoints || 0;
        progressPoints = db[name].progressPoints || 0;
        currentLevel = db[name].currentLevel || 1;
        alert(`환영합니다, ${name}님! 이전 진행 상황을 불러왔습니다.`);
    } else {
        // 신규 유저 생성
        if (!validatePassword(pwd)) {
            if (passwordErrorDiv) passwordErrorDiv.style.display = 'block';
            return;
        }

        if (confirm(`'${name}' 계정이 없습니다. 이 비밀번호로 새로 생성하시겠습니까?`)) {
            db[name] = {
                password: pwd,
                totalPoints: 0,
                progressPoints: 0,
                currentLevel: 1
            };
            localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
            
            totalPoints = 0;
            progressPoints = 0;
            currentLevel = 1;
            alert(`계정이 성공적으로 생성되었습니다!`);
        } else {
            return;
        }
    }

    currentUser = name;

    // Set UI
    userNameDisplay.innerText = name;
    userPoints.innerText = totalPoints.toLocaleString();
    document.getElementById('user-tier').innerText = `씨앗 등급 (Lv.${currentLevel})`;
    updateProgress();

    // Transition Screens
    loginScreen.classList.remove('active');
    loginScreen.classList.add('hidden');

    setTimeout(() => {
        mainApp.classList.remove('hidden');
        mainApp.classList.add('active');
    }, 300);
});

// Optionally allow 'Enter' key to login
usernameInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        passwordInput.focus();
    }
});
passwordInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});

// --- Navigation Logic ---
function switchTab(tabId) {
    // 1. Update Navigation styling
    navItems.forEach(item => {
        if (item.dataset.tab === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // 2. Hide all tabs, show the selected one
    tabContents.forEach(tab => {
        if (tab.id === `${tabId}-tab`) {
            tab.classList.remove('hidden');
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
            tab.classList.add('hidden');
        }
    });

    if (tabId === 'budget') {
        renderBudgetOverview();
    }
    
    if (tabId === 'ai-coach') {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
}

// Add Click Events to Nav Items
navItems.forEach(item => {
    item.addEventListener('click', () => {
        switchTab(item.dataset.tab);
    });
});



// --- Budget Logic ---
function renderBudgetOverview() {
    let totalBudget = 0;
    let totalSpent = 0;
    budgetData.categories.forEach(c => {
        totalBudget += parseInt(c.limit);
        totalSpent += parseInt(c.spent);
    });
    budgetData.totalBudget = totalBudget;
    budgetData.totalSpent = totalSpent;

    let percent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    
    // Dashboard updates
    if (dashTotalBudget) dashTotalBudget.innerText = totalBudget.toLocaleString();
    if (dashTotalSpent) dashTotalSpent.innerText = totalSpent.toLocaleString();
    if (dashBudgetPercent) dashBudgetPercent.innerText = `${percent}%`;
    if (dashBudgetProgress) {
        dashBudgetProgress.style.background = `conic-gradient(var(--primary) ${percent * 3.6}deg, #e2e8f0 0deg)`;
    }
    
    // This month graph
    if (thisMonthBar) {
        thisMonthBar.style.height = `${Math.min(100, Math.max(10, percent))}%`;
        if (percent > 90) thisMonthBar.style.background = '#ef4444';
        else if (percent > 70) thisMonthBar.style.background = '#f59e0b';
        else thisMonthBar.style.background = 'var(--primary)';
    }

    // Render Categories
    if (budgetCategoriesContainer) {
        budgetCategoriesContainer.innerHTML = '';
        budgetData.categories.forEach(c => {
            let catPercent = c.limit > 0 ? Math.round((c.spent / c.limit) * 100) : 0;
            let barColorClass = catPercent > 90 ? 'danger' : (catPercent > 70 ? 'warning' : '');
            
            budgetCategoriesContainer.innerHTML += `
                <div class="budget-category-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold;">${c.name}</span>
                        <span style="font-size: 0.9rem;">${c.spent.toLocaleString()} / ${c.limit.toLocaleString()}원</span>
                    </div>
                    <div class="budget-progress-bar">
                        <div class="budget-progress-fill ${barColorClass}" style="width: ${Math.min(100, catPercent)}%"></div>
                    </div>
                </div>
            `;
        });
    }

    // AI Warning
    if (aiBudgetWarning) {
        if (percent > 90) {
            aiBudgetWarning.classList.remove('hidden');
            aiBudgetWarning.style.background = '#fee2e2';
            aiBudgetWarning.style.color = '#991b1b';
            aiBudgetWarning.style.borderColor = '#fca5a5';
            aiBudgetWarning.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>위험!</strong> 전체 예산의 90%를 초과했어요. 이번 달은 지출을 멈추고 짠테크 모드로 전환하세요! <button class="btn-secondary" style="margin-top: 10px; width: 100%; font-size: 0.8rem; background: white; color: #991b1b; border: 1px solid #fca5a5;">긴급 지출 방어 대안 보기</button>`;
        } else if (percent > 70) {
            aiBudgetWarning.classList.remove('hidden');
            aiBudgetWarning.style.background = '#fef3c7';
            aiBudgetWarning.style.color = '#92400e';
            aiBudgetWarning.style.borderColor = '#fcd34d';
            aiBudgetWarning.innerHTML = `<i class="fa-solid fa-lightbulb"></i> 전체 예산의 70%가 사용됐어요. 이번 주말에는 외식 대신 집밥 어떠세요?`;
        } else {
            aiBudgetWarning.classList.add('hidden');
        }
    }
}

if (btnBudgetSettings) {
    btnBudgetSettings.addEventListener('click', () => {
        budgetInputsContainer.innerHTML = '';
        budgetData.categories.forEach((c, index) => {
            budgetInputsContainer.innerHTML += `
                <div>
                    <label style="font-size: 0.9rem; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">${c.name}</label>
                    <input type="range" class="budget-slider" id="budget-slider-${index}" min="0" max="1000000" step="10000" value="${c.limit}" oninput="document.getElementById('budget-val-${index}').innerText = Number(this.value).toLocaleString() + '원'">
                    <div style="text-align: right; font-weight: bold; font-size: 0.9rem; color: var(--primary);" id="budget-val-${index}">${c.limit.toLocaleString()}원</div>
                </div>
            `;
        });
        document.getElementById('budget-reset-date').value = budgetData.resetDate;
        budgetSettingsModal.classList.remove('hidden');
    });
}

if (budgetSettingsCloseBtn) {
    budgetSettingsCloseBtn.addEventListener('click', () => {
        budgetSettingsModal.classList.add('hidden');
    });
}

if (btnSaveBudget) {
    btnSaveBudget.addEventListener('click', () => {
        budgetData.categories.forEach((c, index) => {
            const slider = document.getElementById(`budget-slider-${index}`);
            if (slider) {
                c.limit = parseInt(slider.value);
            }
        });
        budgetData.resetDate = document.getElementById('budget-reset-date').value;
        renderBudgetOverview();
        budgetSettingsModal.classList.add('hidden');
        alert('예산 설정이 저장되었습니다.');
    });
}

if (btnAiRecommendBudget) {
    btnAiRecommendBudget.addEventListener('click', () => {
        // AI mock logic
        budgetData.categories.forEach(c => {
            if (c.id === 'housing') c.limit = 300000;
            else if (c.id === 'food') c.limit = 200000;
            else if (c.id === 'transport') c.limit = 80000;
            else if (c.id === 'shopping') c.limit = 100000;
            else c.limit = 50000;
        });
        alert('AI가 회원님의 패턴을 분석하여 최적의 예산을 제안했습니다!');
        // Refresh sliders
        btnBudgetSettings.click(); 
    });
}

if (receiptUploadBox) {
    receiptUploadBox.addEventListener('click', () => {
        receiptFileUpload.click();
    });
}

if (receiptFileUpload) {
    receiptFileUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            receiptUploadBox.classList.add('hidden');
            receiptLoading.classList.remove('hidden');
            
            setTimeout(() => {
                receiptLoading.classList.add('hidden');
                receiptUploadBox.classList.remove('hidden');
                
                // Mock adding expense to food
                budgetData.categories[1].spent += 15000; 
                renderBudgetOverview();
                alert('AI 영수증 분석 완료!\\n식비/카페 카테고리에 15,000원이 등록되었습니다.');
                
                receiptFileUpload.value = '';
            }, 1500);
        }
    });
}

// 초기화 시 렌더링
renderBudgetOverview();

// --- Logout Logic ---
logoutBtn.addEventListener('click', () => {
    // 로그아웃 시 현재 상태 한 번 더 저장
    saveUserProgress();

    // 입력창 초기화
    usernameInput.value = '';
    passwordInput.value = '';
    if(currentPasswordInput) currentPasswordInput.value = '';
    if(newPasswordInput) newPasswordInput.value = '';
    if(confirmNewPasswordInput) confirmNewPasswordInput.value = '';

    // 메인 앱 숨기기
    mainApp.classList.remove('active');
    mainApp.classList.add('hidden');

    // 부드러운 전환 효과를 위해 시간차 적용
    setTimeout(() => {
        // 로그인 화면 보이기
        loginScreen.classList.remove('hidden');
        loginScreen.classList.add('active');

        // 상태 초기화
        currentUser = null;
        totalPoints = 0;
        progressPoints = 0;
        currentLevel = 1;
        userPoints.innerText = totalPoints.toLocaleString();
        document.getElementById('user-tier').innerText = `씨앗 등급 (Lv.1)`;
        updateProgress();

        switchTab('dashboard');
        resetChallenge();
    }, 300);
});

// --- AI Coach Chat Logic ---
const GEMINI_API_KEY = "AIzaSyDa8jEQPUbKM_vBRheCZDIWqRSuNExjZ4M"; // 사용자 제공 API 키

const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatContainer = document.getElementById('chat-container');
const suggestionChips = document.getElementById('suggestion-chips');

let chatHistory = [];

async function fetchGeminiResponse(userMessage) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const spentPercent = budgetData.totalBudget > 0 ? ((budgetData.totalSpent / budgetData.totalBudget) * 100).toFixed(1) : 0;
    const remaining = budgetData.totalBudget - budgetData.totalSpent;
    
    const systemPrompt = `너는 월지킴이 AI의 청년주거 자산 코치야. 대학생들이 월세, 생활비, 자산 관리로 고민할 때 친근하게 도와주는 든든한 코치야. 말투는 딱딱하지 않고 대학생 친구처럼 친근하고 솔직하면서도 격려해주는 스타일로 해줘. 현재 사용자의 이번 달 총 예산은 ${budgetData.totalBudget.toLocaleString()}원이고, 그 중 ${spentPercent}%를 사용했어 (남은 예산: ${remaining.toLocaleString()}원). 보유 자산은 300만원으로 가정해.`;

    const payload = {
        contents: [
            {
                role: "user",
                parts: [{ text: systemPrompt + "\n\n사용자 질문: " + userMessage }]
            }
        ],
        generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 4096,
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        
        if (data.error) {
            console.error("Gemini API Error:", data.error);
            return `앗, 제가 지금 생각 정리에 문제가 생겼어요. 😢<br><span style="font-size:0.8rem; color:var(--danger);">(API 오류: ${data.error.message || '알 수 없는 오류'})</span>`;
        }
        
        if (data.candidates && data.candidates[0].content) {
            let text = data.candidates[0].content.parts[0].text;
            // 간단한 마크다운 파싱
            text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            text = text.replace(/\n/g, '<br>');
            return text;
        }
        return "음, 무슨 말인지 잘 이해하지 못했어요. 다시 한번 말씀해주실래요?";
    } catch (e) {
        console.error("Fetch Error:", e);
        return "앗, 통신 상태가 좋지 않아서 연결이 끊어졌어요. 나중에 다시 시도해주세요! 😭";
    }
}

function addMessageToChat(text, sender) {
    if (!text.trim()) return;
    
    // Save to history (simulation)
    chatHistory.push({ sender, text });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    let html = '';
    if (sender === 'ai') {
        html = `
            <div class="chat-bubble">${text}</div>
        `;
    } else {
        html = `
            <div class="chat-bubble">${text}</div>
        `;
    }
    
    messageDiv.innerHTML = html;
    chatContainer.appendChild(messageDiv);
    
    // Auto scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function handleUserMessage(msg) {
    if (!msg.trim()) return;
    
    // 1. Add User Message
    addMessageToChat(msg, 'user');
    chatInput.value = '';
    
    // 2. Hide suggestions temporarily or permanently
    if (suggestionChips) {
        suggestionChips.style.display = 'none';
    }
    
    // 3. Show AI loading (typing indicator)
    const typingId = 'typing-' + Date.now();
    const typingHtml = `
        <div class="chat-bubble" style="background: transparent; border: none; box-shadow: none; padding: 0;">
            <div class="typing-indicator">
                코치가 분석 중입니다... <span></span><span></span><span></span>
            </div>
        </div>
    `;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message ai';
    typingDiv.id = typingId;
    typingDiv.innerHTML = typingHtml;
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    async function handleAsync() {
        // Fetch real Gemini response
        let geminiText = await fetchGeminiResponse(msg);
        let appendedCardHtml = "";
        
        // Append specific UI cards based on keywords (Hybrid approach to preserve UI)
        if (msg.includes("옵션 분석") || msg.includes("주거 가능 옵션")) {
            appendedCardHtml = `<div class="ai-card" style="margin-top: 1rem;">
                            <div class="ai-card-title"><i class="fa-solid fa-building"></i> 코치의 추천: 맞춤형 주거 플랜</div>
                            <div class="ai-card-row"><span>예상 보증금</span><span>100~300만 원</span></div>
                            <div class="ai-card-row"><span>예상 월세</span><span style="color:var(--primary);">35~45만 원</span></div>
                            <div class="ai-card-row"><span>주거 형태</span><span>가성비 원룸 / 공유주택</span></div>
                            <div class="ai-card-actions">
                                <button class="ai-action-btn" onclick="showNearbyPropertiesList()" style="background: var(--primary); color: white; border: none; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.3);">📍 내 주변 실제 매물 나열하기</button>
                            </div>
                         </div>`;
        } else if (msg.includes("월세 지원") || msg.includes("부담 줄까") || msg.includes("월세 계산")) {
            appendedCardHtml = `<div class="ai-card" style="margin-top: 1rem;">
                            <div class="ai-card-title"><i class="fa-solid fa-calculator"></i> 청년월세지원 체감 시뮬레이션</div>
                            <div class="ai-card-big-number" style="color:var(--danger); font-size: 1.2rem; text-decoration: line-through;">기존 450,000원</div>
                            <div class="ai-card-big-number" style="color:var(--primary);">실부담 250,000원</div>
                            <div class="ai-card-row"><span>매월 절약되는 금액</span><span style="color:var(--success);">+200,000원</span></div>
                            <div class="ai-card-row"><span>연간 총 절약액</span><span style="color:var(--success);">+2,400,000원</span></div>
                            <div class="ai-card-actions">
                                <button class="ai-action-btn" onclick="switchTab('benefits')">신청 가이드 보기</button>
                                <button class="ai-action-btn" onclick="switchTab('budget')">예산 다시 짜기</button>
                            </div>
                         </div>`;
        } else if (msg.includes("이사 비용") || msg.includes("시뮬레이션")) {
            appendedCardHtml = `<div class="ai-card" style="margin-top: 1rem;">
                            <div class="ai-card-title"><i class="fa-solid fa-truck-fast"></i> 초기 이사/세팅 비용 계산기</div>
                            <div class="ai-card-big-number">최소 약 60만 원 필요</div>
                            <div class="ai-card-row"><span>용달 이사비</span><span>150,000원</span></div>
                            <div class="ai-card-row"><span>필수 생활용품</span><span>250,000원</span></div>
                            <div class="ai-card-row"><span>중개수수료(월세 50)</span><span>200,000원</span></div>
                            <div class="ai-card-actions">
                                <button class="ai-action-btn" onclick="switchTab('budget')">이사 예산 관리하기</button>
                                <button class="ai-action-btn" onclick="showNearbyPropertiesList()">주변 매물 탐색</button>
                            </div>
                         </div>`;
        } else if (msg.includes("보증금") || msg.includes("계획") || msg.includes("종잣돈")) {
            appendedCardHtml = `<div class="ai-card" style="margin-top: 1rem;">
                            <div class="ai-card-title"><i class="fa-solid fa-piggy-bank"></i> 희망두배 청년통장 1,000만원 플랜</div>
                            <div class="ai-card-big-number">단 2년 소요! (1년 단축)</div>
                            <div class="ai-card-row"><span>내 저축액 (월 15만)</span><span>3,600,000원</span></div>
                            <div class="ai-card-row"><span>지자체 매칭 (월 15만)</span><span style="color:var(--success);">+3,600,000원</span></div>
                            <div class="ai-card-row"><span>기존 보유 자산 합산</span><span>2,800,000원</span></div>
                            <div class="ai-card-actions">
                                <button class="ai-action-btn" onclick="switchTab('benefits')">관련 혜택 공고 보기</button>
                            </div>
                         </div>`;
        } else if (geminiText.includes("매물지도") || geminiText.includes("지도") || geminiText.includes("매물")) {
            // 자연어 대화 중 매물을 언급했을 때 버튼 자동 추가
            appendedCardHtml = `<div class="ai-card-actions" style="margin-top: 15px;">
                            <button class="ai-action-btn" onclick="showNearbyPropertiesList()" style="background: var(--primary); color: white; border: none; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.3);">📍 실시간 내 주변 매물 리스트업 하기</button>
                         </div>`;
        }

        let aiResponse = geminiText + appendedCardHtml;
        
        // Remove typing indicator
        const tDiv = document.getElementById(typingId);
        if(tDiv) tDiv.remove();

        addMessageToChat(aiResponse, 'ai');
        
        // Show suggestions again if needed
        if (suggestionChips) {
            setTimeout(() => {
                suggestionChips.style.display = 'flex';
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 1000);
        }
    }

    // Call the async handler
    handleAsync().catch(err => console.error(err));
}

// Bind Events
if (chatSendBtn) {
    chatSendBtn.addEventListener('click', () => {
        handleUserMessage(chatInput.value);
    });
}

if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserMessage(chatInput.value);
        }
    });
}

// Global function for suggestion chips (populates input, doesn't auto-send)
window.fillInput = function(msg) {
    if (chatInput) {
        chatInput.value = msg;
        chatInput.focus();
    }
};

// 마우스 휠로 추천 칩 가로 스크롤 허용
if (suggestionChips) {
    suggestionChips.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
            e.preventDefault(); // 기본 세로 스크롤 방지
            suggestionChips.scrollLeft += e.deltaY; // 세로 휠을 가로 스크롤로 변환
        }
    });
}

window.showNearbyPropertiesList = function() {
    // 1. Show AI typing indicator
    const typingId = 'typing-' + Date.now();
    const typingHtml = `
        <div class="chat-bubble" style="background: transparent; border: none; box-shadow: none; padding: 0;">
            <div class="typing-indicator">
                GPS 위치 권한을 확인하고 주변 매물을 탐색 중입니다... <span></span><span></span><span></span>
            </div>
        </div>
    `;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message ai';
    typingDiv.id = typingId;
    typingDiv.innerHTML = typingHtml;
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // 2. Fetch Geolocation
    if (!navigator.geolocation) {
        finishPropertySearch(typingId, false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            finishPropertySearch(typingId, true, position);
        },
        (error) => {
            finishPropertySearch(typingId, false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
};

function finishPropertySearch(typingId, success, position = null) {
    const tDiv = document.getElementById(typingId);
    if(tDiv) tDiv.remove();

    // 로컬 환경(file://) 등에서 권한이나 HTTPS 문제로 GPS가 실패할 경우 조용히 강남역 좌표로 모킹
    if (!success || !position) {
        position = { coords: { latitude: 37.4979, longitude: 127.0276 } };
    }

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const naverUrl = `https://new.land.naver.com/rooms?lat=${lat}&lon=${lng}&z=16`;
    
    const aiResponse = "📍 **내 위치 확인 완료!** 현재 계신 곳 반경 1km 내외의 추천 매물을 찾았습니다!<br>아래 카드를 클릭하시면 **네이버 부동산(Npay)** 앱/웹이 열리며 사용자님 주변 지도가 바로 표시됩니다.<br>" +
        `<div style="display:flex; flex-direction:column; gap:0.8rem; margin-top:1rem;">
            <!-- 매물 1 -->
            <div onclick="window.open('${naverUrl}', '_blank')" style="background:white; padding:1rem; border-radius:12px; border:1px solid var(--border); box-shadow:0 2px 4px rgba(0,0,0,0.05); cursor:pointer; transition:transform 0.2s;" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="font-weight:700; color:var(--text-main); font-size:1rem;">현재 위치 반경 500m 쉐어하우스</span>
                    <span style="color:var(--primary); font-weight:800; font-size:1.1rem;">월 35~40만</span>
                </div>
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">초기 자금 부담 적음 | 풀옵션 선별</div>
                <div style="font-size:0.8rem; color:#03c75a; font-weight:700;"><i class="fa-solid fa-location-dot"></i> Npay 부동산에서 내 주변 매물 보기</div>
            </div>
            <!-- 매물 2 -->
            <div onclick="window.open('${naverUrl}', '_blank')" style="background:white; padding:1rem; border-radius:12px; border:1px solid var(--border); box-shadow:0 2px 4px rgba(0,0,0,0.05); cursor:pointer; transition:transform 0.2s;" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="font-weight:700; color:var(--text-main); font-size:1rem;">버팀목 대출 가능 안심 원룸</span>
                    <span style="color:var(--primary); font-weight:800; font-size:1.1rem;">월 45~50만</span>
                </div>
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">전세/반전세 | 관리비 저렴한 곳</div>
                <div style="font-size:0.8rem; color:#03c75a; font-weight:700;"><i class="fa-solid fa-location-dot"></i> Npay 부동산에서 내 주변 매물 보기</div>
            </div>
        </div>`;

    addMessageToChat(aiResponse, 'ai');
}

// --- Calendar Modal Logic ---
const challengeStatusBtn = document.getElementById('challenge-status-btn');
const calendarModal = document.getElementById('calendar-modal');
const calendarCloseBtn = document.getElementById('calendar-close-btn');
const calendarGrid = document.querySelector('.calendar-grid');

function initCalendar() {
    if (!calendarGrid) return;
    calendarGrid.innerHTML = '';
    // 30일치 모의 데이터 생성
    for (let i = 1; i <= 30; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'cal-day';
        dayDiv.innerText = i;
        // 연속 3일 달성했으므로 1~3일째에 스탬프 표시
        if (i <= 3) {
            dayDiv.classList.add('stamped');
        }
        calendarGrid.appendChild(dayDiv);
    }
}

if (challengeStatusBtn) {
    challengeStatusBtn.addEventListener('click', () => {
        initCalendar();
        calendarModal.classList.remove('hidden');
    });
}

if (calendarCloseBtn) {
    calendarCloseBtn.addEventListener('click', () => {
        calendarModal.classList.add('hidden');
    });
}

// 모달 바깥부분 클릭 시 닫기
window.addEventListener('click', (e) => {
    if (e.target === calendarModal) {
        calendarModal.classList.add('hidden');
    }
});

// --- Settings Logic ---
// (도움말 및 문의하기 기능은 HTML 내 인라인 onclick 알림으로 처리됨)
const resetAccountBtn = document.getElementById('reset-account-btn');
if (resetAccountBtn) {
    resetAccountBtn.addEventListener('click', () => {
        if (!currentUser) return;
        
        const isConfirm = confirm("⚠️ 경고! 현재 접속하신 계정의 모든 짠테크 포인트와 레벨 기록이 0으로 초기화됩니다.\n\n정말로 모든 기록을 지우시겠습니까? (이 작업은 되돌릴 수 없습니다!)");
        
        if (isConfirm) {
            // DB에서 해당 UID 자체를 완전히 삭제 (비밀번호, 포인트 등 모든 기록 제거)
            const db = loadUsersDB();
            if (db[currentUser]) {
                delete db[currentUser];
                localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
            }

            // 로그아웃 과정에서 다시 저장되지 않도록 현재 유저 변수 비우기
            currentUser = null;
            
            alert("계정 정보(비밀번호 및 모든 진행 기록)가 영구적으로 삭제되었습니다. 시작 화면으로 돌아갑니다.");
            
            // 화면 전환 및 UI 초기화를 위해 로그아웃 처리
            logoutBtn.click();
        }
    });
}

// --- News Filter Logic ---
const newsData = [
    {
        city: 'all_only',
        tag: '🌐 전국 공통 / 경제동향',
        tagStyle: 'background:#fce7f3; color:#be185d;',
        title: "한국은행, 5월 기준금리 동결 전망... 고물가 장기화 여파",
        description: '최근 소비자물가 상승세가 꺾이지 않으면서 한국은행이 이달 말 예정된 금융통화위원회에서 기준금리를 현행 수준으로 동결할 가능성이 커졌습니다. (2026년 5월 10일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%ED%95%9C%EA%B5%AD%EC%9D%80%ED%96%89+%EA%B8%B0%EC%A4%80%EA%B8%88%EB%A6%AC+%EB%8F%99%EA%B2%B0',
        linkText: '관련 뉴스 보러가기'
    },
    {
        city: 'seoul',
        tag: '📍 서울 / 재무상담',
        tagStyle: 'background:#e0f2fe; color:#0284c7;',
        title: "서울시 '2026 리(Re)테크' 본격 추진... 시민 재무설계 돕는다",
        description: '서울시는 고금리 상황 속에서 시민들의 안정적인 자산관리와 은퇴 설계를 돕기 위해 무료 경제교육 및 1:1 맞춤형 재무상담 프로그램을 본격적으로 시작했습니다. (2026년 4월 8일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EC%84%9C%EC%9A%B8%EC%8B%9C+%EB%A6%AC%ED%85%8C%ED%81%AC+%EC%9E%AC%EB%AC%B4%EC%83%81%EB%8B%B4',
        linkText: '관련 뉴스 보러가기'
    },
    {
        city: 'busan',
        tag: '📍 부산 / 지역경제',
        tagStyle: 'background:#fef08a; color:#854d0e;',
        title: "부산 제조업 5월 체감경기 하락... 비제조업은 관광객 유입으로 '회복세'",
        description: '부산 지역의 제조업 체감경기(CBSI)가 원자재 가격 상승 우려로 하락한 반면, 건설 공사 및 관광객 유입의 영향으로 비제조업은 회복세를 보이고 있습니다. (2026년 4월 말 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EB%B6%80%EC%82%B0+%EC%A0%9C%EC%A1%B0%EC%97%85+%EC%B2%B4%EA%B0%90%EA%B2%BD%EA%B8%B0',
        linkText: '관련 뉴스 보러가기'
    },
    {
        city: 'incheon',
        tag: '📍 인천 / 금융지원',
        tagStyle: 'background:#dcfce7; color:#166534;',
        title: "인천시, 소상공인 경영안정자금 100억원 추가 지원 결정",
        description: '인천시는 지역 경제 활성화를 위해 관내 소상공인을 대상으로 한 경영안정자금 100억 원을 5월부터 추가로 융자 지원하기로 했습니다. 금리 부담을 낮추는 혜택이 포함됩니다. (2026년 5월 2일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EC%9D%B8%EC%B2%9C%EC%8B%9C+%EC%86%8C%EC%83%81%EA%B3%B5%EC%9D%B8+%EA%B2%BD%EC%98%81%EC%95%88%EC%A0%95%EC%9E%90%EA%B8%88',
        linkText: '관련 뉴스 보러가기'
    },
    {
        city: 'daegu',
        tag: '📍 대구 / 부동산금융',
        tagStyle: 'background:#ffedd5; color:#c2410c;',
        title: "대구 수성구 아파트 매매가 바닥론 고개... 주담대 금리 변동에 촉각",
        description: '대구 지역 아파트 매매 거래량이 소폭 반등하며 바닥론이 조심스럽게 제기되는 가운데, 시중은행의 주택담보대출 금리 변동이 향후 주요 변수가 될 전망입니다. (2026년 4월 25일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EB%8C%80%EA%B5%AC+%EC%95%84%ED%8C%8C%ED%8A%B8+%EB%A7%A4%EB%A7%A4%EA%B0%80+%EC%A3%BC%EB%8B%B4%EB%8C%80',
        linkText: '관련 뉴스 보러가기'
    },
    {
        city: 'daejeon',
        tag: '📍 대전 / 투자·스타트업',
        tagStyle: 'background:#fce7f3; color:#be185d;',
        title: "대전 대덕특구 벤처기업, 5월 대규모 벤처캐피탈(VC) 투자유치 릴레이",
        description: '대전 지역의 딥테크 및 핀테크 기반 벤처기업들이 연이어 수도권 대형 벤처캐피탈로부터 수백억 원 규모의 시리즈 투자를 유치하며 자금 조달에 성공하고 있습니다. (2026년 5월 8일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EB%8C%80%EC%A0%84+%EB%8C%80%EB%8D%95%ED%8A%B9%EA%B5%AC+%EB%B2%A4%EC%B2%98%EA%B8%B0%EC%97%85+%ED%88%AC%EC%9E%90',
        linkText: '관련 뉴스 보러가기'
    },
    {
        city: 'gwangju',
        tag: '📍 광주 / 지역화폐',
        tagStyle: 'background:#f3e8ff; color:#7e22ce;',
        title: "광주상생카드(지역화폐), 5월 가정의 달 맞아 10% 특별 할인 재개",
        description: '광주광역시는 고물가로 인한 시민들의 재무적 부담을 덜고 골목상권 소비를 촉진하기 위해 5월 한 달간 광주상생카드 할인율을 10%로 상향 조정했습니다. (2026년 4월 29일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EA%B4%91%EC%A3%BC%EC%83%83%EC%83%9D%EC%B9%B4%EB%93%9C+10%25+%ED%95%A0%EC%9D%B8',
        linkText: '관련 뉴스 보러가기'
    }
];

const newsFeedContainer = document.getElementById('news-feed-container');

function renderNews(filterCity = 'all') {
    if (!newsFeedContainer) return;
    newsFeedContainer.innerHTML = ''; // 기존 뉴스 비우기

    const newsToRender = newsData.filter(news => filterCity === 'all' || news.city === filterCity || (filterCity !== 'all' && news.city === 'all_only'));

    newsToRender.forEach(news => {
        const card = document.createElement('article');
        card.className = 'news-card';
        card.style.cursor = 'pointer';
        card.onclick = () => window.open(news.link, '_blank');
        card.innerHTML = `
            <div class="news-tag highlight" style="${news.tagStyle}">${news.tag}</div>
            <h3>${news.title}</h3>
            <p>${news.description}</p>
            <span class="news-date" style="color: #0284c7; font-weight: 600;">${news.linkText}</span>
        `;
        newsFeedContainer.appendChild(card);
    });
}

window.filterNews = function (city) {
    renderNews(city);
};

// 초기 뉴스 렌더링
renderNews();

// --- Reset Password / CAPTCHA Logic ---
const openResetModalBtn = document.getElementById('open-reset-modal');
const resetModal = document.getElementById('reset-modal');
const resetCloseBtn = document.getElementById('reset-close-btn');
const resetUidInput = document.getElementById('reset-uid');
const captchaQuestionDiv = document.getElementById('captcha-question');
const resetCaptchaInput = document.getElementById('reset-captcha');
const resetNewPasswordInput = document.getElementById('reset-new-password');
const resetPasswordErrorDiv = document.getElementById('reset-password-error');
const resetBtn = document.getElementById('reset-btn');

if (resetNewPasswordInput) {
    resetNewPasswordInput.addEventListener('input', () => {
        if (resetPasswordErrorDiv) resetPasswordErrorDiv.style.display = 'none';
    });
}

let currentCaptchaAnswer = 0;

function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 9) + 1; // 1~9
    const num2 = Math.floor(Math.random() * 9) + 1; // 1~9
    currentCaptchaAnswer = num1 + num2;
    captchaQuestionDiv.innerText = `${num1} + ${num2} = ?`;
    resetCaptchaInput.value = '';
    resetUidInput.value = '';
    resetNewPasswordInput.value = '';
}

if (openResetModalBtn) {
    openResetModalBtn.addEventListener('click', () => {
        generateCaptcha();
        resetModal.classList.remove('hidden');
    });
}

if (resetCloseBtn) {
    resetCloseBtn.addEventListener('click', () => {
        resetModal.classList.add('hidden');
    });
}

if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        const uid = resetUidInput.value.trim();
        const captchaAns = parseInt(resetCaptchaInput.value.trim());
        const newPwd = resetNewPasswordInput.value.trim();

        if (!uid || isNaN(captchaAns) || !newPwd) {
            alert("모든 빈칸을 채워주세요!");
            return;
        }

        if (captchaAns !== currentCaptchaAnswer) {
            alert("자동가입 방지(수학 문제) 정답이 틀렸습니다. 다시 시도해주세요.");
            generateCaptcha();
            return;
        }

        if (resetPasswordErrorDiv) resetPasswordErrorDiv.style.display = 'none';
        if (!validatePassword(newPwd)) {
            if (resetPasswordErrorDiv) resetPasswordErrorDiv.style.display = 'block';
            return;
        }

        const db = loadUsersDB();
        if (!db[uid]) {
            alert("해당 아이디(UID)로 가입된 계정이 없습니다.");
            return;
        }

        // 비밀번호 업데이트
        db[uid].password = newPwd;
        localStorage.setItem(USER_DB_KEY, JSON.stringify(db));

        alert(`'${uid}' 계정의 비밀번호가 성공적으로 초기화되었습니다! 이제 새 비밀번호로 시작하기를 눌러주세요.`);
        resetModal.classList.add('hidden');
    });
}
