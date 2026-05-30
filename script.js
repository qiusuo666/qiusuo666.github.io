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
// 状态管理
// ============================================
const STATE = {
    currentEngine: 0,
    history: [],
    defaultCategoryId: 'cat-default',
    categories: [],
    favorites: [],
    dragData: null,
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

// Auth DOM refs
const authBtn = $('authBtn');
const userDropdown = $('userDropdown');
const userDropdownName = $('userDropdownName');
const userDropdownSync = $('userDropdownSync');
const authModalOverlay = $('authModalOverlay');
const authModalTitle = $('authModalTitle');
const authModalSubtitle = $('authModalSubtitle');
const authUsername = $('authUsername');
const authPassword = $('authPassword');
const authConfirmPasswordGroup = $('authConfirmPasswordGroup');
const authConfirmPassword = $('authConfirmPassword');
const authOldPasswordGroup = $('authOldPasswordGroup');
const authOldPassword = $('authOldPassword');
const authNewPasswordGroup = $('authNewPasswordGroup');
const authNewPassword = $('authNewPassword');
const authRememberLabel = $('authRememberLabel');
const authRememberMe = $('authRememberMe');
const authError = $('authError');
const authSubmitBtn = $('authSubmitBtn');
const authSwitchText = $('authSwitchText');
const authSwitchBtn = $('authSwitchBtn');
const syncToast = $('syncToast');

// Auth state
let authMode = 'login';
let isLoggedIn = false;
let currentUser = null;
let syncDebounceTimer = null;
let lastSyncTime = null;
let isSyncing = false;
const SYNC_DEBOUNCE = 3000;

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
// 工具
// ============================================
function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
}

// ============================================
// 存储
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
    if (isLoggedIn && !isSyncing) {
        clearTimeout(syncDebounceTimer);
        syncDebounceTimer = setTimeout(() => uploadToCloud(), SYNC_DEBOUNCE);
    }
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
    STATE.currentEngine = 0;
    STATE.history = [];
    STATE.categories = [{
        id: STATE.defaultCategoryId,
        name: '常用',
        links: [
            { id: 'd1', name: 'GitHub', url: 'https://github.com' },
            { id: 'd2', name: '哔哩哔哩', url: 'https://www.bilibili.com' },
            { id: 'd3', name: 'YouTube', url: 'https://www.youtube.com' },
            { id: 'd4', name: 'Twitter', url: 'https://twitter.com' },
            { id: 'd5', name: 'Reddit', url: 'https://www.reddit.com' },
            { id: 'd6', name: 'Stack Overflow', url: 'https://stackoverflow.com' },
            { id: 'd7', name: 'Wikipedia', url: 'https://www.wikipedia.org' },
            { id: 'd8', name: 'Gmail', url: 'https://mail.google.com' }
        ]
    }];
}

// ============================================
// 时钟
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
// 搜索引擎
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

function openEngineDropdown() { engineSelector.classList.add('open'); }
function closeEngineDropdown() { engineSelector.classList.remove('open'); }
function toggleEngineDropdown() { engineSelector.classList.contains('open') ? closeEngineDropdown() : openEngineDropdown(); }

document.querySelector('.engine-current').addEventListener('click', (e) => { e.stopPropagation(); toggleEngineDropdown(); });
engineDropdown.addEventListener('click', (e) => { e.stopPropagation(); });
document.addEventListener('click', () => { closeEngineDropdown(); });

// ============================================
// 搜索
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

function addHistory(query) { STATE.history = STATE.history.filter(h => h !== query); STATE.history.unshift(query); if (STATE.history.length > 20) STATE.history.pop(); saveState(); renderHistory(); }
function removeHistory(query) { STATE.history = STATE.history.filter(h => h !== query); saveState(); renderHistory(); }
function clearAllHistory() { STATE.history = []; saveState(); renderHistory(); }

function renderHistory() {
    if (STATE.history.length === 0) { searchHistoryDiv.classList.remove('visible'); return; }
    searchHistoryDiv.classList.add('visible');
    historyTags.innerHTML = STATE.history.map(q => `
        <div class="history-tag" data-query="${q}">
            <span>${q}</span>
            <span class="remove-history" data-query="${q}">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </span>
        </div>`).join('');
    historyTags.querySelectorAll('.history-tag').forEach(el => {
        el.addEventListener('click', (e) => { if (e.target.closest('.remove-history')) return; doSearch(el.dataset.query); });
    });
    historyTags.querySelectorAll('.remove-history').forEach(el => {
        el.addEventListener('click', (e) => { e.stopPropagation(); removeHistory(el.dataset.query); });
    });
}
clearHistoryBtn.addEventListener('click', clearAllHistory);

const searchBox = document.querySelector('.search-box');
searchInput.addEventListener('focus', () => { searchBox.classList.add('focused'); });
searchInput.addEventListener('blur', () => { searchBox.classList.remove('focused'); });
searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch(searchInput.value); } });
searchBtn.addEventListener('click', () => { doSearch(searchInput.value); });
searchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSuggestions(); searchInput.blur(); } });

let suggestTimer = null;
searchInput.addEventListener('input', () => {
    clearTimeout(suggestTimer);
    const val = searchInput.value.trim();
    if (!val) { closeSuggestions(); return; }
    suggestTimer = setTimeout(() => {
        const matches = STATE.history.filter(h => h.includes(val) && h !== val);
        matches.length > 0 ? showSuggestions(matches) : closeSuggestions();
    }, 200);
});

function showSuggestions(items) {
    suggestions.innerHTML = items.map(q => `<div class="suggestion-item" data-query="${q}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg><span>${q}</span></div>`).join('');
    suggestions.classList.add('active');
    suggestions.querySelectorAll('.suggestion-item').forEach(el => { el.addEventListener('mousedown', (e) => { e.preventDefault(); doSearch(el.dataset.query); }); });
}
function closeSuggestions() { suggestions.classList.remove('active'); suggestions.innerHTML = ''; }

// ============================================
// 视图
// ============================================
function showMainView() {
    mainView.classList.remove('hidden');
    linksView.classList.remove('active');
    closeContextMenu();
    wallpaperImg.classList.remove('blurred');
    document.querySelector('.wallpaper').classList.remove('overlay-strong');
}

function showLinksView() {
    mainView.classList.add('hidden');
    linksView.classList.add('active');
    closeContextMenu();
    wallpaperImg.classList.add('blurred');
    document.querySelector('.wallpaper').classList.add('overlay-strong');
}

document.addEventListener('contextmenu', (e) => {
    if (modalOverlay.classList.contains('active')) return;
    if (e.target.closest('.main-view') && !e.target.closest('input') && !e.target.closest('.search-engine-selector')) {
        e.preventDefault(); showLinksView();
    }
});

document.addEventListener('mousedown', (e) => {
    if (modalOverlay.classList.contains('active')) return;
    if (linksView.classList.contains('active') && (e.target === linksView || e.target === linksContainer || e.target.closest('.links-view-bg'))) {
        showMainView(); return;
    }
});

// ============================================
// 颜色
// ============================================
const COLORS = ['linear-gradient(135deg, #6c5ce7, #a29bfe)','linear-gradient(135deg, #fd79a8, #e84393)','linear-gradient(135deg, #00cec9, #00b894)','linear-gradient(135deg, #fdcb6e, #e17055)','linear-gradient(135deg, #0984e3, #6c5ce7)','linear-gradient(135deg, #e17055, #d63031)','linear-gradient(135deg, #00b894, #00cec9)','linear-gradient(135deg, #6c5ce7, #fd79a8)','linear-gradient(135deg, #f9ca24, #f0932b)','linear-gradient(135deg, #a29bfe, #6c5ce7)'];
function getColorForName(name) { let hash = 0; for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash); return COLORS[Math.abs(hash) % COLORS.length]; }

// ============================================
// 分类系统
// ============================================
function renderLinks() {
    linksContainer.innerHTML = '';
    STATE.categories.forEach((cat) => {
        const section = document.createElement('div'); section.className = 'cat-section'; section.dataset.catId = cat.id;
        const header = document.createElement('div'); header.className = 'cat-header';
        header.innerHTML = `<span class="cat-name">${cat.name}</span><span class="cat-count">${cat.links.length}</span><div class="cat-actions"><button class="cat-btn cat-rename" title="重命名分类">✎</button>${cat.id !== STATE.defaultCategoryId ? '<button class="cat-btn cat-delete" title="删除分类">✕</button>' : ''}</div>`;
        header.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); STATE.contextCatId = cat.id; STATE.contextLinkId = null; showContextMenu(e.clientX, e.clientY, null, cat.id); });
        header.querySelector('.cat-rename')?.addEventListener('click', (e) => { e.stopPropagation(); openCatRenameModal(cat.id); });
        header.querySelector('.cat-delete')?.addEventListener('click', (e) => { e.stopPropagation(); if (confirm(`确定删除分类「${cat.name}」及其所有网址？`)) { STATE.categories = STATE.categories.filter(c => c.id !== cat.id); saveState(); renderLinks(); } });
        section.appendChild(header);
        section.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        section.addEventListener('dragenter', (e) => { e.preventDefault(); section.classList.add('drag-target'); });
        section.addEventListener('dragleave', (e) => { section.classList.remove('drag-target'); });
        section.addEventListener('drop', (e) => { e.preventDefault(); section.classList.remove('drag-target'); handleDropOnCategory(cat.id); });

        const grid = document.createElement('div'); grid.className = 'links-grid'; grid.dataset.catId = cat.id;
        cat.links.forEach(link => {
            const card = document.createElement('a'); card.className = 'link-card'; card.href = link.url; card.target = '_blank'; card.dataset.id = link.id; card.dataset.catId = cat.id; card.draggable = true;
            card.innerHTML = `<div class="card-icon" style="background:${getColorForName(link.name)}">${link.name.charAt(0).toUpperCase()}</div><span class="card-name">${link.name}</span><div class="card-remove" data-id="${link.id}" data-cat-id="${cat.id}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></div>`;
            card.querySelector('.card-remove').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); removeLink(link.id, cat.id); });
            card.addEventListener('dragstart', (e) => { STATE.dragData = { catId: cat.id, linkId: link.id }; card.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', link.id); });
            card.addEventListener('dragend', () => { card.classList.remove('dragging'); STATE.dragData = null; });
            card.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
            card.addEventListener('dragenter', (e) => { e.preventDefault(); if (card.dataset.id !== STATE.dragData?.linkId) card.classList.add('drag-over'); });
            card.addEventListener('dragleave', () => { card.classList.remove('drag-over'); });
            card.addEventListener('drop', (e) => { e.preventDefault(); card.classList.remove('drag-over'); if (!STATE.dragData || STATE.dragData.linkId === link.id) return;
                if (STATE.dragData.catId === cat.id) { const fromIdx = cat.links.findIndex(l => l.id === STATE.dragData.linkId); const toIdx = cat.links.findIndex(l => l.id === link.id); const [moved] = cat.links.splice(fromIdx, 1); cat.links.splice(toIdx, 0, moved); } else { const fromCat = STATE.categories.find(c => c.id === STATE.dragData.catId); const li = fromCat?.links.find(l => l.id === STATE.dragData.linkId); if (!li) return; fromCat.links = fromCat.links.filter(l => l.id !== STATE.dragData.linkId); const toIdx = cat.links.findIndex(l => l.id === link.id); cat.links.splice(toIdx, 0, { ...li }); } saveState(); renderLinks(); });
            card.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); STATE.contextLinkId = link.id; STATE.contextCatId = cat.id; showContextMenu(e.clientX, e.clientY, link.id, cat.id); });
            grid.appendChild(card);
        });
        const addLinkBtn = document.createElement('div'); addLinkBtn.className = 'add-card'; addLinkBtn.innerHTML = '<div class="add-icon">+</div><span class="add-text">添加</span>';
        addLinkBtn.addEventListener('click', () => { STATE.editLinkId = null; STATE.editCatId = cat.id; linkNameInput.value = ''; linkUrlInput.value = ''; modalTitle.textContent = `添加网址到「${cat.name}」`; modalConfirm.textContent = '添加'; linkForm.style.display = 'block'; catForm.style.display = 'none'; openModal(); });
        grid.appendChild(addLinkBtn); section.appendChild(grid); linksContainer.appendChild(section);
    });
}

function handleDropOnCategory(targetCatId) {
    if (!STATE.dragData) return;
    const fromCat = STATE.categories.find(c => c.id === STATE.dragData.catId);
    const toCat = STATE.categories.find(c => c.id === targetCatId);
    if (!fromCat || !toCat || STATE.dragData.catId === targetCatId) return;
    const li = fromCat.links.find(l => l.id === STATE.dragData.linkId); if (!li) return;
    fromCat.links = fromCat.links.filter(l => l.id !== STATE.dragData.linkId); toCat.links.push({ ...li }); saveState(); renderLinks();
}

function removeLink(linkId, catId) { const cat = STATE.categories.find(c => c.id === catId); if (!cat) return; cat.links = cat.links.filter(l => l.id !== linkId); saveState(); renderLinks(); }
function addOrEditLink(name, url) { const cat = STATE.categories.find(c => c.id === STATE.editCatId); if (!cat) return; if (STATE.editLinkId) { const idx = cat.links.findIndex(l => l.id === STATE.editLinkId); if (idx !== -1) { cat.links[idx].name = name; cat.links[idx].url = url; } } else { cat.links.push({ id: generateId(), name, url }); } saveState(); renderLinks(); closeModal(); }
function openCatRenameModal(catId) { const cat = STATE.categories.find(c => c.id === catId); if (!cat) return; STATE.editCatId = catId; catNameInput.value = cat.name; modalTitle.textContent = '重命名分类'; modalConfirm.textContent = '保存'; linkForm.style.display = 'none'; catForm.style.display = 'block'; openModal(); }
function saveCatName(name) { const cat = STATE.categories.find(c => c.id === STATE.editCatId); if (!cat) return; cat.name = name; saveState(); renderLinks(); closeModal(); }
function createNewCategory() { STATE.editCatId = null; catNameInput.value = ''; modalTitle.textContent = '新建分类'; modalConfirm.textContent = '创建'; linkForm.style.display = 'none'; catForm.style.display = 'block'; openModal(); }
addCategoryBtn?.addEventListener('click', createNewCategory);

// ============================================
// 模态框
// ============================================
function openModal() { modalOverlay.classList.add('active'); setTimeout(() => { (linkForm.style.display !== 'none' ? linkNameInput : catNameInput).focus(); }, 200); }
function closeModal() { modalOverlay.classList.remove('active'); STATE.editLinkId = null; STATE.editCatId = null; }
modalClose.addEventListener('click', closeModal); modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('mousedown', (e) => { if (e.target === modalOverlay) closeModal(); });
modalConfirm.addEventListener('click', () => {
    if (linkForm.style.display !== 'none') { const name = linkNameInput.value.trim(); let url = linkUrlInput.value.trim(); if (!name || !url) return; if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url; try { new URL(url); } catch { return; } addOrEditLink(name, url); } else { const name = catNameInput.value.trim(); if (!name) return; if (STATE.editCatId) { saveCatName(name); } else { STATE.categories.push({ id: generateId(), name, links: [] }); saveState(); renderLinks(); closeModal(); } }
});
linkUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); modalConfirm.click(); } });
linkNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); linkUrlInput.focus(); } });
catNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); modalConfirm.click(); } });

// ============================================
// 右键菜单
// ============================================
function showContextMenu(x, y, linkId, catId) {
    contextItems.innerHTML = '';
    if (linkId) { contextItems.innerHTML += '<div class="context-item danger" data-action="delete-link">删除此网址</div><div class="context-item" data-action="edit-link">编辑网址</div>'; }
    if (catId) { contextItems.innerHTML += '<div class="context-item" data-action="rename-cat">重命名分类</div>'; if (catId !== STATE.defaultCategoryId) contextItems.innerHTML += '<div class="context-item danger" data-action="delete-cat">删除分类</div>'; }
    contextMenu.style.left = x + 'px'; contextMenu.style.top = y + 'px';
    const rect = contextMenu.getBoundingClientRect(); if (rect.right > window.innerWidth) contextMenu.style.left = (x - rect.width) + 'px'; if (rect.bottom > window.innerHeight) contextMenu.style.top = (y - rect.height) + 'px';
    contextMenu.classList.add('active');
    contextItems.querySelectorAll('.context-item').forEach(el => { el.addEventListener('click', () => { const action = el.dataset.action;
        if (action === 'delete-link' && STATE.contextLinkId && STATE.contextCatId) removeLink(STATE.contextLinkId, STATE.contextCatId);
        else if (action === 'edit-link' && STATE.contextLinkId && STATE.contextCatId) { const cat = STATE.categories.find(c => c.id === STATE.contextCatId); const link = cat?.links.find(l => l.id === STATE.contextLinkId); if (link) { STATE.editLinkId = link.id; STATE.editCatId = STATE.contextCatId; linkNameInput.value = link.name; linkUrlInput.value = link.url; modalTitle.textContent = '编辑网址'; modalConfirm.textContent = '保存'; linkForm.style.display = 'block'; catForm.style.display = 'none'; openModal(); } }
        else if (action === 'rename-cat' && STATE.contextCatId) openCatRenameModal(STATE.contextCatId);
        else if (action === 'delete-cat' && STATE.contextCatId) { const cat2 = STATE.categories.find(c => c.id === STATE.contextCatId); if (cat2 && confirm(`确定删除分类「${cat2.name}」及其所有网址？`)) { STATE.categories = STATE.categories.filter(c => c.id !== STATE.contextCatId); saveState(); renderLinks(); } }
        closeContextMenu();
    }); });
}
function closeContextMenu() { contextMenu.classList.remove('active'); STATE.contextLinkId = null; STATE.contextCatId = null; }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { modalOverlay.classList.contains('active') ? closeModal() : linksView.classList.contains('active') ? showMainView() : closeContextMenu(); } });
document.addEventListener('mousedown', (e) => { if (!e.target.closest('.context-menu')) closeContextMenu(); });
linksContainer.addEventListener('contextmenu', (e) => { if (e.target.closest('.link-card') || e.target.closest('.cat-header')) e.preventDefault(); });

// ============================================
// 快捷栏
// ============================================
function renderFavorites() {
    favoritesTrack.querySelectorAll('.fav-card').forEach(el => el.remove());
    if (STATE.favorites.length === 0) { favDropHint.style.display = 'block'; return; }
    favDropHint.style.display = 'none';
    STATE.favorites.forEach(fav => {
        const card = document.createElement('a'); card.className = 'fav-card'; card.href = fav.url; card.target = '_blank'; card.dataset.id = fav.id; card.draggable = true;
        card.innerHTML = `<div class="fav-icon" style="background:${getColorForName(fav.name)}">${fav.name.charAt(0).toUpperCase()}</div><span class="fav-name">${fav.name}</span><div class="fav-remove" data-id="${fav.id}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></div>`;
        card.querySelector('.fav-remove').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); STATE.favorites = STATE.favorites.filter(f => f.id !== fav.id); saveState(); renderFavorites(); });
        card.addEventListener('dragstart', (e) => { STATE.dragData = { linkId: fav.id, fromFavorites: true }; card.style.opacity = '0.3'; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', fav.id); });
        card.addEventListener('dragend', () => { card.style.opacity = ''; STATE.dragData = null; });
        card.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        card.addEventListener('dragenter', (e) => { e.preventDefault(); card.classList.add('drag-target'); });
        card.addEventListener('dragleave', () => { card.classList.remove('drag-target'); });
        card.addEventListener('drop', (e) => { e.preventDefault(); card.classList.remove('drag-target'); if (!STATE.dragData) return; const fromId = STATE.dragData.linkId; const toId = fav.id; if (fromId === toId) return;
            if (STATE.dragData.fromFavorites) { const fromIdx = STATE.favorites.findIndex(f => f.id === fromId); const toIdx = STATE.favorites.findIndex(f => f.id === toId); if (fromIdx === -1 || toIdx === -1) return; const [moved] = STATE.favorites.splice(fromIdx, 1); STATE.favorites.splice(toIdx, 0, moved); } else { const fromCat = STATE.categories.find(c => c.id === STATE.dragData.catId); if (!fromCat) return; const li = fromCat.links.find(l => l.id === STATE.dragData.linkId); if (!li || STATE.favorites.find(f => f.id === li.id)) return; const toIdx = STATE.favorites.findIndex(f => f.id === toId); STATE.favorites.splice(toIdx, 0, { id: li.id, name: li.name, url: li.url }); } saveState(); renderFavorites(); });
        favoritesTrack.appendChild(card);
    });
}
favoritesTrack.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; favoritesTrack.classList.add('drag-over'); });
favoritesTrack.addEventListener('dragleave', (e) => { if (!e.target.closest('#favoritesTrack')) favoritesTrack.classList.remove('drag-over'); });
favoritesTrack.addEventListener('drop', (e) => { e.preventDefault(); favoritesTrack.classList.remove('drag-over'); if (!STATE.dragData || STATE.dragData.fromFavorites) return; const fromCat = STATE.categories.find(c => c.id === STATE.dragData.catId); if (!fromCat) return; const li = fromCat.links.find(l => l.id === STATE.dragData.linkId); if (!li || STATE.favorites.find(f => f.id === li.id)) return; STATE.favorites.push({ id: li.id, name: li.name, url: li.url }); saveState(); renderFavorites(); });
favoritesTrack.addEventListener('wheel', (e) => { if (favoritesTrack.scrollWidth <= favoritesTrack.clientWidth) return; e.preventDefault(); favoritesTrack.scrollLeft += e.deltaY + e.deltaX; });

// ============================================
// 壁纸
// ============================================
const PRESET_BG = [
    { file: 'wallhaven-yqvj5g_3840x2160.jpg', name: '梵高·星空' },
    { file: 'wallhaven-7pje5o_3840x2160.jpg', name: '暮光森林' },
    { file: 'wallhaven-k8z1q7_3840x2160.jpg', name: '樱花街道' },
    { file: 'wallhaven-qrgj6l_3840x2160.jpg', name: '海岸晚霞' },
    { file: 'wallhaven-rqjrzq_3840x2160.jpg', name: '雪山镜湖' },
];
let customBgFiles = [];
const DEFAULT_BG = PRESET_BG[0].file;
const wallpaperImg = $('wallpaperImg');
const bgPanel = $('bgPanel');
const bgPanelGrid = $('bgPanelGrid');
const bgSettingsBtn = $('bgSettingsBtn');
const bgPanelClose = $('bgPanelClose');
const bgFileInput = $('bgFileInput');

function loadWallpaper() {
    const bg = localStorage.getItem('cst_wallpaper') || DEFAULT_BG;
    const custom = localStorage.getItem('cst_custom_bg'); if (custom) { try { customBgFiles = JSON.parse(custom); } catch {} }
    wallpaperImg.style.backgroundImage = bg.startsWith('data:') ? `url(${bg})` : `url(photos/${bg})`;
    setTimeout(() => wallpaperImg.classList.add('show'), 100);
}
function setWallpaper(src) { wallpaperImg.style.backgroundImage = `url(${src})`; localStorage.setItem('cst_wallpaper', src.startsWith('data:') ? src : src.replace('photos/', '')); }

function renderBgPanel() {
    bgPanelGrid.innerHTML = ''; const currentBg = localStorage.getItem('cst_wallpaper') || DEFAULT_BG;
    [...PRESET_BG, ...customBgFiles.map(f => ({ ...f, isCustom: true }))].forEach(bg => {
        const src = bg.isCustom ? bg.dataURL : `photos/${bg.file}`; const key = bg.isCustom ? bg.dataURL : bg.file; const isActive = currentBg === key || (currentBg === src);
        const card = document.createElement('div'); card.className = `bg-preview ${isActive ? 'active' : ''}`;
        card.innerHTML = `<img src="${src}" alt=""><div class="bg-preview-name">${bg.name}</div><div class="bg-preview-badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>${bg.isCustom ? '<button class="bg-delete-btn">✕</button>' : ''}`;
        card.addEventListener('click', (e) => { if (e.target.closest('.bg-delete-btn')) return; setWallpaper(bg.isCustom ? bg.dataURL : bg.file); loadWallpaper(); renderBgPanel(); });
        if (bg.isCustom) card.querySelector('.bg-delete-btn').addEventListener('click', (e) => { e.stopPropagation(); customBgFiles = customBgFiles.filter(f => f.dataURL !== bg.dataURL); localStorage.setItem('cst_custom_bg', JSON.stringify(customBgFiles)); if (currentBg === bg.dataURL) { setWallpaper(DEFAULT_BG); loadWallpaper(); } renderBgPanel(); });
        bgPanelGrid.appendChild(card);
    });
}
bgSettingsBtn.addEventListener('click', () => { renderBgPanel(); bgPanel.classList.add('open'); });
bgPanelClose.addEventListener('click', () => bgPanel.classList.remove('open'));
document.addEventListener('mousedown', (e) => { if (bgPanel.classList.contains('open') && !e.target.closest('.bg-panel') && !e.target.closest('.bg-settings-btn')) bgPanel.classList.remove('open'); });
bgFileInput.addEventListener('change', () => { const file = bgFileInput.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { const dataURL = reader.result; customBgFiles.push({ name: file.name.replace(/\.[^.]+$/, ''), dataURL }); if (customBgFiles.length > 10) customBgFiles.shift(); localStorage.setItem('cst_custom_bg', JSON.stringify(customBgFiles)); setWallpaper(dataURL); loadWallpaper(); renderBgPanel(); }; reader.readAsDataURL(file); bgFileInput.value = ''; });

// ============================================
// 粒子
// ============================================
(function() {
    const canvas = document.getElementById('cursorCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w, h;
    let mx = -9999, my = -9999;
    let prevMx = -9999, prevMy = -9999;
    let stillTime = 0;
    const PARTICLES = 100;
    const REPEL_RADIUS = 120;
    const MAX_REPEL = 2.8;
    const DAMPING = 0.92;
    const EDGE_BOUNCE = 0.3;
    const STILL_THRESHOLD = 400;
    const TIDE_INNER = 200;
    const TIDE_OUTER = 320;
    const TIDE_PERIOD = 2.5;
    const TIDE_STRENGTH = 0.18;
    const TIDE_FADE = 0.93;
    let tideFactor = 0;

    const particles = [];
    function rand(min, max) { return min + Math.random() * (max - min); }

    class Particle {
        constructor() {
            this.size = rand(6, 22);
            this.opacity = rand(0.06, 0.2);
            this.x = rand(0, w || window.innerWidth);
            this.y = rand(0, h || window.innerHeight);
            this.vx = rand(-0.35, 0.35);
            this.vy = rand(-0.35, 0.35);
            this.repelVx = 0; this.repelVy = 0;
        }

        update(isTidal, time) {
            if (mx > -9000 && my > -9000) {
                const dx = this.x - mx;
                const dy = this.y - my;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < REPEL_RADIUS && dist > 0.5) {
                    const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * MAX_REPEL;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const repelWeight = 1 - tideFactor * 0.85;
                    this.repelVx += nx * force * repelWeight;
                    this.repelVy += ny * force * repelWeight;
                }

                if (isTidal && dist < TIDE_OUTER && dist > 0.5) {
                    const phase = Math.sin(time * (2 * Math.PI / TIDE_PERIOD));
                    const nx = dx / dist;
                    const ny = dy / dist;
                    let strength = TIDE_STRENGTH * phase * tideFactor;
                    if (dist > TIDE_INNER) {
                        const outerRatio = (dist - TIDE_INNER) / (TIDE_OUTER - TIDE_INNER);
                        strength *= Math.max(0, 1 - outerRatio) * 0.5 + 0.3;
                    }
                    this.repelVx += nx * strength;
                    this.repelVy += ny * strength;
                }
            }

            this.x += this.vx + this.repelVx;
            this.y += this.vy + this.repelVy;
            this.repelVx *= DAMPING; this.repelVy *= DAMPING;
            if (Math.abs(this.repelVx) < 0.003) this.repelVx = 0;
            if (Math.abs(this.repelVy) < 0.003) this.repelVy = 0;

            if (this.x < -EDGE_BOUNCE) { this.x = -EDGE_BOUNCE; this.vx = Math.abs(this.vx); }
            if (this.x > w + EDGE_BOUNCE) { this.x = w + EDGE_BOUNCE; this.vx = -Math.abs(this.vx); }
            if (this.y < -EDGE_BOUNCE) { this.y = -EDGE_BOUNCE; this.vy = Math.abs(this.vy); }
            if (this.y > h + EDGE_BOUNCE) { this.y = h + EDGE_BOUNCE; this.vy = -Math.abs(this.vy); }
        }

        draw(ctx) { ctx.beginPath(); ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2); ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`; ctx.lineWidth = 1.2; ctx.stroke(); }
    }

    function resize() { const dpr = window.devicePixelRatio || 1; w = window.innerWidth; h = window.innerHeight; canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }

    document.addEventListener('mousemove', (e) => {
        const nx = e.clientX, ny = e.clientY;
        if (Math.abs(nx - prevMx) > 0.5 || Math.abs(ny - prevMy) > 0.5) stillTime = 0;
        mx = nx; my = ny; prevMx = mx; prevMy = my;
    });
    document.addEventListener('mouseleave', () => { mx = -9999; my = -9999; stillTime = 0; tideFactor = 0; });
    document.addEventListener('mouseenter', () => { if (mx < -9000) { mx = window.innerWidth / 2; my = window.innerHeight / 2; } });
    window.addEventListener('resize', resize);

    resize();
    for (let i = 0; i < PARTICLES; i++) particles.push(new Particle());

    let lastTime = performance.now();
    let animTime = 0;

    function draw(now) {
        const dt = now - lastTime; lastTime = now; animTime += dt / 1000;

        if (mx > -9000 && my > -9000) {
            stillTime += dt;
            if (stillTime >= STILL_THRESHOLD) { tideFactor += (1 - tideFactor) * 0.03; if (tideFactor > 0.99) tideFactor = 1; }
        }
        if (stillTime < STILL_THRESHOLD && tideFactor > 0.001) { tideFactor *= TIDE_FADE; if (tideFactor < 0.001) tideFactor = 0; }

        const isTidal = tideFactor > 0.01;
        ctx.clearRect(0, 0, w, h);
        for (const p of particles) { p.update(isTidal, animTime); p.draw(ctx); }
        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
})();

// ============================================
// 云端同步
// ============================================
function getSyncData() {
    return {
        categories: STATE.categories,
        favorites: STATE.favorites,
        history: STATE.history,
        currentEngine: STATE.currentEngine,
        wallpaper: localStorage.getItem('cst_wallpaper') || null
    };
}

function applyCloudData(data) {
    if (!data) return;
    if (data.categories && data.categories.length > 0) STATE.categories = data.categories;
    if (data.favorites) STATE.favorites = data.favorites;
    if (data.history) STATE.history = data.history;
    if (data.currentEngine !== undefined) STATE.currentEngine = data.currentEngine;
    if (data.wallpaper && !data.wallpaper.startsWith('data:')) setWallpaper(data.wallpaper);
    try { localStorage.setItem('cst_data', JSON.stringify({ categories: STATE.categories, history: STATE.history, currentEngine: STATE.currentEngine, favorites: STATE.favorites })); } catch (e) {}
    lastSyncTime = new Date();
    updateSyncStatus();
}

async function uploadToCloud() {
    if (!isLoggedIn || isSyncing) return;
    isSyncing = true;
    try {
        await window.CST.uploadData(getSyncData());
        lastSyncTime = new Date();
        updateSyncStatus();
    } catch (e) {
        userDropdownSync.textContent = '⚠ 同步失败';
        userDropdownSync.className = 'user-dropdown-sync error';
    } finally { isSyncing = false; }
}

async function downloadFromCloud() {
    if (!isLoggedIn) { showSyncToast('请先登录', 'error'); return; }
    isSyncing = true;
    try {
        const data = await window.CST.downloadData();
        if (data) {
            applyCloudData(data);
            renderLinks(); renderFavorites(); renderHistory(); renderEngines(); loadWallpaper();
            showSyncToast('已从云端下载数据 ✓', 'success');
        } else {
            showSyncToast('云端暂无数据，已上传本地数据', 'success');
            await uploadToCloud();
        }
    } catch (e) { showSyncToast('下载失败：' + (e.message || '请检查网络'), 'error'); }
    finally { isSyncing = false; }
}

function updateSyncStatus() {
    if (!isLoggedIn) return;
    if (lastSyncTime) {
        const diff = Math.round((new Date() - lastSyncTime) / 1000);
        const min = Math.floor(diff / 60);
        if (min > 0) userDropdownSync.textContent = `✓ ${min}分钟前已同步`;
        else userDropdownSync.textContent = '✓ 已同步';
        userDropdownSync.className = 'user-dropdown-sync synced';
    } else {
        userDropdownSync.textContent = '○ 未同步';
        userDropdownSync.className = 'user-dropdown-sync';
    }
}

// ============================================
// Toast
// ============================================
let toastTimer = null;
function showSyncToast(message, type) {
    syncToast.textContent = message;
    syncToast.className = 'sync-toast show ' + (type || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => syncToast.classList.remove('show'), 3000);
}

// ============================================
// 认证 UI
// ============================================
function openAuthModal(mode) {
    authMode = mode;
    authError.classList.remove('visible');
    authError.textContent = '';
    authUsername.value = '';
    authUsername.disabled = false;
    authPassword.value = '';
    authConfirmPassword.value = '';
    authOldPassword.value = '';
    authNewPassword.value = '';

    if (mode === 'login') {
        authModalTitle.textContent = '登录';
        authModalSubtitle.textContent = '登录后可在多端同步数据';
        authSubmitBtn.textContent = '登录';
        authSwitchText.textContent = '还没有账号？';
        authSwitchBtn.textContent = '注册';
        authConfirmPasswordGroup.style.display = 'none';
        authOldPasswordGroup.style.display = 'none';
        authNewPasswordGroup.style.display = 'none';
        authRememberLabel.style.display = 'flex';
    } else if (mode === 'register') {
        authModalTitle.textContent = '注册';
        authModalSubtitle.textContent = '创建账号即可多端同步';
        authSubmitBtn.textContent = '注册';
        authSwitchText.textContent = '已有账号？';
        authSwitchBtn.textContent = '登录';
        authConfirmPasswordGroup.style.display = 'flex';
        authOldPasswordGroup.style.display = 'none';
        authNewPasswordGroup.style.display = 'none';
        authRememberLabel.style.display = 'none';
    } else if (mode === 'changePassword') {
        authModalTitle.textContent = '修改密码';
        authModalSubtitle.textContent = '请输入旧密码和新密码';
        authSubmitBtn.textContent = '保存';
        authSwitchText.textContent = '';
        authSwitchBtn.textContent = '';
        authConfirmPasswordGroup.style.display = 'none';
        authOldPasswordGroup.style.display = 'flex';
        authNewPasswordGroup.style.display = 'flex';
        authRememberLabel.style.display = 'none';
    }

    authModalOverlay.classList.add('active');
    setTimeout(() => authUsername.focus(), 200);
}

function closeAuthModal() {
    authModalOverlay.classList.remove('active');
    authMode = 'login';
}

function showAuthError(msg) {
    authError.textContent = msg;
    authError.classList.add('visible');
    setTimeout(() => authError.classList.remove('visible'), 4000);
}

authBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isLoggedIn) userDropdown.classList.toggle('open');
    else openAuthModal('login');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-dropdown') && !e.target.closest('.auth-btn')) userDropdown.classList.remove('open');
});

$('authModalClose').addEventListener('click', closeAuthModal);
authModalOverlay.addEventListener('mousedown', (e) => { if (e.target === authModalOverlay) closeAuthModal(); });

authSwitchBtn.addEventListener('click', () => {
    if (authMode === 'login') openAuthModal('register');
    else if (authMode === 'register') openAuthModal('login');
});

authSubmitBtn.addEventListener('click', async () => {
    const username = authUsername.value.trim();
    const password = authPassword.value.trim();

    if (!username) { showAuthError('请输入用户名'); return; }
    if (username.length < 2) { showAuthError('用户名至少2个字符'); return; }

    if (authMode === 'changePassword') {
        const oldPwd = authOldPassword.value.trim();
        const newPwd = authNewPassword.value.trim();
        if (!oldPwd) { showAuthError('请输入旧密码'); return; }
        if (!newPwd) { showAuthError('请输入新密码'); return; }
        if (newPwd.length < 6) { showAuthError('新密码至少6位'); return; }
        try {
            authSubmitBtn.disabled = true;
            authSubmitBtn.textContent = '保存中...';
            const email = username.toLowerCase() + '@custom-tabs.local';
            const client = window.CST.getSupabase();
            const { error: signInErr } = await client.auth.signInWithPassword({ email, password: oldPwd });
            if (signInErr) { showAuthError('旧密码不正确'); authSubmitBtn.disabled = false; authSubmitBtn.textContent = '保存'; return; }
            await window.CST.changePassword(newPwd);
            closeAuthModal();
            showSyncToast('密码修改成功 ✓', 'success');
        } catch (e) { showAuthError(e.message || '密码修改失败'); }
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = '保存';
        return;
    }

    if (!password) { showAuthError('请输入密码'); return; }
    if (password.length < 6) { showAuthError('密码至少6位'); return; }

    if (authMode === 'register') {
        const confirmPwd = authConfirmPassword.value.trim();
        if (password !== confirmPwd) { showAuthError('两次密码不一致'); return; }
    }

    try {
        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = authMode === 'login' ? '登录中...' : '注册中...';

        let result;
        const remember = authRememberMe.checked;

        if (authMode === 'login') result = await window.CST.signIn(username, password, remember);
        else result = await window.CST.signUp(username, password);

        onLoginSuccess(result.user, { download: true });
        closeAuthModal();
        showSyncToast('登录成功 ✓，数据将在操作后自动同步', 'success');
    } catch (e) {
        let msg = e.message || '操作失败';
        if (msg.includes('Invalid login credentials')) msg = '用户名或密码错误';
        else if (msg.includes('already registered')) msg = '该用户名已被注册';
        else if (msg.includes('Email rate limit')) msg = '操作过于频繁，请稍后再试';
        showAuthError(msg);
    } finally {
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = authMode === 'login' ? '登录' : '注册';
    }
});

function onLoginSuccess(user, { download = false } = {}) {
    isLoggedIn = true;
    currentUser = user;
    authBtn.classList.add('logged-in');
    authBtn.title = window.CST.getDisplayName(user);
    userDropdownName.textContent = window.CST.getDisplayName(user);
    updateSyncStatus();
    if (download) setTimeout(() => downloadFromCloud(), 500);
}

$('btnSignOut').addEventListener('click', async () => {
    if (!confirm('确定退出登录？本地数据会保留。')) return;
    try {
        await window.CST.signOut();
        isLoggedIn = false;
        currentUser = null;
        lastSyncTime = null;
        authBtn.classList.remove('logged-in');
        authBtn.title = '登录';
        userDropdown.classList.remove('open');
        userDropdownSync.textContent = '○ 未同步';
        userDropdownSync.className = 'user-dropdown-sync';
        showSyncToast('已退出登录', '');
    } catch (e) {}
});

$('btnSyncUpload').addEventListener('click', async () => {
    userDropdown.classList.remove('open');
    if (!isLoggedIn) { showSyncToast('请先登录', 'error'); return; }
    isSyncing = true;
    try {
        await window.CST.uploadData(getSyncData());
        lastSyncTime = new Date();
        updateSyncStatus();
        showSyncToast('已上传到云端 ✓', 'success');
    } catch (e) { showSyncToast('上传失败：' + (e.message || '请检查网络'), 'error'); }
    finally { isSyncing = false; }
});

$('btnSyncDownload').addEventListener('click', () => {
    userDropdown.classList.remove('open');
    if (!confirm('从云端下载将覆盖本地数据，确定继续？')) return;
    downloadFromCloud();
});

$('btnChangePassword').addEventListener('click', () => {
    userDropdown.classList.remove('open');
    if (!currentUser) return;
    authUsername.value = window.CST.getDisplayName(currentUser);
    authUsername.disabled = true;
    openAuthModal('changePassword');
});

// 键盘快捷键
authUsername.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); authPassword.focus(); } });
authPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); if (authMode === 'register') authConfirmPassword.focus(); else authSubmitBtn.click(); }
});
authConfirmPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); authSubmitBtn.click(); } });
authOldPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); authNewPassword.focus(); } });
authNewPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); authSubmitBtn.click(); } });

// ============================================
// 初始化
// ============================================
async function init() {
    loadState(); loadWallpaper();
    renderEngines(); renderLinks(); renderFavorites(); renderHistory(); updateClock();
    setInterval(updateClock, 1000);
    const style = document.createElement('style');
    style.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-4px)}20%,40%,60%,80%{transform:translateX(4px)}}.shake{animation:shake .4s ease}`;
    document.head.appendChild(style);
    initAuth();
    console.log('✨ 新标签页已加载');
}

async function initAuth() {
    try {
        if (typeof window.CST === 'undefined') { setTimeout(initAuth, 500); return; }
        const user = await window.CST.getCurrentUser();
        if (user) { onLoginSuccess(user, { download: true }); console.log('🔑 已恢复登录状态:', window.CST.getDisplayName(user)); }
    } catch (e) { console.log('🔑 未登录（离线或首次使用）'); }
    try {
        window.CST.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                isLoggedIn = false; currentUser = null; lastSyncTime = null;
                authBtn.classList.remove('logged-in'); authBtn.title = '登录';
                userDropdownSync.textContent = '○ 未同步'; userDropdownSync.className = 'user-dropdown-sync';
            } else if (event === 'SIGNED_IN' && !isLoggedIn) {
                if (session?.user) onLoginSuccess(session.user);
            }
        });
    } catch (e) {}
}

document.addEventListener('DOMContentLoaded', init);