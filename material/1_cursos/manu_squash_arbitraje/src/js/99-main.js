/* Inicialización general, enrutador de vistas y gestor de temas */
document.addEventListener('DOMContentLoaded', () => {
  const { U, Sim, Interference, RulesApp, Scoreboard } = MS;

  // 1. Enrutador por pestañas
  function navigateTo(sectionId) {
    U.$$('.page-section').forEach((sec) => {
      sec.classList.toggle('active', sec.id === `section-${sectionId}`);
    });

    U.$$('.nav button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.go === sectionId);
    });

    window.location.hash = sectionId;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Si entra al simulador, recalcular canvas
    if (sectionId === 'simulador' && Sim) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }
  }

  // Event listeners para botones data-go
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-go]');
    if (btn) {
      e.preventDefault();
      navigateTo(btn.dataset.go);
    }
  });

  // Hash inicial
  const hash = window.location.hash.replace('#', '') || 'inicio';
  navigateTo(hash);

  // 2. Modo Claro / Oscuro
  const themeBtn = U.$('#themeBtn');
  const savedTheme = localStorage.getItem('ms_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('ms_theme', next);
    });
  }

  // 3. Inicializar módulos
  try {
    if (Sim) Sim.init();
    if (Interference) Interference.init();
    if (RulesApp) RulesApp.init();
    if (Scoreboard) Scoreboard.init();
  } catch (err) {
    console.error('Error inicializando módulos:', err);
  }
});
