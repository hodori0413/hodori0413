// EmailJS 개발자 설정 (이곳에 한 번만 입력해 두면 실제 이메일 발송이 활성화됩니다)
const EMAILJS_DEV_CONFIG = {
    serviceId: "YOUR_SERVICE_ID",   // EmailJS 서비스 ID
    templateId: "YOUR_TEMPLATE_ID", // EmailJS 템플릿 ID
    publicKey: "YOUR_PUBLIC_KEY"    // EmailJS 공개 키
};

// 최초 로드시 EmailJS 초기화
if (EMAILJS_DEV_CONFIG.publicKey && 
    EMAILJS_DEV_CONFIG.publicKey !== "YOUR_PUBLIC_KEY" && 
    window.emailjs) {
    window.emailjs.init({ publicKey: EMAILJS_DEV_CONFIG.publicKey });
}

// Supabase 설정 키 및 클라이언트 변수
const SUPABASE_URL_KEY = 'SUPABASE_URL_LOCAL';
const SUPABASE_ANON_KEY_KEY = 'SUPABASE_ANON_KEY_LOCAL';
let supabaseClient = null;

function initSupabase() {
    let url = localStorage.getItem(SUPABASE_URL_KEY) || 'https://itcnwqcesnqczycujuho.supabase.co';
    const key = localStorage.getItem(SUPABASE_ANON_KEY_KEY) || 'sb_publishable_GAixpDEKhirlOPHyjx2j9A_mHPP7q12';
    if (url && key && window.supabase) {
        // /rest/v1/ 이 포함되어 있다면 제거하여 Base URL만 추출
        url = url.trim();
        if (url.endsWith('/rest/v1/')) {
            url = url.substring(0, url.length - 9);
        } else if (url.endsWith('/rest/v1')) {
            url = url.substring(0, url.length - 8);
        }
        try {
            supabaseClient = window.supabase.createClient(url, key);
            console.log("Supabase Client initialized successfully!");
            return true;
        } catch (e) {
            console.error("Failed to initialize Supabase client:", e);
            supabaseClient = null;
            return false;
        }
    }
    supabaseClient = null;
    return false;
}

// 초기 로드 시 Supabase 클라이언트 초기화
initSupabase();

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


// Signup DOM Elements
const openSignupLink = document.getElementById('open-signup-link');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupPasswordErrorDiv = document.getElementById('signup-password-error');

// Nav Items and Tabs
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');



// Budget Elements
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
    resetDate: '1',
    expenses: []
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
async function saveUserProgress() {
    if (!currentUser) return;
    
    // 로컬 DB 업데이트 (폴백 및 오프라인 상태 대비)
    const db = loadUsersDB();
    if (!db[currentUser]) {
        db[currentUser] = {};
    }
    db[currentUser].totalPoints = totalPoints;
    db[currentUser].progressPoints = progressPoints;
    db[currentUser].currentLevel = currentLevel;
    db[currentUser].budgetData = budgetData; // budgetData도 함께 저장
    localStorage.setItem(USER_DB_KEY, JSON.stringify(db));

    // Supabase 클라우드 DB 동기화
    if (supabaseClient) {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && session.user) {
                const { error } = await supabaseClient
                    .from('user_profiles')
                    .upsert({
                        id: session.user.id,
                        username: currentUser,
                        total_points: totalPoints,
                        progress_points: progressPoints,
                        current_level: currentLevel,
                        budget_data: budgetData,
                        updated_at: new Date().toISOString()
                    });
                if (error) {
                    console.error("Failed to sync progress to Supabase user_profiles:", error);
                } else {
                    console.log("Successfully synced progress to Supabase cloud!");
                }
            }
        } catch (e) {
            console.error("Failed to execute sync to Supabase:", e);
        }
    }
}

function addPoints(pts) {
    totalPoints += pts;
    progressPoints += pts;
    if (userPoints) userPoints.innerText = totalPoints.toLocaleString();

    let leveledUp = false;
    let requiredForNext = currentLevel * 1000;

    while (progressPoints >= requiredForNext) {
        progressPoints -= requiredForNext;
        currentLevel++;
        requiredForNext = currentLevel * 1000;
        leveledUp = true;
    }

    if (leveledUp) {
        const utEl = document.getElementById('user-tier');
        if (utEl) utEl.innerText = `씨앗 등급 (Lv.${currentLevel})`;
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

    if (pointProgressBar) {
        pointProgressBar.style.transition = "width 0.5s ease-in-out";
        pointProgressBar.style.width = percentage + "%";
    }

    let remaining = requiredForNext - progressPoints;
    if (pointProgressText) {
        pointProgressText.innerText = `다음 Lv.${currentLevel + 1} 등급까지 ${remaining}P 남았어요!`;
    }
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

function loginUser(name, dbRecord) {
    currentUser = name;

    // Set UI
    userNameDisplay.innerText = name;
    totalPoints = dbRecord.totalPoints || 0;
    progressPoints = dbRecord.progressPoints || 0;
    currentLevel = dbRecord.currentLevel || 1;
    
    // 예산 데이터 불러오기
    if (dbRecord.budgetData) {
        budgetData = dbRecord.budgetData;
        if (!budgetData.expenses) {
            budgetData.expenses = [];
        }
    } else {
        budgetData = {
            totalBudget: 500000,
            totalSpent: 0,
            categories: [
                { id: 'housing', name: '주거비', limit: 200000, spent: 0 },
                { id: 'food', name: '식비/카페', limit: 150000, spent: 0 },
                { id: 'transport', name: '교통비', limit: 50000, spent: 0 },
                { id: 'shopping', name: '쇼핑', limit: 50000, spent: 0 },
                { id: 'others', name: '기타', limit: 50000, spent: 0 }
            ],
            resetDate: '1',
            expenses: []
        };
    }
    renderBudgetOverview();

    if (userPoints) userPoints.innerText = totalPoints.toLocaleString();
    const utEl = document.getElementById('user-tier');
    if (utEl) utEl.innerText = `씨앗 등급 (Lv.${currentLevel})`;
    updateProgress();

    // Transition Screens
    loginScreen.classList.remove('active');
    loginScreen.classList.add('hidden');

    setTimeout(() => {
        mainApp.classList.remove('hidden');
        mainApp.classList.add('active');
    }, 300);
}

// 회원가입 모달 엘리먼트 및 상태
const signupModal = document.getElementById('signup-modal');
const signupCloseBtn = document.getElementById('signup-close-btn');
const signupCompleteBtn = document.getElementById('signup-complete-btn');

function openSignupModal(emailVal = '', pwd = '') {
    if (signupEmailInput) signupEmailInput.value = emailVal;
    if (signupPasswordInput) signupPasswordInput.value = pwd;
    if (signupPasswordErrorDiv) signupPasswordErrorDiv.style.display = 'none';
    if (signupModal) signupModal.classList.remove('hidden');
}

if (openSignupLink) {
    openSignupLink.addEventListener('click', () => {
        openSignupModal(usernameInput.value.trim(), passwordInput.value.trim());
    });
}

if (signupCloseBtn) {
    signupCloseBtn.addEventListener('click', () => {
        if (signupModal) signupModal.classList.add('hidden');
    });
}

if (signupCompleteBtn) {
    signupCompleteBtn.addEventListener('click', async () => {
        const email = signupEmailInput.value.trim();
        const pwd = signupPasswordInput.value.trim();
        const username = email ? email.split('@')[0] : '';

        if (!email || !pwd) {
            alert("모든 가입 정보를 올바르게 입력해주세요!");
            return;
        }

        // 간단한 이메일 형식 체크
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("올바른 이메일 주소 형식이 아닙니다.");
            return;
        }

        // 비밀번호 강도 검사
        if (signupPasswordErrorDiv) signupPasswordErrorDiv.style.display = 'none';
        if (!validatePassword(pwd)) {
            if (signupPasswordErrorDiv) signupPasswordErrorDiv.style.display = 'block';
            return;
        }

        // Supabase 모드 회원가입
        if (supabaseClient) {
            signupCompleteBtn.disabled = true;
            signupCompleteBtn.innerText = "계정 생성 중...";
            
            try {
                const { data, error } = await supabaseClient.auth.signUp({
                    email: email,
                    password: pwd,
                    options: {
                        data: {
                            username: username
                        }
                    }
                });

                if (error) {
                    alert("Supabase 회원가입 에러: " + error.message);
                    return;
                }

                // user_profiles 테이블 직접 초기화 시도 (트리거 실패나 SQL 미설정 대비)
                if (data.user) {
                    try {
                        const defaultBudget = {
                            totalBudget: 500000,
                            totalSpent: 0,
                            categories: [
                                { id: 'housing', name: '주거비', limit: 200000, spent: 0 },
                                { id: 'food', name: '식비/카페', limit: 150000, spent: 0 },
                                { id: 'transport', name: '교통비', limit: 50000, spent: 0 },
                                { id: 'shopping', name: '쇼핑', limit: 50000, spent: 0 },
                                { id: 'others', name: '기타', limit: 50000, spent: 0 }
                            ],
                            resetDate: '1',
                            expenses: []
                        };
                        await supabaseClient.from('user_profiles').upsert({
                            id: data.user.id,
                            username: username,
                            total_points: 0,
                            progress_points: 0,
                            current_level: 1,
                            budget_data: defaultBudget,
                            updated_at: new Date().toISOString()
                        });
                    } catch (profileErr) {
                        console.warn("Direct profile creation failed. Relying on fallback.", profileErr);
                    }
                }

                alert('회원가입이 완료되었습니다! 이제 가입하신 정보로 자동 로그인합니다.');
                if (signupModal) signupModal.classList.add('hidden');
                
                // 로그인 화면 입력창 초기화
                usernameInput.value = '';
                passwordInput.value = '';

                // 로컬 정보 저장
                const db = loadUsersDB();
                db[email] = {
                    password: pwd,
                    email: email,
                    totalPoints: 0,
                    progressPoints: 0,
                    currentLevel: 1,
                    budgetData: null
                };
                localStorage.setItem(USER_DB_KEY, JSON.stringify(db));

                const dbRecord = {
                    totalPoints: 0,
                    progressPoints: 0,
                    currentLevel: 1,
                    budgetData: null,
                    email: email
                };
                loginUser(username, dbRecord);
            } catch (err) {
                console.error(err);
                alert("회원가입 중 알 수 없는 에러가 발생했습니다: " + err.message);
            } finally {
                signupCompleteBtn.disabled = false;
                signupCompleteBtn.innerText = "계정 생성 및 시작하기";
            }
        } else {
            // 로컬 모드 회원가입
            const db = loadUsersDB();
            if (db[email]) {
                alert("이미 존재하는 이메일입니다.");
                return;
            }
            db[email] = {
                password: pwd,
                email: email,
                totalPoints: 0,
                progressPoints: 0,
                currentLevel: 1,
                budgetData: {
                    totalBudget: 500000,
                    totalSpent: 0,
                    categories: [
                        { id: 'housing', name: '주거비', limit: 200000, spent: 0 },
                        { id: 'food', name: '식비/카페', limit: 150000, spent: 0 },
                        { id: 'transport', name: '교통비', limit: 50000, spent: 0 },
                        { id: 'shopping', name: '쇼핑', limit: 50000, spent: 0 },
                        { id: 'others', name: '기타', limit: 50000, spent: 0 }
                    ],
                    resetDate: '1',
                    expenses: []
                }
            };
            localStorage.setItem(USER_DB_KEY, JSON.stringify(db));

            alert('계정이 성공적으로 생성되었습니다! (로컬 모드)');
            if (signupModal) signupModal.classList.add('hidden');

            loginUser(username, db[email]);
        }
    });
}

loginBtn.addEventListener('click', async () => {
    if (passwordErrorDiv) passwordErrorDiv.style.display = 'none';
    
    const name = usernameInput.value.trim();
    const pwd = passwordInput.value.trim();

    if (name.length === 0 || pwd.length === 0) {
        alert("이메일과 비밀번호를 모두 입력해주세요!");
        return;
    }

    if (supabaseClient) {
        loginBtn.disabled = true;
        loginBtn.innerText = "로그인 중...";
        
        try {
            let email = name;
            if (!name.includes('@')) {
                const db = loadUsersDB();
                if (db[name] && db[name].email) {
                    email = db[name].email;
                } else {
                    console.log("No local username-to-email mapping found.");
                }
            }

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: pwd
            });

            if (error) {
                alert("로그인 실패: " + error.message);
                loginBtn.disabled = false;
                loginBtn.innerText = "시작하기";
                return;
            }

            let dbRecord = {
                totalPoints: 0,
                progressPoints: 0,
                currentLevel: 1,
                budgetData: null,
                email: email
            };

            let username = name;

            try {
                const { data: profile, error: profileErr } = await supabaseClient
                    .from('user_profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profileErr) {
                    console.warn("Could not load user profile from Supabase table.", profileErr);
                    const db = loadUsersDB();
                    const backup = db[name] || db[email] || {};
                    dbRecord.totalPoints = backup.totalPoints || 0;
                    dbRecord.progressPoints = backup.progressPoints || 0;
                    dbRecord.currentLevel = backup.currentLevel || 1;
                    dbRecord.budgetData = backup.budgetData || null;
                    username = backup.username || data.user.user_metadata?.username || name;
                } else if (profile) {
                    dbRecord.totalPoints = profile.total_points || 0;
                    dbRecord.progressPoints = profile.progress_points || 0;
                    dbRecord.currentLevel = profile.current_level || 1;
                    dbRecord.budgetData = profile.budget_data || null;
                    username = profile.username || data.user.user_metadata?.username || name;
                }
            } catch (profileErr) {
                console.error("Database fetch error, using local fallback:", profileErr);
                const db = loadUsersDB();
                const backup = db[name] || db[email] || {};
                dbRecord.totalPoints = backup.totalPoints || 0;
                dbRecord.progressPoints = backup.progressPoints || 0;
                dbRecord.currentLevel = backup.currentLevel || 1;
                dbRecord.budgetData = backup.budgetData || null;
            }

            alert(`환영합니다, ${username}님! 클라우드 세션을 연결했습니다.`);
            loginUser(username, dbRecord);

        } catch (err) {
            console.error("Auth error:", err);
            alert("로그인 중 서버 연결 에러가 발생했습니다.");
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerText = "시작하기";
        }
    } else {
        const db = loadUsersDB();

        if (db[name]) {
            if (db[name].password !== pwd) {
                alert("비밀번호가 일치하지 않습니다.");
                return;
            }
            alert(`환영합니다, ${name}님! (로컬 모드)`);
            loginUser(name, db[name]);
        } else {
            if (!validatePassword(pwd)) {
                if (passwordErrorDiv) passwordErrorDiv.style.display = 'block';
                return;
            }
            openSignupModal(name, pwd);
        }
    }
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
    
    // This month comparison updates
    const thisMonthAmount = document.getElementById('this-month-amount');
    const thisMonthProgressBar = document.getElementById('this-month-progress-bar');
    const budgetComparisonBadge = document.getElementById('budget-comparison-badge');

    const lastMonthSpent = 420000;

    if (thisMonthAmount) {
        thisMonthAmount.innerText = `${totalSpent.toLocaleString()}원`;
    }

    if (thisMonthProgressBar) {
        const comparePercent = Math.min(100, Math.round((totalSpent / lastMonthSpent) * 100));
        thisMonthProgressBar.style.width = comparePercent + '%';
        
        if (totalSpent > lastMonthSpent) {
            thisMonthProgressBar.style.background = 'linear-gradient(90deg, #f87171, #ef4444)'; // Red gradient if exceeding last month
        } else {
            thisMonthProgressBar.style.background = 'linear-gradient(90deg, var(--primary-light), var(--primary))'; // Default sky blue
        }
    }

    if (budgetComparisonBadge) {
        if (totalSpent < lastMonthSpent) {
            const diff = lastMonthSpent - totalSpent;
            budgetComparisonBadge.innerText = `지난달 대비 ${diff.toLocaleString()}원 절약 중! 🌿`;
            budgetComparisonBadge.style.background = '#dcfce7';
            budgetComparisonBadge.style.color = '#15803d';
        } else if (totalSpent === lastMonthSpent) {
            budgetComparisonBadge.innerText = `지난달과 소비액 동일`;
            budgetComparisonBadge.style.background = '#e2e8f0';
            budgetComparisonBadge.style.color = '#475569';
        } else {
            const diff = totalSpent - lastMonthSpent;
            budgetComparisonBadge.innerText = `지난달 대비 ${diff.toLocaleString()}원 초과 지출! ⚠️`;
            budgetComparisonBadge.style.background = '#fee2e2';
            budgetComparisonBadge.style.color = '#991b1b';
        }
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

    // Render Expenses List
    const expenseHistoryList = document.getElementById('expense-history-list');
    const expenseCountSpan = document.getElementById('expense-count');
    const emptyHistoryText = document.getElementById('empty-history-text');

    if (expenseHistoryList) {
        expenseHistoryList.innerHTML = '';
        const expenses = budgetData.expenses || [];
        
        if (expenseCountSpan) {
            expenseCountSpan.innerText = `${expenses.length}건`;
        }

        if (expenses.length === 0) {
            if (emptyHistoryText) {
                expenseHistoryList.appendChild(emptyHistoryText);
                emptyHistoryText.style.display = 'block';
            } else {
                expenseHistoryList.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;" id="empty-history-text">등록된 지출 내역이 없습니다.</p>`;
            }
        } else {
            const sortedExpenses = [...expenses].reverse();
            
            sortedExpenses.forEach(exp => {
                const item = document.createElement('div');
                item.style.display = 'flex';
                item.style.justify = 'space-between';
                item.style.alignItems = 'center';
                item.style.background = '#f8fafc';
                item.style.padding = '0.8rem 1rem';
                item.style.borderRadius = '12px';
                item.style.border = '1px solid var(--border)';
                
                let badgeColor = '#e0f2fe';
                let badgeText = '#0369a1';
                if (exp.category === 'housing') { badgeColor = '#ffedd5'; badgeText = '#c2410c'; }
                else if (exp.category === 'food') { badgeColor = '#fef9c3'; badgeText = '#854d0e'; }
                else if (exp.category === 'transport') { badgeColor = '#dcfce7'; badgeText = '#15803d'; }
                else if (exp.category === 'shopping') { badgeColor = '#f3e8ff'; badgeText = '#7e22ce'; }
                
                item.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.75rem; font-weight: bold; background: ${badgeColor}; color: ${badgeText}; padding: 0.2rem 0.5rem; border-radius: 6px;">${exp.categoryName}</span>
                        <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${exp.title}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 700; font-size: 0.9rem; color: var(--primary);">${Number(exp.amount).toLocaleString()}원</span>
                        <button onclick="deleteExpense('${exp.id}')" style="background: none; border: none; color: var(--danger); cursor: pointer; padding: 2px 5px;"><i class="fa-solid fa-trash-can" style="font-size: 0.85rem;"></i></button>
                    </div>
                `;
                expenseHistoryList.appendChild(item);
            });
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


// --- Manual Expense Logging Logic ---
const expenseCategorySelect = document.getElementById('expense-category');
const expenseTitleInput = document.getElementById('expense-title');
const expenseAmountInput = document.getElementById('expense-amount');
const btnAddExpense = document.getElementById('btn-add-expense');

if (btnAddExpense) {
    btnAddExpense.addEventListener('click', () => {
        if (!currentUser) {
            alert("로그인 후 지출 기입이 가능합니다.");
            return;
        }

        const categoryId = expenseCategorySelect.value;
        const title = expenseTitleInput.value.trim();
        const amount = parseInt(expenseAmountInput.value.trim());

        if (!title || isNaN(amount) || amount <= 0) {
            alert("지출 내용과 올바른 금액을 기입해주세요!");
            return;
        }

        const category = budgetData.categories.find(c => c.id === categoryId);
        if (!category) {
            alert("올바르지 않은 카테고리입니다.");
            return;
        }

        // Add to category spent
        category.spent += amount;

        // Add to expenses history
        if (!budgetData.expenses) {
            budgetData.expenses = [];
        }

        const newExpense = {
            id: 'exp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            category: categoryId,
            categoryName: category.name,
            title: title,
            amount: amount,
            date: new Date().toISOString()
        };

        budgetData.expenses.push(newExpense);

        // Reset input fields
        expenseTitleInput.value = '';
        expenseAmountInput.value = '';

        // Save progress, update points, and render
        saveUserProgress();
        renderBudgetOverview();
        

    });
}

// Global function for deleting expense
window.deleteExpense = function(id) {
    if (!budgetData.expenses) return;
    
    // Find index
    const index = budgetData.expenses.findIndex(exp => exp.id === id);
    if (index === -1) return;
    
    const exp = budgetData.expenses[index];
    
    // Deduct from category spent
    const category = budgetData.categories.find(c => c.id === exp.category);
    if (category) {
        category.spent = Math.max(0, category.spent - exp.amount);
    }
    
    // Remove from array
    budgetData.expenses.splice(index, 1);
    
    // Save and re-render
    saveUserProgress();
    renderBudgetOverview();
};

// 초기화 시 렌더링
renderBudgetOverview();

// --- Logout Logic ---
logoutBtn.addEventListener('click', () => {
    // 로그아웃 시 현재 상태 한 번 더 저장
    saveUserProgress();

    // 대화 기록 초기화
    geminiChatHistory = [];

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
        budgetData = {
            totalBudget: 500000,
            totalSpent: 0,
            categories: [
                { id: 'housing', name: '주거비', limit: 200000, spent: 0 },
                { id: 'food', name: '식비/카페', limit: 150000, spent: 0 },
                { id: 'transport', name: '교통비', limit: 50000, spent: 0 },
                { id: 'shopping', name: '쇼핑', limit: 50000, spent: 0 },
                { id: 'others', name: '기타', limit: 50000, spent: 0 }
            ],
            resetDate: '1',
            expenses: []
        };
        renderBudgetOverview();

        if (userPoints) userPoints.innerText = totalPoints.toLocaleString();
        const utEl = document.getElementById('user-tier');
        if (utEl) utEl.innerText = `씨앗 등급 (Lv.1)`;
        updateProgress();

        switchTab('dashboard');
        resetChallenge();
    }, 300);
});

// --- AI Coach Chat Logic ---








const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatContainer = document.getElementById('chat-container');
const suggestionChips = document.getElementById('suggestion-chips');

// ChatGPT style continuous conversation history (Gemini format)
let geminiChatHistory = [];

async function fetchGeminiResponse(userMessage) {
    // API 키는 백엔드(Vercel Serverless Function)에서 안전하게 관리합니다.
    const url = `/api/gemini`;
    
    const spentPercent = budgetData.totalBudget > 0 ? ((budgetData.totalSpent / budgetData.totalBudget) * 100).toFixed(1) : 0;
    const remaining = budgetData.totalBudget - budgetData.totalSpent;
    
    // Core coach persona (System Instruction)
    const systemInstruction = `너는 월지킴이 AI의 청년주거 자산 코치이다. 대학생들에게 든든하고 전문적인 코치로서 조언한다. 말투는 친근하지만 코치답게 차분하고 신뢰감 있게 유지한다. 재무, 주거, 생활비 관련 질문에는 전문적으로 답변하고, 일상 대화도 자연스럽게 받아준다.
현재 사용자의 이번 달 예산 현황 정보는 다음과 같다:
- 이번 달 총 예산: ${budgetData.totalBudget.toLocaleString()}원
- 현재 총 지출 금액: ${budgetData.totalSpent.toLocaleString()}원 (${spentPercent}% 사용 완료)
- 남은 예산: ${remaining.toLocaleString()}원
- 보유 자산: 3,000,000원 (가상 자산)
사용자가 주거나 재무 계획을 물어볼 때 이 수치들을 주시하고 분석하여 현실적이고 구체적인 조언을 제공해줘.`;

    // Append user message to the conversation history
    geminiChatHistory.push({
        role: "user",
        parts: [{ text: userMessage }]
    });

    // Limit history length to prevent huge payloads (e.g. keep last 20 messages)
    if (geminiChatHistory.length > 20) {
        geminiChatHistory = geminiChatHistory.slice(geminiChatHistory.length - 20);
    }

    const payload = {
        contents: geminiChatHistory,
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
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
            // If error, remove the last user message from history to prevent corrupt state
            geminiChatHistory.pop();
            return `앗, 제가 지금 생각 정리에 문제가 생겼어요. 😢<br><span style="font-size:0.8rem; color:var(--danger);">(API 오류: ${data.error.message || '알 수 없는 오류'})</span>`;
        }
        
        if (data.candidates && data.candidates[0].content) {
            let text = data.candidates[0].content.parts[0].text;
            
            // Append assistant response to history
            geminiChatHistory.push({
                role: "model",
                parts: [{ text: text }]
            });

            // Premium simple markdown parser
            // Bold
            text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            // Bullet points starting with * or -
            text = text.split('\n').map(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                    return `• ${trimmed.substring(2)}`;
                }
                return line;
            }).join('\n');
            // Newlines
            text = text.replace(/\n/g, '<br>');
            return text;
        }
        
        geminiChatHistory.pop();
        return "음, 무슨 말인지 잘 이해하지 못했어요. 다시 한번 말씀해주실래요?";
    } catch (e) {
        console.error("Fetch Error:", e);
        geminiChatHistory.pop();
        return "앗, 통신 상태가 좋지 않아서 연결이 끊어졌어요. 나중에 다시 시도해주세요! 😭";
    }
}

function addMessageToChat(text, sender) {
    if (!text.trim()) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    let html = `
        <div class="chat-bubble">${text}</div>
    `;
    
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
    if (e.target === signupModal) {
        if (signupModal) signupModal.classList.add('hidden');
    }
    if (e.target === resetModal) {
        closeResetModal();
    }
});

// --- Settings Logic ---
// (도움말 및 문의하기 기능은 HTML 내 인라인 onclick 알림으로 처리됨)
const resetAccountBtn = document.getElementById('reset-account-btn');
if (resetAccountBtn) {
    resetAccountBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        
        const isConfirm = confirm("⚠️ 경고! 현재 접속하신 계정의 모든 짠테크 포인트와 레벨 기록이 0으로 초기화됩니다.\n\n정말로 모든 기록을 지우시겠습니까? (이 작업은 되돌릴 수 없습니다!)");
        
        if (isConfirm) {
            // Supabase 연동 시 클라우드 프로필 삭제
            if (supabaseClient) {
                try {
                    const { data: { session } } = await supabaseClient.auth.getSession();
                    if (session && session.user) {
                        const { error } = await supabaseClient
                            .from('user_profiles')
                            .delete()
                            .eq('id', session.user.id);
                        if (error) {
                            console.error("Failed to delete user profile in Supabase:", error);
                        } else {
                            console.log("Successfully deleted user profile from Supabase cloud.");
                        }
                    }
                } catch (e) {
                    console.error("Supabase profile delete error:", e);
                }
            }

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
    // === [NEW] 2026 하반기 전국 공통 최신 금융 정책 뉴스 ===
    {
        city: 'new_all',
        isNew: true,
        tag: '🔥 [신규] 전국 / 주거지원',
        tagStyle: 'background:#eff6ff; color:#1d4ed8; border: 1px solid #bfdbfe;',
        title: "2026 하반기 청년 주거안정 대책 발표... LH 전세임대 공급 2배 확대",
        description: '국토교통부는 2026년 하반기 청년들의 보증금 마련 부담을 줄이기 위해 전세임대 주택 공급을 당초 계획보다 2배 늘리고, 버팀목 대출의 우대 금리 우대 한도를 대폭 상향하기로 최종 확정했습니다. (2026년 5월 26일 속보)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EC%B2%AD%EB%85%84+%EC%A3%BC%EA%B1%B0%EC%95%88%EC%A0%95+%EB%8C%80%EC%B1%85+%EC%A0%84%EC%84%B8%EC%9E%84%EB%8C%80',
        linkText: '정부 상세 대책 보러가기'
    },
    {
        city: 'new_all',
        isNew: true,
        tag: '🔥 [신규] 전국 / 자산형성',
        tagStyle: 'background:#f0fdf4; color:#15803d; border: 1px solid #bbf7d0;',
        title: "청년도약계좌 매칭 기여금 비율 상향... 목돈 마련 혜택 대폭 강화",
        description: '금융위원회는 일하는 청년들의 효율적인 자산 형성을 지원하기 위해 청년도약계좌의 매칭 정부 기여금 지급 비율을 확대 개편하여, 만기 시 수령 금액을 한층 더 높이기로 결정했습니다. (2026년 5월 24일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EC%B2%AD%EB%85%84%EB%8F%84%EC%95%BD%EA%B3%84%EC%A2%8C+%EA%B8%B0%EC%97%AC%EA%B8%88',
        linkText: '기여금 개편 뉴스 보러가기'
    },
    {
        city: 'new_all',
        isNew: true,
        tag: '🔥 [신규] 전국 / 금융 혜택',
        tagStyle: 'background:#fdf2f8; color:#be185d; border: 1px solid #fbcfe8;',
        title: "5대 시중은행, 실질 최고 연 7.5% 우대금리 청년 적금 동시 출시",
        description: '주요 시중은행들이 공동으로 사회초년생의 종잣돈 마련을 돕는 우대 적금 상품을 대거 론칭했습니다. 기본 금리에 급여 이체 및 주택청약 계좌 연동 시 연 최대 7.5%의 파격적 이자를 챙길 수 있습니다. (2026년 5월 21일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EC%8B%9C%EC%A4%91%EC%9D%80%ED%96%89+%EC%B2%AD%EB%85%84+%EC%A0%81%EA%B8%88+%EC%9A%B0%EB%8C%80',
        linkText: '은행별 특별 금리 비교'
    },
    // === [OLD] 이전 금융/부동산 뉴스 (지역 클릭 시 노출) ===
    {
        city: 'all_only',
        isNew: false,
        tag: '🌐 전국 공통 / 경제동향',
        tagStyle: 'background:#f1f5f9; color:#475569; border: 1px solid #cbd5e1;',
        title: "한국은행, 5월 기준금리 동결 전망... 고물가 장기화 여파",
        description: '최근 소비자물가 상승세가 꺾이지 않으면서 한국은행이 이달 말 예정된 금융통화위원회에서 기준금리를 현행 수준으로 동결할 가능성이 커졌습니다. (2026년 5월 10일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%ED%95%9C%EA%B5%AD%EC%9D%80%ED%96%89+%EA%B8%B0%EC%A4%80%EA%B8%88%EB%A6%AC+%EB%8F%99%EA%B2%B0',
        linkText: '금리 동결 뉴스 보러가기'
    },
    {
        city: 'seoul',
        isNew: false,
        tag: '📍 서울 / 재무상담',
        tagStyle: 'background:#e0f2fe; color:#0284c7; border: 1px solid #bae6fd;',
        title: "서울시 '2026 리(Re)테크' 본격 추진... 시민 재무설계 돕는다",
        description: '서울시는 고금리 상황 속에서 시민들의 안정적인 자산관리와 은퇴 설계를 돕기 위해 무료 경제교육 및 1:1 맞춤형 재무상담 프로그램을 본격적으로 시작했습니다. (2026년 4월 8일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EC%84%9C%EC%9A%B8%EC%8B%9C+%EB%A6%AC%ED%85%8C%ED%81%AC+%EC%9E%AC%EB%AC%B4%EC%83%81%EB%8B%B4',
        linkText: '서울시 리테크 뉴스 보러가기'
    },
    {
        city: 'seoul',
        isNew: false,
        tag: '📍 서울 / 주거안심',
        tagStyle: 'background:#e0f2fe; color:#0284c7; border: 1px solid #bae6fd;',
        title: "서울시 역세권 청년안심주택 공급기준 완화... 입주 기회 확대",
        description: '서울시가 역세권 청년안심주택의 소득 제한 기준을 완화하여 사회초년생의 입주 자격을 넓히고 맞춤형 주거비 보조 한도를 추가 증액하기로 결정했습니다. (2026년 5월 15일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EC%84%9C%EC%9A%B8%EC%8B%9C+%EC%B2%AD%EB%85%84+%EC%95%88%EC%8B%9C%EC%A3%BC%ED%83%9D',
        linkText: '안심주택 입주 안내'
    },
    {
        city: 'busan',
        isNew: false,
        tag: '📍 부산 / 지역경제',
        tagStyle: 'background:#fef08a; color:#854d0e; border: 1px solid #fef08a;',
        title: "부산 제조업 5월 체감경기 하락... 비제조업은 관광객 유입으로 '회복세'",
        description: '부산 지역의 제조업 체감경기(CBSI)가 원자재 가격 상승 우려로 하락한 반면, 건설 공사 및 관광객 유입의 영향으로 비제조업은 회복세를 보이고 있습니다. (2026년 4월 말 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EB%B6%80%EC%82%B0+%EC%A0%9C%EC%A1%B0%EC%97%85+%EC%B2%B4%EA%B0%90%EA%B2%BD%EA%B8%B0',
        linkText: '부산 체감경기 뉴스 보러가기'
    },
    {
        city: 'busan',
        isNew: false,
        tag: '📍 부산 / 월세지원',
        tagStyle: 'background:#fef08a; color:#854d0e; border: 1px solid #fef08a;',
        title: "부산시 청년 월세 특별지원 사업 2차 모집... 월 최대 20만원 지원",
        description: '부산광역시는 무주택 독립 청년들의 주거 안정을 돕기 위해 12개월간 매달 최대 20만 원의 월세를 현금 지원하는 2차 특별 지원 사업 모집 공고를 발표했습니다. (2026년 5월 12일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EB%B6%80%EC%82%B0%EC%8B%9C+%EC%B2%AD%EB%85%84+%EC%9B%94%EC%84%B8+%ED%8A%B9%EB%B3%84%EC%A7%80%EC%9B%90',
        linkText: '부산 월세 신청 바로가기'
    },
    {
        city: 'incheon',
        isNew: false,
        tag: '📍 인천 / 도약지원',
        tagStyle: 'background:#dcfce7; color:#166534; border: 1px solid #bbf7d0;',
        title: "인천시, 2026 청년 주거·취업 통합 패키지 '청년도약플러스' 본격 시행",
        description: '인천광역시는 관내 무주택 청년들의 주거 안정과 경제적 안착을 지원하기 위해 매월 최대 20만 원의 월세 보조와 자산 관리 재무 상담을 결합한 통합 청년도약플러스 패키지 사업을 추진합니다. (2026년 4월 18일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EC%9D%B8%EC%B2%9C%EC%8B%9C+%EC%B2%AD%EB%85%84+%EB%8F%84%EC%95%BD+%EC%A7%85%EC%A4%91+%EC%A7%80%EC%9B%90',
        linkText: '인천 청년도약 신청 보러가기'
    },
    {
        city: 'incheon',
        isNew: false,
        tag: '📍 인천 / 주거안전',
        tagStyle: 'background:#dcfce7; color:#166534; border: 1px solid #bbf7d0;',
        title: "인천 청년 전세보증금 반환보증료 전액 지원... 안심 전세 실현",
        description: '인천광역시는 사회초년생의 보증금 전세사기 피해를 적극 예방하기 위해 최대 30만 원 상당의 HUG 전세금 반환보증 보험 가입료 전액을 환급해 주는 안심 정책을 상시 시행 중입니다. (2026년 5월 18일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EC%9D%B8%EC%B2%9C+%EC%B2%AD%EB%85%84+%EC%A0%84%EC%84%B8%EB%B3%B4%EC%A6%9D%EA%B8%B0+%EB%B3%B4%EC%A6%9D%EB%A3%8C',
        linkText: '반환보증료 지원 신청'
    },
    {
        city: 'daegu',
        isNew: false,
        tag: '📍 대구 / 부동산금융',
        tagStyle: 'background:#ffedd5; color:#c2410c; border: 1px solid #fed7aa;',
        title: "대구 수성구 아파트 매매가 바닥론 고개... 주담대 금리 변동에 촉각",
        description: '대구 지역 아파트 매매 거래량이 소폭 반등하며 바닥론이 조심스럽게 제기되는 가운데, 시중은행의 주택담보대출 금리 변동이 향후 주요 변수가 될 전망입니다. (2026년 4월 25일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EB%8C%80%EA%B5%AC+%EC%95%84%ED%8C%8C%ED%8A%B8+%EB%A7%A4%EB%A7%A4%EA%B0%80+%EC%A3%BC%EB%8B%B4%EB%8C%80',
        linkText: '대구 아파트 수성구 뉴스 보러가기'
    },
    {
        city: 'daegu',
        isNew: false,
        tag: '📍 대구 / 자산형성',
        tagStyle: 'background:#ffedd5; color:#c2410c; border: 1px solid #fed7aa;',
        title: "대구시 청년 희망적금 만기 도래... 지자체 3배 매칭 지원금 지급",
        description: '대구광역시는 관내 저소득 청년들이 목돈을 형성할 수 있도록 돕는 대구 청년희망적금 가입자 중 성실 납입자들을 대상으로 300% 수준의 시 예산 매칭 적립금을 일제히 지급합니다. (2026년 5월 14일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EB%8C%80%EA%B5%AC%EC%8B%9C+%EC%B2%AD%EB%85%84+%ED%9D%AC%EB%A7%9D%EC%A0%81%EA%B8%90',
        linkText: '대구 청년적금 확인하기'
    },
    {
        city: 'daejeon',
        isNew: false,
        tag: '📍 대전 / 투자·스타트업',
        tagStyle: 'background:#fce7f3; color:#be185d; border: 1px solid #fbcfe8;',
        title: "대전 대덕특구 벤처기업, 5월 대규모 벤처캐피탈(VC) 투자유치 릴레이",
        description: '대전 지역의 딥테크 및 핀테크 기반 벤처기업들이 연이어 수도권 대형 벤처캐피탈로부터 수백억 원 규모의 시리즈 투자를 유치하며 자금 조달에 성공하고 있습니다. (2026년 5월 8일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EB%8C%80%EC%A0%84+%EB%8C%80%EB%8D%95%ED%8A%B9%EA%B5%AC+%EB%B2%A4%EC%B2%98%EA%B8%B0%EC%97%85+%ED%88%AC%EC%9E%90',
        linkText: '대전 벤처기업 투자 뉴스 보러가기'
    },
    {
        city: 'daejeon',
        isNew: false,
        tag: '📍 대전 / 창업·재무',
        tagStyle: 'background:#fce7f3; color:#be185d; border: 1px solid #fbcfe8;',
        title: "대전시 청년 창업가 특별 저금리 '디딤돌 금융 지원' 대폭 확대",
        description: '대전광역시는 혁신 사업 아이디어를 보유한 2030 청년 스타트업과 소상공인들을 지원하기 위해 1%대 수준의 특별 경영 자금 대출 및 우대 금리 한도를 확대 시행합니다. (2026년 5월 19일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EB%8C%80%EC%A0%84%EC%8B%9C+%EC%B2%AD%EB%85%84+%EC%B0%BD%EC%97%85+%EA%B8%88%EC%9C%B5',
        linkText: '창업자금 디딤돌 지원 안내'
    },
    {
        city: 'gwangju',
        isNew: false,
        tag: '📍 광주 / 지역화폐',
        tagStyle: 'background:#f3e8ff; color:#7e22ce; border: 1px solid #e9d5ff;',
        title: "광주상생카드(지역화폐), 5월 가정의 달 맞아 10% 특별 할인 재개",
        description: '광주광역시는 고물가로 인한 시민들의 재무적 부담을 덜고 골목상권 소비를 촉진하기 위해 5월 한 달간 광주상생카드 할인율을 10%로 상향 조정했습니다. (2026년 4월 29일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EA%B4%91%EC%A3%BC%EC%83%83%EC%83%9D%EC%B9%B4%EB%93%9C+10%25+%ED%95%A0%EC%9D%B8',
        linkText: '광주상생카드 뉴스 보러가기'
    },
    {
        city: 'gwangju',
        isNew: false,
        tag: '📍 광주 / 주거분리',
        tagStyle: 'background:#f3e8ff; color:#7e22ce; border: 1px solid #e9d5ff;',
        title: "광주 청년 주거급여 특별 분리 지급 실시... 자취 청년 부담 해소",
        description: '광주광역시는 취약 가구 내에서 독립하여 학업이나 직장을 준비하는 20대 자취 청년들에게 부모 가구와는 별도로 주거 수당을 분리하여 직접 지급하는 특별 지원을 개시했습니다. (2026년 5월 16일 보도)',
        link: 'https://search.naver.com/search.naver?where=news&query=%EA%B4%91%EC%A3%BC+%EC%B2%AD%EB%85%84+%EC%A3%BC%EA%B1%B0%EC%9급%EC%97%AC+%EB%B6%84%EB%A6%AC',
        linkText: '주거급여 분리지급 신청'
    }
];

const newsFeedContainer = document.getElementById('news-feed-container');

function renderNews(filterCity = 'all') {
    if (!newsFeedContainer) return;
    newsFeedContainer.innerHTML = ''; // 기존 뉴스 비우기

    let newsToRender = [];
    if (filterCity === 'all') {
        // 전체보기일 때는 '새로운 전국 공통 최신 뉴스'만 노출
        newsToRender = newsData.filter(news => news.isNew === true);
    } else {
        // 특정 지역 클릭 시, 해당 지역의 기존 뉴스 및 기존 전국 공통 뉴스(all_only)가 함께 노출됨
        newsToRender = newsData.filter(news => news.isNew === false && (news.city === filterCity || news.city === 'all_only'));
    }

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

// --- Reset Password / Email Verification Logic ---
const openResetModalBtn = document.getElementById('open-reset-modal');
const resetModal = document.getElementById('reset-modal');
const resetCloseBtn = document.getElementById('reset-close-btn');
const resetEmailInput = document.getElementById('reset-email');
const resetSendCodeBtn = document.getElementById('reset-send-code-btn');
const simulatedEmailToast = document.getElementById('simulated-email-toast');

const resetStep1Inputs = document.getElementById('reset-step-1-inputs');
const resetStep2Verification = document.getElementById('reset-step-2-verification');
const resetStep3Password = document.getElementById('reset-step-3-password');
const resetVerificationCodeInput = document.getElementById('reset-verification-code');
const resetTimerSpan = document.getElementById('reset-timer');
const resetVerifyCodeBtn = document.getElementById('reset-verify-code-btn');

const resetNewPasswordInput = document.getElementById('reset-new-password');
const resetPasswordErrorDiv = document.getElementById('reset-password-error');
const resetChangePwdBtn = document.getElementById('reset-change-pwd-btn');
const resetStepDesc = document.getElementById('reset-step-desc');

if (resetNewPasswordInput) {
    resetNewPasswordInput.addEventListener('input', () => {
        if (resetPasswordErrorDiv) resetPasswordErrorDiv.style.display = 'none';
    });
}

let verificationTimer = null;
let verificationTimeLeft = 180; // 3 minutes
let generatedVerificationCode = '';
let verificationUid = '';
let verificationEmail = '';

function startVerificationTimer() {
    clearInterval(verificationTimer);
    verificationTimeLeft = 180;
    updateTimerDisplay();
    verificationTimer = setInterval(() => {
        verificationTimeLeft--;
        updateTimerDisplay();
        if (verificationTimeLeft <= 0) {
            clearInterval(verificationTimer);
            alert("인증 시간이 초과되었습니다. 인증 코드를 다시 발송해 주세요.");
            resetVerificationFlow();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(verificationTimeLeft / 60);
    const seconds = verificationTimeLeft % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    if (resetTimerSpan) {
        resetTimerSpan.innerText = formatted;
        if (verificationTimeLeft <= 30) {
            resetTimerSpan.classList.add('timer-pulse');
        } else {
            resetTimerSpan.classList.remove('timer-pulse');
        }
    }
}

function resetVerificationFlow() {
    clearInterval(verificationTimer);
    generatedVerificationCode = '';
    verificationUid = '';
    verificationEmail = '';
    
    if (resetStepDesc) resetStepDesc.innerText = "가입하신 이메일을 입력해주세요.";
    if (resetStep1Inputs) resetStep1Inputs.classList.remove('hidden');
    if (resetStep2Verification) resetStep2Verification.classList.add('hidden');
    if (resetStep3Password) resetStep3Password.classList.add('hidden');
    if (simulatedEmailToast) {
        simulatedEmailToast.classList.add('hidden');
        simulatedEmailToast.innerHTML = '';
    }
    
    if (resetEmailInput) resetEmailInput.value = '';
    if (resetVerificationCodeInput) resetVerificationCodeInput.value = '';
    if (resetNewPasswordInput) resetNewPasswordInput.value = '';
    if (resetPasswordErrorDiv) resetPasswordErrorDiv.style.display = 'none';
}

function closeResetModal() {
    resetVerificationFlow();
    if (resetModal) resetModal.classList.add('hidden');
}

if (openResetModalBtn) {
    openResetModalBtn.addEventListener('click', () => {
        resetVerificationFlow();
        resetModal.classList.remove('hidden');
    });
}

if (resetCloseBtn) {
    resetCloseBtn.addEventListener('click', () => {
        closeResetModal();
    });
}

if (resetSendCodeBtn) {
    resetSendCodeBtn.addEventListener('click', () => {
        const email = resetEmailInput.value.trim();

        if (!email) {
            alert("이메일 주소를 입력해주세요!");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("올바른 이메일 주소 형식이 아닙니다.");
            return;
        }

        const db = loadUsersDB();
        // 옛날 계정(아이디 기반)과 이메일 기반 계정 모두 찾을 수 있도록 지원
        let targetUid = null;
        if (db[email]) {
            targetUid = email;
        } else {
            // 이메일 주소로 검색
            for (const key in db) {
                if (db[key].email && db[key].email.toLowerCase() === email.toLowerCase()) {
                    targetUid = key;
                    break;
                }
            }
        }

        if (!targetUid) {
            alert("해당 이메일로 가입된 계정이 없습니다.");
            return;
        }

        // 6자리 인증코드 생성
        const code = String(Math.floor(100000 + Math.random() * 900000));
        generatedVerificationCode = code;
        verificationUid = targetUid;
        verificationEmail = email;

        // 실제 이메일 발송 또는 시뮬레이션 처리
        sendVerificationEmail(email, code)
            .then((isRealSent) => {
                if (isRealSent) {
                    if (simulatedEmailToast) {
                        simulatedEmailToast.classList.remove('hidden');
                        simulatedEmailToast.innerHTML = `
                            <div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; color: var(--success);">
                                <i class="fa-solid fa-paper-plane"></i> 실제 이메일 발송 완료
                            </div>
                            <div style="font-size: 0.85rem; line-height: 1.4; color: var(--text-main);">
                                수신 이메일: <strong>${email}</strong><br>
                                입력하신 이메일로 실제 인증 코드가 포함된 메일을 발송했습니다.<br>메일함을 확인해 주세요! (스팸 메일함도 함께 확인 바랍니다.)
                            </div>
                        `;
                    }
                } else {
                    if (simulatedEmailToast) {
                        simulatedEmailToast.classList.remove('hidden');
                        simulatedEmailToast.innerHTML = `
                            <div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                <i class="fa-solid fa-envelope" style="color: var(--primary);"></i> [시뮬레이션] 가상 이메일 전송 완료
                            </div>
                            <div style="font-size: 0.85rem; line-height: 1.4; color: var(--text-main);">
                                수신자: <strong>${email}</strong><br>
                                내용: [청년지갑] 본인 확인을 위한 인증 번호입니다.<br>
                                <div class="verify-code-badge">${code}</div>
                                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">※ 실제 서비스 시에는 메일로 발송되나, MVP 데모 테스트용으로 화면에 표시됩니다.</span>
                            </div>
                        `;
                    }
                }

                if (resetStepDesc) resetStepDesc.innerText = "이메일로 전송된 6자리 인증 코드를 입력해주세요.";
                if (resetStep1Inputs) resetStep1Inputs.classList.add('hidden');
                if (resetStep2Verification) resetStep2Verification.classList.remove('hidden');

                startVerificationTimer();
            })
            .catch((err) => {
                console.error("이메일 발송 에러:", err);
                alert("실제 이메일 발송 중 오류가 발생했습니다. 개발자 설정값을 확인하거나 잠시 후 시도해주세요. (오류 내용: " + err.message + ")");
            });
    });
}

function sendVerificationEmail(email, code) {
    const sId = EMAILJS_DEV_CONFIG.serviceId;
    const tId = EMAILJS_DEV_CONFIG.templateId;
    const pKey = EMAILJS_DEV_CONFIG.publicKey;

    if (!sId || sId === "YOUR_SERVICE_ID" || 
        !tId || tId === "YOUR_TEMPLATE_ID" || 
        !pKey || pKey === "YOUR_PUBLIC_KEY") {
        return Promise.resolve(false); 
    }
    
    if (!window.emailjs) {
        return Promise.reject(new Error("EmailJS SDK가 로드되지 않았습니다."));
    }

    const templateParams = {
        to_email: email,
        email_to: email,
        code: code,
        verification_code: code,
        message: `인증번호는 [${code}] 입니다.`
    };

    return window.emailjs.send(sId, tId, templateParams)
        .then((response) => {
            console.log('EmailJS Success:', response.status, response.text);
            return true;
        });
}

if (resetVerifyCodeBtn) {
    resetVerifyCodeBtn.addEventListener('click', () => {
        const inputCode = resetVerificationCodeInput.value.trim();

        if (!inputCode) {
            alert("인증 코드를 입력해주세요!");
            return;
        }

        if (inputCode !== generatedVerificationCode) {
            alert("인증 코드가 일치하지 않습니다. 다시 확인해주세요.");
            return;
        }

        // 인증 성공
        clearInterval(verificationTimer);
        if (resetStepDesc) resetStepDesc.innerText = "새로운 비밀번호를 설정해주세요.";
        if (resetStep2Verification) resetStep2Verification.classList.add('hidden');
        if (simulatedEmailToast) simulatedEmailToast.classList.add('hidden');
        if (resetStep3Password) resetStep3Password.classList.remove('hidden');
    });
}

if (resetChangePwdBtn) {
    resetChangePwdBtn.addEventListener('click', () => {
        const newPwd = resetNewPasswordInput.value.trim();

        if (!newPwd) {
            alert("새로운 비밀번호를 입력해주세요!");
            return;
        }

        if (resetPasswordErrorDiv) resetPasswordErrorDiv.style.display = 'none';
        if (!validatePassword(newPwd)) {
            if (resetPasswordErrorDiv) resetPasswordErrorDiv.style.display = 'block';
            return;
        }

        const db = loadUsersDB();
        if (db[verificationUid]) {
            db[verificationUid].password = newPwd;
            db[verificationUid].email = verificationEmail; // 이메일 주소 저장/업데이트
            localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
            
            alert(`'${verificationUid}' 계정의 비밀번호가 성공적으로 변경되었습니다! 새 비밀번호로 시작하기를 눌러주세요.`);
            closeResetModal();
        } else {
            alert("계정 정보 수정 도중 오류가 발생했습니다.");
            resetVerificationFlow();
        }
    });
}

// 로그아웃 시 호출되는 챌린지 초기화 함수 (정의 누락 방지용)
function resetChallenge() {
    console.log("Challenge reset called.");
}
