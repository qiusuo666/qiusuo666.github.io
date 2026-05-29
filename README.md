# 新标签页 (Custom Tabs)

一个精美的浏览器新标签页替代品，支持多端数据同步。

## ✨ 功能

- **美观的时钟** — 大字号数字时钟 + 日期显示
- **搜索引擎切换** — Google / 百度 / Bing / DuckDuckGo / 搜狗 / 360
- **搜索历史** — 自动记录搜索关键词，支持清空和删除
- **快捷网址** — 自定义分类和网址卡片，拖拽排序、跨分类移动
- **常用快捷栏** — 底部常驻收藏栏，快速访问高频网站
- **壁纸系统** — 5 张内置壁纸 + 自定义上传，切换实时生效
- **粒子背景** — 鼠标排斥 + 静止潮汐聚散的浮动粒子动画
- **🔐 账号登录** — 基于 Supabase 的用户名+密码认证
- **☁️ 多端同步** — 登录后自动同步分类、收藏、搜索历史、搜索引擎偏好

## 🚀 快速开始

### 本地使用

1. 克隆仓库
2. 用浏览器打开 `index.html`
3. （可选）将浏览器新标签页扩展指向本地文件，或部署到 GitHub Pages

### 作为 Chrome/Edge 新标签页

可以使用扩展（如 [New Tab Redirect](https://chromewebstore.google.com/detail/new-tab-redirect/icpgjfneehieebagbmdbhnlpiopdcmna)）将新标签页重定向到 GitHub Pages 地址。

## ☁️ 多端同步

项目使用 [Supabase](https://supabase.com) 作为后端：

| 功能 | 说明 |
|------|------|
| 用户注册/登录 | 用户名 + 密码（无需邮箱验证） |
| 记住登录 | 可选持久会话，跨页面刷新保持登录 |
| 自动同步 | 数据变更后 3 秒防抖自动上传 |
| 手动同步 | 用户菜单中可手动上传/下载 |
| 修改密码 | 支持在已登录状态下修改密码 |

### 自建同步服务

1. 在 [Supabase](https://supabase.com) 创建项目
2. 执行 `supabase-setup.sql` 中的建表语句
3. 在 Auth Providers 中关闭邮箱确认（`Confirm email` → 关闭）
4. 修改 `supabase-client.js` 中的 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`

## 📁 项目结构

```
Custom tabs/
├── index.html          # 主页面
├── style.css           # 样式表
├── script.js           # 主逻辑（搜索、时钟、壁纸、快捷栏、粒子）
├── supabase-client.js  # Supabase 认证 + 同步 API
├── supabase-setup.sql  # 数据库建表 SQL（供自建参考）
├── photos/             # 内置壁纸
├── 存档1~4/            # 开发历史版本
└── README.md
```

## 🛠 技术栈

- **前端**：原生 HTML/CSS/JavaScript（无框架）
- **后端/认证**：[Supabase](https://supabase.com) (Auth + PostgreSQL)
- **字体**：Google Fonts (Inter)
- **图标**：内联 SVG
- **存储**：localStorage（本地） + Supabase JSONB（云端）

## 📄 许可证

[MIT License](LICENSE) © 2026 qiusuo666