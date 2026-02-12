// ============================================================
// 【系统核心功能】
// ============================================================

// 全局变量
const iphone = document.getElementById('iphone');
const stand = document.getElementById('badgeStand');
const track = document.getElementById('rulerTrack');
const bubble = document.getElementById('standBubble');
const pagesContainer = document.getElementById('pagesContainer');
const dots = document.querySelectorAll('.page-dot');
let sweetSpot = Math.random() * 80 + 10;
let isDragging = false;

// 主题设置
let displaySettings = {
    mode: 'light',
    auto: false,
    scheduleType: 'sunset'
};

// 1. 状态栏初始化
function initStatusBar() {
    // 更新时间
    setInterval(() => {
        const d = new Date();
        document.getElementById('sb-time').textContent = 
            String(d.getHours()).padStart(2, '0') + ':' + 
            String(d.getMinutes()).padStart(2, '0');
    }, 1000);
    
    // 电池信息
    if (navigator.getBattery) {
        navigator.getBattery().then(b => {
            document.getElementById('sb-bat-level').style.width = (b.level * 100) + '%';
        });
    }
}

// 2. 纪念日初始化
function initAnniversary() {
    const start = new Date("2023-01-01");
    const now = new Date();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    document.getElementById('anni-days').textContent = days;
}

// 3. 天气更新
function updateWeather() {
    const cityEl = document.getElementById('w-city');
    const tempEl = document.getElementById('w-temp');
    const descEl = document.getElementById('w-desc');
    
    cityEl.textContent = "定位中...";
    
    fetch('https://ipwho.is/')
        .then(res => res.json())
        .then(data => {
            if (!data.success) throw new Error("IP Locate Failed");
            cityEl.textContent = data.city || "本地";
            return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${data.latitude}&longitude=${data.longitude}&current_weather=true`);
        })
        .then(res => res.json())
        .then(data => {
            if (data.current_weather) {
                const code = data.current_weather.weathercode;
                let desc = "晴 ☀️";
                if (code > 80) desc = "多云 ☁️";
                else if (code > 50) desc = "雨 🌧️";
                else if (code > 0) desc = "少云 ⛅";
                
                tempEl.textContent = Math.round(data.current_weather.temperature) + "°";
                descEl.textContent = desc;
            }
        })
        .catch(err => {
            cityEl.textContent = "未知";
            descEl.textContent = "重试";
        });
}

// 4. App 开关控制
function openApp(id) {
    document.getElementById(id + 'App').classList.add('active');
    iphone.classList.add('dark-text');
    
    if (id === 'sms') {
        if (typeof initSMSLogic === 'function') initSMSLogic();
        if (typeof renderSMSHome === 'function') renderSMSHome();
        const badge = document.getElementById('sms-badge');
        if (badge) badge.classList.remove('active');
    }
}

function closeApp() {
    document.querySelectorAll('.app-overlay').forEach(e => e.classList.remove('active'));
    iphone.classList.remove('dark-text');
}

// 5. 层显示/隐藏
function showLayer(id) {
    document.getElementById(id).classList.add('active');
}

function hideLayer(id) {
    document.getElementById(id).classList.remove('active');
}

// 6. 切换底部菜单
function toggleSheet(id, s) {
    const o = document.getElementById(id);
    s ? o.classList.add('active') : o.classList.remove('active');
}

// 7. 切换标签页
function switchTab(t, e) {
    document.querySelectorAll('.tab-item').forEach(x => x.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    document.querySelectorAll('.tab-view').forEach(x => x.classList.remove('active'));
    const m = {
        'contacts': 'view-contacts',
        'list': 'view-list',
        'profile': 'view-profile'
    };
    
    if (m[t]) document.getElementById(m[t]).classList.add('active');
}

// 8. 尺子立牌逻辑
function initRuler() {
    stand.addEventListener('touchstart', (e) => {
        isDragging = true;
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
        bubble.classList.remove('show');
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        const touch = e.touches[0];
        const trackRect = track.getBoundingClientRect();
        let newLeft = touch.clientX - trackRect.left - (stand.offsetWidth / 2);
        
        if (newLeft < 0) newLeft = 0;
        if (newLeft > trackRect.width - stand.offsetWidth) newLeft = trackRect.width - stand.offsetWidth;
        
        stand.style.left = newLeft + 'px';
        const percent = (newLeft / (trackRect.width - stand.offsetWidth)) * 100;
        
        if (Math.abs(percent - sweetSpot) < 5) {
            showBubble();
        }
    });
}

function showBubble() {
    if (bubble.classList.contains('show')) return;
    
    const quotes = [
        "我爱你",
        "今天过得好吗",
        "我在这里",
        "想你了",
        "抱抱",
        "一切都会好的"
    ];
    
    bubble.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    bubble.classList.add('show');
    
    setTimeout(() => {
        bubble.classList.remove('show');
    }, 3000);
    
    sweetSpot = Math.random() * 80 + 10;
}

// 9. 主题系统
function setAppearanceMode(mode) {
    displaySettings.mode = mode;
    
    // 更新单选按钮状态
    document.getElementById('radio-light').classList.toggle('checked', mode === 'light');
    document.getElementById('radio-dark').classList.toggle('checked', mode === 'dark');
    
    // 应用模式
    if (mode === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function toggleAutoMode() {
    displaySettings.auto = document.getElementById('auto-mode-toggle').checked;
    document.getElementById('auto-options-row').style.display = displaySettings.auto ? 'flex' : 'none';
    
    if (displaySettings.auto) {
        checkAutoDisplayMode();
    }
}

function setScheduleType(type) {
    displaySettings.scheduleType = type;
    
    // 更新UI
    document.getElementById('sched-sunset').classList.toggle('checked', type === 'sunset');
    document.getElementById('sched-custom').classList.toggle('checked', type === 'custom');
    document.getElementById('custom-time-picker').style.display = type === 'custom' ? 'block' : 'none';
    document.getElementById('current-schedule-desc').textContent = type === 'sunset' ? '日落到日出' : '自定义时段';
    
    // 勾选状态
    document.getElementById('sched-sunset').textContent = type === 'sunset' ? '✓' : '';
    document.getElementById('sched-custom').textContent = type === 'custom' ? '✓' : '';
    
    checkAutoDisplayMode();
}

function checkAutoDisplayMode() {
    if (!displaySettings.auto) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    let isDarkTime = false;
    
    if (displaySettings.scheduleType === 'sunset') {
        if (currentHour >= 18 || currentHour < 6) isDarkTime = true;
    } else {
        // 简单模拟自定义：22:00 - 07:00
        if (currentHour >= 22 || currentHour < 7) isDarkTime = true;
    }
    
    if (isDarkTime && displaySettings.mode !== 'dark') {
        setAppearanceMode('dark');
    } else if (!isDarkTime && displaySettings.mode !== 'light') {
        setAppearanceMode('light');
    }
}

// 10. 分页滚动监听
function initPageScroll() {
    // 初始定位到第二页
    setTimeout(() => {
        pagesContainer.scrollTo({
            left: pagesContainer.clientWidth,
            behavior: 'auto'
        });
    }, 100);

    pagesContainer.addEventListener('scroll', () => {
        const scrollLeft = pagesContainer.scrollLeft;
        const width = pagesContainer.clientWidth;
        const pageIndex = Math.round(scrollLeft / width);
        
        dots.forEach((d, i) => {
            d.classList.toggle('active', i === pageIndex);
        });
    });
}

// 11. 通用功能
function togglePersonaExpand(expand, textareaId = null) {
    const fullLayer = document.getElementById('persona-full-layer');
    
    if (expand) {
        const textarea = document.getElementById(textareaId);
        document.getElementById('full-persona-input').value = textarea.value;
        document.getElementById('full-persona-input').dataset.source = textareaId;
        fullLayer.classList.add('active');
    } else {
        const sourceId = document.getElementById('full-persona-input').dataset.source;
        if (sourceId) {
            const textarea = document.getElementById(sourceId);
            textarea.value = document.getElementById('full-persona-input').value;
        }
        fullLayer.classList.remove('active');
    }
}

// 12. 初始化系统模块
function initSystem() {
    initStatusBar();
    initAnniversary();
    updateWeather();
    initRuler();
    initPageScroll();
    
    // 初始化默认主题
    setAppearanceMode('light');
    setScheduleType('sunset');
    setInterval(checkAutoDisplayMode, 60000);
    
    // 给天气组件添加点击事件
    document.getElementById('weather-widget').addEventListener('click', updateWeather);
}

// 导出全局函数
window.openApp = openApp;
window.closeApp = closeApp;
window.showLayer = showLayer;
window.hideLayer = hideLayer;
window.toggleSheet = toggleSheet;
window.switchTab = switchTab;
window.setAppearanceMode = setAppearanceMode;
window.toggleAutoMode = toggleAutoMode;
window.setScheduleType = setScheduleType;
window.togglePersonaExpand = togglePersonaExpand;
// 设置外观计划类型（日落/自定义）
function setScheduleType(type) {
    // 1. 先把所有的勾都去掉
    document.getElementById('sched-sunset').parentElement.classList.remove('active');
    document.getElementById('sched-custom').parentElement.classList.remove('active');

    // 2. 给当前点的这个加上勾
    document.getElementById('sched-' + type).parentElement.classList.add('active');

    // 3. 更新上一页显示的文字
    const desc = (type === 'sunset') ? '日落到日出' : '自定义时段';
    document.getElementById('current-schedule-desc').innerText = desc;

    // 4. 如果选了自定义，就显示时间选择框；否则隐藏
    const picker = document.getElementById('custom-time-picker');
    if (type === 'custom') {
        picker.style.display = 'block';
    } else {
        picker.style.display = 'none';
    }
}
