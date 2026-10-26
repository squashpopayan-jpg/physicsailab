/* ===================================================================
   90-app.js — Orquestador de la Aplicación del Curso
   Percepción Computacional — Ing. Luis Fernando Barajas Ardila
   =================================================================== */
(function () {
  'use strict';
  const P = window.PERCEPCION;

  const state = {
    currentChapter: 'inicio',
    chapters: [],
    simInstances: {},
    quizAnswers: {},
    quizMode: 'practice' // 'practice' | 'exam'
  };
  P.appState = state;

  /* ---------- 1. Inicialización Principal ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initChapters();
    initRouting();
    initProgressBar();
    initSidebarToggle();
    initSearch();
  });

  /* ---------- 2. Gestión de Tema Claro / Oscuro ---------- */
  function initTheme() {
    const saved = localStorage.getItem('percepcion_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    const btn = document.getElementById('btn-theme-toggle');
    if (btn) {
      btn.onclick = () => {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('percepcion_theme', next);
        btn.textContent = next === 'dark' ? '🌙' : '☀️';
        P.notifyTheme();
      };
      btn.textContent = saved === 'dark' ? '🌙' : '☀️';
    }
  }

  /* ---------- 3. Detección y Carga de Capítulos ---------- */
  function initChapters() {
    const tpls = Array.from(document.querySelectorAll('template.chapter-src'));
    state.chapters = tpls.map(t => ({
      id: t.dataset.id,
      num: t.dataset.num,
      title: t.dataset.title,
      part: t.dataset.part || '',
      tpl: t
    }));

    buildSidebarTOC();
  }

  function buildSidebarTOC() {
    const container = document.getElementById('sidebar-toc');
    if (!container) return;
    container.innerHTML = '';

    let currentPart = '';
    state.chapters.forEach(ch => {
      if (ch.part && ch.part !== currentPart) {
        currentPart = ch.part;
        const partLbl = P.el('div', 'toc-section-label', currentPart);
        container.appendChild(partLbl);
      }

      const link = P.el('a', 'toc-link');
      link.href = '#' + ch.id;
      link.dataset.id = ch.id;

      const badge = P.el('span', 'toc-badge', ch.num || '•');
      const title = P.el('span', '', ch.title);
      link.append(badge, title);

      link.onclick = (e) => {
        e.preventDefault();
        navigateTo(ch.id);
        // Si está en pantalla pequeña, cerrar sidebar
        if (window.innerWidth <= 960) {
          const sb = document.getElementById('sidebar');
          if (sb) sb.classList.remove('open');
        }
      };

      container.appendChild(link);
    });
  }

  /* ---------- 4. Enrutamiento y Montaje ---------- */
  function initRouting() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'inicio';
      navigateTo(hash, false);
    });

    const initial = window.location.hash.replace('#', '') || 'inicio';
    navigateTo(initial, false);
  }

  function navigateTo(chapId, updateHash = true) {
    const target = state.chapters.find(c => c.id === chapId) || state.chapters[0];
    if (!target) return;

    state.currentChapter = target.id;
    if (updateHash) window.location.hash = '#' + target.id;

    // Actualizar enlaces activos en el TOC
    document.querySelectorAll('.toc-link').forEach(l => {
      l.classList.toggle('active', l.dataset.id === target.id);
    });

    // Montar contenido en el contenedor principal
    const stage = document.getElementById('main-chapter-container');
    if (stage) {
      stage.innerHTML = '';
      const clone = target.tpl.content.cloneNode(true);
      stage.appendChild(clone);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Iniciar simulaciones asociadas al capítulo
      mountSimulations(stage);

      // Iniciar visor de aulas si es el capítulo de aulas
      if (target.id === 'aulas') initAulaViewer();

      // Iniciar test de repaso si es el capítulo de test
      if (target.id === 'test') initQuizEngine();

      // MathJax typesetting
      if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([stage]).catch(err => console.warn('MathJax err:', err));
      }
    }
  }
  P.navigateTo = navigateTo;

  /* ---------- 5. Montaje de Simulaciones ---------- */
  function mountSimulations(container) {
    const simContainers = container.querySelectorAll('.sim-host[data-sim]');
    simContainers.forEach(host => {
      const simName = host.dataset.sim;
      if (P.SIM_REGISTRY && P.SIM_REGISTRY[simName]) {
        try {
          P.SIM_REGISTRY[simName](host);
        } catch (err) {
          console.error('Error mounting simulation ' + simName, err);
        }
      }
    });
  }

  /* ---------- 6. Barra de Progreso de Lectura ---------- */
  function initProgressBar() {
    const bar = document.getElementById('read-progress-bar');
    if (!bar) return;

    window.addEventListener('scroll', () => {
      const totalH = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalH > 0 ? (window.scrollY / totalH) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, progress)) + '%';
    });
  }

  /* ---------- 7. Responsive Sidebar Toggle ---------- */
  function initSidebarToggle() {
    const btn = document.getElementById('btn-sidebar-toggle');
    const sb = document.getElementById('sidebar');
    if (btn && sb) {
      btn.onclick = () => {
        sb.classList.toggle('open');
      };
    }
  }

  /* ---------- 8. Buscador en la Barra Lateral ---------- */
  function initSearch() {
    const input = document.getElementById('sidebar-search-input');
    if (!input) return;

    input.oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      const links = document.querySelectorAll('.toc-link');
      links.forEach(l => {
        const text = l.textContent.toLowerCase();
        l.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
      });
    };
  }

  /* ---------- 9. Visor de Aulas Interactivas Netlify ---------- */
  function initAulaViewer() {
    const frame = document.getElementById('aula-active-iframe');
    const titleEl = document.getElementById('aula-active-title');
    const descEl = document.getElementById('aula-active-desc');
    const linkEl = document.getElementById('aula-external-link');
    const tabs = document.querySelectorAll('.btn-aula-tab');

    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const url = tab.dataset.url;
        const title = tab.dataset.title;
        const desc = tab.dataset.desc;

        if (frame) frame.src = url;
        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = desc;
        if (linkEl) linkEl.href = url;
      };
    });
  }

  /* ---------- 10. Motor de Examen de 40 Preguntas ---------- */
  function initQuizEngine() {
    const listContainer = document.getElementById('quiz-questions-list');
    const scoreBanner = document.getElementById('quiz-score-banner');
    const catSelect = document.getElementById('quiz-category-filter');
    if (!listContainer || !P.QUESTIONS) return;

    function renderQuestions(cat = 'all') {
      listContainer.innerHTML = '';
      const qs = cat === 'all' ? P.QUESTIONS : P.QUESTIONS.filter(q => q.category === cat);

      qs.forEach((q, idx) => {
        const card = P.el('div', 'quiz-wrapper');
        card.id = 'q-card-' + q.id;

        const header = P.el('div', 'quiz-header');
        const badge = P.el('span', 'quiz-badge', 'Pregunta ' + q.id + ' · ' + (q.category || 'General'));
        header.appendChild(badge);

        const qText = P.el('div', 'quiz-q-text', q.question);
        const optContainer = P.el('div', 'quiz-options');

        q.options.forEach((opt, optIdx) => {
          const btn = P.el('button', 'quiz-opt-btn');
          btn.innerHTML = `<strong>${String.fromCharCode(65 + optIdx)}.</strong> <span>${P.esc(opt)}</span>`;

          btn.onclick = () => {
            const btns = optContainer.querySelectorAll('.quiz-opt-btn');
            btns.forEach(b => {
              b.classList.remove('correct', 'incorrect');
              b.disabled = true;
            });

            if (optIdx === q.correct) {
              btn.classList.add('correct');
              state.quizAnswers[q.id] = true;
            } else {
              btn.classList.add('incorrect');
              btns[q.correct].classList.add('correct');
              state.quizAnswers[q.id] = false;
            }

            // Explicación pedagógica
            let exp = card.querySelector('.quiz-explanation');
            if (!exp) {
              exp = P.el('div', 'quiz-explanation');
              card.appendChild(exp);
            }
            exp.innerHTML = `<strong>Explicación:</strong> ${P.esc(q.explanation || 'Respuesta verificada según el material académico del curso.')}`;

            updateScore();
          };

          optContainer.appendChild(btn);
        });

        card.append(header, qText, optContainer);
        listContainer.appendChild(card);
      });
    }

    function updateScore() {
      if (!scoreBanner) return;
      const answered = Object.keys(state.quizAnswers).length;
      const correct = Object.values(state.quizAnswers).filter(Boolean).length;
      const total = P.QUESTIONS.length;
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

      scoreBanner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
          <div>
            <h4 style="margin:0 0 0.25rem; font-size:1.15rem; color:#fff;">Progreso de Evaluación</h4>
            <span style="font-size:0.85rem; color:var(--text-muted, #94A3B8);">
              Respondidas: <strong>${answered}</strong> de <strong>${total}</strong> | Aciertos: <strong>${correct}</strong>
            </span>
          </div>
          <div style="font-size:1.75rem; font-weight:800; color:${pct >= 70 ? '#10B981' : '#F59E0B'}; font-family:var(--font-mono);">
            ${pct}%
          </div>
        </div>
      `;
    }

    if (catSelect) {
      catSelect.onchange = (e) => renderQuestions(e.target.value);
    }

    renderQuestions('all');
    updateScore();
  }

  // Copia de código al portapapeles
  window.copyCode = function (btn) {
    const block = btn.closest('.code-block');
    const code = block ? block.querySelector('code').textContent : '';
    navigator.clipboard.writeText(code).then(() => {
      const orig = btn.textContent;
      btn.textContent = '✓ Copiado';
      setTimeout(() => btn.textContent = orig, 1800);
    });
  };
})();
