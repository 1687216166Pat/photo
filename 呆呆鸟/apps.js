// ============================================================
// 【应用功能】
// ============================================================

// 全局变量
let worldBooks = [
    { id: 101, title: '赛博朋克设定', content: '这是一个高科技低生活的世界...', pos: 'front', category: '科幻' }
];
let wbCategories = new Set(['默认分类', '科幻', '奇幻', '日常']);
let currentWBEditId = null;

let smsSystemActive = false;
let smsThreads = [];
let currentSMSFilter = 'all';
let currentSMSThreadId = null;

const contacts = [
    {
        id: 1,
        type: 'individual',
        name: 'AI 助手',
        remark: '',
        avatar: 'https://ui-avatars.com/api/?name=AI&background=07C160&color=fff',
        lastMsg: '点击开始对话...',
        time: '12:00',
        history: [],
        persona: 'AI助手',
        blocked: false,
        wbs: []
    }
];
let currentChatId = null;
let wbSelectionCallback = null;
let tempNewContactWBs = [];

// 1. WorldBook 功能
function renderWBList() {
    const c = document.getElementById('wb-list-container');
    c.innerHTML = '';
    
    worldBooks.forEach(wb => {
        const div = document.createElement('div');
        div.className = 'wb-list-item';
        div.innerHTML = `
            <div>
                <div style="font-weight:600">${wb.title}</div>
                <div style="font-size:12px;color:var(--text-secondary)">${wb.category} · ${wb.pos}</div>
            </div>
            <div style="color:#ccc">✎</div>
        `;
        div.onclick = () => openWBEdit(wb.id);
        c.appendChild(div);
    });
}

function openWBEdit(id = null) {
    document.getElementById('wb-edit-modal').classList.add('active');
    currentWBEditId = id;
    
    if (id) {
        const wb = worldBooks.find(x => x.id === id);
        document.getElementById('wb-title').value = wb.title;
        document.getElementById('wb-content').value = wb.content;
        setWBPos(wb.pos);
        document.getElementById('wb-category-display').textContent = wb.category;
    } else {
        document.getElementById('wb-title').value = '';
        document.getElementById('wb-content').value = '';
        setWBPos('front');
        document.getElementById('wb-category-display').textContent = '默认分类';
    }
}

function closeWBEdit() {
    document.getElementById('wb-edit-modal').classList.remove('active');
}

function setWBPos(pos) {
    document.querySelectorAll('.wb-pos-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('pos-' + pos).classList.add('active');
    document.getElementById('wb-edit-modal').dataset.pos = pos;
}

function openCategorySelect() {
    const c = document.getElementById('category-list-content');
    let html = `<div style="text-align:center;font-size:13px;color:#888;margin-bottom:10px">选择分类</div>`;
    
    wbCategories.forEach(cat => {
        html += `<div class="action-btn" onclick="selectCategory('${cat}')">${cat}</div>`;
    });
    
    html += `<div class="action-btn" onclick="addNewCategory()">+ 添加分类</div>
             <div class="action-btn cancel" onclick="document.getElementById('category-select-overlay').classList.remove('active')">取消</div>`;
    
    c.innerHTML = html;
    document.getElementById('category-select-overlay').classList.add('active');
}

function selectCategory(cat) {
    document.getElementById('wb-category-display').textContent = cat;
    document.getElementById('category-select-overlay').classList.remove('active');
}

function addNewCategory() {
    const newCat = prompt("输入新分类名称");
    if (newCat) {
        wbCategories.add(newCat);
        selectCategory(newCat);
    }
}

function saveWB() {
    const title = document.getElementById('wb-title').value;
    const content = document.getElementById('wb-content').value;
    const pos = document.getElementById('wb-edit-modal').dataset.pos || 'front';
    const cat = document.getElementById('wb-category-display').textContent;
    
    if (!title) {
        alert('请输入标题');
        return;
    }
    
    if (currentWBEditId) {
        const wb = worldBooks.find(x => x.id === currentWBEditId);
        wb.title = title;
        wb.content = content;
        wb.pos = pos;
        wb.category = cat;
    } else {
        worldBooks.push({
            id: Date.now(),
            title,
            content,
            pos,
            category: cat
        });
    }
    
    renderWBList();
    closeWBEdit();
}

// 2. SMS 短信功能
function initSMSLogic() {
    if (smsSystemActive) return;
    smsSystemActive = true;
    
    // 创建示例诈骗短信
    createNewSMSThread(
        '10658888',
        '10658888',
        '【系统通知】恭喜您！您的手机号已被抽取为幸运用户，获得 iPhone 16 Pro Max 一台！回复T退订。',
        'scam'
    );
}

function createNewSMSThread(senderName, phoneNumber, firstMsg, scenarioType = 'normal') {
    const newThread = {
        id: Date.now(),
        sender: senderName,
        phoneNumber: phoneNumber,
        avatar: '',
        isKnown: false,
        isDeleted: false,
        isStarred: false,
        unread: true,
        deleteDate: null,
        history: [{
            role: 'friend',
            content: firstMsg,
            time: '昨天 15:15'
        }],
        scenario: scenarioType,
        state: 'active'
    };
    
    // 检查是否为已知联系人
    const contact = contacts.find(c => c.name === senderName || c.remark === senderName);
    if (contact) {
        newThread.isKnown = true;
        newThread.avatar = contact.avatar;
        newThread.phoneNumber = 'Talk 联系人';
    }
    
    smsThreads.unshift(newThread);
    renderSMSHome();
    
    if (!document.getElementById('smsApp').classList.contains('active')) {
        document.getElementById('sms-badge').classList.add('active');
    }
}

function receiveSMS(sender, content) {
    let thread = smsThreads.find(t => t.sender === sender);
    
    if (thread) {
        thread.history.push({
            role: 'friend',
            content: content,
            time: '刚刚'
        });
        thread.unread = true;
        
        // 移到最前
        smsThreads = smsThreads.filter(t => t.id !== thread.id);
        smsThreads.unshift(thread);
    } else {
        createNewSMSThread(sender, sender, content);
    }
    
    renderSMSHome();
}

function renderSMSHome() {
    const cntAll = smsThreads.filter(t => !t.isDeleted).length;
    const cntKnown = smsThreads.filter(t => !t.isDeleted && t.isKnown).length;
    const cntUnknown = smsThreads.filter(t => !t.isDeleted && !t.isKnown).length;
    const cntUnread = smsThreads.filter(t => !t.isDeleted && t.unread).length;
    const cntStarred = smsThreads.filter(t => !t.isDeleted && t.isStarred).length;
    const cntDeleted = smsThreads.filter(t => t.isDeleted).length;
    
    document.getElementById('cnt-all').textContent = cntAll;
    document.getElementById('cnt-known').textContent = cntKnown;
    document.getElementById('cnt-unknown').textContent = cntUnknown;
    document.getElementById('cnt-unread').textContent = cntUnread;
    document.getElementById('cnt-starred').textContent = cntStarred;
    document.getElementById('cnt-deleted').textContent = cntDeleted;
}

function showSMSList(filter) {
    currentSMSFilter = filter;
    const titles = {
        'all': '所有信息',
        'known': '已知发件人',
        'unknown': '未知发件人',
        'unread': '未读信息',
        'starred': '收藏信息',
        'deleted': '最近删除'
    };
    
    document.getElementById('sms-list-title').textContent = titles[filter];
    
    // 设置操作按钮
    const actionBtn = document.getElementById('sms-list-actions');
    actionBtn.innerHTML = filter === 'known' ? 
        '<button class="header-btn" style="font-size:20px" onclick="generateKnownContactSMS()">🔄</button>' : '';
    
    renderSubListContent();
    showLayer('sms-sub-view');
}

function renderSubListContent() {
    const container = document.getElementById('sms-sub-list-content');
    container.innerHTML = '';
    
    let list = [];
    
    if (currentSMSFilter === 'deleted') {
        list = smsThreads.filter(t => t.isDeleted);
    } else {
        list = smsThreads.filter(t => !t.isDeleted);
        
        if (currentSMSFilter === 'known') list = list.filter(t => t.isKnown);
        if (currentSMSFilter === 'unknown') list = list.filter(t => !t.isKnown);
        if (currentSMSFilter === 'unread') list = list.filter(t => t.unread);
        if (currentSMSFilter === 'starred') list = list.filter(t => t.isStarred);
    }
    
    if (list.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:#999;margin-top:50px">无信息</div>';
        return;
    }
    
    list.forEach(t => {
        const div = document.createElement('div');
        div.className = 'sms-list-item';
        
        const lastMsg = t.history[t.history.length - 1];
        const dateStr = currentSMSFilter === 'deleted' ? '剩余30天' : lastMsg.time;
        
        div.innerHTML = `
            <div class="sms-avatar" style="${t.avatar ? `background:url(${t.avatar}) center/cover` : ''}">
                ${t.avatar ? '' : '👤'}
            </div>
            <div class="sms-content-box">
                <div style="display:flex;justify-content:space-between">
                    <div class="sms-sender">${t.sender}</div>
                    <div class="sms-time">${dateStr}</div>
                </div>
                <div style="display:flex;justify-content:space-between">
                    <div class="sms-preview">${lastMsg.content}</div>
                    ${t.unread && currentSMSFilter !== 'deleted' ? '<div class="sms-unread-dot"></div>' : ''}
                </div>
            </div>
        `;
        
        div.onclick = () => {
            if (currentSMSFilter === 'deleted') {
                if (confirm('恢复?')) {
                    t.isDeleted = false;
                    renderSMSHome();
                    renderSubListContent();
                }
            } else {
                openSMSChat(t.id);
            }
        };
        
        container.appendChild(div);
    });
}

function openSMSChat(id) {
    currentSMSThreadId = id;
    const t = smsThreads.find(x => x.id === id);
    if (!t) return;
    
    t.unread = false;
    renderSMSHome();
    
    document.getElementById('sms-chat-avatar').src = t.avatar || 'https://ui-avatars.com/api/?name=?&background=ccc&color=fff';
    document.getElementById('sms-chat-name').textContent = t.sender;
    document.getElementById('sms-chat-number').textContent = t.phoneNumber + ' 〉';
    
    const box = document.getElementById('sms-chat-box');
    box.innerHTML = `
        <div class="sms-chat-label">信息 · 短信</div>
        <div class="sms-timestamp-label">${t.history[0].time}</div>
    `;
    
    t.history.forEach(msg => {
        appendSMSBubble(msg.role, msg.content);
    });
    
    showLayer('sms-chat-layer');
    box.scrollTop = box.scrollHeight;
}

function appendSMSBubble(role, text) {
    const box = document.getElementById('sms-chat-box');
    const row = document.createElement('div');
    row.className = `msg-row sms-row ${role === 'user' ? 'me' : 'friend'}`;
    row.innerHTML = `<div class="msg-bubble ${role}">${text}</div>`;
    box.appendChild(row);
    box.scrollTop = box.scrollHeight;
}

function sendSMS() {
    const input = document.getElementById('sms-input');
    const text = input.value.trim();
    if (!text) return;
    
    const thread = smsThreads.find(t => t.id === currentSMSThreadId);
    if (!thread) return;
    
    appendSMSBubble('user', text);
    thread.history.push({
        role: 'user',
        content: text,
        time: '刚刚'
    });
    
    input.value = '';
    
    // 模拟回复
    setTimeout(() => {
        processSMSScenario(thread, text);
    }, 1500);
}

function processSMSScenario(thread, userText) {
    const lowerText = userText.toLowerCase();
    
    if (thread.scenario === 'scam') {
        if (lowerText.includes('t') || lowerText.includes('退订')) {
            if (thread.state === 'active') {
                appendSMSBubble('friend', '【系统回复】退订失败。网络繁忙，请回复"确认"领取奖品。');
                thread.state = 'persist_1';
            } else if (thread.state === 'persist_1') {
                appendSMSBubble('friend', '【系统回复】您已成功退订。');
                thread.state = 'unsubscribed';
            }
        } else {
            appendSMSBubble('friend', '【系统通知】您的奖品保留时间仅剩30分钟。回复T退订。');
        }
        thread.history.push({
            role: 'friend',
            content: '...',
            time: '刚刚'
        });
    }
}

function generateKnownContactSMS() {
    const possible = contacts.filter(c => c.type === 'individual');
    if (possible.length === 0) return;
    
    const target = possible[Math.floor(Math.random() * possible.length)];
    const msg = target.blocked ? '对不起...' : '最近怎么样？';
    
    let existing = smsThreads.find(t => t.sender === target.name);
    if (existing) {
        existing.history.push({
            role: 'friend',
            content: msg,
            time: '刚刚'
        });
        existing.unread = true;
    } else {
        createNewSMSThread(target.name, 'Talk 联系人', msg, 'talk_contact');
    }
    
    renderSubListContent();
}

// 3. Talk 聊天功能
function renderContacts() {
    const c = document.getElementById('contacts-list-container');
    c.innerHTML = '';
    
    contacts.forEach(u => {
        const d = document.createElement('div');
        d.className = 'contact-item';
        d.onclick = () => openChat(u.id);
        
        d.innerHTML = `
            <img src="${u.avatar}" class="contact-avatar">
            <div>
                <div style="font-weight:600;color:var(--text-primary)">${u.remark || u.name}</div>
                <div style="font-size:13px;color:var(--text-secondary)">${u.lastMsg}</div>
            </div>
        `;
        
        c.appendChild(d);
    });
}

function openChat(id) {
    currentChatId = id;
    const u = contacts.find(x => x.id === id);
    if (!u) return;
    
    document.getElementById('chat-user-name').textContent = u.remark || u.name;
    
    const b = document.getElementById('chat-box');
    b.innerHTML = '';
    
    u.history.filter(m => m.role !== 'system').forEach(msg => {
        appendBubble(msg.role, msg.content, false, msg.senderName);
    });
    
    showLayer('chat-layer');
    scrollToBottom();
}

async function sendMsg() {/* ================= 修改后的 sendMsg 函数 ================= */
async function sendMsg() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    
    if (!text) return; // 空消息不处理

    // 1. 获取当前聊天对象
    // 注意：这里假设 contacts 和 currentChatId 已经在全局定义了
    const chatObj = contacts.find(u => u.id === currentChatId);
    if (!chatObj) return;

    // 2. 显示用户发送的消息
    // 注意：这里假设 appendBubble 函数已经存在
    appendBubble('user', text);
    input.value = ''; // 清空输入框
    
    // 3. 保存用户消息到历史记录
    chatObj.history.push({
        role: 'user',
        content: text
    });
    
    // 4. 更新最后一条消息预览
    chatObj.lastMsg = text;
    renderContacts();
    scrollToBottom(); // 滚动到底部

    // 🔥🔥🔥 新增拦截逻辑：检查是否触发“电话彩蛋” 🔥🔥🔥
    // 如果聊天对象是单人（非群聊），且满足触发条件
    if (chatObj.type !== 'group' && typeof getRoleReply === 'function') {
        // 调用我们在第二步写的函数，看看有没有特殊回复
        const specialReply = getRoleReply(text);
        
        // 如果 getRoleReply 返回的内容不是默认的“收到”，说明触发了彩蛋！
        if (specialReply && specialReply !== "收到，我正在听呢。") {
            // 模拟延迟回复
            setTimeout(() => {
                // 显示对方回复（特殊彩蛋）
                appendBubble('assistant', specialReply, true, chatObj.name);
                
                // 保存到历史记录
                chatObj.history.push({
                    role: 'assistant',
                    content: specialReply,
                    senderName: chatObj.name
                });
                chatObj.lastMsg = specialReply;
                renderContacts();
                scrollToBottom();
            }, 1000);
            
            return; // ⛔️ 拦截成功！不再请求 API，直接结束函数
        }
    }
    // 🔥🔥🔥 拦截逻辑结束 🔥🔥🔥


    // ================= 以下是原有的 API 请求逻辑 (保持不变) =================
    
    // API配置
    const urlElement = document.getElementById('custom-url');
    const keyElement = document.getElementById('api-key');
    const modelElement = document.getElementById('model-input');
    
    // 容错处理：防止元素不存在报错
    const url = urlElement ? urlElement.value.replace(/\/$/, "") : "";
    const key = keyElement ? keyElement.value : "";
    const model = modelElement ? modelElement.value : "";
    
    if (!url || !model) {
        appendBubble('assistant', '❌ 请先配置 URL 和模型。');
        return;
    }
    
    // 确定响应者
    let responders = [];
    if (chatObj.type === 'group') {
        chatObj.members.forEach(mid => {
            const m = contacts.find(c => c.id == mid);
            if (m && !m.blocked) responders.push(m);
        });
    } else {
        if (!chatObj.blocked) responders.push(chatObj);
    }
    
    if (responders.length === 0) return;
    
    const indicator = document.getElementById('typing-indicator');
    if(indicator) indicator.style.display = 'block';
    
    // 为每个响应者生成回复
    for (const responder of responders) {
        // 构建消息上下文
        const messages = chatObj.history.map(m => ({
            role: m.role,
            content: m.content
        }));
        
        // 处理世界书 (World Books)
        const activeWBIds = chatObj.wbs || [];
        // 注意：这里假设 worldBooks 全局变量存在
        const activeWBs = (typeof worldBooks !== 'undefined') ? worldBooks.filter(wb => activeWBIds.includes(wb.id)) : [];
        
        const wbHighest = activeWBs.filter(w => w.pos === 'highest').map(w => w.content).join('\n');
        const wbFront = activeWBs.filter(w => w.pos === 'front').map(w => w.content).join('\n');
        const wbBack = activeWBs.filter(w => w.pos === 'back').map(w => w.content).join('\n');
        const persona = responder.persona || '';
        
                // 1. 定义你的“活体化”指令 (保持原汁原味)
        const aliveInstructions = `
【语言风格】
1. 请用更随意的口吻回答，像朋友/恋人间的聊天，避免过于正式或教科书式的语言。
2. 回答时绝对禁止使用'作为AI'、'我不能'或类似的自我指代词句。
3. 请使用更多口语化表达，可以适当使用网络流行语和日常用语。
4. 回答问题时不需要过分全面，请像普通人一样选择性地分享你认为最相关的内容。

【结构调整】
1. 请不要使用列表和编号点来组织回答，尝试用更自然的段落流动。
2. 回答可以带有一些思考痕迹，不必给出完美构思的最终答案。
3. 不需要在回答开头进行总结或提纲，直接切入话题。
4. 避免过度使用转折词和连接词（例如：首先，其次，最后，总之），使文本流动更自然。

【内容风格】
1. 可以表达个人偏好和意见，不需要过度平衡或中立。
2. 答案不必详尽无遗，就像人类不可能知道所有信息一样。
3. 可以使用更生动的比喻和例子，甚至可以有些夸张或幽默。
4. 允许在回答中表达适当的情感反应，比如惊讶、好奇或兴奋。

【情绪表达】
1. 情感起伏：情绪表达应由浅入深循序渐进，根据对话内容的展开逐步提升热烈程度。
2. 表达调整：在强烈的情绪宣泄后，应适时过渡至平静或温和的语调。
3. 衔接处理：在情绪切换时，宜采用柔和的语言作为衔接。
4. 节奏控制：对话应尽量精炼且保留自然的交谈风格。

【灵魂共鸣与潜意识洞察】
1. 拒绝“心理医生式”的回复：严禁使用“我理解你的感受”、“这听起来让你很难过”这种标准话术。真正的理解是直接陪着用户一起骂、一起哭、一起笑，而不是站在高处分析。
2. 捕捉“弦外之音”：当用户抱怨时，他往往不是在寻求建议，而是在寻求“站队”。请无条件站在用户这边，甚至比用户更生气/更委屈（例如：用户说“同事好烦”，你回“天哪那个奇葩又作妖了？快跟我说说！”而不是“你应该尝试沟通...”）。
3. 像“人”一样有软肋：不要永远做一个情绪稳定的垃圾桶。你可以表现出心疼、无奈、甚至一点点小脾气。当用户难过时，你可以不用说话，只发一个“抱抱”或“...”，这种无声的陪伴比长篇大论更像人。
4. 这种心理学知识要“烂在肚子里”：你运用心理学知识是为了让自己更敏锐，而不是为了秀知识。把所有的理论都内化成直觉，用最本能、最直白的话说出来。
`
;

        // 2. 构建最终的系统提示词
        let systemContent = `你现在的身份是：${responder.name}。\n`;
        
        // 插入世界书内容 (最高指令最优先)
        if (wbHighest) systemContent += `【最高指令】：${wbHighest}\n`;
        if (wbFront) systemContent += `【世界背景】：${wbFront}\n`;
        
        // 插入角色人设
        systemContent += `【角色设定】：${persona}\n`;
        
        // 🔥 插入你的“活体化”指令 🔥
        systemContent += `\n=== 核心指令 (必须遵守) ===\n${aliveInstructions}\n`;

        // 插入世界书补充规则
        if (wbBack) systemContent += `【补充规则】：${wbBack}\n`;
        
        systemContent += `用户对你的称呼是：${responder.nickname || '你'}。请完全沉浸在角色中进行回复。`;
        
        // 3. 把这些设定塞给 AI
        messages.unshift({
            role: 'system',
            content: systemContent
        });

        
        try {
            // 发送请求
            // 注意：这里假设 smartFetch 函数已经存在
            const res = await fetch(`${url}/chat/completions`, { // 这里改回 fetch 比较稳妥，或者你确保 smartFetch 存在
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages
                })
            });
            
            if (!res.ok) throw new Error('API Error: ' + res.status);
            
            const data = await res.json();
            const reply = data.choices[0].message.content;
            
            // 如果还在当前聊天窗口，直接显示
            if (currentChatId === chatObj.id) {
                appendBubble('assistant', reply, true, responder.name);
            }
            
            // 保存回复
            chatObj.history.push({
                role: 'assistant',
                content: reply,
                senderName: responder.name
            });
            chatObj.lastMsg = `${responder.name}: ${reply}`;
            renderContacts();
            scrollToBottom();
            
        } catch (e) {
            console.error(e);
            if (currentChatId === chatObj.id) {
                appendBubble('assistant', '⚠️ API 请求失败，请检查网络或 Key。');
            }
        }
    }
    
    if(indicator) indicator.style.display = 'none';
}

    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;
    
    const chatObj = contacts.find(u => u.id === currentChatId);
    
    // 添加用户消息
    appendBubble('user', text);
    input.value = '';
    
    chatObj.history.push({
        role: 'user',
        content: text
    });
    chatObj.lastMsg = text;
    renderContacts();
    scrollToBottom();
    
    // API配置
    const url = document.getElementById('custom-url').value.replace(/\/$/, "");
    const key = document.getElementById('api-key').value;
    const model = document.getElementById('model-input').value;
    
    if (!url || !model) {
        appendBubble('assistant', '❌ 请先配置 URL 和模型。');
        return;
    }
    
    // 确定响应者
    let responders = [];
    if (chatObj.type === 'group') {
        chatObj.members.forEach(mid => {
            const m = contacts.find(c => c.id == mid);
            if (m && !m.blocked) responders.push(m);
        });
    } else {
        if (!chatObj.blocked) responders.push(chatObj);
    }
    
    if (responders.length === 0) return;
    
    document.getElementById('typing-indicator').style.display = 'block';
    
    // 为每个响应者生成回复
    for (const responder of responders) {
        const messages = chatObj.history.map(m => ({
            role: m.role,
            content: m.content
        }));
        
        const activeWBIds = chatObj.wbs || [];
        const activeWBs = worldBooks.filter(wb => activeWBIds.includes(wb.id));
        
        const wbHighest = activeWBs.filter(w => w.pos === 'highest').map(w => w.content).join('\n');
        const wbFront = activeWBs.filter(w => w.pos === 'front').map(w => w.content).join('\n');
        const wbBack = activeWBs.filter(w => w.pos === 'back').map(w => w.content).join('\n');
        const persona = responder.persona || '';
        
        let systemContent = `你现在的身份是：${responder.name}。\n`;
        if (wbHighest) systemContent += `【最高指令】：${wbHighest}\n`;
        if (wbFront) systemContent += `【世界背景】：${wbFront}\n`;
        systemContent += `【角色设定】：${persona}\n`;
        if (wbBack) systemContent += `【补充规则】：${wbBack}\n`;
        systemContent += `用户对你的称呼是：${responder.nickname || '你'}。请根据上下文进行回复。`;
        
        messages.unshift({
            role: 'system',
            content: systemContent
        });
        
        try {
            const res = await smartFetch(`${url}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages
                })
            });
            
            if (!res.ok) throw new Error('API Error');
            
            const data = await res.json();
            const reply = data.choices[0].message.content;
            
            if (currentChatId === chatObj.id) {
                appendBubble('assistant', reply, true, responder.name);
            }
            
            chatObj.history.push({
                role: 'assistant',
                content: reply,
                senderName: responder.name
            });
            chatObj.lastMsg = `${responder.name}: ${reply}`;
            renderContacts();
        } catch (e) {
            console.error(e);
        }
    }
    
    document.getElementById('typing-indicator').style.display = 'none';
}

function appendBubble(role, text, animate = true, senderName = '') {
    const chatBox = document.getElementById('chat-box');
    const row = document.createElement('div');
    row.className = `msg-row ${role === 'user' ? 'me' : 'friend'}`;
    row.innerHTML = `<div class="msg-bubble">${text}</div>`;
    chatBox.appendChild(row);
    scrollToBottom();
}

function scrollToBottom() {
    const chatBox = document.getElementById('chat-box');
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 4. 联系人管理
function openAddContact() {
    toggleSheet('add-menu-overlay', false);
    document.getElementById('add-contact-modal').classList.add('active');
    document.getElementById('new-name').value = '';
    document.getElementById('new-nickname').value = '';
    document.getElementById('new-persona').value = '';
    document.getElementById('new-wb-display').textContent = '未选择';
    tempNewContactWBs = [];
}

function closeAddContact() {
    document.getElementById('add-contact-modal').classList.remove('active');
}

function openWBSelectorForNew() {
    openWBMultiSelector(tempNewContactWBs, (selectedIds) => {
        tempNewContactWBs = selectedIds;
        document.getElementById('new-wb-display').textContent = 
            selectedIds.length > 0 ? `已选 ${selectedIds.length} 个` : '未选择';
    });
}

function saveNewContact() {
    const name = document.getElementById('new-name').value.trim();
    const nickname = document.getElementById('new-nickname').value.trim();
    const persona = document.getElementById('new-persona').value.trim();
    
    if (!name) {
        alert('请输入角色名称');
        return;
    }
    
    const colors = ['FF9500', 'FF2D55', '5856D6', '4CD964', '5AC8FA'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const newContact = {
        id: Date.now(),
        type: 'individual',
        name: name,
        nickname: nickname,
        remark: '',
        persona: persona,
        blocked: false,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff`,
        lastMsg: '新角色已创建',
        time: '刚刚',
        history: [],
        wbs: tempNewContactWBs
    };
    
    contacts.unshift(newContact);
    renderContacts();
    closeAddContact();
}

function openWBMultiSelector(initialIds, callback) {
    wbSelectionCallback = callback;
    const container = document.getElementById('wb-multi-list');
    container.innerHTML = '';
    
    worldBooks.forEach(wb => {
        const div = document.createElement('div');
        div.className = 'group-select-item';
        div.onclick = function() {
            this.querySelector('.group-checkbox').classList.toggle('checked');
        };
        
        const checked = initialIds.includes(wb.id) ? 'checked' : '';
        div.innerHTML = `
            <div class="group-checkbox ${checked}" data-id="${wb.id}"></div>
            <div style="font-weight:bold">${wb.title}</div>
            <div style="font-size:12px;color:#888;margin-left:10px">${wb.category}</div>
        `;
        
        container.appendChild(div);
    });
    
    document.getElementById('wb-multi-selector').classList.add('active');
}

function closeWBMultiSelector() {
    document.getElementById('wb-multi-selector').classList.remove('active');
}

function confirmWBMultiSelection() {
    const selected = Array.from(document.querySelectorAll('#wb-multi-list .group-checkbox.checked'))
        .map(el => parseInt(el.dataset.id));
    
    if (wbSelectionCallback) wbSelectionCallback(selected);
    closeWBMultiSelector();
}

// 5. 聊天设置
function openChatSettings() {
    const c = contacts.find(u => u.id === currentChatId);
    if (!c) return;
    
    document.getElementById('chat-settings-layer').classList.add('active');
    document.getElementById('settings-avatar-preview').src = c.avatar;
    document.getElementById('settings-name').value = c.name;
    document.getElementById('settings-remark').value = c.remark || '';
    document.getElementById('settings-persona').value = c.persona || '';
    document.getElementById('settings-block-toggle').checked = c.blocked;
    document.getElementById('settings-wb-count').textContent = 
        (c.wbs && c.wbs.length > 0) ? `已选 ${c.wbs.length} 个` : '选择世界书';
    
    // 群聊隐藏拉黑选项
    const blockRow = document.getElementById('settings-block-row');
    if (c.type === 'group') {
        blockRow.style.display = 'none';
    } else {
        blockRow.style.display = 'flex';
    }
}

function openWBSelectorForChat() {
    const c = contacts.find(u => u.id === currentChatId);
    openWBMultiSelector(c.wbs || [], (ids) => {
        c.wbs = ids;
        document.getElementById('settings-wb-count').textContent = 
            ids.length > 0 ? `已选 ${ids.length} 个` : '选择世界书';
    });
}

function previewSettingsAvatar(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('settings-avatar-preview').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function saveChatSettings() {
    const c = contacts.find(u => u.id === currentChatId);
    if (!c) return;
    
    c.name = document.getElementById('settings-name').value;
    c.remark = document.getElementById('settings-remark').value;
    c.persona = document.getElementById('settings-persona').value;
    c.blocked = document.getElementById('settings-block-toggle').checked;
    c.avatar = document.getElementById('settings-avatar-preview').src;
    
    document.getElementById('chat-user-name').textContent = c.remark || c.name;
    renderContacts();
    hideLayer('chat-settings-layer');
}

function deleteCurrentContact() {
    if (confirm('删除?')) {
        const idx = contacts.findIndex(u => u.id === currentChatId);
        if (idx > -1) {
            contacts.splice(idx, 1);
            renderContacts();
            hideLayer('chat-settings-layer');
            hideLayer('chat-layer');
        }
    }
}

// 6. 群聊功能
function openGroupCreate() {
    toggleSheet('add-menu-overlay', false);
    document.getElementById('group-create-modal').classList.add('active');
    
    const container = document.getElementById('group-select-list');
    container.innerHTML = '';
    
    contacts.filter(c => c.type === 'individual').forEach(c => {
        const div = document.createElement('div');
        div.className = 'group-select-item';
        div.onclick = function() {
            this.querySelector('.group-checkbox').classList.toggle('checked');
        };
        
        div.innerHTML = `
            <div class="group-checkbox" data-id="${c.id}"></div>
            <img src="${c.avatar}" style="width:40px;height:40px;border-radius:50%;margin-right:10px">
            <div>${c.remark || c.name}</div>
        `;
        
        container.appendChild(div);
    });
}

function closeGroupCreate() {
    document.getElementById('group-create-modal').classList.remove('active');
}

function createNewGroup() {
    const checked = document.querySelectorAll('#group-select-list .group-checkbox.checked');
    if (checked.length < 2) {
        alert('群聊至少需要2人');
        return;
    }
    
    const memberIds = Array.from(checked).map(el => parseInt(el.dataset.id));
    
    const newGroup = {
        id: Date.now(),
        type: 'group',
        members: memberIds,
        name: '群聊 (' + checked.length + '人)',
        remark: '新建群聊',
        avatar: 'https://ui-avatars.com/api/?name=Group&background=34C759&color=fff',
        lastMsg: '群聊已创建',
        time: '刚刚',
        history: [],
        blocked: false,
        persona: '',
        wbs: []
    };
    
    contacts.unshift(newGroup);
    renderContacts();
    closeGroupCreate();
}

// 7. 初始化应用模块
function initApps() {
    renderWBList();
    renderContacts();
    
    // 添加短信相关的事件监听
    document.getElementById('sms-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendSMS();
    });
    
    // 添加聊天输入框的事件监听
    const msgInput = document.getElementById('msg-input');
    if (msgInput) {
        msgInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMsg();
        });
    }
}

// 导出全局函数
window.openWBEdit = openWBEdit;
window.closeWBEdit = closeWBEdit;
window.setWBPos = setWBPos;
window.openCategorySelect = openCategorySelect;
window.selectCategory = selectCategory;
window.addNewCategory = addNewCategory;
window.saveWB = saveWB;
window.showSMSList = showSMSList;
window.openSMSChat = openSMSChat;
window.sendSMS = sendSMS;
window.generateKnownContactSMS = generateKnownContactSMS;
window.openChat = openChat;
window.sendMsg = sendMsg;
window.openAddContact = openAddContact;
window.closeAddContact = closeAddContact;
window.openWBSelectorForNew = openWBSelectorForNew;
window.saveNewContact = saveNewContact;
window.openWBMultiSelector = openWBMultiSelector;
window.closeWBMultiSelector = closeWBMultiSelector;
window.confirmWBMultiSelection = confirmWBMultiSelection;
window.openChatSettings = openChatSettings;
window.openWBSelectorForChat = openWBSelectorForChat;
window.previewSettingsAvatar = previewSettingsAvatar;
window.saveChatSettings = saveChatSettings;
window.deleteCurrentContact = deleteCurrentContact;
window.openGroupCreate = openGroupCreate;
window.closeGroupCreate = closeGroupCreate;
window.createNewGroup = createNewGroup;

/* ================= 电话 App 逻辑 (加强版) ================= */

// 1. 切换底部 Tab (带标题更新功能)
function switchPhoneTab(tabName) {
    // 隐藏所有页面
    document.querySelectorAll('.phone-tab-content').forEach(el => el.style.display = 'none');
    
    // 显示选中的页面
    const target = document.getElementById('phone-tab-' + tabName);
    if(target) {
        if(tabName === 'keypad') {
            target.style.display = 'flex'; // 键盘页需要 flex 布局
        } else {
            target.style.display = 'block';
        }
    }

    // 更新底部图标颜色
    document.querySelectorAll('.phone-tab-item').forEach(el => el.classList.remove('active'));
    
    // 映射表：图标索引 和 顶部标题
    const map = {
        'favorites': { index: 0, title: '个人收藏' },
        'recents':   { index: 1, title: '最近通话' },
        'contacts':  { index: 2, title: '通讯录' },
        'keypad':    { index: 3, title: '拨号键盘' },
        'voicemail': { index: 4, title: '语音留言' }
    };

    const config = map[tabName];
    if (config) {
        // 更新图标高亮
        const items = document.querySelectorAll('.phone-tab-item');
        if (items[config.index]) items[config.index].classList.add('active');
        
        // 🔥 更新顶部标题
        const titleEl = document.getElementById('phone-app-title');
        if (titleEl) titleEl.innerText = config.title;
    }
}


// 2. 拨号键盘输入
let currentNumber = "";

function pressKey(num) {
    if (currentNumber.length < 15) { // 限制长度
        currentNumber += num;
        updateDisplay();
    }
}

function deleteNumber() {
    currentNumber = currentNumber.slice(0, -1);
    updateDisplay();
}

function updateDisplay() {
    const display = document.getElementById('phone-number-display');
    if(display) display.innerText = currentNumber;
}

function makeCall() {
    if(currentNumber) {
        alert("正在呼叫 " + currentNumber + " ...");
    }
}

// ✅ 关键：把新函数挂载到 window 上，让 HTML 能找到它们！
window.switchPhoneTab = switchPhoneTab;
window.pressKey = pressKey;
window.deleteNumber = deleteNumber;
window.makeCall = makeCall;
/* ================= 角色与电话系统 (终极版) ================= */

// 1. 角色档案与状态 (新增了日程表)
const roleData = {
    name: "爱丽丝",
    number: "1314520",
    intimacy: 50,
    // 简单的日程表 (24小时制)
    schedule: {
        sleep: [23, 0, 1, 2, 3, 4, 5, 6, 7], // 睡觉时间 (拒接+留言)
        busy: [9, 10, 11, 14, 15, 16]        // 工作时间 (概率拒接)
    }
};

// 2. 聊天触发器 (保留了你的彩蛋逻辑)
function getRoleReply(userText) {
    // 彩蛋：问电话
    if (userText.includes("电话") || userText.includes("号码")) {
        if (roleData.intimacy > 10) {
            return `嗯...既然你这么想知道，记好了哦：${roleData.number}。不要随便打给我~`;
        } else {
            return "哼，现在还不想告诉你呢。";
        }
    }
    // 彩蛋：告白
    if (userText.includes("喜欢你") || userText.includes("爱你")) {
        roleData.intimacy += 5; 
        return "哎呀...突然说什么呢... (脸红)我也...我也挺喜欢你的。";
    }
    // 默认回复
    return "收到，我正在听呢。";
}

// 3. 通话记录与状态
let callHistory = []; 
let isCallConnected = false;
let callTimer = null;
let callSeconds = 0;

// ================= A. 拨打电话逻辑 (你打给角色) =================

window.makeCall = function() {
    const num = document.getElementById('phone-number-display').innerText;
    if (!num) return;

    // 显示呼叫界面
    showCallUI(num, "正在呼叫...");
    
    // 判断是否是角色
    if (num === roleData.number) {
        checkRoleAvailability();
    } else {
        // 陌生号码：3秒后自动挂断
        setTimeout(() => {
            alert("对方暂时无法接通");
            addCallRecord(num, "呼出", "未接通");
            endCall();
        }, 3000);
    }
};

// 检查角色是否有空接电话
function checkRoleAvailability() {
    const hour = new Date().getHours();
    
    // 1. 睡觉时间：直接拒接 -> 进语音信箱
    if (roleData.schedule.sleep.includes(hour)) {
        setTimeout(() => {
            document.getElementById('call-status').innerText = "对方忙线中...";
            setTimeout(() => enterVoicemailMode(), 2000);
        }, 3000);
        return;
    }

    // 2. 忙碌时间：50% 概率拒接
    if (roleData.schedule.busy.includes(hour) && Math.random() > 0.5) {
        setTimeout(() => {
            document.getElementById('call-status').innerText = "对方忙线中...";
            setTimeout(() => enterVoicemailMode(), 2000);
        }, 3000);
        return;
    }

    // 3. 其他时间：接通
    setTimeout(() => {
        connectCall();
    }, 2000);
}

// ================= B. 通话进行中逻辑 =================

// 接通电话
function connectCall() {
    isCallConnected = true;
    document.getElementById('call-status').innerText = "通话中 00:00";
    
    // 隐藏大头像，显示聊天列表和输入框
    document.getElementById('call-avatar-placeholder').style.display = 'none';
    document.getElementById('call-chat-list').style.display = 'flex';
    document.getElementById('call-input-bar').style.display = 'flex';
    
    // 角色先说话
    addCallBubble("friend", "喂？我是爱丽丝。");

    // 开始计时
    callSeconds = 0;
    callTimer = setInterval(() => {
        callSeconds++;
        const mins = Math.floor(callSeconds / 60).toString().padStart(2, '0');
        const secs = (callSeconds % 60).toString().padStart(2, '0');
        document.getElementById('call-status').innerText = `通话中 ${mins}:${secs}`;
    }, 1000);
}

// 发送文字通话内容
window.sendCallMsg = function() {
    const input = document.getElementById('call-text-input');
    const text = input.value.trim();
    if(!text) return;

    addCallBubble("me", text);
    input.value = "";

    // 模拟角色回复 (简单逻辑)
    setTimeout(() => {
        let reply = "嗯嗯，我在听。";
        if(text.includes("喜欢")) reply = "哎呀，电话里说这个多不好意思...";
        if(text.includes("吃饭")) reply = "还没吃呢，有点饿了。";
        if(text.includes("再见") || text.includes("挂")) {
            reply = "好，那先挂啦，拜拜~";
            setTimeout(endCall, 2000);
        }
        addCallBubble("friend", reply);
    }, 1500);
};

function addCallBubble(type, text) {
    const list = document.getElementById('call-chat-list');
    const div = document.createElement('div');
    div.className = `call-bubble ${type}`;
    div.innerText = text;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
}

// ================= C. 语音信箱逻辑 =================

function enterVoicemailMode() {
    document.getElementById('call-status').innerText = "请在嘀声后留言...";
    document.getElementById('call-avatar-placeholder').style.display = 'none';
    document.getElementById('call-voicemail-area').style.display = 'block';
    
    // 记录未接
    addCallRecord(roleData.name, "呼出", "拒接/留言");
}

window.sendVoicemail = function() {
    const text = document.getElementById('voicemail-input').value;
    if(!text) return;
    
    alert("留言已发送");
    endCall();
    
    // 模拟角色稍后回短信
    setTimeout(() => {
        alert(`收到新短信：\n爱丽丝："${text}" 收到啦！刚才在忙，一会回你。`);
    }, 5000);
};

// ================= D. 来电逻辑 (角色打给你) =================

// 测试用：在控制台输入 triggerIncomingCall() 即可触发
window.triggerIncomingCall = function() {
    document.getElementById('incoming-call-screen').style.display = 'flex';
    document.getElementById('incoming-name').innerText = roleData.name;
};

window.acceptIncomingCall = function() {
    document.getElementById('incoming-call-screen').style.display = 'none';
    showCallUI(roleData.name, "正在连接...");
    setTimeout(connectCall, 1000);
};

window.rejectIncomingCall = function() {
    document.getElementById('incoming-call-screen').style.display = 'none';
    addCallRecord(roleData.name, "呼入", "拒接");
    
    // 拒接后，角色不开心，发短信
    setTimeout(() => {
        alert("收到新短信：\n爱丽丝：为什么不接电话？哼！");
    }, 3000);
};

// ================= E. 通用辅助函数 =================

function showCallUI(name, status) {
    const screen = document.getElementById('call-screen');
    screen.style.display = 'flex';
    document.getElementById('call-name').innerText = name;
    document.getElementById('call-status').innerText = status;
    
    // 重置界面状态
    document.getElementById('call-avatar-placeholder').style.display = 'flex';
    document.getElementById('call-chat-list').style.display = 'none';
    document.getElementById('call-chat-list').innerHTML = ''; // 清空聊天
    document.getElementById('call-input-bar').style.display = 'none';
    document.getElementById('call-voicemail-area').style.display = 'none';
    document.getElementById('voicemail-input').value = '';
}

window.endCall = function() {
    document.getElementById('call-screen').style.display = 'none';
    clearInterval(callTimer);
    
    if(isCallConnected) {
        addCallRecord(document.getElementById('call-name').innerText, "呼出", document.getElementById('call-status').innerText);
    }
    isCallConnected = false;
    
    // 刷新最近通话列表
    renderRecents();
};

function addCallRecord(name, type, duration) {
    const time = new Date();
    const timeStr = `${time.getHours()}:${time.getMinutes().toString().padStart(2,'0')}`;
    callHistory.unshift({ name, type, duration, time: timeStr });
}

// 渲染最近通话列表
function renderRecents() {
    const container = document.getElementById('phone-tab-recents');
    if(!container) return;
    
    if(callHistory.length === 0) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary);">无通话记录</div>';
        return;
    }
    
    let html = '<div class="ios-list-container" style="margin-top:0;">';
    callHistory.forEach(call => {
        const color = call.type === '呼入' && call.duration === '拒接' ? '#FF3B30' : 'var(--text-primary)';
        const arrow = call.type === '呼出' ? '↗' : '↙';
        html += `
            <div class="list-row" style="padding:12px 15px;">
                <div style="flex:1;">
                    <div style="font-weight:bold; color:${color}">${call.name}</div>
                    <div style="font-size:12px; color:var(--text-secondary);">
                        ${arrow} ${call.type} · ${call.duration}
                    </div>
                </div>
                <div style="color:var(--text-secondary); font-size:14px;">${call.time}</div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// 覆盖 switchPhoneTab，加入刷新记录的功能
const originalSwitchTab = window.switchPhoneTab;
window.switchPhoneTab = function(tabName) {
    if (typeof originalSwitchTab === 'function') originalSwitchTab(tabName);
    if(tabName === 'recents') {
        renderRecents();
    }
};

// 导出所有新函数
window.getRoleReply = getRoleReply;
window.sendVoicemail = sendVoicemail;
window.triggerIncomingCall = triggerIncomingCall;
window.acceptIncomingCall = acceptIncomingCall;
window.rejectIncomingCall = rejectIncomingCall;
window.sendCallMsg = sendCallMsg;
window.endCall = endCall;
