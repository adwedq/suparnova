// ext.js — custom HTML elements
// usage: <script src="ext.js"></script>

// ─────────────────────────────────────────
// <x-blink> — parpadeo de texto
// attrs: speed (ms, default 500)
// <x-blink speed="300">SALE</x-blink>
// ─────────────────────────────────────────
customElements.define('x-blink', class extends HTMLElement {
  connectedCallback() {
    const speed = this.getAttribute('speed') || 500;
    this.style.display = 'inline-block';
    this._iv = setInterval(() => {
      this.style.visibility = this.style.visibility === 'hidden' ? 'visible' : 'hidden';
    }, speed);
  }
  disconnectedCallback() { clearInterval(this._iv); }
});

// ─────────────────────────────────────────
// <x-glitch> — efecto glitch en texto
// attrs: intensity (low/mid/high, default mid)
// <x-glitch intensity="high">ERROR</x-glitch>
// ─────────────────────────────────────────
customElements.define('x-glitch', class extends HTMLElement {
  connectedCallback() {
    const intensity = this.getAttribute('intensity') || 'mid';
    const text = this.textContent;
    const speeds = { low: '4s', mid: '2s', high: '0.8s' };
    const speed = speeds[intensity] || '2s';
    this.innerHTML = '';
    this.style.cssText = 'display:inline-block;position:relative;';
    const style = document.createElement('style');
    const id = 'g' + Math.random().toString(36).slice(2, 7);
    this.setAttribute('data-id', id);
    style.textContent = `
      [data-id="${id}"] { font-family: inherit; }
      [data-id="${id}"]::before,
      [data-id="${id}"]::after {
        content: attr(data-text);
        position: absolute;
        top: 0; left: 0;
        width: 100%;
        overflow: hidden;
      }
      [data-id="${id}"]::before {
        color: #f00;
        animation: glitch-a-${id} ${speed} infinite;
        clip-path: polygon(0 30%, 100% 30%, 100% 50%, 0 50%);
      }
      [data-id="${id}"]::after {
        color: #0ff;
        animation: glitch-b-${id} ${speed} infinite;
        clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%);
      }
      @keyframes glitch-a-${id} {
        0%,90%,100% { transform: translate(0); opacity: 0; }
        91% { transform: translate(-3px, 1px); opacity: 1; }
        93% { transform: translate(3px, -1px); opacity: 1; }
        95% { transform: translate(-2px, 0); opacity: 1; }
      }
      @keyframes glitch-b-${id} {
        0%,90%,100% { transform: translate(0); opacity: 0; }
        92% { transform: translate(3px, 1px); opacity: 1; }
        94% { transform: translate(-3px, -1px); opacity: 1; }
        96% { transform: translate(2px, 0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    this.setAttribute('data-text', text);
    this.textContent = text;
  }
});

// ─────────────────────────────────────────
// <x-bgcolor> — switcher de color de fondo
// attrs: options (colores separados por coma), value (color directo)
// <x-bgcolor options="white,black,#ff6b6b,#4ecdc4"></x-bgcolor>
// <x-bgcolor value="pink"></x-bgcolor>
// ─────────────────────────────────────────
customElements.define('x-bgcolor', class extends HTMLElement {
  connectedCallback() {
    const value = this.getAttribute('value');
    const options = this.getAttribute('options');

    if (value) {
      document.body.style.background = value;
      return;
    }

    if (options) {
      const colors = options.split(',').map(c => c.trim());
      this.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;';
      colors.forEach(color => {
        const btn = document.createElement('button');
        btn.style.cssText = `
          width:28px;height:28px;border-radius:50%;
          background:${color};border:2px solid rgba(0,0,0,0.15);
          cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;
          flex-shrink:0;
        `;
        btn.title = color;
        btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.2)');
        btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
        btn.addEventListener('click', () => {
          document.body.style.background = color;
          this.querySelectorAll('button').forEach(b => b.style.boxShadow = '');
          btn.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.4)';
        });
        this.appendChild(btn);
      });
    }
  }
});

// ─────────────────────────────────────────
// <x-toast> — notificaciones
// attrs: duration (ms), position (top/bottom + start/end/center), type (success/error/info/warning)
// <x-toast duration="3000" position="bottom-end" type="success">Guardado</x-toast>
// JS: document.querySelector('x-toast').show() or xToast('mensaje', {type, duration})
// ─────────────────────────────────────────
customElements.define('x-toast', class extends HTMLElement {
  connectedCallback() {
    const pos = this.getAttribute('position') || 'bottom-end';
    const type = this.getAttribute('type') || 'info';
    const duration = parseInt(this.getAttribute('duration') || 3000);
    const auto = this.hasAttribute('auto');

    const [v, h] = pos.split('-');
    const vPos = v === 'top' ? 'top:20px' : 'bottom:20px';
    const hPos = h === 'start' ? 'left:20px' : h === 'center' ? 'left:50%;transform:translateX(-50%)' : 'right:20px';
    const colors = { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    const dot = colors[type] || colors.info;

    this._container = document.createElement('div');
    this._container.style.cssText = `
      position:fixed;${vPos};${hPos};
      background:#1a1814;color:#f5f0e8;
      padding:11px 16px;border-radius:6px;
      font-family:inherit;font-size:14px;
      display:flex;align-items:center;gap:10px;
      opacity:0;transition:opacity 0.25s,transform 0.25s;
      transform:${v==='top'?'translateY(-8px)':'translateY(8px)'};
      z-index:9999;max-width:320px;line-height:1.4;
      box-shadow:0 4px 20px rgba(0,0,0,0.25);
      pointer-events:none;
    `;

    const dotEl = document.createElement('span');
    dotEl.style.cssText = `width:7px;height:7px;border-radius:50%;background:${dot};flex-shrink:0;`;
    const msg = document.createElement('span');
    msg.textContent = this.getAttribute('message') || this.textContent.trim();

    this._container.appendChild(dotEl);
    this._container.appendChild(msg);
    document.body.appendChild(this._container);
    this.style.display = 'none';

    this.show = (text, opts = {}) => {
      if (text) msg.textContent = text;
      if (opts.type) dotEl.style.background = colors[opts.type] || dot;
      this._container.style.opacity = '1';
      this._container.style.transform = 'translateY(0)';
      clearTimeout(this._t);
      this._t = setTimeout(() => this.hide(), opts.duration || duration);
    };

    this.hide = () => {
      this._container.style.opacity = '0';
      this._container.style.transform = v === 'top' ? 'translateY(-8px)' : 'translateY(8px)';
    };

    if (auto) this.show();
  }
  disconnectedCallback() { this._container?.remove(); }
});

// helper global
window.xToast = (msg, opts = {}) => {
  let t = document.querySelector('x-toast');
  if (!t) {
    t = document.createElement('x-toast');
    t.setAttribute('position', opts.position || 'bottom-end');
    t.setAttribute('type', opts.type || 'info');
    document.body.appendChild(t);
    setTimeout(() => t.show(msg, opts), 50);
  } else {
    t.show(msg, opts);
  }
};

// ─────────────────────────────────────────
// <x-tabs> + <x-tab> + <x-panel>
// <x-tabs>
//   <x-tab for="p1">Tab uno</x-tab>
//   <x-tab for="p2">Tab dos</x-tab>
//   <x-panel id="p1">Contenido uno</x-panel>
//   <x-panel id="p2">Contenido dos</x-panel>
// </x-tabs>
// ─────────────────────────────────────────
customElements.define('x-tabs', class extends HTMLElement {
  connectedCallback() {
    setTimeout(() => this._init());
  }
  _init() {
    const tabs = [...this.querySelectorAll('x-tab')];
    const panels = [...this.querySelectorAll('x-panel')];

    const style = document.createElement('style');
    style.textContent = `
      x-tabs { display:block; }
      x-tab {
        display:inline-block;padding:8px 16px;cursor:pointer;
        font-family:inherit;font-size:14px;
        border-bottom:2px solid transparent;color:#888;
        transition:color 0.15s,border-color 0.15s;
        user-select:none;
      }
      x-tab[active] { color:#1a1814;border-bottom-color:currentColor;font-weight:500; }
      x-tab:hover:not([active]) { color:#444; }
      x-panel { display:none;padding:16px 0; }
      x-panel[active] { display:block;animation:xpanel 0.2s ease; }
      @keyframes xpanel { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
    `;
    if (!document.querySelector('style[data-xtabs]')) {
      style.setAttribute('data-xtabs', '');
      document.head.appendChild(style);
    }

    const activate = (tab) => {
      tabs.forEach(t => t.removeAttribute('active'));
      panels.forEach(p => p.removeAttribute('active'));
      tab.setAttribute('active', '');
      const target = this.querySelector(`x-panel#${tab.getAttribute('for')}`);
      if (target) target.setAttribute('active', '');
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(tab));
      tab.setAttribute('tabindex', '0');
      tab.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') activate(tab);
        if (e.key === 'ArrowRight') tabs[(i + 1) % tabs.length].focus();
        if (e.key === 'ArrowLeft') tabs[(i - 1 + tabs.length) % tabs.length].focus();
      });
    });

    if (tabs.length) activate(tabs[0]);
  }
});
customElements.define('x-tab', class extends HTMLElement {});
customElements.define('x-panel', class extends HTMLElement {});

// ─────────────────────────────────────────
// <x-include> — incluir HTML externo
// attrs: src
// <x-include src="/partials/nav.html"></x-include>
// ─────────────────────────────────────────
customElements.define('x-include', class extends HTMLElement {
  async connectedCallback() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(res.status);
      const html = await res.text();
      const tpl = document.createElement('template');
      tpl.innerHTML = html;
      this.replaceWith(tpl.content.cloneNode(true));
    } catch(e) {
      this.innerHTML = `<span style="color:#ef4444;font-size:12px;font-family:monospace">x-include: no se pudo cargar "${src}"</span>`;
    }
  }
});

// ─────────────────────────────────────────
// <x-carousel> + <x-slide>
// attrs: loop, autoplay (ms), controls, indicators
// <x-carousel loop autoplay="4000" controls indicators>
//   <x-slide>Slide 1</x-slide>
//   <x-slide>Slide 2</x-slide>
// </x-carousel>
// ─────────────────────────────────────────
customElements.define('x-carousel', class extends HTMLElement {
  connectedCallback() {
    setTimeout(() => this._init());
  }
  _init() {
    const slides = [...this.querySelectorAll('x-slide')];
    if (!slides.length) return;
    const loop = this.hasAttribute('loop');
    const autoplay = parseInt(this.getAttribute('autoplay') || 0);
    const showControls = this.hasAttribute('controls');
    const showIndicators = this.hasAttribute('indicators');
    let current = 0;

    this.style.cssText = 'display:block;position:relative;overflow:hidden;';

    const track = document.createElement('div');
    track.style.cssText = 'display:flex;transition:transform 0.35s cubic-bezier(.4,0,.2,1);will-change:transform;';
    slides.forEach(s => {
      s.style.cssText = 'min-width:100%;display:block;';
      track.appendChild(s);
    });
    this.innerHTML = '';
    this.appendChild(track);

    const go = (i) => {
      if (!loop && (i < 0 || i >= slides.length)) return;
      current = ((i % slides.length) + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, j) => d.style.background = j === current ? '#1a1814' : 'rgba(0,0,0,0.2)');
    };

    const dots = [];
    if (showIndicators) {
      const bar = document.createElement('div');
      bar.style.cssText = 'position:absolute;bottom:12px;left:0;right:0;display:flex;justify-content:center;gap:6px;z-index:2;';
      slides.forEach((_, i) => {
        const d = document.createElement('button');
        d.style.cssText = `width:7px;height:7px;border-radius:50%;border:none;cursor:pointer;padding:0;background:${i===0?'#1a1814':'rgba(0,0,0,0.2)'};transition:background 0.2s;`;
        d.addEventListener('click', () => go(i));
        dots.push(d);
        bar.appendChild(d);
      });
      this.appendChild(bar);
    }

    if (showControls) {
      const btnStyle = `position:absolute;top:50%;transform:translateY(-50%);z-index:2;background:rgba(255,255,255,0.85);border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:background 0.15s;`;
      const prev = document.createElement('button');
      prev.innerHTML = '&#8592;';
      prev.style.cssText = btnStyle + 'left:10px;';
      prev.addEventListener('click', () => go(current - 1));
      const next = document.createElement('button');
      next.innerHTML = '&#8594;';
      next.style.cssText = btnStyle + 'right:10px;';
      next.addEventListener('click', () => go(current + 1));
      this.appendChild(prev);
      this.appendChild(next);
    }

    // touch swipe
    let tx = 0;
    this.addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
    this.addEventListener('touchend', e => {
      const diff = tx - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) go(current + (diff > 0 ? 1 : -1));
    });

    if (autoplay) {
      let iv = setInterval(() => go(current + 1), autoplay);
      this.addEventListener('mouseenter', () => clearInterval(iv));
      this.addEventListener('mouseleave', () => { iv = setInterval(() => go(current + 1), autoplay); });
    }
  }
});
customElements.define('x-slide', class extends HTMLElement {});

// ─────────────────────────────────────────
// <x-swap> — alternar entre dos vistas
// <x-swap>
//   <div slot="a">Vista A <x-swap type="trigger">Más</x-swap></div>
//   <div slot="b"><x-swap type="trigger">Atrás</x-swap> Vista B</div>
// </x-swap>
// ─────────────────────────────────────────
customElements.define('x-swap', class extends HTMLElement {
  connectedCallback() {
    if (this.getAttribute('type') === 'trigger') {
      this.style.cssText = 'display:inline-block;cursor:pointer;user-select:none;';
      this.addEventListener('click', () => {
        const root = this.closest('x-swap:not([type])');
        if (root) root._toggle();
      });
      return;
    }
    setTimeout(() => this._init());
  }
  _init() {
    const slotA = this.querySelector('[slot="a"]');
    const slotB = this.querySelector('[slot="b"]');
    if (!slotA || !slotB) return;
    this.style.display = 'block';
    slotB.style.display = 'none';
    this._state = 'a';
    this._slotA = slotA;
    this._slotB = slotB;
  }
  _toggle() {
    if (!this._slotA) return;
    const goingTo = this._state === 'a' ? 'b' : 'a';
    this._slotA.style.display = goingTo === 'a' ? '' : 'none';
    this._slotB.style.display = goingTo === 'b' ? '' : 'none';
    this._state = goingTo;
  }
});

// ─────────────────────────────────────────
// <x-shape> — formas geométricas simples
// attrs: type (circle/square/triangle/star/rect), size, width, height, color, border, radius
// <x-shape type="circle" size="60" color="tomato"></x-shape>
// <x-shape type="star" size="50" color="gold"></x-shape>
// ─────────────────────────────────────────
customElements.define('x-shape', class extends HTMLElement {
  connectedCallback() {
    const type   = this.getAttribute('type') || 'circle';
    const size   = this.getAttribute('size') || 40;
    const color  = this.getAttribute('color') || 'currentColor';
    const border = this.getAttribute('border') || 'none';
    const radius = this.getAttribute('radius') || 8;
    const w      = this.getAttribute('width') || size;
    const h      = this.getAttribute('height') || size;

    this.style.cssText = `display:inline-block;line-height:0;vertical-align:middle;`;

    const shapes = {
      circle: `<circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}"/>`,
      square: `<rect x="1" y="1" width="${size-2}" height="${size-2}" rx="${radius}"/>`,
      rect:   `<rect x="1" y="1" width="${w-2}" height="${h-2}" rx="${radius}"/>`,
      triangle: `<polygon points="${size/2},2 ${size-2},${size-2} 2,${size-2}"/>`,
      star: (() => {
        const cx = size/2, cy = size/2, r1 = size/2 - 2, r2 = r1 * 0.4, pts = 5;
        let d = '';
        for (let i = 0; i < pts * 2; i++) {
          const r = i % 2 === 0 ? r1 : r2;
          const a = (i * Math.PI / pts) - Math.PI / 2;
          d += `${i===0?'':','} ${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        }
        return `<polygon points="${d}"/>`;
      })(),
      diamond: `<polygon points="${size/2},2 ${size-2},${size/2} ${size/2},${size-2} 2,${size/2}"/>`,
    };

    const W = type === 'rect' ? w : size;
    const H = type === 'rect' ? h : size;
    const [bWidth, bStyle, bColor] = border !== 'none'
      ? border.split(' ')
      : ['0', 'none', 'none'];

    this.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <g fill="${color}" stroke="${bColor || 'none'}" stroke-width="${parseFloat(bWidth)||0}">
        ${shapes[type] || shapes.circle}
      </g>
    </svg>`;
  }
});

// ─────────────────────────────────────────
// <x-bgsound> — sonido de fondo
// attrs: src, loop, volume (0-1), autoplay
// <x-bgsound src="music.mp3" loop volume="0.3" autoplay></x-bgsound>
// JS: el.play() / el.pause()
// ─────────────────────────────────────────
customElements.define('x-bgsound', class extends HTMLElement {
  connectedCallback() {
    const src      = this.getAttribute('src');
    const loop     = this.hasAttribute('loop');
    const volume   = parseFloat(this.getAttribute('volume') ?? 0.5);
    const autoplay = this.hasAttribute('autoplay');

    if (!src) return;
    this._audio = new Audio(src);
    this._audio.loop = loop;
    this._audio.volume = Math.min(1, Math.max(0, volume));
    this.style.display = 'none';

    this.play  = () => this._audio.play().catch(() => {});
    this.pause = () => this._audio.pause();
    this.stop  = () => { this._audio.pause(); this._audio.currentTime = 0; };

    if (autoplay) {
      // browsers bloquean autoplay sin interacción — esperamos el primer click
      const start = () => { this.play(); document.removeEventListener('click', start); };
      document.addEventListener('click', start, { once: true });
    }
  }
  disconnectedCallback() { this._audio?.pause(); }
});
