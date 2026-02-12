// ============================================================
// 【服务功能】
// ============================================================

// 1. API 功能
function autoFixUrl(input) {
    let val = input.value.trim();
    if (val && !val.endsWith('/v1')) {
        input.value = val.replace(/\/$/, "") + '/v1';
    }
}

function checkApiProvider() {
    const p = document.getElementById('api-provider').value;
    const urlInput = document.getElementById('custom-url');
    
    if (p === 'openai') {
        urlInput.value = 'https://api.openai.com/v1';
    } else {
        urlInput.value = '';
    }
}

async function smartFetch(url, options) {
    const useProxy = document.getElementById('cors-toggle').checked;
    
    if (useProxy) {
        return fetch('https://corsproxy.io/?' + encodeURIComponent(url), options);
    }
    
    try {
        return await fetch(url, options);
    } catch (err) {
        return fetch('https://corsproxy.io/?' + encodeURIComponent(url), options);
    }
}

async function testConnection() {
    const urlInput = document.getElementById('custom-url');
    autoFixUrl(urlInput);
    
    const url = urlInput.value;
    const key = document.getElementById('api-key').value;
    
    if (!url) {
        alert('请填写 URL');
        return;
    }
    
    const btn = event.target;
    const originText = btn.textContent;
    btn.textContent = '...';
    
    try {
        const res = await smartFetch(`${url}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${key}`
            }
        });
        
        if (res.ok) {
            alert('✅ 连接成功！');
            try {
                const data = await res.json();
                if (data.data && data.data.length > 0) {
                    document.getElementById('model-input').value = data.data[0].id;
                }
            } catch (e) {}
        } else {
            alert(`❌ 失败 (Code: ${res.status})`);
        }
    } catch (e) {
        alert(`❌ 网络错误: ${e.message}`);
    } finally {
        btn.textContent = originText;
    }
}

async function fetchModels() {
    const urlInput = document.getElementById('custom-url');
    autoFixUrl(urlInput);
    
    const url = urlInput.value;
    const key = document.getElementById('api-key').value;
    
    if (!url) {
        alert('请填写 URL');
        return;
    }
    
    const btn = event.target;
    btn.textContent = '...';
    
    try {
        const res = await smartFetch(`${url}/models`, {
            headers: {
                'Authorization': `Bearer ${key}`
            }
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        let models = [];
        
        if (data.data && Array.isArray(data.data)) {
            models = data.data.map(m => m.id);
        } else {
            models = Array.isArray(data) ? data : ['格式错误'];
        }
        
        const content = document.getElementById('model-list-content');
        let html = `<div style="text-align:center;font-size:13px;color:#888;margin-bottom:10px">选择模型</div>`;
        
        models.forEach(m => {
            html += `<div class="action-btn" onclick="selectModel('${m}')">${m}</div>`;
        });
        
        html += `<div class="action-btn cancel" onclick="toggleSheet('model-select-overlay',false)">取消</div>`;
        content.innerHTML = html;
        toggleSheet('model-select-overlay', true);
    } catch (e) {
        alert('获取失败: ' + e.message);
    } finally {
        btn.textContent = '获取模型';
    }
}

function selectModel(m) {
    document.getElementById('model-input').value = m;
    toggleSheet('model-select-overlay', false);
}

// 2. 美化功能
function openBeautify() {
    showLayer('beautify-layer');
}

function handleImageUpload(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById(previewId).src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function saveBeautify() {
    document.getElementById('info-banner-img').src = document.getElementById('preview-banner').src;
    document.getElementById('badge-img').src = document.getElementById('preview-badge').src;
    hideLayer('beautify-layer');
}

// 3. 全局初始化
function initializeAll() {
    // 初始化系统模块
    if (typeof initSystem === 'function') {
        initSystem();
    }
    
    // 初始化应用模块
    if (typeof initApps === 'function') {
        initApps();
    }
    
    console.log('所有模块初始化完成！');
}

// 4. 导出全局函数
window.autoFixUrl = autoFixUrl;
window.checkApiProvider = checkApiProvider;
window.testConnection = testConnection;
window.fetchModels = fetchModels;
window.selectModel = selectModel;
window.openBeautify = openBeautify;
window.handleImageUpload = handleImageUpload;
window.saveBeautify = saveBeautify;
window.smartFetch = smartFetch; // 导出给其他模块使用

// 5. 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeAll);