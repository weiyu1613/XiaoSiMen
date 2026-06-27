/**
 * TeachAny P1-16: 学科签名组件
 * 为四学科创建差异化的Hero区域视觉效果
 */
(function() {
    'use strict';
    
    const SubjectSignature = {
        history: {
            pattern: 'timeline',
            icon: 'fa-landmark',
            bgPattern: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M40 10 L40 70 M20 30 L60 30 M20 50 L60 50\' stroke=\'%23ffffff\' stroke-width=\'1\'/%3E%3Ccircle cx=\'40\' cy=\'10\' r=\'3\'/%3E%3Ccircle cx=\'40\' cy=\'30\' r=\'3\'/%3E%3Ccircle cx=\'40\' cy=\'50\' r=\'3\'/%3E%3Ccircle cx=\'40\' cy=\'70\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")',
            tagline: '以史为鉴，可知兴替'
        },
        geography: {
            pattern: 'compass',
            icon: 'fa-compass',
            bgPattern: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'1\' stroke-opacity=\'0.06\'%3E%3Ccircle cx=\'40\' cy=\'40\' r=\'30\'/%3E%3Ccircle cx=\'40\' cy=\'40\' r=\'20\'/%3E%3Ccircle cx=\'40\' cy=\'40\' r=\'10\'/%3E%3Cpath d=\'M40 10 L40 70 M10 40 L70 40\'/%3E%3C/g%3E%3C/svg%3E")',
            tagline: '胸怀天下，脚踏实地'
        },
        biology: {
            pattern: 'dna',
            icon: 'fa-dna',
            bgPattern: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'1\' stroke-opacity=\'0.06\'%3E%3Cpath d=\'M20 10 Q40 25 20 40 Q40 55 20 70 M60 10 Q40 25 60 40 Q40 55 60 70\'/%3E%3Cpath d=\'M20 10 L60 10 M20 25 L60 25 M20 40 L60 40 M20 55 L60 55 M20 70 L60 70\' stroke-dasharray=\'2 4\'/%3E%3C/g%3E%3C/svg%3E")',
            tagline: '探索生命奥秘，敬畏自然规律'
        },
        politics: {
            pattern: 'scales',
            icon: 'fa-scale-balanced',
            bgPattern: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'1\' stroke-opacity=\'0.06\'%3E%3Cpath d=\'M40 10 L40 60 M20 25 L60 25 M15 40 Q20 50 15 55 Q10 50 15 40 M65 40 Q70 50 65 55 Q60 50 65 40\'/%3E%3Crect x=\'30\' y=\'60\' width=\'20\' height=\'8\' rx=\'2\'/%3E%3C/g%3E%3C/svg%3E")',
            tagline: '崇德尚法，知行合一'
        }
    };
    
    function applySignature() {
        const heroSection = document.querySelector('.hero-section, .hero, header.hero');
        if (!heroSection) return;
        
        // Detect subject from path
        const path = window.location.pathname;
        let subject = null;
        if (path.indexOf('01_') > -1 || path.indexOf('history') > -1) subject = 'history';
        else if (path.indexOf('02_') > -1 || path.indexOf('geography') > -1) subject = 'geography';
        else if (path.indexOf('03_') > -1 || path.indexOf('biology') > -1) subject = 'biology';
        else if (path.indexOf('04_') > -1 || path.indexOf('politics') > -1) subject = 'politics';
        
        if (!subject) return;
        const sig = SubjectSignature[subject];
        
        // Apply background pattern
        heroSection.style.backgroundImage = sig.bgPattern + ', ' + (heroSection.style.backgroundImage || '');
        
        // Add tagline if not present
        const existingTagline = heroSection.querySelector('.subject-tagline');
        if (!existingTagline) {
            const tagline = document.createElement('p');
            tagline.className = 'subject-tagline';
            tagline.style.cssText = 'font-size:0.95rem;opacity:0.85;margin-top:12px;font-style:italic;';
            tagline.textContent = sig.tagline;
            const heroContent = heroSection.querySelector('.hero-content, .container');
            if (heroContent) heroContent.appendChild(tagline);
        }
        
        // Add floating icon
        if (!heroSection.querySelector('.subject-float-icon')) {
            const floatIcon = document.createElement('div');
            floatIcon.className = 'subject-float-icon';
            floatIcon.innerHTML = '<i class="fa-solid ' + sig.icon + '"></i>';
            floatIcon.style.cssText = 'position:absolute;right:30px;top:50%;transform:translateY(-50%);font-size:80px;opacity:0.1;pointer-events:none;';
            heroSection.style.position = heroSection.style.position || 'relative';
            heroSection.appendChild(floatIcon);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applySignature);
    } else {
        applySignature();
    }
    
    window.SubjectSignature = SubjectSignature;
})();
