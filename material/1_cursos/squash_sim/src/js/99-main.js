/* Arranque */
if (typeof document !== 'undefined') {
  const boot = () => { try { MS.App.init(); MS.Export.downloads(); } catch (e) { console.error(e); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
}
