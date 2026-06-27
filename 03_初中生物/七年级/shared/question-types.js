/**
 * TeachAny P2-7: 题型升级（素养立意）
 * 提供材料分析题、图表判读题、开放论述题三种新题型
 *
 * 三种题型：
 *   1. MaterialAnalysis 材料分析题
 *   2. ChartReading      图表判读题
 *   3. OpenDiscussion    开放论述题
 *
 * 使用方式：
 *   new MaterialAnalysis('container-id', { ... });
 *   new ChartReading('container-id', { ... });
 *   new OpenDiscussion('container-id', { ... });
 */
(function () {
    'use strict';

    /* =========================================================
     * 内部工具函数
     * ========================================================= */
    function $(selector, root) {
        return (root || document).querySelector(selector);
    }
    function el(tag, className, html) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (html !== undefined) node.innerHTML = html;
        return node;
    }
    function esc(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    // 简单 toast 提示（若页面已有 showToast 则复用）
    function showToast(msg) {
        if (typeof window.showToast === 'function') { window.showToast(msg); return; }
        var t = el('div', 'qt-toast', esc(msg));
        t.style.cssText = 'position:fixed;left:50%;bottom:80px;transform:translateX(-50%);' +
            'background:rgba(33,33,33,0.92);color:#fff;padding:10px 18px;border-radius:8px;' +
            'font-size:14px;z-index:10001;box-shadow:0 4px 12px rgba(0,0,0,0.25);' +
            'opacity:0;transition:opacity .25s;';
        document.body.appendChild(t);
        requestAnimationFrame(function () { t.style.opacity = '1'; });
        setTimeout(function () {
            t.style.opacity = '0';
            setTimeout(function () { t.remove(); }, 300);
        }, 2000);
    }
    function uniqueId(prefix) {
        return (prefix || 'qt') + '-' + Math.random().toString(36).slice(2, 9);
    }

    // 注入基础样式（仅注入一次）
    var _styleInjected = false;
    function injectBaseStyle() {
        if (_styleInjected) return;
        _styleInjected = true;
        var css = '' +
            '.qt-wrap{font-family:inherit;color:#2c3e50;margin:18px 0;}' +
            '.qt-title{font-size:1.15rem;font-weight:600;margin:0 0 12px;padding-left:10px;border-left:4px solid var(--primary,#1565C0);}' +
            '.qt-card{background:#fff;border:1px solid #e3e8ef;border-radius:10px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.06);}' +
            '.qt-material{background:#f6f8fa;border-left:3px solid var(--primary,#1565C0);padding:14px 16px;border-radius:6px;line-height:1.75;white-space:pre-wrap;}' +
            '.qt-material img{max-width:100%;border-radius:6px;margin-top:10px;}' +
            '.qt-subq{margin-top:16px;}' +
            '.qt-subq-title{font-weight:600;margin-bottom:6px;}' +
            '.qt-input,.qt-textarea{width:100%;border:1px solid #d6dde6;border-radius:6px;padding:10px 12px;font-size:14px;line-height:1.6;box-sizing:border-box;font-family:inherit;}' +
            '.qt-textarea{min-height:90px;resize:vertical;}' +
            '.qt-input:focus,.qt-textarea:focus{outline:none;border-color:var(--primary,#1565C0);box-shadow:0 0 0 2px rgba(21,101,192,0.15);}' +
            '.qt-btn{display:inline-block;background:var(--primary,#1565C0);color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:14px;cursor:pointer;transition:opacity .2s;}' +
            '.qt-btn:hover{opacity:0.9;}' +
            '.qt-btn.ghost{background:transparent;color:var(--primary,#1565C0);border:1px solid var(--primary,#1565C0);}' +
            '.qt-answer{margin-top:10px;padding:12px 14px;background:#fff8e1;border:1px dashed #e0c16a;border-radius:6px;line-height:1.7;display:none;}' +
            '.qt-answer.show{display:block;}' +
            '.qt-choice{display:flex;flex-direction:column;gap:8px;margin:8px 0;}' +
            '.qt-choice label{display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid #d6dde6;border-radius:6px;cursor:pointer;}' +
            '.qt-choice label:hover{background:#f6f8fa;}' +
            '.qt-choice input{margin:0;}' +
            '.qt-choice label.correct{background:#e8f5e9;border-color:#66bb6a;}' +
            '.qt-choice label.wrong{background:#ffebee;border-color:#ef5350;}' +
            '.qt-feedback{margin-top:8px;font-size:13px;font-weight:600;}' +
            '.qt-feedback.ok{color:#2e7d32;}' +
            '.qt-feedback.no{color:#c62828;}' +
            '.qt-criteria{margin-top:12px;background:#eef5ff;border-radius:6px;padding:12px 14px;display:none;}' +
            '.qt-criteria.show{display:block;}' +
            '.qt-criteria h4{margin:0 0 8px;font-size:14px;}' +
            '.qt-criteria ul{margin:0;padding-left:20px;}' +
            '.qt-criteria li{margin:4px 0;line-height:1.6;}' +
            '.qt-counter{font-size:13px;color:#666;margin-top:6px;}' +
            '.qt-counter.warn{color:#e65100;}' +
            '.qt-reference{margin-top:14px;padding:14px;background:#f0f7ff;border-radius:8px;line-height:1.75;display:none;}' +
            '.qt-reference.show{display:block;}' +
            '.qt-chart-wrap{position:relative;background:#fff;border:1px solid #e3e8ef;border-radius:8px;padding:10px;margin-bottom:14px;}' +
            '.qt-chart-wrap canvas{display:block;width:100%;max-width:560px;height:auto;}' +
            '.qt-toggle{cursor:pointer;user-select:none;}' +
            '@media (max-width:600px){.qt-card{padding:14px;}.qt-title{font-size:1.05rem;}}';
        var style = el('style', null, css);
        document.head.appendChild(style);
    }

    /* =========================================================
     * 1. 材料分析题 MaterialAnalysis
     * ========================================================= */
    function MaterialAnalysis(containerId, options) {
        if (!(this instanceof MaterialAnalysis)) return new MaterialAnalysis(containerId, options);
        this.container = document.getElementById(containerId);
        this.options = options || {};
        injectBaseStyle();
        this._render();
    }
    MaterialAnalysis.prototype._render = function () {
        var opt = this.options;
        var wrap = el('div', 'qt-wrap qt-material-analysis');
        var card = el('div', 'qt-card');

        // 标题
        if (opt.title) card.appendChild(el('h3', 'qt-title', esc(opt.title)));

        // 材料文本
        if (opt.material) {
            var mat = el('div', 'qt-material', esc(opt.material));
            if (opt.materialImage) {
                var img = document.createElement('img');
                img.src = opt.materialImage;
                img.alt = '材料配图';
                mat.appendChild(img);
            }
            card.appendChild(mat);
        }

        // 子题目
        var questions = opt.questions || [];
        for (var i = 0; i < questions.length; i++) {
            card.appendChild(this._renderSubQuestion(questions[i], i));
        }

        wrap.appendChild(card);
        this.container.innerHTML = '';
        this.container.appendChild(wrap);
    };
    MaterialAnalysis.prototype._renderSubQuestion = function (q, index) {
        var sub = el('div', 'qt-subq');
        sub.appendChild(el('div', 'qt-subq-title', (index + 1) + '. ' + esc(q.question || '')));

        var textarea = el('textarea', 'qt-textarea');
        textarea.placeholder = '在此输入你的分析…';
        textarea.rows = 3;
        sub.appendChild(textarea);

        // 答案区
        var ans = el('div', 'qt-answer');
        ans.innerHTML = '<strong>参考答案：</strong>' + esc(q.referenceAnswer || '暂无');
        sub.appendChild(ans);

        // 按钮
        var btnRow = el('div');
        btnRow.style.marginTop = '8px';
        var btn = el('button', 'qt-btn ghost', '显示参考答案');
        btn.type = 'button';
        var shown = false;
        btn.addEventListener('click', function () {
            shown = !shown;
            ans.classList.toggle('show', shown);
            btn.textContent = shown ? '隐藏参考答案' : '显示参考答案';
        });
        btnRow.appendChild(btn);
        sub.appendChild(btnRow);
        return sub;
    };

    /* =========================================================
     * 2. 图表判读题 ChartReading
     * ========================================================= */
    function ChartReading(containerId, options) {
        if (!(this instanceof ChartReading)) return new ChartReading(containerId, options);
        this.container = document.getElementById(containerId);
        this.options = options || {};
        injectBaseStyle();
        this._render();
    }
    ChartReading.prototype._render = function () {
        var opt = this.options;
        var wrap = el('div', 'qt-wrap qt-chart-reading');
        var card = el('div', 'qt-card');

        if (opt.title) card.appendChild(el('h3', 'qt-title', esc(opt.title)));

        // 图表
        var chartWrap = el('div', 'qt-chart-wrap');
        var canvas = document.createElement('canvas');
        canvas.width = 560;
        canvas.height = 280;
        chartWrap.appendChild(canvas);
        card.appendChild(chartWrap);

        // 等到 DOM 插入后再绘制
        this.container.innerHTML = '';
        this.container.appendChild(wrap);
        wrap.appendChild(card);

        this._drawChart(canvas, opt.chartType || 'bar', opt.chartData || {});

        // 题目
        var questions = opt.questions || [];
        for (var i = 0; i < questions.length; i++) {
            var q = questions[i] || {};
            if (q.type === 'choice') {
                card.appendChild(this._renderChoice(q, i));
            } else {
                card.appendChild(this._renderFill(q, i));
            }
        }
    };
    ChartReading.prototype._drawChart = function (canvas, type, data) {
        var ctx = canvas.getContext('2d');
        var W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        var labels = data.labels || [];
        var values = data.values || [];
        var padding = { top: 24, right: 24, bottom: 36, left: 40 };
        var cw = W - padding.left - padding.right;
        var ch = H - padding.top - padding.bottom;
        var maxVal = Math.max.apply(null, values.concat([1]));
        var palette = ['#1565C0', '#43A047', '#FB8C00', '#8E24AA', '#00897B', '#E53935'];

        function drawAxis() {
            ctx.strokeStyle = '#cfd8dc';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, padding.top);
            ctx.lineTo(padding.left, padding.top + ch);
            ctx.lineTo(padding.left + cw, padding.top + ch);
            ctx.stroke();
            ctx.fillStyle = '#90a4ae';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            // y 轴刻度
            for (var k = 0; k <= 4; k++) {
                var y = padding.top + ch - (ch * k / 4);
                ctx.fillText(Math.round(maxVal * k / 4), padding.left - 6, y + 3);
                ctx.beginPath();
                ctx.moveTo(padding.left - 3, y);
                ctx.lineTo(padding.left, y);
                ctx.stroke();
            }
        }

        if (type === 'pie') {
            var total = values.reduce(function (a, b) { return a + b; }, 0) || 1;
            var cx = padding.left + cw / 2, cy = padding.top + ch / 2;
            var radius = Math.min(cw, ch) / 2 - 10;
            var start = -Math.PI / 2;
            for (var i = 0; i < values.length; i++) {
                var angle = (values[i] / total) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, radius, start, start + angle);
                ctx.closePath();
                ctx.fillStyle = palette[i % palette.length];
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                // 标签
                var mid = start + angle / 2;
                var lx = cx + Math.cos(mid) * (radius + 14);
                var ly = cy + Math.sin(mid) * (radius + 14);
                ctx.fillStyle = '#37474f';
                ctx.font = '12px sans-serif';
                ctx.textAlign = lx >= cx ? 'left' : 'right';
                ctx.fillText((labels[i] || '') + ' ' + values[i], lx, ly);
                start += angle;
            }
            return;
        }

        drawAxis();

        if (type === 'line') {
            ctx.strokeStyle = '#1565C0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (var i2 = 0; i2 < values.length; i2++) {
                var x = padding.left + (values.length === 1 ? cw / 2 : (cw * i2 / (values.length - 1)));
                var y = padding.top + ch - (values[i2] / maxVal) * ch;
                if (i2 === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                // 数据点
                ctx.fillStyle = '#1565C0';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.stroke();
        } else { // bar
            var n = values.length;
            var barW = cw / n * 0.6;
            var gap = cw / n * 0.4;
            for (var i3 = 0; i3 < n; i3++) {
                var bx = padding.left + (cw * i3 / n) + gap / 2;
                var bh = (values[i3] / maxVal) * ch;
                ctx.fillStyle = palette[i3 % palette.length];
                ctx.fillRect(bx, padding.top + ch - bh, barW, bh);
                ctx.fillStyle = '#37474f';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(values[i3], bx + barW / 2, padding.top + ch - bh - 4);
            }
        }

        // x 轴标签
        ctx.fillStyle = '#546e7a';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        for (var j = 0; j < labels.length; j++) {
            var xl = padding.left + (labels.length === 1 ? cw / 2 : (cw * j / (labels.length - 1)));
            if (type === 'bar') {
                xl = padding.left + (cw * j / labels.length) + (cw / labels.length) / 2;
            }
            ctx.fillText(labels[j] || '', xl, padding.top + ch + 18);
        }
    };
    ChartReading.prototype._renderChoice = function (q, index) {
        var sub = el('div', 'qt-subq');
        sub.appendChild(el('div', 'qt-subq-title', (index + 1) + '. ' + esc(q.question || '') + '（选择题）'));
        var choiceBox = el('div', 'qt-choice');
        var options = q.options || [];
        var correctIdx = q.correct;
        var feedback = el('div', 'qt-feedback');
        for (var i = 0; i < options.length; i++) {
            (function (i) {
                var label = el('label');
                var input = document.createElement('input');
                input.type = 'radio';
                input.name = 'qt-choice-' + uniqueId('c');
                label.appendChild(input);
                label.appendChild(document.createTextNode(' ' + String.fromCharCode(65 + i) + '. ' + options[i]));
                input.addEventListener('change', function () {
                    // 清除上次状态
                    Array.prototype.forEach.call(choiceBox.querySelectorAll('label'), function (lb) {
                        lb.classList.remove('correct', 'wrong');
                    });
                    if (i === correctIdx) {
                        label.classList.add('correct');
                        feedback.textContent = '回答正确！';
                        feedback.className = 'qt-feedback ok';
                    } else {
                        label.classList.add('wrong');
                        var correctLabel = choiceBox.querySelectorAll('label')[correctIdx];
                        if (correctLabel) correctLabel.classList.add('correct');
                        feedback.textContent = '回答错误，正确答案为 ' + String.fromCharCode(65 + correctIdx) + '。';
                        feedback.className = 'qt-feedback no';
                    }
                });
                choiceBox.appendChild(label);
            })(i);
        }
        sub.appendChild(choiceBox);
        sub.appendChild(feedback);
        return sub;
    };
    ChartReading.prototype._renderFill = function (q, index) {
        var sub = el('div', 'qt-subq');
        sub.appendChild(el('div', 'qt-subq-title', (index + 1) + '. ' + esc(q.question || '') + '（填空题）'));
        var input = el('input', 'qt-input');
        input.type = 'text';
        input.placeholder = '请输入答案';
        sub.appendChild(input);

        var ans = el('div', 'qt-answer');
        ans.innerHTML = '<strong>参考答案：</strong>' + esc(q.answer || '暂无');
        sub.appendChild(ans);

        var btn = el('button', 'qt-btn ghost', '显示参考答案');
        btn.type = 'button';
        var shown = false;
        btn.addEventListener('click', function () {
            shown = !shown;
            ans.classList.toggle('show', shown);
            btn.textContent = shown ? '隐藏参考答案' : '显示参考答案';
        });
        var row = el('div');
        row.style.marginTop = '8px';
        row.appendChild(btn);
        sub.appendChild(row);
        return sub;
    };

    /* =========================================================
     * 3. 开放论述题 OpenDiscussion
     * ========================================================= */
    function OpenDiscussion(containerId, options) {
        if (!(this instanceof OpenDiscussion)) return new OpenDiscussion(containerId, options);
        this.container = document.getElementById(containerId);
        this.options = options || {};
        injectBaseStyle();
        this._render();
    }
    OpenDiscussion.prototype._render = function () {
        var opt = this.options;
        var wrap = el('div', 'qt-wrap qt-open-discussion');
        var card = el('div', 'qt-card');

        if (opt.title) card.appendChild(el('h3', 'qt-title', esc(opt.title)));
        if (opt.question) {
            var qBox = el('div', 'qt-material');
            qBox.textContent = opt.question;
            card.appendChild(qBox);
        }

        // 文本输入区
        var textarea = el('textarea', 'qt-textarea');
        textarea.placeholder = '请在此处展开你的论述…';
        textarea.rows = 8;
        card.appendChild(textarea);

        // 字数统计
        var counter = el('div', 'qt-counter');
        var minWords = opt.minWords || 0;
        counter.textContent = '已输入 0 字' + (minWords ? '（建议不少于 ' + minWords + ' 字）' : '');
        card.appendChild(counter);

        var self = this;
        textarea.addEventListener('input', function () {
            var len = textarea.value.length;
            counter.textContent = '已输入 ' + len + ' 字' + (minWords ? '（建议不少于 ' + minWords + ' 字）' : '');
            counter.classList.toggle('warn', minWords > 0 && len < minWords);
        });

        // 评分标准（折叠）
        var criteria = el('div', 'qt-criteria');
        var critHtml = '<h4>评分标准</h4>';
        var critList = opt.scoringCriteria || [];
        if (critList.length) {
            critHtml += '<ul>';
            for (var i = 0; i < critList.length; i++) {
                critHtml += '<li>' + esc(critList[i]) + '</li>';
            }
            critHtml += '</ul>';
        } else {
            critHtml += '<p>暂无评分标准。</p>';
        }
        criteria.innerHTML = critHtml;
        card.appendChild(criteria);

        var critBtn = el('button', 'qt-btn ghost', '查看评分标准');
        critBtn.type = 'button';
        var critShown = false;
        critBtn.addEventListener('click', function () {
            critShown = !critShown;
            criteria.classList.toggle('show', critShown);
            critBtn.textContent = critShown ? '隐藏评分标准' : '查看评分标准';
        });

        // 参考要点（提交后显示）
        var ref = el('div', 'qt-reference');
        ref.innerHTML = '<strong>参考要点：</strong>' + esc(opt.referencePoints || '暂无参考要点');
        card.appendChild(ref);

        var submitBtn = el('button', 'qt-btn', '提交');
        submitBtn.type = 'button';
        submitBtn.addEventListener('click', function () {
            var len = textarea.value.trim().length;
            if (minWords > 0 && len < minWords) {
                showToast('字数不足，建议至少 ' + minWords + ' 字（当前 ' + len + ' 字）');
                return;
            }
            ref.classList.add('show');
            submitBtn.disabled = true;
            submitBtn.textContent = '已提交';
            submitBtn.style.opacity = '0.7';
            showToast('已提交，请对照参考要点自评');
        });

        var btnRow = el('div');
        btnRow.style.marginTop = '10px';
        btnRow.style.display = 'flex';
        btnRow.style.gap = '10px';
        btnRow.style.flexWrap = 'wrap';
        btnRow.appendChild(critBtn);
        btnRow.appendChild(submitBtn);
        card.appendChild(btnRow);

        wrap.appendChild(card);
        this.container.innerHTML = '';
        this.container.appendChild(wrap);
    };

    /* =========================================================
     * 暴露到全局
     * ========================================================= */
    window.MaterialAnalysis = MaterialAnalysis;
    window.ChartReading = ChartReading;
    window.OpenDiscussion = OpenDiscussion;

    // 便捷命名空间
    window.QuestionTypes = {
        MaterialAnalysis: MaterialAnalysis,
        ChartReading: ChartReading,
        OpenDiscussion: OpenDiscussion
    };
})();
