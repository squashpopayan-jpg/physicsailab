/**
 * TrueTrading Web Widget - Integrable en cualquier página web
 * Uso:
 *   <div id="truetrading-widget" data-api="http://tu-servidor-o-vps:8080"></div>
 *   <script src="widget.js"></script>
 */
(function() {
  const container = document.getElementById('truetrading-widget');
  if (!container) return;

  const apiBase = (container.getAttribute('data-api') || 'http://localhost:8080').replace(/\/$/, '');

  container.innerHTML = `
    <div style="font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; border: 1px solid #1e293b; border-radius: 16px; padding: 20px; max-width: 500px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">👑</span>
          <strong style="font-size: 15px;">TrueTrading · Monitor en Vivo</strong>
        </div>
        <span id="ttw-status" style="font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #064e3b; color: #34d399; font-weight: bold;">● En vivo</span>
      </div>

      <!-- FTMO Box -->
      <div style="background: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 14px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; font-weight: bold; color: #60a5fa;">RETO FTMO 100K</span>
          <span id="ttw-ftmo-pnl" style="font-size: 14px; font-weight: 800; color: #34d399;">+$0.00 USD</span>
        </div>
        
        <!-- TP Bar -->
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #94a3b8;">
          <span>Progreso Meta TP ($350)</span>
          <span id="ttw-ftmo-tp-pct" style="font-weight: bold; color: #f8fafc;">0.0%</span>
        </div>
        <div style="background: #1e293b; border-radius: 999px; height: 10px; overflow: hidden; margin-bottom: 10px; position: relative;">
          <div id="ttw-ftmo-tp-bar" style="background: #10b981; height: 100%; width: 0%; transition: width 0.4s ease;"></div>
        </div>

        <!-- SL Bar -->
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #94a3b8;">
          <span>Consumo Stop Loss (-$500)</span>
          <span id="ttw-ftmo-sl-pct" style="font-weight: bold; color: #f8fafc;">0.0%</span>
        </div>
        <div style="background: #1e293b; border-radius: 999px; height: 10px; overflow: hidden; margin-bottom: 12px;">
          <div id="ttw-ftmo-sl-bar" style="background: #64748b; height: 100%; width: 0%; transition: width 0.4s ease;"></div>
        </div>

        <!-- Buttons -->
        <div style="display: flex; gap: 8px;">
          <button id="ttw-btn-ftmo-lock" style="flex: 1; padding: 6px 12px; font-size: 11px; font-weight: bold; border-radius: 8px; background: #78350f; color: #fde68a; border: 1px solid #b45309; cursor: pointer;">
            🔒 Candado FTMO
          </button>
          <button id="ttw-btn-ftmo-unlock" style="padding: 6px 12px; font-size: 11px; font-weight: bold; border-radius: 8px; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; cursor: pointer;">
            🔓 Desbloquear
          </button>
        </div>
      </div>

      <div id="ttw-toast" style="display: none; font-size: 11px; padding: 6px 10px; border-radius: 6px; background: #1e293b; color: #facc15; text-align: center;"></div>
    </div>
  `;

  const pnlEl = document.getElementById('ttw-ftmo-pnl');
  const tpPctEl = document.getElementById('ttw-ftmo-tp-pct');
  const tpBarEl = document.getElementById('ttw-ftmo-tp-bar');
  const slPctEl = document.getElementById('ttw-ftmo-sl-pct');
  const slBarEl = document.getElementById('ttw-ftmo-sl-bar');
  const toastEl = document.getElementById('ttw-toast');

  function showMsg(msg) {
    toastEl.innerText = msg;
    toastEl.style.display = 'block';
    setTimeout(() => { toastEl.style.display = 'none'; }, 3000);
  }

  async function update() {
    try {
      const res = await fetch(`${apiBase}/api/status`);
      const data = await res.json();
      const ftmo = data.accounts?.ftmo;
      if (ftmo) {
        const sign = ftmo.pnl_total >= 0 ? '+' : '';
        pnlEl.innerText = `${sign}$${ftmo.pnl_total.toFixed(2)} USD`;
        pnlEl.style.color = ftmo.pnl_total >= 0 ? '#34d399' : '#f87171';

        const tp = ftmo.tp_pct || 0;
        tpPctEl.innerText = `${tp.toFixed(1)}%`;
        tpBarEl.style.width = `${tp}%`;
        if (tp >= 90) {
          tpBarEl.style.background = 'linear-gradient(90deg, #f59e0b, #eab308)';
        } else {
          tpBarEl.style.background = '#10b981';
        }

        const sl = ftmo.sl_pct || 0;
        slPctEl.innerText = `${sl.toFixed(1)}%`;
        slBarEl.style.width = `${sl}%`;
        if (sl >= 50) {
          slBarEl.style.background = 'linear-gradient(90deg, #f97316, #ef4444)';
        } else {
          slBarEl.style.background = '#64748b';
        }
      }
    } catch (e) {
      document.getElementById('ttw-status').innerText = '○ Offline';
      document.getElementById('ttw-status').style.background = '#881337';
      document.getElementById('ttw-status').style.color = '#fca5a5';
    }
  }

  document.getElementById('ttw-btn-ftmo-lock').onclick = async () => {
    try {
      const r = await fetch(`${apiBase}/api/candado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: 'ftmo' })
      });
      const d = await r.json();
      showMsg(d.message || 'Candado puesto');
      update();
    } catch (err) {
      showMsg('Error: ' + err.message);
    }
  };

  document.getElementById('ttw-btn-ftmo-unlock').onclick = async () => {
    try {
      const r = await fetch(`${apiBase}/api/desbloquear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: 'ftmo' })
      });
      const d = await r.json();
      showMsg(d.message || 'Candado levantado');
      update();
    } catch (err) {
      showMsg('Error: ' + err.message);
    }
  };

  update();
  setInterval(update, 3000);
})();
