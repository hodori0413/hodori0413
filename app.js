// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username-input');
const userNameDisplay = document.getElementById('user-name-display');
const logoutBtn = document.getElementById('logout-btn');

// Nav Items and Tabs
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

// Translator Elements
const uploadBox = document.getElementById('upload-box');
const fileUpload = document.getElementById('file-upload');
const translatorLoading = document.getElementById('translator-loading');
const translatorResult = document.getElementById('translator-result');
const translatorRestartBtn = document.getElementById('translator-restart-btn');

// Challenge Elements
const challengeUploadBox = document.getElementById('challenge-upload-box');
const challengeFileUpload = document.getElementById('challenge-file-upload');
const challengeSuccess = document.getElementById('challenge-success');
const userPoints = document.getElementById('user-points');
const pointProgressBar = document.getElementById('point-progress-bar');
const pointProgressText = document.getElementById('point-progress-text');

// --- State Variables ---
let totalPoints = 0;
let progressPoints = 0;
let currentLevel = 1;

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

// --- Login Logic ---
loginBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    if (name.length === 0) {
        alert("코칭을 시작하려면 이름을 입력해주세요!");
        return;
    }

    // Set Name
    userNameDisplay.innerText = name;

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

    // 3. Reset states when navigating back to tab (optional, for UX)
    if (tabId === 'translator') {
        resetTranslator();
    } else if (tabId === 'challenge') {
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

// --- Translator Logic ---
const GEMINI_API_KEY = "AIzaSyCrO0CmFvMDJcEG5Gc_mM6Hp7tLtIssbCs"; 

function resetTranslator() {
    uploadBox.classList.remove('hidden');
    translatorLoading.classList.add('hidden');
    translatorResult.classList.add('hidden');
}

uploadBox.addEventListener('click', () => {
    // 실제 파일 선택창 띄우기
    fileUpload.click();
});

// 파일이 선택되면 로딩을 띄우고 분석 수행
fileUpload.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];

        uploadBox.classList.add('hidden');
        translatorLoading.classList.remove('hidden');

        try {
            // 1. 이미지를 Base64로 변환
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]); // MIME 정보 제외하고 순수 데이터만
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });

            // 2. API 호출 로직 분기
            if (!GEMINI_API_KEY || GEMINI_API_KEY === "AIzaSyDElc4xPkWjtOVJcXrFAZSzuiJEwwHv2Is") {
                console.warn("유효한 API 키가 없습니다. 코드를 수정해 키를 넣으면 실제 분석이 가능합니다.");
                await new Promise(r => setTimeout(r, 2000));
                updateTranslatorUI({
                    status: 'safe',
                    statusText: '분석 완료 (안전 - 시뮬레이션 모드)',
                    gapguSummary: "제미나이 코치(체험모드): 소유자는 '김구글'님으로 확인되며, 가압류나 경매 등 권리 침해 사실이 없습니다. (실제 키 입력 시 업로드한 사진의 글자를 읽어냅니다!)",
                    eulguSummary: "제미나이 코치(체험모드): 모기지론으로 인한 근저당권 5천만 원이 잡혀있으나, 시세 대비 20% 이하로 안전합니다.",
                    coachAdvice: "실제 분석을 테스트하시려면 app.js 파일 상단의 GEMINI_API_KEY 변수에 키를 입력해 주세요!"
                });
            } else {
                // 실제 제미나이 API 전송
                const result = await analyzeWithGemini(base64Data, file.type);
                updateTranslatorUI(result);
            }
        } catch (err) {
            alert('사진 분석 중 오류가 발생했습니다: ' + err.message);
            resetTranslator();
        }

        // 다음 테스트를 위해 파일 input 초기화
        fileUpload.value = '';
    }
});

async function analyzeWithGemini(base64Image, mimeType) {
    // 모델 이름을 gemini-1.5-flash 에서 gemini-1.5-flash-latest 로 변경
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
당신은 대한민국 2030 사회초년생을 돕는 친절하고 똑똑한 'AI 부동산 코치'입니다.
첨부된 이미지는 부동산 '등기부등본'의 전체 또는 일부입니다. 이미지를 면밀히 읽고 다음 양식에 맞춰 JSON 형식으로만 응답해주세요.

{
    "status": "safe" 또는 "warning" 또는 "danger" 또는 "unknown",
    "statusText": "예: 위험! 주의하세요 / 아주 깨끗한 집 / 판독 불가 등",
    "gapguSummary": "갑구 (소유권) 데이터가 있으면 요약, 없으면 '갑구 내역을 찾을 수 없습니다(표제부 등 다른 페이지일 수 있음)'라고 출력",
    "eulguSummary": "을구 (소유권 이외) 데이터가 있으면 요약, 없으면 '을구 내역을 찾을 수 없습니다.'라고 출력",
    "coachAdvice": "코치의 총평. 만약 표제부만 있다면 '올려주신 사진은 건물의 성격을 나타내는 표제부입니다. 누가 집주인인지(갑구), 빚이 있는지(을구) 확인하려면 다른 페이지 사진이 필요해요!'라고 조언."
}
반드시 다른 말자르지 말고 중괄호 {} 로 시작하고 끝나는 순수 JSON 텍스트만 출력하세요. 마크다운 코드 블록(\`\`\`)도 포함하지 마세요.
    `;

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: prompt },
                    { inline_data: { mime_type: mimeType, data: base64Image } }
                ]
            }
        ]
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API 요청에 실패했습니다.");
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error("AI가 응답을 생성하지 못했습니다 (안전 필터 등에 걸렸을 수 있습니다).");
    }

    let textResponse = data.candidates[0].content.parts[0].text;
    
    // JSON 부분만 안전하게 추출
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            throw new Error("AI가 반환한 데이터를 처리할 수 없습니다 (JSON 파싱 에러).");
        }
    } else {
        throw new Error("AI가 지정된 표 형식(JSON)으로 응답하지 않았습니다.");
    }
}

function updateTranslatorUI(result) {
    const riskBadge = document.getElementById('res-risk-badge');
    const resGapgu = document.getElementById('res-gapgu');
    const resEulgu = document.getElementById('res-eulgu');
    const resAdvice = document.getElementById('res-advice');

    resGapgu.innerText = result.gapguSummary;
    resEulgu.innerText = result.eulguSummary;
    resAdvice.innerHTML = `<i class="fa-solid fa-lightbulb"></i> <strong>코치의 꿀팁:</strong> ${result.coachAdvice}`;

    riskBadge.className = 'risk-badge';
    if (result.status === 'safe') {
        riskBadge.classList.add('safe');
        riskBadge.innerHTML = `<i class="fa-solid fa-shield-check"></i> ${result.statusText}`;
        riskBadge.style.background = '#dcfce7'; riskBadge.style.color = '#166534';
    } else if (result.status === 'warning') {
        riskBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${result.statusText}`;
        riskBadge.style.background = '#fef08a'; riskBadge.style.color = '#854d0e';
    } else {
        riskBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${result.statusText}`;
        riskBadge.style.background = '#fee2e2'; riskBadge.style.color = '#991b1b';
    }

    document.getElementById('translator-loading').classList.add('hidden');
    document.getElementById('translator-result').classList.remove('hidden');
}

translatorRestartBtn.addEventListener('click', resetTranslator);

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
    // 로그아웃 확인창 (선택사항이나, MVP의 직관성을 위해 바로 로그아웃 처리)

    // 입력창 초기화
    usernameInput.value = '';

    // 메인 앱 숨기기
    mainApp.classList.remove('active');
    mainApp.classList.add('hidden');

    // 부드러운 전환 효과를 위해 시간차 적용
    setTimeout(() => {
        // 로그인 화면 보이기
        loginScreen.classList.remove('hidden');
        loginScreen.classList.add('active');

        // 상태 초기화
        totalPoints = 0;
        progressPoints = 0;
        currentLevel = 1;
        userPoints.innerText = totalPoints.toLocaleString();
        document.getElementById('user-tier').innerText = `씨앗 등급 (Lv.1)`;
        updateProgress();

        switchTab('dashboard');
        resetTranslator();
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

// --- News Filter Logic ---
const newsData = [
    {
        city: 'all_only',
        tag: '🌐 전국 공통 / 자본관리',
        tagStyle: 'background:#fce7f3; color:#be185d;',
        title: "누적 가입자 200만명 돌파 앞둔 청년도약계좌, 선택 이유는 바로?",
        description: '연 9%대 적금 효과를 내세운 청년도약계좌가 누적 가입자 200만명을 돌파할 것으로 보입니다. 연 6% 금리에 비과세 혜택까지 더해진 실제 혜택 뉴스를 확인해 보세요. [42]',
        link: 'https://search.naver.com/search.naver?where=news&query=%EB%88%84%EC%A0%81+%EA%B0%80%EC%9E%85%EC%9E%90+200%EB%A7%8C%EB%AA%85+%EB%8F%8C%ED%8C%8C+%EC%95%9E%EB%91%94+%EC%B2%AD%EB%85%84%EB%8F%84%EC%95%BD%EA%B3%84%EC%A2%8C',
        linkText: '네이버 뉴스 바로가기'
    },
    {
        city: 'seoul',
        tag: '📍 서울 / 월세·주거',
        tagStyle: 'background:#e0f2fe; color:#0284c7;',
        title: "서울 청년 월세 지원, 신청 조건부터 지원금까지 총정리",
        description: '서울에 거주하는 19세~39세 무주택 청년 1인 가구를 대상으로 월 최대 20만 원의 월세를 최장 12개월간 지원하는 정책에 대한 최신 보도 내용입니다. [53]',
        link: 'https://search.naver.com/search.naver?where=news&query=%EC%84%9C%EC%9A%B8+%EC%B2%AD%EB%85%84+%EC%9B%94%EC%84%B8+%EC%A7%80%EC%9B%90,+%EC%8B%A0%EC%B2%AD+%EC%A1%B0%EA%B1%B4%EB%B6%80%ED%84%B0+%EC%A7%80%EC%9B%90%EA%B8%88%EA%B9%8C%EC%A7%80+%EC%B4%9D%EC%A0%95%EB%A6%AC',
        linkText: '네이버 뉴스 바로가기'
    },
    {
        city: 'busan',
        tag: '📍 부산 / 대출·금융',
        tagStyle: 'background:#fef08a; color:#854d0e;',
        title: "부산 청년 전세대출 ‘머물자리론’, 선착순 폐지…신청 접수로 변경",
        description: '부산시가 청년 임차보증금 대출 및 이자 지원사업인 머물자리론의 조기 마감 문제를 해결하기 위해 선착순을 폐지하고 상시 신청으로 개편했습니다. [86]',
        link: 'https://search.naver.com/search.naver?where=news&query=%EB%B6%80%EC%82%B0+%EC%B2%AD%EB%85%84+%EC%A0%84%EC%84%B8%EB%8C%80%EC%B6%9C+%EB%A8%B8%EB%AC%BC%EC%9E%90%EB%A6%AC%EB%A1%A0,+%EC%84%A0%EC%B0%A9%EC%88%9C+%ED%8F%90%EC%A7%80',
        linkText: '네이버 뉴스 바로가기'
    },
    {
        city: 'incheon',
        tag: '📍 인천 / 자산형성',
        tagStyle: 'background:#dcfce7; color:#166534;',
        title: "“인천 거주 청년이면 된다” 내년부터 바뀌는 드림For 청년통장",
        description: '매월 15만 원씩 3년간 저축하면 인천시가 540만 원을 추가로 지원하는 드림For 청년통장의 직장 소재지 요건이 사라지고 소득 기준이 대폭 완화됩니다. [49]',
        link: 'https://search.naver.com/search.naver?where=news&query=%EC%9D%B8%EC%B2%9C+%EA%B1%B0%EC%A3%BC+%EC%B2%AD%EB%85%84%EC%9D%B4%EB%A9%B4+%EB%90%9C%EB%8B%A4+%EB%82%B4%EB%85%84%EB%B6%80%ED%84%B0+%EB%B0%94%EB%80%8C%EB%8A%94+드림For+%EC%B2%AD%EB%85%84%ED%86%B5%EC%9E%A5',
        linkText: '네이버 뉴스 바로가기'
    },
    {
        city: 'daegu',
        tag: '📍 대구 / 자산보호',
        tagStyle: 'background:#ffedd5; color:#c2410c;',
        title: "[단독] 대구 역대 최대 '전세사기' 의혹···피해 규모 200억 추산",
        description: '대구에서 단일 사건으론 역대 최대 규모인 200억 원대 전세사기 의혹이 불거졌습니다. 피해 추정 가구가 330여 가구에 달해 청년 세입자들의 각별한 주의가 필요합니다. [66]',
        link: 'https://search.naver.com/search.naver?where=news&query=%EB%8C%80%EA%B5%AC+%EC%97%AD%EB%8C%80+%EC%B5%9C%EB%8C%80+%EC%A0%84%EC%84%B8%EC%82%AC%EA%B8%B0+%EC%9D%98%ED%98%B9+%ED%94%BC%ED%95%B4+%EA%B7%9C%EB%AA%A8+200%EC%96%B5+%EC%B6%94%EC%82%B0',
        linkText: '네이버 뉴스 바로가기'
    },
    {
        city: 'daejeon',
        tag: '📍 대전 / 청년주택',
        tagStyle: 'background:#fce7f3; color:#be185d;',
        title: "'청년 근로자 주거 안정' 대전청년하우스 문 열어",
        description: '대전 지역 청년근로자 200여명이 생활하게 될 기숙사인 대전청년하우스가 개관했습니다. 보증금 100만원, 월 27만5천원의 저렴한 비용으로 제공됩니다. [36]',
        link: 'https://search.naver.com/search.naver?where=news&query=%EC%B2%AD%EB%85%84+%EA%B7%BC%EB%A1%9C%EC%9E%90+%EC%A3%BC%EA%B1%B0+%EC%95%88%EC%A0%95+%EB%8C%80%EC%A0%84%EC%B2%AD%EB%85%84%ED%95%98%EC%9A%B0%EC%8A%A4+%EB%AC%B8+%EC%97%B4%EC%96%B4',
        linkText: '네이버 뉴스 바로가기'
    },
    {
        city: 'gwangju',
        tag: '📍 광주 / 공공주택',
        tagStyle: 'background:#f3e8ff; color:#7e22ce;',
        title: "광주시, 시청 1층에 ‘전세피해지원센터’ 개소",
        description: '광주광역시가 전세사기 피해로 주거 불안을 겪고 있는 시민들에게 법률·주거·금융 등 맞춤형 서비스를 종합적으로 제공하는 거점 기관을 개소했습니다. [83]',
        link: 'https://search.naver.com/search.naver?where=news&query=%EA%B4%91%EC%A3%BC%EC%8B%9C,+%EC%8B%9C%EC%B2%AD+1%EC%B8%B5%EC%97%90+%EC%A0%84%EC%84%B8%ED%94%BC%ED%95%B4%EC%A7%80%EC%9B%90%EC%84%BC%ED%84%B0+%EA%B0%9C%EC%86%8C',
        linkText: '네이버 뉴스 바로가기'
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
