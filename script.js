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
    editCatId: null,
    activePage: 0,
    notes: []
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
const pagerWrap = $('pagerWrap');
const pageDots = $('pageDots');
const linkTooltip = $('linkTooltip');
const linksBackBtn = $('linksBackBtn');
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
const linkCatSelect = $('linkCatSelect');
const importBtn = $('importBtn');
const exportBtn = $('exportBtn');
const importFileInput = $('importFileInput');

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
            favorites: STATE.favorites,
            notes: STATE.notes
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
            if (d.notes) STATE.notes = d.notes;
            return;
        }
    } catch (e) {}
    STATE.currentEngine = 0;
    STATE.history = [];
    STATE.categories = [
        {
            id: STATE.defaultCategoryId,
            name: '常用',
            links: [
                { id: 'd1', name: 'GitHub', url: 'https://github.com' },
                { id: 'd2', name: '哔哩哔哩', url: 'https://www.bilibili.com' },
                { id: 'd3', name: 'YouTube', url: 'https://www.youtube.com' },
                { id: 'd4', name: 'X (Twitter)', url: 'https://twitter.com' },
                { id: 'd5', name: 'Reddit', url: 'https://www.reddit.com' },
                { id: 'd6', name: 'Stack Overflow', url: 'https://stackoverflow.com' },
                { id: 'd7', name: 'Wikipedia', url: 'https://www.wikipedia.org' },
                { id: 'd8', name: 'Gmail', url: 'https://mail.google.com' }
            ]
        },
        {
            id: 'cat-preset-work',
            name: '工作协作',
            links: [
                { id: 'd9', name: '飞书', url: 'https://www.feishu.cn' },
                { id: 'd10', name: '钉钉', url: 'https://www.dingtalk.com' },
                { id: 'd11', name: 'Notion', url: 'https://www.notion.so' },
                { id: 'd12', name: '腾讯文档', url: 'https://docs.qq.com' },
                { id: 'd13', name: '语雀', url: 'https://www.yuque.com' },
                { id: 'd14', name: 'Figma', url: 'https://www.figma.com' },
                { id: 'd15', name: 'Slack', url: 'https://slack.com' },
                { id: 'd16', name: 'Trello', url: 'https://trello.com' }
            ]
        },
        {
            id: 'cat-preset-dev',
            name: '开发工具',
            links: [
                { id: 'd17', name: 'GitHub', url: 'https://github.com' },
                { id: 'd18', name: 'GitLab', url: 'https://gitlab.com' },
                { id: 'd19', name: 'MDN', url: 'https://developer.mozilla.org' },
                { id: 'd20', name: '掘金', url: 'https://juejin.cn' },
                { id: 'd21', name: 'CSDN', url: 'https://www.csdn.net' },
                { id: 'd22', name: '菜鸟教程', url: 'https://www.runoob.com' },
                { id: 'd23', name: 'V2EX', url: 'https://www.v2ex.com' },
                { id: 'd24', name: 'npm', url: 'https://www.npmjs.com' }
            ]
        },
        {
            id: 'cat-preset-news',
            name: '资讯阅读',
            links: [
                { id: 'd25', name: '知乎', url: 'https://www.zhihu.com' },
                { id: 'd26', name: '微博', url: 'https://weibo.com' },
                { id: 'd27', name: '36氪', url: 'https://36kr.com' },
                { id: 'd28', name: '虎嗅', url: 'https://www.huxiu.com' },
                { id: 'd29', name: '少数派', url: 'https://sspai.com' },
                { id: 'd30', name: 'IT之家', url: 'https://www.ithome.com' },
                { id: 'd31', name: '澎湃新闻', url: 'https://www.thepaper.cn' },
                { id: 'd32', name: '阮一峰的网络日志', url: 'https://www.ruanyifeng.com/blog' }
            ]
        },
        {
            id: 'cat-preset-video',
            name: '视频娱乐',
            links: [
                { id: 'd33', name: '哔哩哔哩', url: 'https://www.bilibili.com' },
                { id: 'd34', name: 'YouTube', url: 'https://www.youtube.com' },
                { id: 'd35', name: '抖音', url: 'https://www.douyin.com' },
                { id: 'd36', name: '腾讯视频', url: 'https://v.qq.com' },
                { id: 'd37', name: '爱奇艺', url: 'https://www.iqiyi.com' },
                { id: 'd38', name: '优酷', url: 'https://www.youku.com' },
                { id: 'd39', name: '网易云音乐', url: 'https://music.163.com' },
                { id: 'd40', name: 'QQ音乐', url: 'https://y.qq.com' }
            ]
        },
        {
            id: 'cat-preset-ai',
            name: 'AI 工具',
            links: [
                { id: 'd41', name: 'ChatGPT', url: 'https://chatgpt.com' },
                { id: 'd42', name: 'Claude', url: 'https://claude.ai' },
                { id: 'd43', name: 'DeepSeek', url: 'https://chat.deepseek.com' },
                { id: 'd44', name: 'Kimi', url: 'https://kimi.moonshot.cn' },
                { id: 'd45', name: '豆包', url: 'https://www.doubao.com' },
                { id: 'd46', name: '文心一言', url: 'https://yiyan.baidu.com' },
                { id: 'd47', name: '通义千问', url: 'https://tongyi.aliyun.com' },
                { id: 'd48', name: 'Hugging Face', url: 'https://huggingface.co' }
            ]
        },
        {
            id: 'cat-preset-shop',
            name: '购物生活',
            links: [
                { id: 'd49', name: '淘宝', url: 'https://www.taobao.com' },
                { id: 'd50', name: '京东', url: 'https://www.jd.com' },
                { id: 'd51', name: '拼多多', url: 'https://www.pinduoduo.com' },
                { id: 'd52', name: '天猫', url: 'https://www.tmall.com' },
                { id: 'd53', name: '闲鱼', url: 'https://www.goofish.com' },
                { id: 'd54', name: '亚马逊', url: 'https://www.amazon.com' },
                { id: 'd55', name: '饿了么', url: 'https://www.ele.me' },
                { id: 'd56', name: '美团', url: 'https://www.meituan.com' }
            ]
        },
        {
            id: 'cat-preset-design',
            name: '产品设计',
            links: [
                { id: 'd57', name: 'Product Hunt', url: 'https://www.producthunt.com' },
                { id: 'd58', name: 'Dribbble', url: 'https://dribbble.com' },
                { id: 'd59', name: 'Behance', url: 'https://www.behance.net' },
                { id: 'd60', name: '站酷', url: 'https://www.zcool.com.cn' },
                { id: 'd61', name: '优设网', url: 'https://www.uisdc.com' },
                { id: 'd62', name: '人人都是产品经理', url: 'https://www.woshipm.com' },
                { id: 'd63', name: 'Product Plan', url: 'https://www.productplan.com' },
                { id: 'd64', name: 'Miro', url: 'https://miro.com' }
            ]
        }
    ];
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
searchBtn.addEventListener('mousedown', (e) => { e.preventDefault(); doSearch(searchInput.value); });
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
    if (!linksView.classList.contains('active')) return;
    if (e.button !== 0) return;
    // 仅当点击次级页真正的空白区域（视图/分页容器/面板/指示点本身）才返回主界面；
    // 卡片、按钮、右键菜单、分类文件夹等交互元素一律不触发
    const t = e.target;
    if (t === linksView || t === pagerWrap || t === pageDots ||
        t.classList?.contains('pager-panel') || t.classList?.contains('pager-track') ||
        t.closest('.links-view-bg')) {
        showMainView();
    }
});

// ============================================
// 颜色
// ============================================
const COLORS = ['linear-gradient(135deg, #6c5ce7, #a29bfe)','linear-gradient(135deg, #fd79a8, #e84393)','linear-gradient(135deg, #00cec9, #00b894)','linear-gradient(135deg, #fdcb6e, #e17055)','linear-gradient(135deg, #0984e3, #6c5ce7)','linear-gradient(135deg, #e17055, #d63031)','linear-gradient(135deg, #00b894, #00cec9)','linear-gradient(135deg, #6c5ce7, #fd79a8)','linear-gradient(135deg, #f9ca24, #f0932b)','linear-gradient(135deg, #a29bfe, #6c5ce7)'];
function getColorForName(name) { let hash = 0; for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash); return COLORS[Math.abs(hash) % COLORS.length]; }

// ============================================
// 网址图标（favicon 多源加载 + 域名文字回退）
// ============================================
const faviconCache = {};
const faviconFailCache = {};

function getDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
}

function domainFallbackText(domain) {
    if (domain.length <= 10) return domain;
    return domain.slice(0, 12);
}

function applyFavicon(iconEl, gradient, src) {
    iconEl.classList.add('has-favicon');
    iconEl.style.backgroundImage = `url("${src}"), ${gradient}`;
    iconEl.style.backgroundSize = '60% 60%, cover';
    iconEl.style.backgroundPosition = 'center';
    iconEl.style.backgroundRepeat = 'no-repeat';
}

// 三源 fallback：站点直抓（国内最稳）→ DuckDuckGo → Google
function faviconSources(domain) {
    return [
        `https://${domain}/favicon.ico`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://www.google.com/s2/favicons?sz=64&domain=${domain}`
    ];
}

// 并发去重加载：同一域名只发一轮请求，成功后回调全部订阅者
const faviconPending = {};
function fetchFavicon(domain, onSuccess) {
    if (faviconCache[domain]) { onSuccess(faviconCache[domain]); return; }
    if (faviconFailCache[domain]) return;
    if (faviconPending[domain]) { faviconPending[domain].push(onSuccess); return; }
    faviconPending[domain] = [onSuccess];
    const sources = faviconSources(domain);
    let idx = 0;
    const tryLoad = () => {
        if (idx >= sources.length) {
            faviconFailCache[domain] = true;
            faviconPending[domain] = null;
            return;
        }
        const img = new Image();
        img.onload = () => {
            faviconCache[domain] = sources[idx];
            const cbs = faviconPending[domain] || [];
            faviconPending[domain] = null;
            cbs.forEach(cb => cb(sources[idx]));
        };
        img.onerror = () => { idx++; tryLoad(); };
        img.src = sources[idx];
    };
    tryLoad();
}

function loadFavicon(iconEl, name, url) {
    const domain = getDomain(url);
    if (!domain) return;
    const gradient = getColorForName(name);
    if (faviconFailCache[domain]) return;
    if (faviconCache[domain]) { applyFavicon(iconEl, gradient, faviconCache[domain]); return; }
    fetchFavicon(domain, (src) => applyFavicon(iconEl, gradient, src));
}

// 无渐变的小图标（分类文件夹缩略图等）
function loadFaviconThumb(el, url) {
    const domain = getDomain(url);
    if (!domain) return;
    if (faviconFailCache[domain]) return;
    if (faviconCache[domain]) { el.style.backgroundImage = `url("${faviconCache[domain]}")`; return; }
    fetchFavicon(domain, (src) => { el.style.backgroundImage = `url("${src}")`; });
}

// ============================================
// 分页切换
// ============================================
function goToPage(idx) {
    const totalPages = STATE.categories.length + 1;
    STATE.activePage = Math.max(0, Math.min(idx, totalPages - 1));
    const track = pagerWrap.querySelector('.pager-track');
    if (track) {
        track.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        track.style.transform = `translateX(-${STATE.activePage * 100}%)`;
        // 动画期间隐藏各页滚动条，避免相邻页滚动条横穿视口（闪烁）
        pagerWrap.classList.add('paging');
        setTimeout(() => pagerWrap.classList.remove('paging'), 380);
    }
    pageDots.querySelectorAll('.page-dot').forEach((d, i) => d.classList.toggle('active', i === STATE.activePage));
}

function applyPage(idx) {
    const track = pagerWrap.querySelector('.pager-track');
    if (track) {
        track.style.transition = 'none';
        track.style.transform = `translateX(-${idx * 100}%)`;
        void track.offsetWidth;
        track.style.transition = '';
    }
    pageDots.querySelectorAll('.page-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
}

// 触摸横滑切页（轴向判定：水平滑动手势切页，垂直滚动不干扰）
let pageTouch = null;
function endPageTouch() {
    if (!pageTouch) return;
    if (pageTouch.axis === 'h') {
        const w = pagerWrap.clientWidth || window.innerWidth;
        let next = STATE.activePage;
        if (pageTouch.dx < -w * 0.25) next = STATE.activePage + 1;
        else if (pageTouch.dx > w * 0.25) next = STATE.activePage - 1;
        goToPage(next);
    }
    pageTouch = null;
}
pagerWrap.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || modalOverlay.classList.contains('active')) return;
    pageTouch = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, dx: 0, axis: null };
}, { passive: true });
pagerWrap.addEventListener('touchmove', (e) => {
    if (!pageTouch) return;
    const t = e.touches[0];
    const dx = t.clientX - pageTouch.startX;
    const dy = t.clientY - pageTouch.startY;
    if (!pageTouch.axis) {
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) pageTouch.axis = 'h';
        else if (Math.abs(dy) > 10) pageTouch.axis = 'v';
        else return;
    }
    if (pageTouch.axis === 'h') {
        e.preventDefault();
        pageTouch.dx = dx;
        const track = pagerWrap.querySelector('.pager-track');
        if (track) {
            track.style.transition = 'none';
            track.style.transform = `translateX(calc(-${STATE.activePage * 100}% + ${dx}px))`;
        }
    }
}, { passive: false });
pagerWrap.addEventListener('touchend', endPageTouch);
pagerWrap.addEventListener('touchcancel', endPageTouch);

// ============================================
// 分类系统
// ============================================
function renderLinks() {
    hideTooltip(); // DOM 重建前收起提示，避免删除/编辑后悬浮残留
    if (!pagerWrap) return;
    const totalPages = STATE.categories.length + 1;
    const activeIdx = Math.min(STATE.activePage || 0, totalPages - 1);
    STATE.activePage = activeIdx;

    // ---- 分页面板：第 0 页为"全部"（分类文件夹网格），后续每分类一页 ----
    const track = document.createElement('div');
    track.className = 'pager-track';
    const allPanel = document.createElement('div');
    allPanel.className = 'pager-panel';
    renderCategoryFolders(allPanel);
    track.appendChild(allPanel);
    STATE.categories.forEach(cat => {
        const panel = document.createElement('div');
        panel.className = 'pager-panel';
        renderCategorySection(panel, cat);
        track.appendChild(panel);
    });
    pagerWrap.innerHTML = '';
    pagerWrap.appendChild(track);

    // ---- 页面指示点（分类过多时省略）----
    pageDots.innerHTML = '';
    if (totalPages <= 12) {
        for (let i = 0; i < totalPages; i++) {
            const dot = document.createElement('button');
            dot.className = 'page-dot' + (i === activeIdx ? ' active' : '');
            dot.addEventListener('click', () => goToPage(i));
            pageDots.appendChild(dot);
        }
    }

    applyPage(activeIdx);
}

// "全部"页：分类文件夹网格（Win11 应用文件夹风格，点击进入分类，可作拖放目标）
function renderCategoryFolders(container) {
    if (STATE.categories.length === 0) {
        container.innerHTML = '<div class="folders-empty">还没有分类，点击右上角「新建分类」开始组织你的网址</div>';
        return;
    }
    const grid = document.createElement('div');
    grid.className = 'folders-grid';
    STATE.categories.forEach(cat => {
        const folder = document.createElement('div');
        folder.className = 'cat-folder';
        folder.dataset.catId = cat.id;
        // 渐变底 + 前 4 个网址 favicon 缩略图堆叠
        const preview = document.createElement('div');
        preview.className = 'folder-preview';
        preview.style.backgroundImage = getColorForName(cat.name);
        const thumbs = cat.links.slice(0, 4).map(link => {
            const s = document.createElement('span');
            s.className = 'folder-thumb';
            loadFaviconThumb(s, link.url);
            return s;
        });
        if (thumbs.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'folder-thumb folder-thumb-empty';
            thumbs.push(empty);
        }
        const thumbsWrap = document.createElement('div');
        thumbsWrap.className = 'folder-thumbs';
        thumbs.forEach(s => thumbsWrap.appendChild(s));
        preview.appendChild(thumbsWrap);
        const meta = document.createElement('div');
        meta.className = 'folder-meta';
        meta.innerHTML = `<div class="folder-name">${htmlEscape(cat.name)}</div><div class="folder-count">${cat.links.length} 个网址</div>`;
        folder.appendChild(preview);
        folder.appendChild(meta);
        // 点击进入该分类页
        folder.addEventListener('click', () => goToPage(STATE.categories.indexOf(cat) + 1));
        // 拖放目标：拖网址到文件夹 = 移入该分类（替代原"拖到标签"）
        folder.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        folder.addEventListener('dragenter', (e) => { e.preventDefault(); folder.classList.add('drag-over'); });
        folder.addEventListener('dragleave', () => { folder.classList.remove('drag-over'); });
        folder.addEventListener('drop', (e) => {
            e.preventDefault(); folder.classList.remove('drag-over');
            if (!STATE.dragData || STATE.dragData.fromFavorites || STATE.dragData.catId === cat.id) return;
            const fromCat = STATE.categories.find(c => c.id === STATE.dragData.catId);
            const li = fromCat && fromCat.links.find(l => l.id === STATE.dragData.linkId);
            if (!fromCat || !li) return;
            fromCat.links = fromCat.links.filter(l => l.id !== STATE.dragData.linkId);
            cat.links.push({ ...li });
            saveState(); renderLinks();
        });
        grid.appendChild(folder);
    });
    container.appendChild(grid);
}

function renderCategorySection(container, cat) {
    // 面包屑：返回"全部"文件夹页
    const crumb = document.createElement('button');
    crumb.className = 'pager-crumb';
    crumb.innerHTML = '← 全部';
    crumb.addEventListener('click', () => goToPage(0));
    container.appendChild(crumb);
    const section = document.createElement('div'); section.className = 'cat-section'; section.dataset.catId = cat.id;
    const header = document.createElement('div'); header.className = 'cat-header';
    header.innerHTML = `<span class="cat-name">${htmlEscape(cat.name)}</span><span class="cat-count">${cat.links.length}</span><div class="cat-actions"><button class="cat-btn cat-rename" title="重命名分类">✎</button>${cat.id !== STATE.defaultCategoryId ? '<button class="cat-btn cat-delete" title="删除分类">✕</button>' : ''}</div>`;
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
        const domain = getDomain(link.url);
        const flClass = domain.length <= 4 ? 'fl-short' : domain.length <= 10 ? 'fl-mid' : 'fl-long';
        card.innerHTML = `<div class="card-icon ${flClass}" style="background-image:${getColorForName(link.name)}">${htmlEscape(domainFallbackText(domain))}</div><span class="card-name">${htmlEscape(link.name)}</span><div class="card-remove" data-id="${link.id}" data-cat-id="${cat.id}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></div>`;
        loadFavicon(card.querySelector('.card-icon'), link.name, link.url);
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
    grid.appendChild(addLinkBtn); section.appendChild(grid); container.appendChild(section);
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
function addOrEditLink(name, url) {
    const targetCatId = STATE.editLinkId ? (linkCatSelect ? linkCatSelect.value : STATE.editCatId) : STATE.editCatId;
    const cat = STATE.categories.find(c => c.id === targetCatId);
    if (!cat) return;
    if (STATE.editLinkId) {
        const originalCat = STATE.categories.find(c => c.id === STATE.editCatId);
        const originalIdx = originalCat?.links.findIndex(l => l.id === STATE.editLinkId);
        if (originalIdx !== -1) {
            const link = originalCat.links[originalIdx];
            link.name = name;
            link.url = url;
            // 如果分类变了，移动链接
            if (targetCatId !== STATE.editCatId) {
                originalCat.links.splice(originalIdx, 1);
                cat.links.push(link);
            }
        }
    } else {
        cat.links.push({ id: generateId(), name, url });
    }
    saveState(); renderLinks(); closeModal();
}
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
    if (linkForm.style.display !== 'none') {
        let name = linkNameInput.value.trim();
        let url = linkUrlInput.value.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
        try { new URL(url); } catch { return; }
        // 名称留空时默认用域名（如 github.com），实现粘贴网址后直接保存
        if (!name) name = getDomain(url);
        if (!name) return;
        addOrEditLink(name, url);
    } else { const name = catNameInput.value.trim(); if (!name) return; if (STATE.editCatId) { saveCatName(name); } else { STATE.categories.push({ id: generateId(), name, links: [] }); saveState(); renderLinks(); closeModal(); } }
});
linkUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); modalConfirm.click(); } });
linkNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); linkUrlInput.focus(); } });
catNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); modalConfirm.click(); } });

// ============================================
// 右键菜单
// ============================================
function populateCatSelect(selectedCatId) {
    linkCatSelect.innerHTML = STATE.categories.map(c =>
        `<option value="${c.id}" ${c.id === selectedCatId ? 'selected' : ''}>${c.name}</option>`
    ).join('');
}

function showContextMenu(x, y, linkId, catId) {
    contextItems.innerHTML = '';
    if (linkId) {
        contextItems.innerHTML += '<div class="context-item danger" data-action="delete-link">删除此网址</div>';
        contextItems.innerHTML += '<div class="context-item" data-action="edit-link">编辑网址</div>';
        if (!STATE.favorites.some(f => f.id === linkId)) {
            contextItems.innerHTML += '<div class="context-item" data-action="add-favorite">添加到常用</div>';
        }
    }
    if (catId && !linkId) { contextItems.innerHTML += '<div class="context-item" data-action="rename-cat">重命名分类</div>'; if (catId !== STATE.defaultCategoryId) contextItems.innerHTML += '<div class="context-item danger" data-action="delete-cat">删除分类</div>'; }
    contextMenu.style.left = x + 'px'; contextMenu.style.top = y + 'px';
    const rect = contextMenu.getBoundingClientRect(); if (rect.right > window.innerWidth) contextMenu.style.left = (x - rect.width) + 'px'; if (rect.bottom > window.innerHeight) contextMenu.style.top = (y - rect.height) + 'px';
    contextMenu.classList.add('active');
    contextItems.querySelectorAll('.context-item').forEach(el => { el.addEventListener('click', () => { const action = el.dataset.action;
        if (action === 'delete-link' && STATE.contextLinkId && STATE.contextCatId) removeLink(STATE.contextLinkId, STATE.contextCatId);
        else if (action === 'edit-link' && STATE.contextLinkId && STATE.contextCatId) { const cat = STATE.categories.find(c => c.id === STATE.contextCatId); const link = cat?.links.find(l => l.id === STATE.contextLinkId); if (link) { STATE.editLinkId = link.id; STATE.editCatId = STATE.contextCatId; linkNameInput.value = link.name; linkUrlInput.value = link.url; populateCatSelect(STATE.contextCatId); linkCatGroup.style.display = 'block'; modalTitle.textContent = '编辑网址'; modalConfirm.textContent = '保存'; linkForm.style.display = 'block'; catForm.style.display = 'none'; openModal(); } }
        else if (action === 'add-favorite' && STATE.contextLinkId && STATE.contextCatId) { const cat2 = STATE.categories.find(c => c.id === STATE.contextCatId); const li = cat2?.links.find(l => l.id === STATE.contextLinkId); if (li && !STATE.favorites.find(f => f.id === li.id)) { STATE.favorites.push({ id: li.id, name: li.name, url: li.url }); saveState(); renderFavorites(); } }
        else if (action === 'rename-cat' && STATE.contextCatId) openCatRenameModal(STATE.contextCatId);
        else if (action === 'delete-cat' && STATE.contextCatId) { const cat3 = STATE.categories.find(c => c.id === STATE.contextCatId); if (cat3 && confirm(`确定删除分类「${cat3.name}」及其所有网址？`)) { STATE.categories = STATE.categories.filter(c => c.id !== STATE.contextCatId); saveState(); renderLinks(); } }
        closeContextMenu();
    }); });
}
function closeContextMenu() { contextMenu.classList.remove('active'); STATE.contextLinkId = null; STATE.contextCatId = null; }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { modalOverlay.classList.contains('active') ? closeModal() : linksView.classList.contains('active') ? showMainView() : closeContextMenu(); } });
document.addEventListener('mousedown', (e) => { if (!e.target.closest('.context-menu')) closeContextMenu(); });
pagerWrap.addEventListener('contextmenu', (e) => { if (e.target.closest('.link-card') || e.target.closest('.cat-header')) e.preventDefault(); });

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
const BING_MARKER = 'bing://daily';
const wallpaperImg = $('wallpaperImg');
const bgPanel = $('bgPanel');
const bgPanelGrid = $('bgPanelGrid');
const bgSettingsBtn = $('bgSettingsBtn');
const bgPanelClose = $('bgPanelClose');
const bgFileInput = $('bgFileInput');

async function fetchBingWallpaper() {
    const BING_CACHE_VERSION = 2; // 缓存版本：v1=1080p, v2=UHD 4K
    const cached = JSON.parse(localStorage.getItem('cst_bing') || '{}');
    const today = new Date().toDateString();
    if (cached.date === today && cached._v === BING_CACHE_VERSION && cached.url) return cached;

    const bingApiUrl = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';
    const proxyUrls = [
        bingApiUrl,
        'https://api.allorigins.win/raw?url=' + encodeURIComponent(bingApiUrl),
        'https://corsproxy.io/?' + encodeURIComponent(bingApiUrl)
    ];

    for (const proxyUrl of proxyUrls) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timer);
            if (!res.ok) continue;
            const data = await res.json();
            // 替换为 UHD (3840×2160) 分辨率，解决 1080p 模糊问题
            const url = 'https://www.bing.com' + data.images[0].url.replace(/_\d+x\d+/, '_UHD');
            const copyright = data.images[0].copyright || '';
            const result = { url, copyright, date: today, _v: BING_CACHE_VERSION };
            localStorage.setItem('cst_bing', JSON.stringify(result));
            console.log('☀️ Bing 壁纸已获取 (UHD 4K)');
            return result;
        } catch (e) {
            console.warn('Bing fetch failed for', proxyUrl, e.message || e);
            continue;
        }
    }

    console.warn('☀️ 所有 Bing 源均失败，使用缓存');
    return cached.url ? cached : null;
}

function loadWallpaper() {
    const bg = localStorage.getItem('cst_wallpaper') || DEFAULT_BG;
    const custom = localStorage.getItem('cst_custom_bg'); if (custom) { try { customBgFiles = JSON.parse(custom); } catch {} }

    if (bg === BING_MARKER) {
        // 先显示缓存或默认壁纸
        const cached = JSON.parse(localStorage.getItem('cst_bing') || '{}');
        wallpaperImg.style.backgroundImage = cached.url
            ? `url(${cached.url})`
            : `url(photos/${DEFAULT_BG})`;
        // 异步更新最新的 Bing 壁纸
        fetchBingWallpaper().then(result => {
            if (result) wallpaperImg.style.backgroundImage = `url(${result.url})`;
        });
    } else {
        wallpaperImg.style.backgroundImage = bg.startsWith('data:') ? `url(${bg})` : `url(photos/${bg})`;
    }
    setTimeout(() => wallpaperImg.classList.add('show'), 100);
}

function setWallpaper(src) {
    wallpaperImg.style.backgroundImage = `url(${src})`;
    localStorage.setItem('cst_wallpaper', src.startsWith('data:') ? src : src.replace('photos/', ''));
}

function renderBgPanel() {
    bgPanelGrid.innerHTML = ''; const currentBg = localStorage.getItem('cst_wallpaper') || DEFAULT_BG;

    // === Bing 每日壁纸卡片 ===
    const bingCard = document.createElement('div');
    bingCard.className = `bg-preview ${currentBg === BING_MARKER ? 'active' : ''}`;

    const cached = JSON.parse(localStorage.getItem('cst_bing') || '{}');
    const bingSrc = cached.url || `photos/${DEFAULT_BG}`;
    bingCard.innerHTML = `<img src="${bingSrc}" alt=""><div class="bg-preview-name">Bing·每日</div><span class="bing-badge">今日</span><div class="bg-preview-badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>`;
    bingCard.addEventListener('click', () => {
        localStorage.setItem('cst_wallpaper', BING_MARKER);
        loadWallpaper();
        renderBgPanel();
        // 后台静默获取最新 Bing 壁纸
        fetchBingWallpaper().then(result => {
            if (result && result.url) loadWallpaper();
        });
    });
    bgPanelGrid.appendChild(bingCard);

    // === 预设壁纸 + 自定义壁纸 ===
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
        notes: STATE.notes
    };
}

function applyCloudData(data) {
    if (!data) return;
    if (data.categories && data.categories.length > 0) STATE.categories = data.categories;
    if (data.favorites) STATE.favorites = data.favorites;
    if (data.history) STATE.history = data.history;
    if (data.currentEngine !== undefined) STATE.currentEngine = data.currentEngine;
    if (data.notes) STATE.notes = data.notes;
    try { localStorage.setItem('cst_data', JSON.stringify({ categories: STATE.categories, history: STATE.history, currentEngine: STATE.currentEngine, favorites: STATE.favorites, notes: STATE.notes })); } catch (e) {}
    lastSyncTime = new Date();
    updateSyncStatus();
    renderPinnedNotes();
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
    renderEngines(); renderLinks(); renderFavorites(); renderHistory(); renderPinnedNotes(); updateClock();
    setInterval(updateClock, 1000);
    const style = document.createElement('style');
    style.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-4px)}20%,40%,60%,80%{transform:translateX(4px)}}.shake{animation:shake .4s ease}`;
    document.head.appendChild(style);
    initAuth();
    initSettingsToggles();
    console.log('✨ 新标签页已加载');
}

// ============================================
// 设置面板开关（毛玻璃 / 粒子特效）
// ============================================
function initSettingsToggles() {
    const glassCheckbox = document.querySelector('#glassToggle input');
    const particlesCheckbox = document.querySelector('#particlesToggle input');

    // 从 localStorage 恢复状态
    const glassEnabled = localStorage.getItem('cst_glass') !== 'false'; // 默认开
    const particlesEnabled = localStorage.getItem('cst_particles') !== 'false'; // 默认开

    function applyGlass(enabled) {
        if (enabled) {
            document.body.classList.remove('no-glass');
        } else {
            document.body.classList.add('no-glass');
        }
    }

    function applyParticles(enabled) {
        if (enabled) {
            document.body.classList.remove('no-particles');
        } else {
            document.body.classList.add('no-particles');
        }
    }

    // 初始化状态
    if (glassCheckbox) {
        glassCheckbox.checked = glassEnabled;
        glassCheckbox.addEventListener('change', () => {
            const val = glassCheckbox.checked;
            localStorage.setItem('cst_glass', val);
            applyGlass(val);
        });
    }
    if (particlesCheckbox) {
        particlesCheckbox.checked = particlesEnabled;
        particlesCheckbox.addEventListener('change', () => {
            const val = particlesCheckbox.checked;
            localStorage.setItem('cst_particles', val);
            applyParticles(val);
        });
    }

    // 应用初始状态
    applyGlass(glassEnabled);
    applyParticles(particlesEnabled);
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

// ============================================
// 网址卡片提示 tooltip（鼠标悬停 800ms 显示完整标题）
// ============================================
let tooltipTimer = null;
function hideTooltip() { clearTimeout(tooltipTimer); linkTooltip.classList.remove('visible'); }
function showTooltip(card) {
    if (!card || !card.isConnected) return;
    const name = card.querySelector('.card-name')?.textContent || '';
    const url = card.href || '';
    if (!name) return;
    linkTooltip.innerHTML = `<div class="tt-name">${htmlEscape(name)}</div>${url ? `<div class="tt-url">${htmlEscape(url)}</div>` : ''}`;
    linkTooltip.classList.add('visible');
    const rect = card.getBoundingClientRect();
    const tw = linkTooltip.offsetWidth, th = linkTooltip.offsetHeight;
    let left = Math.max(8, Math.min(rect.left + rect.width / 2 - tw / 2, window.innerWidth - tw - 8));
    let top = rect.top - th - 10;
    if (top < 8) top = rect.bottom + 10;
    linkTooltip.style.left = left + 'px';
    linkTooltip.style.top = top + 'px';
}
document.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.link-card');
    if (!card) return;
    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(() => showTooltip(card), 800);
});
document.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.link-card');
    if (card && (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.link-card'))) {
        hideTooltip();
    }
});
document.addEventListener('scroll', hideTooltip, true);

// ============================================
// 移动端交互
// ============================================

// 移动端快捷网址按钮
$('mobileLinksBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    showLinksView();
});

// 返回按钮（桌面 + 移动端统一入口；替代原"触摸空白即退"逻辑，消除滑动误触）
linksBackBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showMainView();
});

// 长按检测（500ms）
let longPressTimer = null;
let longPressTarget = null;

document.addEventListener('touchstart', (e) => {
    if (modalOverlay.classList.contains('active')) return;
    if (authModalOverlay.classList.contains('active')) return;
    if (e.target.closest('input') || e.target.closest('.search-engine-selector')) return;

    const target = e.target.closest('.link-card');
    if (target) {
        longPressTarget = target;
        longPressTimer = setTimeout(() => {
            if (longPressTarget === target) {
                e.preventDefault();
                const linkId = target.dataset.id;
                const catId = target.dataset.catId;
                STATE.contextLinkId = linkId;
                STATE.contextCatId = catId;
                const rect = target.getBoundingClientRect();
                showContextMenu(rect.left + rect.width / 2, rect.top + rect.height / 2, linkId, catId);
                // 振动反馈
                if (navigator.vibrate) navigator.vibrate(20);
            }
        }, 500);
    } else if (e.target.closest('.main-view') && !e.target.closest('.auth-btn') && !e.target.closest('.bg-settings-btn') && !e.target.closest('.mobile-links-btn') && !e.target.closest('.fav-card')) {
        longPressTarget = e.target;
        longPressTimer = setTimeout(() => {
            if (longPressTarget === e.target) {
                showLinksView();
                if (navigator.vibrate) navigator.vibrate(20);
            }
        }, 500);
    }
}, { passive: false });

document.addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
    longPressTarget = null;
});

document.addEventListener('touchmove', () => {
    clearTimeout(longPressTimer);
    longPressTarget = null;
});

// 触摸拖拽增强：防止触摸时页面滚动
let touchDragActive = false;
document.addEventListener('touchmove', (e) => {
    if (touchDragActive) {
        e.preventDefault();
    }
}, { passive: false });

// 粒子数量根据屏幕自适应
(function() {
    const canvas = document.getElementById('cursorCanvas');
    if (!canvas) return;
    const numParticles = window.innerWidth <= 480 ? 40 :
                         window.innerWidth <= 768 ? 60 :
                         window.innerWidth <= 1024 ? 80 : 100;

    // 已初始化则不重复
    if (canvas.dataset.inited === 'true') return;
    canvas.dataset.inited = 'true';
})();

// ============================================
// 书签导入导出
// ============================================

function htmlEscape(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function exportBookmarks() {
    const lines = [
        '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
        '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
        '<TITLE>Custom Tabs 书签备份</TITLE>',
        '<H1>Custom Tabs 书签备份</H1>',
        '<DL><p>'
    ];

    // 输出分类
    STATE.categories.forEach(cat => {
        lines.push(`    <DT><H3>${htmlEscape(cat.name)}</H3>`);
        lines.push('    <DL><p>');
        cat.links.forEach(link => {
            lines.push(`        <DT><A HREF="${htmlEscape(link.url)}">${htmlEscape(link.name)}</A>`);
        });
        lines.push('    </DL><p>');
    });

    // 输出常用栏
    if (STATE.favorites.length > 0) {
        lines.push('    <DT><H3>★ 常用</H3>');
        lines.push('    <DL><p>');
        STATE.favorites.forEach(fav => {
            lines.push(`        <DT><A HREF="${htmlEscape(fav.url)}">${htmlEscape(fav.name)}</A>`);
        });
        lines.push('    </DL><p>');
    }

    lines.push('</DL><p>');

    const html = lines.join('\n');
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CustomTabs_书签备份_${dateStr}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSyncToast('书签已导出 ✓', 'success');
}

function importBookmarks(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const html = e.target.result;
            const lines = html.split(/\r?\n/);
            const categories = [];  // [{ name, links: [] }]
            let currentFolder = null;
            const seen = new Set();
            let currentFolderLinks = null;
            let orphanLinks = [];

            function finishFolder() {
                if (currentFolder && currentFolderLinks && currentFolderLinks.length > 0) {
                    categories.push({ name: currentFolder, links: currentFolderLinks });
                } else if (currentFolderLinks && currentFolderLinks.length > 0) {
                    orphanLinks = orphanLinks.concat(currentFolderLinks);
                }
            }

            // 正则：匹配 <DT><H3 ...>名称</H3> (同级或不同行)
            const h3Regex = /<H3[^>]*>([^<]+)<\/H3>/i;
            // 正则：匹配 <A HREF="url" ...>text</A>
            const aRegex = /<A\s[^>]*?HREF\s*=\s*"([^"]+)"[^>]*>\s*([^<]*?)\s*<\/A>/i;

            for (const line of lines) {
                // 检查是否包含 H3（文件夹）
                const h3Match = line.match(h3Regex);
                if (h3Match) {
                    finishFolder();
                    currentFolder = h3Match[1].trim();
                    // 跳过浏览器内置文件夹
                    if (currentFolder === '收藏夹栏' || currentFolder === '书签栏' || currentFolder === '其他书签') {
                        currentFolder = null;
                    }
                    currentFolderLinks = [];
                    continue;
                }

                // 检查是否包含 A 标签
                const aMatch = line.match(aRegex);
                if (aMatch) {
                    const url = aMatch[1].trim();
                    let name = aMatch[2].trim();
                    if (!url || !(url.startsWith('http://') || url.startsWith('https://'))) continue;
                    if (!name) name = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                    const key = url;
                    if (!seen.has(key)) {
                        seen.add(key);
                        const link = { id: generateId(), name: name.substring(0, 20) || url, url: url };
                        if (currentFolderLinks) {
                            currentFolderLinks.push(link);
                        } else {
                            orphanLinks.push(link);
                        }
                    }
                }
            }

            // 处理最后一个文件夹
            finishFolder();

            // 尝试另一种解析：合并连续多行的 A 标签正则（处理 div 换行情况）
            if (categories.length === 0 && orphanLinks.length === 0) {
                const aRegexGlobal = /<A\s[^>]*?HREF\s*=\s*"([^"]+)"[^>]*?>\s*([\s\S]*?)\s*<\/A>/gi;
                let m;
                while ((m = aRegexGlobal.exec(html)) !== null) {
                    const url = m[1].trim();
                    let name = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                    if (!url || !(url.startsWith('http://') || url.startsWith('https://'))) continue;
                    if (!name) name = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                    const key = url;
                    if (!seen.has(key)) {
                        seen.add(key);
                        orphanLinks.push({ id: generateId(), name: name.substring(0, 20) || url, url: url });
                    }
                }
            }

            const totalLinks = categories.reduce((s, c) => s + c.links.length, 0) + orphanLinks.length;
            if (totalLinks === 0) {
                showSyncToast('未找到可导入的链接', 'error');
                return;
            }

            // 合并到现有分类
            categories.forEach(nc => {
                const existing = STATE.categories.find(c => c.name === nc.name);
                if (existing) {
                    existing.links = existing.links.concat(nc.links);
                } else {
                    STATE.categories.push({ id: generateId(), name: nc.name, links: nc.links });
                }
            });

            // 孤儿链接 → "未分类" 或用文件名
            if (orphanLinks.length > 0) {
                const catName = file.name.replace(/\.[^.]+$/, '').substring(0, 15) || '导入书签';
                const existing = STATE.categories.find(c => c.name === catName);
                if (existing) {
                    existing.links = existing.links.concat(orphanLinks);
                } else if (categories.length === 0) {
                    STATE.categories.push({ id: generateId(), name: catName, links: orphanLinks });
                } else {
                    const uncat = STATE.categories.find(c => c.name === '未分类');
                    if (uncat) uncat.links = uncat.links.concat(orphanLinks);
                    else STATE.categories.push({ id: generateId(), name: '未分类', links: orphanLinks });
                }
            }

            saveState();
            renderLinks();
            const catCount = categories.length + (orphanLinks.length > 0 && categories.length === 0 ? 1 : 0);
            showSyncToast(`已导入 ${totalLinks} 个链接、${catCount} 个分类 ✓`, 'success');
        } catch (err) {
            showSyncToast('导入失败：' + (err.message || '格式不兼容'), 'error');
            console.error('importBookmarks error:', err);
        }
    };
    reader.readAsText(file, 'UTF-8');
}

importBtn.addEventListener('click', () => {
    importFileInput.click();
});

importFileInput.addEventListener('change', () => {
    const file = importFileInput.files[0];
    if (!file) return;
    importBookmarks(file);
    importFileInput.value = '';
});

exportBtn.addEventListener('click', () => {
    exportBookmarks();
});

// ============================================
// 便签系统（直接映射模式：输入即保存）
// ============================================
let currentNoteId = null;

function openNotePanel(noteId) {
    $('notePanelOverlay').classList.add('active');
    $('notePanel').classList.add('open');
    refreshNoteList();
    if (noteId) {
        loadNoteToEditor(noteId);
    } else if (STATE.notes.length > 0) {
        loadNoteToEditor(STATE.notes[0].id);
    } else {
        createAndLoadNote();
    }
}

function closeNotePanel() {
    $('notePanelOverlay').classList.remove('active');
    $('notePanel').classList.remove('open');
}

function loadNoteToEditor(noteId) {
    currentNoteId = noteId;
    const note = STATE.notes.find(n => n.id === noteId);
    if (!note) return;
    $('noteTitleInput').value = note.title;
    $('noteContentInput').value = note.content;
    $('notePinBtn').classList.toggle('pinned', note.pinned);
    $('notePinBtn').querySelector('span').textContent = note.pinned ? '已钉固' : '钉固';
    refreshNoteList();
    $('noteTitleInput').focus();
}

function createAndLoadNote() {
    const note = { id: generateId(), title: '', content: '', pinned: false };
    STATE.notes.unshift(note);
    saveState();
    loadNoteToEditor(note.id);
}

// 输入即保存：DOM 输入框直接映射到 STATE.notes[x]
$('noteTitleInput').addEventListener('input', () => {
    if (!currentNoteId) return;
    const note = STATE.notes.find(n => n.id === currentNoteId);
    if (!note) return;
    note.title = $('noteTitleInput').value;
    saveState(); // 即时保存
    refreshNoteList();
    renderPinnedNotes();
});

$('noteContentInput').addEventListener('input', () => {
    if (!currentNoteId) return;
    const note = STATE.notes.find(n => n.id === currentNoteId);
    if (!note) return;
    note.content = $('noteContentInput').value;
    saveState(); // 即时保存
    renderPinnedNotes();
});

$('noteTitleInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); $('noteContentInput').focus(); }
});

$('noteNewBtn').addEventListener('click', createAndLoadNote);

$('notePinBtn').addEventListener('click', () => {
    if (!currentNoteId) return;
    const note = STATE.notes.find(n => n.id === currentNoteId);
    if (!note) return;
    note.pinned = !note.pinned;
    $('notePinBtn').classList.toggle('pinned', note.pinned);
    $('notePinBtn').querySelector('span').textContent = note.pinned ? '已钉固' : '钉固';
    saveState();
    refreshNoteList();
    renderPinnedNotes();
});

// 同步状态更新
function updateNoteSyncStatus() {
    const el = $('noteSyncStatus');
    if (!isLoggedIn) {
        el.textContent = '⚠ 未登录';
        el.className = 'note-sync-status';
    } else if (lastSyncTime) {
        el.textContent = '✓ 已同步';
        el.className = 'note-sync-status synced';
    } else {
        el.textContent = '○ 待同步';
        el.className = 'note-sync-status';
    }
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
    updateNoteSyncStatus();
}

function deleteNote(noteId) {
    STATE.notes = STATE.notes.filter(n => n.id !== noteId);
    if (currentNoteId === noteId) {
        currentNoteId = STATE.notes.length > 0 ? STATE.notes[0].id : null;
        if (currentNoteId) loadNoteToEditor(currentNoteId);
    }
    saveState();
    refreshNoteList();
    renderPinnedNotes();
    if (!currentNoteId && STATE.notes.length > 0) loadNoteToEditor(STATE.notes[0].id);
}

function refreshNoteList() {
    const list = $('noteList');
    if (STATE.notes.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:var(--text-tertiary);font-size:12px;padding:12px;">暂无便签</div>';
        return;
    }
    list.innerHTML = STATE.notes.map(n => {
        const active = n.id === currentNoteId ? ' active' : '';
        const title = n.title || '无标题';
        const pin = n.pinned ? '<span class="note-item-pin">📌</span>' : '';
        const preview = n.content || '';
        return `<div class="note-list-item${active}" data-id="${n.id}">
            <div class="note-item-left">
                <span class="note-item-icon">📝</span>
                <div class="note-item-text">
                    <span class="note-item-title${active}">${title}</span>${pin}
                    ${preview ? `<span class="note-item-preview">${preview.replace(/\n/g, ' ').substring(0, 30)}</span>` : ''}
                </div>
            </div>
            <button class="note-item-delete" data-id="${n.id}" title="删除"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
        </div>`;
    }).join('');
    list.querySelectorAll('.note-list-item').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('.note-item-delete')) return;
            loadNoteToEditor(el.dataset.id);
        });
    });
    list.querySelectorAll('.note-item-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNote(btn.dataset.id);
        });
    });
}

function renderPinnedNotes() {
    const container = $('pinnedNotes');
    const pinned = STATE.notes.filter(n => n.pinned);
    if (pinned.length === 0) {
        container.innerHTML = '';
        $('noteBtn').classList.remove('has-notes');
        return;
    }
    $('noteBtn').classList.add('has-notes');
    container.innerHTML = pinned.map(n => {
        const title = n.title || '无标题';
        const content = n.content || '';
        return `<div class="pinned-note-card" data-id="${n.id}">
            <button class="pinned-note-delete" data-id="${n.id}" title="删除"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
            <div class="pinned-title">${title}</div>
            ${content ? `<div class="pinned-content">${content}</div>` : ''}
        </div>`;
    }).join('');
    container.querySelectorAll('.pinned-note-card').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('.pinned-note-delete')) return;
            openNotePanel(el.dataset.id);
        });
    });
    container.querySelectorAll('.pinned-note-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNote(btn.dataset.id);
        });
    });
}

// 滑动隐藏/展开（移动端 ≤768px）
(function () {
    let startX = 0;
    const toggler = (show) => {
        const that = $('pinnedNotes');
        const handle = $('pinnedExpandHandle');
        if (show) {
            that.style.transform = '';
            that.style.opacity = '';
            handle.style.display = 'none';
        } else {
            that.style.transform = 'translateX(-120%)';
            that.style.opacity = '0';
            handle.style.display = 'flex';
        }
    };
    $('pinnedNotes').addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    }, { passive: true });
    $('pinnedNotes').addEventListener('touchend', (e) => {
        const dx = (e.changedTouches[0].clientX - startX);
        if (dx < -40) toggler(false);
    });
    $('pinnedExpandHandle').addEventListener('click', () => toggler(true));
})();

$('noteBtn').addEventListener('click', () => openNotePanel());
$('notePanelClose').addEventListener('click', closeNotePanel);
$('notePanelOverlay').addEventListener('click', closeNotePanel);

document.addEventListener('DOMContentLoaded', init);
