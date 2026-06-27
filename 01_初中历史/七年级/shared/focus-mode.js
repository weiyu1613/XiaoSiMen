/**
 * TeachAny P2-9: 专注模式
 * 点击月亮图标切换：关闭粒子/光晕等装饰性动画，界面降级为极简风格
 * 尊重 prefers-reduced-motion 系统设置
 *
 * 依赖：focus-mode.css（建议在页面中一并引入）
 *
 * 状态存储：localStorage key = teachany_focus_mode
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'teany_focus_mode';
    // 兼容拼写变体（历史可能写入过不同 key），统一使用上面这一个
    var STORAGE_KEY_ALT = 'teachany_focus_mode';

    var FocusMode = {
        enabled: false,
        toggleBtn: null,

        /* ---------- 初始化 ---------- */
        init: function () {
            if (this._inited) return;
            this._inited = true;

            // 读取存储
            var stored = this._readStored();
            // 检测系统设置：prefers-reduced-motion
            var reduceMotion = this._prefersReducedMotion();

            // 系统已开启减少动画时，默认启用专注模式（除非用户曾显式关闭过）
            var enable;
            if (stored === null) {
                enable = reduceMotion;
            } else {
                enable = stored === true;
            }

            this._buildButton();
            this._apply(enable, true);

            // 监听系统设置变化（实时跟随）
            if (window.matchMedia) {
                var mql = window.matchMedia('(prefers-reduced-motion: reduce)');
                var self = this;
                var handler = function (e) {
                    // 只有在用户未显式设置过时才跟随系统
                    if (self._readStored() === null) {
                        self._apply(e.matches, false);
                    }
                };
                if (mql.addEventListener) {
                    mql.addEventListener('change', handler);
                } else if (mql.addListener) {
                    mql.addListener(handler); // 旧版 Safari
                }
            }
        },

        /* ---------- 公共方法 ---------- */
        toggle: function () {
            this._apply(!this.enabled, false);
        },
        enable: function () {
            this._apply(true, false);
        },
        disable: function () {
            this._apply(false, false);
        },
        isEnabled: function () {
            return this.enabled;
        },

        /* ---------- 内部方法 ---------- */
        _readStored: function () {
            try {
                var v = localStorage.getItem(STORAGE_KEY);
                if (v === null) v = localStorage.getItem(STORAGE_KEY_ALT);
                if (v === null) return null;
                return v === '1' || v === 'true';
            } catch (e) {
                return null;
            }
        },
        _writeStored: function (val) {
            try {
                localStorage.setItem(STORAGE_KEY, val ? '1' : '0');
                // 同步旧 key（防止历史脚本读取）
                localStorage.setItem(STORAGE_KEY_ALT, val ? '1' : '0');
            } catch (e) { /* 隐私模式可能写入失败，忽略 */ }
        },
        _prefersReducedMotion: function () {
            if (!window.matchMedia) return false;
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        },

        _buildButton: function () {
            var existing = document.querySelector('.focus-mode-toggle');
            if (existing) { this.toggleBtn = existing; return; }

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'focus-mode-toggle';
            btn.setAttribute('aria-label', '切换专注模式');
            btn.setAttribute('title', '切换专注模式');
            btn.textContent = '🌙';

            var self = this;
            btn.addEventListener('click', function () {
                self.toggle();
            });

            // 延迟到 DOM 就绪后插入
            var append = function () {
                document.body.appendChild(btn);
            };
            if (document.body) {
                append();
            } else {
                document.addEventListener('DOMContentLoaded', append);
            }
            this.toggleBtn = btn;
        },

        _apply: function (enable, silent) {
            this.enabled = !!enable;
            if (!document.body) {
                // body 尚未就绪，稍后重试
                var self = this;
                document.addEventListener('DOMContentLoaded', function () {
                    self._apply(enable, silent);
                });
                return;
            }

            if (this.enabled) {
                document.body.classList.add('focus-mode');
            } else {
                document.body.classList.remove('focus-mode');
            }

            // 持久化（无论来自系统默认还是用户操作，都写入以便后续读取）
            this._writeStored(this.enabled);

            // 更新按钮图标
            if (this.toggleBtn) {
                this.toggleBtn.textContent = this.enabled ? '☀️' : '🌙';
                this.toggleBtn.setAttribute('aria-pressed', this.enabled ? 'true' : 'false');
            }

            // toast 提示（初始化静默时不弹）
            if (!silent) {
                this._toast(this.enabled ? '专注模式已开启' : '专注模式已关闭');
            }

            // 派发自定义事件，便于其他组件联动（如暂停粒子动画）
            try {
                document.dispatchEvent(new CustomEvent('focusmode:change', {
                    detail: { enabled: this.enabled }
                }));
            } catch (e) { /* 老浏览器无 CustomEvent，忽略 */ }
        },

        _toast: function (msg) {
            // 复用页面已有 showToast
            if (typeof window.showToast === 'function') { window.showToast(msg); return; }
            var t = document.createElement('div');
            t.textContent = msg;
            t.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);' +
                'background:rgba(33,33,33,0.92);color:#fff;padding:10px 18px;border-radius:8px;' +
                'font-size:14px;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.25);' +
                'opacity:0;transition:opacity .25s;';
            document.body.appendChild(t);
            requestAnimationFrame(function () { t.style.opacity = '1'; });
            setTimeout(function () {
                t.style.opacity = '0';
                setTimeout(function () { t.remove(); }, 300);
            }, 1800);
        }
    };

    /* ---------- 暴露到全局 ---------- */
    window.FocusMode = FocusMode;

    /* ---------- 自动初始化 ---------- */
    function autoInit() {
        FocusMode.init();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
})();
