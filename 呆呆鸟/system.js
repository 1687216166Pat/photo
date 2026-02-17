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
/**
 * ============================================================
 * 主屏幕模式切换逻辑 (双模方案)
 * ============================================================
 */
/* ============================================================
   【2. system.js - 模式切换与开机还原】
   ============================================================ */

function changeHomeMode(mode) {
    const iphone = document.getElementById('iphone');
    const androidLayout1 = document.getElementById('page1-android-style');
    const iosLayout1 = document.getElementById('page1-ios-style');
    const androidLayout2 = document.getElementById('layout-android-style');
    const iosLayout2 = document.getElementById('layout-ios-style');
    const checkAndroid = document.getElementById('check-android');
    const checkIos = document.getElementById('check-ios');

    // 纠错：如果传入的是 null，默认设为 ios
    if (!mode) mode = 'ios';

    if (mode === 'ios') {
        if(iphone) { iphone.classList.add('mode-ios'); iphone.classList.remove('mode-android'); }
        if(androidLayout1) androidLayout1.style.display = 'none';
        if(iosLayout1) iosLayout1.style.display = 'block';
        if(androidLayout2) androidLayout2.style.display = 'none';
        if(iosLayout2) iosLayout2.style.display = 'block';
        if(checkIos) { checkIos.style.background = '#007aff'; checkIos.style.borderColor = '#007aff'; }
        if(checkAndroid) { checkAndroid.style.background = 'none'; checkAndroid.style.borderColor = '#ccc'; }
        
        // 记录数据
        window.phoneState.mode = 'ios';
    } else {
        if(iphone) { iphone.classList.add('mode-android'); iphone.classList.remove('mode-ios'); }
        if(androidLayout1) androidLayout1.style.display = 'block';
        if(iosLayout1) iosLayout1.style.display = 'none';
        if(androidLayout2) androidLayout2.style.display = 'block';
        if(iosLayout2) iosLayout2.style.display = 'none';
        if(checkAndroid) { checkAndroid.style.background = '#007aff'; checkAndroid.style.borderColor = '#007aff'; }
        if(checkIos) { checkIos.style.background = 'none'; checkIos.style.borderColor = '#ccc'; }

        // 记录数据
        window.phoneState.mode = 'android';
    }
    
    // 执行强制保存
    window.saveAllToLocal();
}

// --- 开机还原逻辑 (关键：针对 iOS 优化) ---
window.addEventListener('load', () => {
    console.log("📱 系统正在启动...");
    
    // 1. 优先使用大脑里的数据
    let targetMode = window.phoneState.mode;

    // 2. 二次检查：如果大脑没记准，看一眼备用钥匙
    const backupMode = localStorage.getItem('homeMode');
    if (!targetMode && backupMode) {
        targetMode = backupMode;
    }

    // 3. 执行还原
    console.log("正在还原模式:", targetMode);
    changeHomeMode(targetMode);
});


/* ============================================================
   iOS 全局手势引擎 (下拉唤起、上滑返回)
   ============================================================ */

// 1. 准备变量记录手指位置
let startX = 0;
let startY = 0;

// 获取手机外壳容器
const phoneContainer = document.getElementById('iphone');

// 2. 监听手指按下
phoneContainer.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
}, {passive: true});

// 3. 监听手指抬起
phoneContainer.addEventListener('touchend', function(e) {
    let endX = e.changedTouches[0].clientX;
    let endY = e.changedTouches[0].clientY;

    let diffX = endX - startX;
    let diffY = endY - startY; // 下拉为正，上滑为负
    
    let screenWidth = phoneContainer.offsetWidth;
    let screenHeight = phoneContainer.offsetHeight;

    // --- 逻辑 A: 顶部下拉手势 ---
    // 触发条件：手指从顶部 100 像素内开始，且向下滑动距离超过 50 像素
    if (startY < 100 && diffY > 50) {
        if (startX < screenWidth / 2) {
            // A1: 左半边下拉 -> 唤起锁屏
            document.getElementById('layer-lock-screen').classList.remove('screen-hidden');
        } else {
            // A2: 右半边下拉 -> 唤起控制中心
            document.getElementById('layer-control-center').classList.remove('screen-hidden');
        }
    }

   /* ============================================================
   【全能交互模块 - 无错版】
   ============================================================ */

// 1. 变量定义
let cc_startY_fixed = 0;

// 2. 监听开始触摸
document.addEventListener('touchstart', function(e) {
    cc_startY_fixed = e.touches[0].clientY;
}, {passive: true});

// 3. 监听触摸结束 (上滑返回)
document.addEventListener('touchend', function(e) {
    const screenHeight = window.innerHeight;
    const endY = e.changedTouches[0].clientY;
    const diffY = endY - cc_startY_fixed;

    if (cc_startY_fixed > (screenHeight - 100) && diffY < -50) {
        // 执行关闭
        const overlays = document.querySelectorAll('.full-overlay');
        overlays.forEach(l => l.classList.add('screen-hidden'));
        
        const edits = document.querySelectorAll('.full-screen-edit');
        edits.forEach(p => p.classList.remove('active'));

        if (typeof closeApp === 'function') closeApp();
    }
}, {passive: true});

// 4. 监听点击背景
document.addEventListener('click', function(e) {
    const cc = document.getElementById('control-center');
    if (cc && e.target === cc) {
        const overlays = document.querySelectorAll('.full-overlay');
        overlays.forEach(l => l.classList.add('screen-hidden'));
        if (typeof closeApp === 'function') closeApp();
    }
});})

/* ============================================================
   【Re phone 启动动画 - 修复强力版】
   ============================================================ */

function startRePhone() {
    const ball = document.getElementById('loading-ball');
    const screen = document.getElementById('startup-screen');

    if (!screen) return;

    // 1. 立即开始移动小球
    if (ball) {
        // 稍微延时一点点确保浏览器捕捉到起点
        setTimeout(() => {
            ball.style.left = '100%';
        }, 50);
    }

    // 2. 无论页面加载多慢，3秒后准时淡出启动页
    setTimeout(() => {
        screen.style.opacity = '0';
        screen.style.pointerEvents = 'none';
        
        // 3. 彻底移除
        setTimeout(() => {
            screen.remove();
        }, 800);
    }, 2800); // 2.8秒是给小球运动和回弹留出的总时间
}

// 只要 HTML 加载好就立刻执行，不等图片
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startRePhone);
} else {
    startRePhone();
}
在这里添加
