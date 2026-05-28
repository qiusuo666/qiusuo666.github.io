// ============================================
// 搜索引擎配置
// ============================================
const ENGINES = [
    { name: 'Google',   url: 'https://www.google.com/search?q=',     icon: 'https://www.google.com/favicon.ico' },
    { name: '百度',     url: 'https://www.baidu.com/s?wd=',           icon: 'https://www.baidu.com/favicon.ico' },
    { name: 'Bing',     url: 'https://www.bing.com/search?q=',        icon: 'https://www.bing.com/favicon.ico' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=',          icon: 'https://duckduckgo.com/favicon.ico' },
    { name: 'Sogou',    url: 'https://www.sogou.com/web?query=',      icon: 'https://www.sogou.com/favicon.ico' },
    { name: '360',      url: 'https://www.so.com/s?q=',               icon: 'https://www.so.com/favicon.ico' }
];

// ============================================
// ============================================
// 状态管理
// ============================================
const STATE = {
    currentEngine: 0,
    history: [],
    defaultCategoryId: 'cat-default',
    categories: [],
    favorites: [],          // { id, name, url } — 主界面快捷栏
    dragData: null,         // { catId, linkId, fromFavorites: bool }
    dragFromFavorites: false,
    contextLinkId: null,
    contextCatId: null,
    editLinkId: null,
    editCatId: null
};

// ============================================
// DOM 引用
// ============================================
const $ = id => document.getElementById(id);
const clockTime = $('clockTime');
const clockDate = $('clockDate');
const searchInput = $('searchInput');
const searchBtn = $('searchBtn');
const engineSelector = $('engineSelector');
const engineDropdown = $('engineDropdown');
const currentEngineIcon = $('currentEngineIcon');
const currentEngineName = $('currentEngineName');
const searchHistoryDiv = $('searchHistory');
const historyTags = $('historyTags');
const clearHistoryBtn = $('clearHistory');
const mainView = $('mainView');
const linksView = $('linksView');
const linksContainer = $('linksContainer');
const modalOverlay = $('modalOverlay');
const modalClose = $('modalClose');
const modalCancel = $('modalCancel');
const modalConfirm = $('modalConfirm');
const linkNameInput = $('linkName');
const linkUrlInput = $('linkUrl');
const contextMenu = $('contextMenu');
const contextItems = $('contextItems');
const suggestions = $('suggestions');
const addCategoryBtn = $('addCategoryBtn');
const modalTitle = $('modalTitle');
const catNameInput = $('catNameInput');
const favoritesTrack = $('favoritesTrack');
const favDropHint = $('favDropHint');
const formLinkName = $('formLinkName');
const formLinkUrl = $('formLinkUrl');
const formCatName = $('formCatName');
const linkForm = $('linkForm');
const catForm = $('catForm');

// ============================================
// 工具函数
// ============================================
function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
}

function getFaviconUrl(url) {
    try { const u = new URL(url); return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`; }
    catch { return ''; }
}

// ============================================
// LocalStorage
// ============================================
function saveState() {
    try {
        localStorage.setItem('cst_data', JSON.stringify({
            categories: STATE.categories,
            history: STATE.history,
            currentEngine: STATE.currentEngine,
            favorites: STATE.favorites
        }));
    } catch (e) {}
}

function loadState() {
    try {
        const raw = localStorage.getItem('cst_data');
        if (raw) {
            const d = JSON.parse(raw);
            if (d.categories && d.categories.length > 0) STATE.categories = d.categories;
            if (d.history) STATE.history = d.history;
            if (d.currentEngine !== undefined) STATE.currentEngine = d.currentEngine;
            if (d.favorites) STATE.favorites = d.favorites;
            return;
        }
    } catch (e) {}
    // defaults
    STATE.currentEngine = 0;
    STATE.history = [];
    STATE.categories = [{
        id: STATE.defaultCategoryId,
        name: '常用',
        links: [
            { id: 'd1', name: 'GitHub',     url: 'https://github.com' },
            { id: 'd2', name: '哔哩哔哩',   url: 'https://www.bilibili.com' },
            { id: 'd3', name: 'YouTube',    url: 'https://www.youtube.com' },
            { id: 'd4', name: 'Twitter',    url: 'https://twitter.com' },
            { id: 'd5', name: 'Reddit',     url: 'https://www.reddit.com' },
            { id: 'd6', name: 'Stack Overflow', url: 'https://stackoverflow.com' },
            { id: 'd7', name: 'Wikipedia',  url: 'https://www.wikipedia.org' },
            { id: 'd8', name: 'Gmail',      url: 'https://mail.google.com' }
        ]
    }];
}

// ============================================
// 数字时钟
// ============================================
function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    clockTime.textContent = `${h}:${m}:${s}`;
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[now.getDay()];
    clockDate.textContent = `${year}年${month}月${day}日 ${weekday}`;
}

// ============================================
// 搜索引擎切换（修复版）
// ============================================
function renderEngines() {
    const selected = ENGINES[STATE.currentEngine];
    currentEngineIcon.src = selected.icon;
    currentEngineIcon.onerror = function() { this.style.display = 'none'; };
    currentEngineName.textContent = selected.name;

    engineDropdown.innerHTML = ENGINES.map((engine, i) =>
        `<div class="engine-option ${i === STATE.currentEngine ? 'active' : ''}" data-index="${i}">
            <img src="${engine.icon}" alt="" onerror="this.style.display='none'">
            <span>${engine.name}</span>
        </div>`
    ).join('');

    engineDropdown.querySelectorAll('.engine-option').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const i = parseInt(el.dataset.index, 10);
            STATE.currentEngine = i;
            saveState();
            renderEngines();
            closeEngineDropdown();
            searchInput.focus();
        });
    });
}

// ===== 引擎下拉菜单开关 =====
function openEngineDropdown() {
    engineSelector.classList.add('open');
}

function closeEngineDropdown() {
    engineSelector.classList.remove('open');
}

function toggleEngineDropdown() {
    if (engineSelector.classList.contains('open')) {
        closeEngineDropdown();
    } else {
        openEngineDropdown();
    }
}

// 点击引擎按钮切换下拉菜单
document.querySelector('.engine-current').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleEngineDropdown();
});

// 点击下拉菜单内的选项不关闭（由选项自己的 click 处理）
engineDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
});

// 点击页面其他任何地方关闭下拉菜单
document.addEventListener('click', () => {
    closeEngineDropdown();
});

// ============================================
// 搜索功能
// ============================================
function doSearch(query) {
    if (!query || !query.trim()) return;
    const q = query.trim();
    const engine = ENGINES[STATE.currentEngine];
    addHistory(q);
    window.open(engine.url + encodeURIComponent(q), '_blank');
    searchInput.value = '';
    closeSuggestions();
}

function addHistory(query) {
    STATE.history = STATE.history.filter(h => h !== query);
    STATE.history.unshift(query);
    if (STATE.history.length > 20) STATE.history.pop();
    saveState();
    renderHistory();
}

function removeHistory(query) {
    STATE.history = STATE.history.filter(h => h !== query);
    saveState();
    renderHistory();
}

function clearAllHistory() {
    STATE.history = [];
    saveState();
    renderHistory();
}

function renderHistory() {
    if (STATE.history.length === 0) {
        searchHistoryDiv.classList.remove('visible');
        return;
    }
    searchHistoryDiv.classList.add('visible');
    historyTags.innerHTML = STATE.history.map(q => `
        <div class="history-tag" data-query="${q}">
            <span>${q}</span>
            <span class="remove-history" data-query="${q}">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </span>
        </div>`
    ).join('');

    historyTags.querySelectorAll('.history-tag').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('.remove-history')) return;
            doSearch(el.dataset.query);
        });
    });
    historyTags.querySelectorAll('.remove-history').forEach(el => {
        el.addEventListener('click', (e) => { e.stopPropagation(); removeHistory(el.dataset.query); });
    });
}

clearHistoryBtn.addEventListener('click', clearAllHistory);

// 搜索框 Q弹拉长动效 — 仅在用户主动聚焦时触发
const searchBox = document.querySelector('.search-box');
searchInput.addEventListener('focus', () => { searchBox.classList.add('focused'); });
searchInput.addEventListener('blur', () => { searchBox.classList.remove('focused'); });

// 回车搜索
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); doSearch(searchInput.value); }
});
searchBtn.addEventListener('click', () => { doSearch(searchInput.value); });
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeSuggestions(); searchInput.blur(); }
});

// 搜索建议
let suggestTimer = null;
searchInput.addEventListener('input', () => {
    clearTimeout(suggestTimer);
    const val = searchInput.value.trim();
    if (!val) { closeSuggestions(); return; }
    suggestTimer = setTimeout(() => {
        const matches = STATE.history.filter(h => h.includes(val) && h !== val);
        if (matches.length > 0) showSuggestions(matches);
        else closeSuggestions();
    }, 200);
});

function showSuggestions(items) {
    suggestions.innerHTML = items.map(q => `
        <div class="suggestion-item" data-query="${q}">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <span>${q}</span>
        </div>`
    ).join('');
    suggestions.classList.add('active');
    suggestions.querySelectorAll('.suggestion-item').forEach(el => {
        el.addEventListener('mousedown', (e) => { e.preventDefault(); doSearch(el.dataset.query); });
    });
}

function closeSuggestions() {
    suggestions.classList.remove('active');
    suggestions.innerHTML = '';
}

// ============================================
// 视图切换
// ============================================
// 壁纸引用（初始化在底部定义，这里需要先声明引用）
function showMainView() {
    mainView.classList.remove('hidden');
    linksView.classList.remove('active');
    closeContextMenu();
    // 壁纸：恢复清晰
    wallpaperImg.classList.remove('blurred');
    document.querySelector('.wallpaper').classList.remove('overlay-strong');
    // 不要再 focus！否则触发搜索框拉长动效
}

function showLinksView() {
    mainView.classList.add('hidden');
    linksView.classList.add('active');
    closeContextMenu();
    // 壁纸：降低饱和度/明度 + 略微放大 + 高斯模糊
    wallpaperImg.classList.add('blurred');
    document.querySelector('.wallpaper').classList.add('overlay-strong');
}

// 右键 -> 快捷网址页（主界面非输入区域）
document.addEventListener('contextmenu', (e) => {
    if (modalOverlay.classList.contains('active')) return;
    if (e.target.closest('.main-view') && !e.target.closest('input') && !e.target.closest('.search-engine-selector')) {
        e.preventDefault();
        showLinksView();
    }
});

// 左键空白返回主界面
document.addEventListener('mousedown', (e) => {
    if (modalOverlay.classList.contains('active')) return;
    if (linksView.classList.contains('active')) {
        if (e.target === linksView || e.target === linksContainer ||
            e.target.closest('.links-view-bg')) {
            showMainView();
            return;
        }
    }
});

// ============================================
// 颜色工具
// ============================================
const COLORS = [
    'linear-gradient(135deg, #6c5ce7, #a29bfe)',
    'linear-gradient(135deg, #fd79a8, #e84393)',
    'linear-gradient(135deg, #00cec9, #00b894)',
    'linear-gradient(135deg, #fdcb6e, #e17055)',
    'linear-gradient(135deg, #0984e3, #6c5ce7)',
    'linear-gradient(135deg, #e17055, #d63031)',
    'linear-gradient(135deg, #00b894, #00cec9)',
    'linear-gradient(135deg, #6c5ce7, #fd79a8)',
    'linear-gradient(135deg, #f9ca24, #f0932b)',
    'linear-gradient(135deg, #a29bfe, #6c5ce7)'
];

function getColorForName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash) % COLORS.length];
}

// ============================================
// 分类系统：渲染
// ============================================
function renderLinks() {
    linksContainer.innerHTML = '';

    STATE.categories.forEach((cat, catIdx) => {
        const section = document.createElement('div');
        section.className = 'cat-section';
        section.dataset.catId = cat.id;
        section.dataset.catIdx = catIdx;

        // 分类头部
        const header = document.createElement('div');
        header.className = 'cat-header';
        header.innerHTML = `
            <span class="cat-name">${cat.name}</span>
            <span class="cat-count">${cat.links.length}</span>
            <div class="cat-actions">
                <button class="cat-btn cat-rename" title="重命名分类">✎</button>
                ${cat.id !== STATE.defaultCategoryId ? `<button class="cat-btn cat-delete" title="删除分类">✕</button>` : ''}
            </div>
        `;

        // 右键菜单 on header
        header.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            STATE.contextCatId = cat.id;
            STATE.contextLinkId = null;
            showContextMenu(e.clientX, e.clientY, null, cat.id);
        });

        // 点击重命名
        header.querySelector('.cat-rename')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openCatRenameModal(cat.id);
        });

        // 点击删除分类
        header.querySelector('.cat-delete')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`确定删除分类「${cat.name}」及其所有网址？`)) {
                STATE.categories = STATE.categories.filter(c => c.id !== cat.id);
                saveState();
                renderLinks();
            }
        });

        section.appendChild(header);

        // 拖拽放置区
        section.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        section.addEventListener('dragenter', (e) => { e.preventDefault(); section.classList.add('drag-target'); });
        section.addEventListener('dragleave', (e) => { section.classList.remove('drag-target'); });
        section.addEventListener('drop', (e) => {
            e.preventDefault();
            section.classList.remove('drag-target');
            handleDropOnCategory(cat.id);
        });

        // 网格
        const grid = document.createElement('div');
        grid.className = 'links-grid';
        grid.dataset.catId = cat.id;

        cat.links.forEach(link => {
            const card = document.createElement('a');
            card.className = 'link-card';
            card.href = link.url;
            card.target = '_blank';
            card.dataset.id = link.id;
            card.dataset.catId = cat.id;
            card.draggable = true;
            card.innerHTML = `
                <div class="card-icon" style="background:${getColorForName(link.name)}">${link.name.charAt(0).toUpperCase()}</div>
                <span class="card-name">${link.name}</span>
                <div class="card-remove" data-id="${link.id}" data-cat-id="${cat.id}">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </div>`;

            // 删除按钮
            card.querySelector('.card-remove').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                removeLink(link.id, cat.id);
            });

            // 拖拽
            card.addEventListener('dragstart', (e) => {
                STATE.dragData = { catId: cat.id, linkId: link.id };
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', link.id);
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                document.querySelectorAll('.link-card').forEach(c => c.classList.remove('drag-over'));
                STATE.dragData = null;
            });
            card.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
            card.addEventListener('dragenter', (e) => { e.preventDefault(); if (card.dataset.id !== STATE.dragData?.linkId) card.classList.add('drag-over'); });
            card.addEventListener('dragleave', () => { card.classList.remove('drag-over'); });
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                if (!STATE.dragData) return;
                if (STATE.dragData.linkId === link.id) return;
                // 同分类拖拽排序
                if (STATE.dragData.catId === cat.id) {
                    const fromIdx = cat.links.findIndex(l => l.id === STATE.dragData.linkId);
                    const toIdx = cat.links.findIndex(l => l.id === link.id);
                    if (fromIdx === -1 || toIdx === -1) return;
                    const [moved] = cat.links.splice(fromIdx, 1);
                    cat.links.splice(toIdx, 0, moved);
                    saveState();
                    renderLinks();
                } else {
                    // 跨分类拖拽
                    const fromCat = STATE.categories.find(c => c.id === STATE.dragData.catId);
                    if (!fromCat) return;
                    const li = fromCat.links.find(l => l.id === STATE.dragData.linkId);
                    if (!li) return;
                    fromCat.links = fromCat.links.filter(l => l.id !== STATE.dragData.linkId);
                    const toIdx = cat.links.findIndex(l => l.id === link.id);
                    cat.links.splice(toIdx, 0, { ...li });
                    saveState();
                    renderLinks();
                }
            });

            // 卡片右键
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                STATE.contextLinkId = link.id;
                STATE.contextCatId = cat.id;
                showContextMenu(e.clientX, e.clientY, link.id, cat.id);
            });

            grid.appendChild(card);
        });

        // + 添加链接按钮（每个分类底部）
        const addLinkBtn = document.createElement('div');
        addLinkBtn.className = 'add-card';
        addLinkBtn.innerHTML = '<div class="add-icon">+</div><span class="add-text">添加</span>';
        addLinkBtn.addEventListener('click', () => {
            STATE.editLinkId = null;
            STATE.editCatId = cat.id;
            linkNameInput.value = '';
            linkUrlInput.value = '';
            modalTitle.textContent = `添加网址到「${cat.name}」`;
            modalConfirm.textContent = '添加';
            linkForm.style.display = 'block';
            catForm.style.display = 'none';
            openModal();
        });
        grid.appendChild(addLinkBtn);

        section.appendChild(grid);
        linksContainer.appendChild(section);
    });
}

// ============================================
// 拖拽到分类空白区
// ============================================
function handleDropOnCategory(targetCatId) {
    if (!STATE.dragData) return;
    const fromCat = STATE.categories.find(c => c.id === STATE.dragData.catId);
    const toCat = STATE.categories.find(c => c.id === targetCatId);
    if (!fromCat || !toCat) return;
    if (STATE.dragData.catId === targetCatId) return; // 同分类拖到空白区不做操作
    const li = fromCat.links.find(l => l.id === STATE.dragData.linkId);
    if (!li) return;
    fromCat.links = fromCat.links.filter(l => l.id !== STATE.dragData.linkId);
    toCat.links.push({ ...li });
    saveState();
    renderLinks();
}

// ============================================
// 添加/删除/编辑链接
// ============================================
function removeLink(linkId, catId) {
    const cat = STATE.categories.find(c => c.id === catId);
    if (!cat) return;
    cat.links = cat.links.filter(l => l.id !== linkId);
    saveState();
    renderLinks();
}

function addOrEditLink(name, url) {
    const cat = STATE.categories.find(c => c.id === STATE.editCatId);
    if (!cat) return;
    if (STATE.editLinkId) {
        const idx = cat.links.findIndex(l => l.id === STATE.editLinkId);
        if (idx !== -1) { cat.links[idx].name = name; cat.links[idx].url = url; }
    } else {
        cat.links.push({ id: generateId(), name, url });
    }
    saveState();
    renderLinks();
    closeModal();
}

// ============================================
// 分类重命名
// ============================================
function openCatRenameModal(catId) {
    const cat = STATE.categories.find(c => c.id === catId);
    if (!cat) return;
    STATE.editCatId = catId;
    catNameInput.value = cat.name;
    modalTitle.textContent = '重命名分类';
    modalConfirm.textContent = '保存';
    linkForm.style.display = 'none';
    catForm.style.display = 'block';
    openModal();
}

function saveCatName(name) {
    const cat = STATE.categories.find(c => c.id === STATE.editCatId);
    if (!cat) return;
    cat.name = name;
    saveState();
    renderLinks();
    closeModal();
}

// ============================================
// 新建分类
// ============================================
function createNewCategory() {
    STATE.editCatId = null;
    catNameInput.value = '';
    modalTitle.textContent = '新建分类';
    modalConfirm.textContent = '创建';
    linkForm.style.display = 'none';
    catForm.style.display = 'block';
    openModal();
}

addCategoryBtn?.addEventListener('click', createNewCategory);

// ============================================
// 模态框
// ============================================
function openModal() {
    modalOverlay.classList.add('active');
    setTimeout(() => {
        if (linkForm.style.display !== 'none') linkNameInput.focus();
        else catNameInput.focus();
    }, 200);
}

function closeModal() {
    modalOverlay.classList.remove('active');
    STATE.editLinkId = null;
    STATE.editCatId = null;
}

modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('mousedown', (e) => { if (e.target === modalOverlay) closeModal(); });

// 链接表单提交
modalConfirm.addEventListener('click', () => {
    if (linkForm.style.display !== 'none') {
        const name = linkNameInput.value.trim();
        let url = linkUrlInput.value.trim();
        if (!name || !url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
        try { new URL(url); } catch { return; }
        addOrEditLink(name, url);
    } else {
        const name = catNameInput.value.trim();
        if (!name) return;
        if (STATE.editCatId) {
            saveCatName(name);
        } else {
            STATE.categories.push({ id: generateId(), name, links: [] });
            saveState();
            renderLinks();
            closeModal();
        }
    }
});

// 回车
linkUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); modalConfirm.click(); } });
linkNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); linkUrlInput.focus(); } });
catNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); modalConfirm.click(); } });

// ============================================
// 右键菜单
// ============================================
function showContextMenu(x, y, linkId, catId) {
    contextItems.innerHTML = '';
    if (linkId) {
        contextItems.innerHTML += '<div class="context-item danger" data-action="delete-link">删除此网址</div>';
        contextItems.innerHTML += '<div class="context-item" data-action="edit-link">编辑网址</div>';
    }
    if (catId) {
        contextItems.innerHTML += '<div class="context-item" data-action="rename-cat">重命名分类</div>';
        if (catId !== STATE.defaultCategoryId) {
            contextItems.innerHTML += '<div class="context-item danger" data-action="delete-cat">删除分类</div>';
        }
    }

    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) contextMenu.style.left = (x - rect.width) + 'px';
    if (rect.bottom > window.innerHeight) contextMenu.style.top = (y - rect.height) + 'px';
    contextMenu.classList.add('active');

    contextItems.querySelectorAll('.context-item').forEach(el => {
        el.addEventListener('click', () => {
            const action = el.dataset.action;
            if (action === 'delete-link' && STATE.contextLinkId && STATE.contextCatId) {
                removeLink(STATE.contextLinkId, STATE.contextCatId);
            } else if (action === 'edit-link' && STATE.contextLinkId && STATE.contextCatId) {
                const cat = STATE.categories.find(c => c.id === STATE.contextCatId);
                const link = cat?.links.find(l => l.id === STATE.contextLinkId);
                if (link) {
                    STATE.editLinkId = link.id;
                    STATE.editCatId = STATE.contextCatId;
                    linkNameInput.value = link.name;
                    linkUrlInput.value = link.url;
                    modalTitle.textContent = '编辑网址';
                    modalConfirm.textContent = '保存';
                    linkForm.style.display = 'block';
                    catForm.style.display = 'none';
                    openModal();
                }
            } else if (action === 'rename-cat' && STATE.contextCatId) {
                openCatRenameModal(STATE.contextCatId);
            } else if (action === 'delete-cat' && STATE.contextCatId) {
                const cat = STATE.categories.find(c => c.id === STATE.contextCatId);
                if (cat && confirm(`确定删除分类「${cat.name}」及其所有网址？`)) {
                    STATE.categories = STATE.categories.filter(c => c.id !== STATE.contextCatId);
                    saveState();
                    renderLinks();
                }
            }
            closeContextMenu();
        });
    });
}

function closeContextMenu() {
    contextMenu.classList.remove('active');
    STATE.contextLinkId = null;
    STATE.contextCatId = null;
}

// ESC 键
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (modalOverlay.classList.contains('active')) closeModal();
        else if (linksView.classList.contains('active')) showMainView();
        else closeContextMenu();
    }
});

// 点击其他位置关闭右键菜单
document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.context-menu')) closeContextMenu();
});

// 阻止卡片上的链接跳转的右键菜单
linksContainer.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.link-card') || e.target.closest('.cat-header')) {
        e.preventDefault();
    }
});

// ============================================
// 快捷栏（主界面）渲染
// ============================================
function renderFavorites() {
    // 清除现有的卡片（保留 drop-hint）
    favoritesTrack.querySelectorAll('.fav-card').forEach(el => el.remove());

    if (STATE.favorites.length === 0) {
        favDropHint.style.display = 'block';
        return;
    }
    favDropHint.style.display = 'none';

    STATE.favorites.forEach(fav => {
        const card = document.createElement('a');
        card.className = 'fav-card';
        card.href = fav.url;
        card.target = '_blank';
        card.dataset.id = fav.id;
        card.draggable = true;
        card.innerHTML = `
            <div class="fav-icon" style="background:${getColorForName(fav.name)}">${fav.name.charAt(0).toUpperCase()}</div>
            <span class="fav-name">${fav.name}</span>
            <div class="fav-remove" data-id="${fav.id}">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </div>`;

        // 点击删除
        card.querySelector('.fav-remove').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            STATE.favorites = STATE.favorites.filter(f => f.id !== fav.id);
            saveState();
            renderFavorites();
        });

        // 拖拽 — 从快捷栏拖走 = 删除
        card.addEventListener('dragstart', (e) => {
            STATE.dragData = { linkId: fav.id, fromFavorites: true };
            card.style.opacity = '0.3';
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', fav.id);
        });
        card.addEventListener('dragend', () => {
            card.style.opacity = '';
            STATE.dragData = null;
        });

        // 放到快捷栏内的卡片之间 → 排序
        card.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        card.addEventListener('dragenter', (e) => { e.preventDefault(); card.classList.add('drag-target'); });
        card.addEventListener('dragleave', () => { card.classList.remove('drag-target'); });
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-target');
            if (!STATE.dragData) return;
            const fromId = STATE.dragData.linkId;
            const toId = fav.id;
            if (fromId === toId) return;
            if (STATE.dragData.fromFavorites) {
                // 快捷栏内排序
                const fromIdx = STATE.favorites.findIndex(f => f.id === fromId);
                const toIdx = STATE.favorites.findIndex(f => f.id === toId);
                if (fromIdx === -1 || toIdx === -1) return;
                const [moved] = STATE.favorites.splice(fromIdx, 1);
                STATE.favorites.splice(toIdx, 0, moved);
            } else {
                // 从分类拖到快捷栏的某个卡片位置 = 添加 + 排到该位置
                const fromCat = STATE.categories.find(c => c.id === STATE.dragData.catId);
                if (!fromCat) return;
                const li = fromCat.links.find(l => l.id === STATE.dragData.linkId);
                if (!li) return;
                // 检查是否已存在
                if (STATE.favorites.find(f => f.id === li.id)) return;
                const toIdx = STATE.favorites.findIndex(f => f.id === toId);
                STATE.favorites.splice(toIdx, 0, { id: li.id, name: li.name, url: li.url });
            }
            saveState();
            renderFavorites();
        });

        favoritesTrack.appendChild(card);
    });
}

// 快捷栏作为拖拽放置区（拖到空白处）
favoritesTrack.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    favoritesTrack.classList.add('drag-over');
});
favoritesTrack.addEventListener('dragleave', (e) => {
    if (!e.target.closest('#favoritesTrack')) {
        favoritesTrack.classList.remove('drag-over');
    }
});
favoritesTrack.addEventListener('drop', (e) => {
    e.preventDefault();
    favoritesTrack.classList.remove('drag-over');
    if (!STATE.dragData || STATE.dragData.fromFavorites) return;
    const fromCat = STATE.categories.find(c => c.id === STATE.dragData.catId);
    if (!fromCat) return;
    const li = fromCat.links.find(l => l.id === STATE.dragData.linkId);
    if (!li) return;
    if (STATE.favorites.find(f => f.id === li.id)) return;
    STATE.favorites.push({ id: li.id, name: li.name, url: li.url });
    saveState();
    renderFavorites();
});

// 鼠标滚轮横向滚动
favoritesTrack.addEventListener('wheel', (e) => {
    // 如果内容不足以滚动，不做处理
    if (favoritesTrack.scrollWidth <= favoritesTrack.clientWidth) return;
    e.preventDefault();
    // 滚轮垂直量转换为横向滚动（灵敏度可调）
    favoritesTrack.scrollLeft += e.deltaY;
    // 同时处理部分鼠标的 deltaX
    favoritesTrack.scrollLeft += e.deltaX;
});

// ============================================
// 背景图系统
// ============================================
const PRESET_BG = [
    { file: 'wallhaven-yqvj5g_3840x2160.jpg', name: '梵高·星空' },
    { file: 'wallhaven-7pje5o_3840x2160.jpg', name: '暮光森林' },
    { file: 'wallhaven-k8z1q7_3840x2160.jpg', name: '樱花街道' },
    { file: 'wallhaven-qrgj6l_3840x2160.jpg', name: '海岸晚霞' },
    { file: 'wallhaven-rqjrzq_3840x2160.jpg', name: '雪山镜湖' },
];

let customBgFiles = [];  // { name, dataURL }
const DEFAULT_BG = PRESET_BG[0].file;

const wallpaperImg = $('wallpaperImg');
const bgPanel = $('bgPanel');
const bgPanelGrid = $('bgPanelGrid');
const bgSettingsBtn = $('bgSettingsBtn');
const bgPanelClose = $('bgPanelClose');
const bgFileInput = $('bgFileInput');

function loadWallpaper() {
    const bg = localStorage.getItem('cst_wallpaper') || DEFAULT_BG;
    const custom = localStorage.getItem('cst_custom_bg');
    if (custom) { try { customBgFiles = JSON.parse(custom); } catch {} }

    if (bg.startsWith('data:')) {
        wallpaperImg.style.backgroundImage = `url(${bg})`;
    } else {
        wallpaperImg.style.backgroundImage = `url(photos/${bg})`;
    }
    // 延迟淡入，避免闪白
    setTimeout(() => wallpaperImg.classList.add('show'), 100);
}

function setWallpaper(src) {
    wallpaperImg.style.backgroundImage = `url(${src})`;
    localStorage.setItem('cst_wallpaper', src.startsWith('data:') ? src : src.replace('photos/', ''));
}

function renderBgPanel() {
    bgPanelGrid.innerHTML = '';
    const currentBg = localStorage.getItem('cst_wallpaper') || DEFAULT_BG;

    [...PRESET_BG, ...customBgFiles.map(f => ({ ...f, isCustom: true }))].forEach(bg => {
        const src = bg.isCustom ? bg.dataURL : `photos/${bg.file}`;
        const key = bg.isCustom ? bg.dataURL : bg.file;
        const isActive = currentBg === key || (currentBg === src);

        const card = document.createElement('div');
        card.className = `bg-preview ${isActive ? 'active' : ''}`;
        card.innerHTML = `
            <img src="${src}" alt="">
            <div class="bg-preview-name">${bg.name}</div>
            <div class="bg-preview-badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>
            ${bg.isCustom ? '<button class="bg-delete-btn">✕</button>' : ''}
        `;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.bg-delete-btn')) return;
            setWallpaper(bg.isCustom ? bg.dataURL : bg.file);
            loadWallpaper();
            renderBgPanel();
        });

        if (bg.isCustom) {
            card.querySelector('.bg-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                customBgFiles = customBgFiles.filter(f => f.dataURL !== bg.dataURL);
                localStorage.setItem('cst_custom_bg', JSON.stringify(customBgFiles));
                if (currentBg === bg.dataURL) {
                    setWallpaper(DEFAULT_BG);
                    loadWallpaper();
                }
                renderBgPanel();
            });
        }

        bgPanelGrid.appendChild(card);
    });
}

// 打开/关闭面板
bgSettingsBtn.addEventListener('click', () => {
    renderBgPanel();
    bgPanel.classList.add('open');
});
bgPanelClose.addEventListener('click', () => bgPanel.classList.remove('open'));
// 点击面板外部关闭
document.addEventListener('mousedown', (e) => {
    if (bgPanel.classList.contains('open') &&
        !e.target.closest('.bg-panel') &&
        !e.target.closest('.bg-settings-btn')) {
        bgPanel.classList.remove('open');
    }
});

// 自定义上传
bgFileInput.addEventListener('change', () => {
    const file = bgFileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const dataURL = reader.result;
        customBgFiles.push({ name: file.name.replace(/\.[^.]+$/, ''), dataURL });
        if (customBgFiles.length > 10) customBgFiles.shift();
        localStorage.setItem('cst_custom_bg', JSON.stringify(customBgFiles));
        setWallpaper(dataURL);
        loadWallpaper();
        renderBgPanel();
    };
    reader.readAsDataURL(file);
    bgFileInput.value = '';
});

// ============================================
// 磁性流体光标系统
// ============================================
(function() {
    const canvas = document.getElementById('cursorCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w, h;
    // 实际鼠标位置
    let mx = 0, my = 0;
    // lerp 跟随的光标位置（平滑延迟跟随）
    let cursor = { x: 0, y: 0 };
    // 外层环的延迟位置
    let ring = { x: 0, y: 0, rx: 20, ry: 20 };

    // 粒子池：卫星粒子
    const satellites = [];
    const SATELLITE_COUNT = 7;

    // 鼠标移出窗口标记
    let mouseOnScreen = false;

    // 悬停状态
    let hoverTarget = null;
    let hoverRect = null;

    // ====== resize ======
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize);

    // ====== 鼠标追踪 ======
    document.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        mouseOnScreen = true;
    });
    document.addEventListener('mouseleave', () => { mouseOnScreen = false; });
    document.addEventListener('mouseenter', () => { mouseOnScreen = true; mx = cursor.x; my = cursor.y; });

    // ====== 悬停检测 ======
    function getHoverTarget(x, y) {
        const els = document.querySelectorAll('.fav-card, .link-card, .add-card, .search-btn, .engine-current, .bg-settings-btn, .btn, .modal-close, .history-tag, .context-item, .cat-btn, .add-cat-btn, .clear-history');
        for (const el of els) {
            const rect = el.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return { el, rect };
            }
        }
        return null;
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    // ====== 初始化卫星 ======
    for (let i = 0; i < SATELLITE_COUNT; i++) {
        satellites.push({
            angle: (Math.PI * 2 / SATELLITE_COUNT) * i,
            radius: 18 + Math.random() * 8,    // 基础半径 18-26px
            speed: 0.5 + Math.random() * 0.3,   // 旋转速度
            jitter: Math.random() * Math.PI * 2,
            size: 2 + Math.random() * 2,        // 粒子大小 2-4px
            alpha: 0.6 + Math.random() * 0.4,
            colorBoost: Math.random()           // 颜色混合系数
        });
    }

    // ====== 主循环 ======
    function draw() {
        ctx.clearRect(0, 0, w, h);

        // 悬停检测
        const target = getHoverTarget(cursor.x, cursor.y);
        hoverTarget = target?.el || null;
        hoverRect = target?.rect || null;

        // lerp 光标层（第一层）
        const lerpSpeed = hoverTarget ? 0.25 : 0.2;
        cursor.x = lerp(cursor.x, mx, lerpSpeed);
        cursor.y = lerp(cursor.y, my, lerpSpeed);

        // lerp 外环（第三层）- 更大的延迟
        const ringSpeed = hoverTarget ? 0.35 : 0.08;
        ring.x = lerp(ring.x, mx, ringSpeed);
        ring.y = lerp(ring.y, my, ringSpeed);

        // 运动方向对椭圆环的影响
        const dx = mx - ring.x;
        const dy = my - ring.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const targetRX = 88 + Math.min(dist * 0.3, 60);
        const targetRY = 88 - Math.min(dist * 0.3, 50);
        ring.rx = lerp(ring.rx, Math.max(targetRY, 20), 0.1);
        ring.ry = lerp(ring.ry, Math.max(targetRY, 20), 0.1);

        // 悬停时的目标
        let attractX = cursor.x, attractY = cursor.y;
        if (hoverTarget && hoverRect) {
            attractX = (hoverRect.left + hoverRect.right) / 2;
            attractY = (hoverRect.top + hoverRect.bottom) / 2;
        }

        if (!mouseOnScreen) return requestAnimationFrame(draw);

        // ---- 第三层：外环描边 ----
        ctx.save();
        ctx.beginPath();
        const rx = hoverTarget ? Math.min(hoverRect.width / 2 + 4, 50) : ring.rx;
        const ry = hoverTarget ? Math.min(hoverRect.height / 2 + 4, 50) : ring.ry;
        const cx = hoverTarget ? attractX : ring.x;
        const cy = hoverTarget ? attractY : ring.y;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(99, 179, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(99, 179, 255, 0.3)';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();

        // ---- 第二层：模糊光晕 ----
        const glowGrad = ctx.createRadialGradient(
            attractX, attractY, 0,
            attractX, attractY, hoverTarget ? 40 : 55
        );
        glowGrad.addColorStop(0, 'rgba(99, 179, 255, 0.18)');
        glowGrad.addColorStop(0.5, 'rgba(120, 200, 255, 0.06)');
        glowGrad.addColorStop(1, 'rgba(99, 179, 255, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(attractX, attractY, hoverTarget ? 40 : 55, 0, Math.PI * 2);
        ctx.fill();

        // ---- 第一层：卫星粒子 ----
        for (const s of satellites) {
            s.angle += s.speed * 0.05;
            const a = s.angle + s.jitter;
            const r = hoverTarget ? s.radius * 0.4 : s.radius;
            const px = attractX + Math.cos(a) * r;
            const py = attractY + Math.sin(a) * r;

            const grad = ctx.createRadialGradient(px, py, 0, px, py, s.size * 2);
            const b = s.colorBoost;
            grad.addColorStop(0, `rgba(${180 + b * 75}, ${220 - b * 60}, 255, ${s.alpha})`);
            grad.addColorStop(1, 'rgba(99, 179, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, s.size * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // ---- 鼠标替换点 ----
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        requestAnimationFrame(draw);
    }

    resize();
    // 初始位置设为屏幕中心
    cursor.x = w / 2; cursor.y = h / 2;
    ring.x = w / 2; ring.y = h / 2;
    mx = w / 2; my = h / 2;
    draw();
    console.log('🖱️ 磁性流体光标已启动');
})();

// ============================================
// 初始化
// ============================================
function init() {
    loadState();
    loadWallpaper();

    renderEngines();
    renderLinks();
    renderFavorites();
    renderHistory();
    updateClock();

    setInterval(updateClock, 1000);

    const style = document.createElement('style');
    style.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-4px)}20%,40%,60%,80%{transform:translateX(4px)}}.shake{animation:shake .4s ease}`;
    document.head.appendChild(style);

    console.log('✨ 新标签页已加载');
}

document.addEventListener('DOMContentLoaded', init);
