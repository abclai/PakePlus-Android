window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});/**
 * PakePlus / Tauri 专用优化脚本
 * 功能：
 * 1. 拦截 _blank 与新窗口，强制在当前窗口加载（兼容 http:// 与 https://）
 * 2. 优化 window.open 行为，防止脚本报错
 * 3. 自动将 Session Cookie 转换为长期 Cookie，实现持久化“保存密码/保持登录”
 */

(function () {
    'use strict';

    // ==========================================
    // 1. 拦截点击事件（支持 http / https 跳转）
    // ==========================================
    const hookClick = (e) => {
        const origin = e.target.closest('a');
        const isBaseTargetBlank = document.querySelector('head base[target="_blank"]');

        if (!origin || !origin.href) return;

        // 过滤非网页协议（如 javascript:、mailto:、tel: 等）
        const href = origin.href.trim();
        if (/^(javascript|mailto|tel|data|blob):/i.test(href)) return;

        // 检查是否需要强制在当前页打开
        const isTargetBlank = origin.target === '_blank' || Boolean(isBaseTargetBlank);

        if (isTargetBlank) {
            e.preventDefault();
            console.log('[PakeInject] 拦截新窗口跳转，当前页加载:', href);
            location.href = href;
        }
    };

    // ==========================================
    // 2. 覆盖原生 window.open
    // ==========================================
    window.open = function (url, target, features) {
        console.log('[PakeInject] window.open 被调用:', url);

        if (!url) return null;

        const urlString = String(url).trim();
        if (/^(javascript|mailto|tel):/i.test(urlString)) return null;

        location.href = urlString;
        return window; // 返回当前 window 句柄，防止 SPA 报错
    };

    // ==========================================
    // 3. 自动保持登录与持久化存储 Cookie
    // ==========================================
    const keepLoginAlive = () => {
        try {
            if (!document.cookie) return;
            
            // 将未指定过期时间的临时 Cookie（Session Cookie）强制延长为 1 年有效
            const cookies = document.cookie.split(';');
            const oneYearInSeconds = 365 * 24 * 60 * 60;

            cookies.forEach(cookie => {
                const eqPos = cookie.indexOf('=');
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                const value = eqPos > -1 ? cookie.substr(eqPos + 1) : '';

                if (name && !cookie.includes('expires=') && !cookie.includes('max-age=')) {
                    document.cookie = `${name}=${value}; max-age=${oneYearInSeconds}; path=/; SameSite=Lax`;
                }
            });
        } catch (err) {
            console.warn('[PakeInject] Cookie 持久化异常:', err);
        }
    };

    // 绑定事件
    document.addEventListener('click', hookClick, { capture: true });
    window.addEventListener('DOMContentLoaded', keepLoginAlive);
    window.addEventListener('beforeunload', keepLoginAlive);

    console.log('[PakeInject] http访问与保存登录脚本注入成功');
})();