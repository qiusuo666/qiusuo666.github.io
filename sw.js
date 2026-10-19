/* Custom Tabs - Service Worker
 *
 * 策略
 *   导航 / HTML      → network-first（3s 超时回退缓存）：保证改动即时生效
 *   style.css / *.js → network-first（304 校验极快，同样保证即时生效）
 *   vendor/*         → cache-first：版本固定的第三方库，永不重复下载
 *   图片             → cache-first + 30 天后台刷新：壁纸、图标不再重下
 *   跨域请求         → 完全不接管，交给浏览器默认处理
 *
 * 说明：只接管同源请求，且只在 https / localhost 下生效。
 */
const VERSION = 'v1';
const STATIC_CACHE = `cst-static-${VERSION}`;
const IMAGE_CACHE  = `cst-image-${VERSION}`;

const HTML_KEY     = new URL('/index.html', self.location.origin).href;
const NAV_TIMEOUT  = 3000;
const IMAGE_TTL    = 30 * 24 * 3600 * 1000;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k.startsWith('cst-') && k !== STATIC_CACHE && k !== IMAGE_CACHE)
          .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  if (url.origin !== self.location.origin) return;        // 跨域交给浏览器
  if (url.pathname.endsWith('/sw.js')) return;            // 自身不缓存

  // 页面导航：永远优先拿最新 HTML
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, new Request(HTML_KEY, { method: 'GET' })));
    return;
  }

  // 版本固定的第三方库：本地优先
  if (url.pathname.startsWith('/vendor/')) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // 图片：本地优先，30 天后后台刷新
  if (/\.(?:png|jpe?g|webp|gif|svg|ico|avif)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const [resp, update] = await imageStrategy(req);
      if (update) event.waitUntil(update);
      return resp;
    })());
    return;
  }

  // 样式与脚本：网络优先（304 极快），断网时用缓存
  if (/\.(?:css|js|mjs|woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(networkFirst(req, req));
    return;
  }
});

async function networkFirst(req, cacheKey) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const res = await fetchWithTimeout(req, NAV_TIMEOUT);
    if (res && res.ok) await cache.put(cacheKey, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
    throw e;
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) await cache.put(req, res.clone());
  return res;
}

async function imageStrategy(req) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(req);

  if (cached) {
    const date = Date.parse(cached.headers.get('date') || '');
    if (!date || Date.now() - date < IMAGE_TTL) return [cached, null];
    // 过期：先给旧的，后台静默更新
    const update = fetch(req)
      .then(res => { if (res && res.ok) cache.put(req, res.clone()); })
      .catch(() => {});
    return [cached, update];
  }

  const res = await fetch(req);
  if (res && res.ok) await cache.put(req, res.clone());
  return [res, null];
}

function fetchWithTimeout(req, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(req).then(
      res => { clearTimeout(timer); resolve(res); },
      err => { clearTimeout(timer); reject(err); }
    );
  });
}
