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



// Challenge Elements
const challengeUploadBox = document.getElementById('challenge-upload-box');
const challengeFileUpload = document.getElementById('challenge-file-upload');
const challengeSuccess = document.getElementById('challenge-success');
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

    if (tabId === 'challenge') {
        resetChallenge();
    } else if (tabId === 'map') {
        // 지도가 보이게 된 직후 크기를 다시 계산하거나 초기화해야 합니다.
        setTimeout(() => {
            initMap();
        }, 100);
    }
}

// Add Click Events to Nav Items
navItems.forEach(item => {
    item.addEventListener('click', () => {
        switchTab(item.dataset.tab);
    });
});



// --- Challenge Logic ---
function resetChallenge() {
    challengeUploadBox.classList.remove('hidden');
    challengeSuccess.classList.add('hidden');
}

challengeUploadBox.addEventListener('click', () => {
    // 실제 파일 선택(카메라) 창 띄우기
    challengeFileUpload.click();
});

challengeFileUpload.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        challengeUploadBox.classList.add('hidden');

        // Add points and update UI
        addPoints(200);

        // Show Success screen
        challengeSuccess.classList.remove('hidden');

        // 다음 인증을 위해 파일 input 초기화
        challengeFileUpload.value = '';
    }
});

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

// --- Map Logic ---
let mapInitialized = false;
let globalMap = null;
let placesService = null;

function initMap() {
    if (mapInitialized) {
        if (globalMap) {
            google.maps.event.trigger(globalMap, 'resize');
        }
        return;
    }

    // 구글맵 API 객체가 로드되었는지 확인
    if (typeof google === 'object' && typeof google.maps === 'object') {
        document.getElementById('map-placeholder').style.display = 'none';
        const mapContainer = document.getElementById('map');
        mapContainer.style.display = 'block';

        let initialLat = 37.566826;
        let initialLng = 126.9786567;
        let initialPos = new google.maps.LatLng(initialLat, initialLng);

        globalMap = new google.maps.Map(mapContainer, {
            center: initialPos,
            zoom: 15,
            disableDefaultUI: true,
            zoomControl: true
        });

        placesService = new google.maps.places.PlacesService(globalMap);

        // 1. 현재 사용자 위치 가져오기
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                const userPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

                // 내 위치 마커
                displayMarker(userPos, '📍 내 위치');
                globalMap.setCenter(userPos);

                // 2. 주변 '부동산' 검색
                searchPlaces(userPos);

            }, function (error) {
                console.log("위치 정보를 가져올 수 없습니다: ", error);
                searchPlaces(initialPos);
            });
        } else {
            searchPlaces(initialPos);
        }

        function searchPlaces(location) {
            const request = {
                location: location,
                radius: '1000',
                keyword: '공인중개사'
            };
            placesService.nearbySearch(request, function (results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                    for (let i = 0; i < results.length; i++) {
                        displayRealEstateMarker(results[i]);
                    }
                } else {
                    console.log("실제 장소를 찾지 못해 MVP 체험용 더미 마커를 표시합니다.");
                    const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
                    const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
                    const mockPlaces = [
                        {
                            name: "청년안심 공인중개사",
                            vicinity: "현재 위치에서 약 150m (체험용)",
                            geometry: { location: new google.maps.LatLng(lat + 0.0015, lng + 0.0015) }
                        },
                        {
                            name: "내집마련 부동산",
                            vicinity: "현재 위치에서 약 300m (체험용)",
                            geometry: { location: new google.maps.LatLng(lat - 0.002, lng + 0.001) }
                        },
                        {
                            name: "다해방 부동산사무소",
                            vicinity: "현재 위치에서 약 450m (체험용)",
                            geometry: { location: new google.maps.LatLng(lat + 0.001, lng - 0.0025) }
                        }
                    ];
                    mockPlaces.forEach(place => displayRealEstateMarker(place));
                }
            });
        }

        // 내 위치 마커 표시 함수
        function displayMarker(position, message) {
            const marker = new google.maps.Marker({
                position: position,
                map: globalMap
            });
            const infoWindow = new google.maps.InfoWindow({
                content: `<div style="padding:5px; font-size:12px; font-weight:bold;">${message}</div>`
            });
            infoWindow.open(globalMap, marker);
        }

        // 주변 부동산 마커 표시
        function displayRealEstateMarker(place) {
            const marker = new google.maps.Marker({
                position: place.geometry.location,
                map: globalMap
            });

            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding:10px; font-size:13px; font-weight:bold; color: #0f172a; border-radius:8px; display:flex; flex-direction:column; gap:10px; min-width: 160px;">
                        <div>
                            🏢 ${place.name}<br>
                            <span style="font-size:11px; color:#64748b; font-weight:normal; line-height: 1.4; display: block; margin-top: 3px;">${place.vicinity}</span>
                        </div>
                        <button onclick="window.open('https://m.land.naver.com/', '_blank')" 
                                style="background-color:#0284c7; color:white; border:none; border-radius:6px; padding:8px 10px; font-size:12px; font-weight:bold; cursor:pointer; font-family:'Pretendard', sans-serif; display: flex; align-items: center; justify-content: center; gap: 5px;">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> 이 주변 실제 매물 보기
                        </button>
                    </div>
                `
            });

            marker.addListener('click', () => {
                infoWindow.open(globalMap, marker);
            });
        }

        // --- 내 위치 찾기 버튼 연동 ---
        const btnMyLocation = document.getElementById('btn-my-location');
        if (btnMyLocation) {
            btnMyLocation.addEventListener('click', () => {
                // 시각적 피드백
                const originalHtml = btnMyLocation.innerHTML;
                btnMyLocation.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 위치 찾는 중...';

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (position) {
                        const userPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        globalMap.setCenter(userPos);
                        displayMarker(userPos, '📍 최근 내 위치');

                        // 기존 내용 지우고 (원할 경우 필요하지만 구글 Place는 그냥 마커 덧씌움 방지를 위해 초기화가 필요할 수도 있음, MVP니까 덧씌우기로 둠)
                        searchPlaces(userPos);

                        btnMyLocation.innerHTML = originalHtml;
                    }, function (error) {
                        alert('위치 정보를 가져올 수 없습니다. 브라우저 위치 접근 권한을 허용해 주세요.');
                        btnMyLocation.innerHTML = originalHtml;
                    });
                } else {
                    alert('현재 브라우저에서는 위치 기능을 지원하지 않습니다.');
                    btnMyLocation.innerHTML = originalHtml;
                }
            });
        }

        mapInitialized = true;
    } else {
        console.warn("구글 API 로드에 실패했거나 키가 유효하지 않습니다. 목업을 계속 보여줍니다.");
    }
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
