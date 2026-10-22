// PhysicsAILab - Webhook Oficial de Wompi Bancolombia
// Procesa pagos aprobados, genera claves únicas y despacha correos oficiales desde profesor@physicsailab.com

const RESEND_API_KEY = process.env.RESEND_API_KEY || Buffer.from('cmVfR1lMZlFqdWFfNWd6WEM5Q2U0ekRKN3FVZkY4NHpkSmYy', 'base64').toString('utf8');
const FIREBASE_BASE = 'https://squashpopayan-65e33-default-rtdb.firebaseio.com/physicsailab';

const COURSE_TITLES = {
    'mecanica': 'Cuaderno Interactivo de Mecánica Clásica',
    'materiales': 'Laboratorio Virtual de Resistencia de Materiales',
    'transformadores': 'Laboratorio Virtual de Transformadores Eléctricos',
    'ondas': 'Cuaderno Interactivo de Ondas, Sonido y Fenómenos Ondulatorios',
    'neuro': 'Neurociencia Computacional, Plasticidad y Aprendizaje Profundo',
    'electromagnetismo': 'Campos Electromagnéticos y Teoría de Maxwell',
    'ml': 'Inteligencia Artificial y Aprendizaje Automático en Física',
    'cuantica': 'Física Cuántica y Estructura de la Materia',
    'retie': 'Reglamento Técnico de Instalaciones Eléctricas (RETIE)',
    'squash_sim': 'Física, Biomecánica y Simulación del Squash',
    'finanzas': 'Matemáticas Financieras y Modelos Cuantitativos',
    'termo': 'Termodinámica Estadística y Máquinas Térmicas',
    'torneos': 'Software de Torneos y Cuadros Competitivos',
    'laboratorio': 'Metodología Experimental y Análisis de Datos Físicos',
    'fluidos': 'Mecánica de Fluidos e Hidráulica Computacional',
    'venturi': 'Laboratorio Experimental Virtual de Tubo Venturi',
    'guias': 'Guías Didácticas de Laboratorio y Montajes Prácticos',
    'ingles': 'Inglés Técnico Científico para Ingenieros y Físicos'
};

const COURSE_PREFIXES = {
    'mecanica': 'MEC',
    'materiales': 'MAT',
    'transformadores': 'TRA',
    'ondas': 'OND',
    'neuro': 'NEU',
    'electromagnetismo': 'ELE',
    'ml': 'MLA',
    'cuantica': 'CUA',
    'retie': 'RET',
    'squash_sim': 'SQU',
    'finanzas': 'FIN',
    'termo': 'TER',
    'torneos': 'TOR',
    'laboratorio': 'LAB',
    'fluidos': 'FLU',
    'venturi': 'VEN',
    'guias': 'GUI',
    'ingles': 'ENG'
};

function generateUniquePassword(courseId) {
    const prefix = COURSE_PREFIXES[courseId] || 'FIS';
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const s1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const s2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${prefix}-${s1}-${s2}`;
}

function detectCourseFromData(tx) {
    const ref = (tx.reference || '').toLowerCase();
    for (const [id, title] of Object.entries(COURSE_TITLES)) {
        if (ref.includes(id)) {
            return { id, title };
        }
    }
    // Si no tiene referencia específica, inferir por monto o asignar Mecánica/Acceso General
    return { id: 'mecanica', title: 'Cuaderno Interactivo de Mecánica Clásica' };
}

module.exports = async function handler(req, res) {
    // Permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return res.status(200).json({ status: 'ok', service: 'PhysicsAILab Wompi Webhook Service', timestamp: new Date().toISOString() });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const payload = req.body || {};
        const event = payload.event;
        const data = payload.data || {};
        const transaction = data.transaction || {};

        console.log(`[Wompi Webhook] Evento recibido: ${event}, Estado: ${transaction.status}, ID: ${transaction.id}`);

        // Solo procesamos transacciones con estado APROBADO
        if (transaction.status !== 'APPROVED') {
            return res.status(200).json({ message: 'Evento ignorado (transacción no aprobada)', status: transaction.status });
        }

        const txId = transaction.id;
        const customerEmail = transaction.customer_email || (transaction.customer_data && transaction.customer_data.email);
        const customerName = (transaction.customer_data && transaction.customer_data.full_name) || 'Estudiante';
        const customerPhone = (transaction.customer_data && transaction.customer_data.phone_number) || '';
        const amountFormatted = transaction.amount_in_cents ? '$' + Number(transaction.amount_in_cents / 100).toLocaleString('es-CO') + ' COP' : 'Tarifa oficial';

        if (!customerEmail) {
            console.error('[Wompi Webhook] Error: La transacción no contiene correo del comprador');
            return res.status(200).json({ warning: 'Sin correo de comprador en transacción' });
        }

        // 1. Evitar duplicados: verificar si ya generamos licencia para esta transacción
        const existingCheck = await fetch(`${FIREBASE_BASE}/licenses/lic_wompi_${txId}.json`).then(r => r.json()).catch(() => null);
        if (existingCheck && existingCheck.codigo) {
            console.log(`[Wompi Webhook] Transacción ${txId} ya procesada anteriormente con clave: ${existingCheck.codigo}`);
            return res.status(200).json({ message: 'Transacción ya procesada previamente', codigo: existingCheck.codigo });
        }

        // 2. Determinar el curso adquirido
        const course = detectCourseFromData(transaction);
        const uniquePassword = generateUniquePassword(course.id);

        // 3. Crear registro de Licencia Personal en Firebase
        const licenseData = {
            id: `lic_wompi_${txId}`,
            codigo: uniquePassword,
            cursoId: course.id,
            cursoTitulo: course.title,
            estudianteNombre: customerName,
            estudianteEmail: customerEmail,
            estudianteTelefono: customerPhone,
            transaccionId: txId,
            referenciaWompi: transaction.reference || '',
            monto: amountFormatted,
            metodoPago: transaction.payment_method_type || 'Wompi PSE / Tarjeta',
            fecha: new Date().toISOString(),
            origen: 'Wompi Bancolombia Oficial',
            estado: 'activo',
            usos: 0,
            tipo: 'unico'
        };

        await fetch(`${FIREBASE_BASE}/licenses/${licenseData.id}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(licenseData)
        }).catch(err => console.error('[Wompi Webhook] Error guardando licencia en Firebase:', err));

        // 4. Registrar en actividad general de la plataforma
        const activityRecord = {
            id: `act_${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: `Compra aprobada en Wompi [${course.title}] - Alumno: ${customerName}`,
            type: 'purchase',
            studentName: customerName,
            email: customerEmail,
            amount: amountFormatted,
            courseId: course.id
        };
        await fetch(`${FIREBASE_BASE}/activity/${activityRecord.id}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activityRecord)
        }).catch(() => {});

        // 5. Enviar Correo Oficial al Estudiante con Resend
        const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceso Activado - PhysicsAILab</title>
</head>
<body style="margin:0; padding:0; background-color:#0b0f19; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0f19; padding:30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="620px" border="0" cellspacing="0" cellpadding="0" style="max-width:620px; background-color:#111827; border:1px solid #1f2937; border-radius:16px; overflow:hidden; box-shadow:0 12px 30px rgba(0,0,0,0.5);">
          
          <!-- Encabezado con Identidad Visual -->
          <tr>
            <td style="background:linear-gradient(135deg, #0f172a, #1e1b4b); padding:32px 30px; text-align:center; border-bottom:2px solid #6366f1;">
              <div style="font-size:2.4rem; line-height:1; margin-bottom:10px;">🔬⚡</div>
              <h1 style="color:#ffffff; font-size:24px; margin:0 0 6px 0; font-weight:800; letter-spacing:-0.5px;">PhysicsAILab.com</h1>
              <p style="color:#94a3b8; font-size:13px; margin:0; text-transform:uppercase; letter-spacing:1px; font-weight:600;">
                Departamento de Física · Universidad del Cauca
              </p>
            </td>
          </tr>

          <!-- Cuerpo Principal -->
          <tr>
            <td style="padding:32px 30px;">
              <div style="display:inline-block; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4); border-radius:30px; padding:6px 14px; margin-bottom:18px;">
                <span style="color:#34d399; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">✓ Pago Aprobado por Wompi Bancolombia</span>
              </div>

              <h2 style="color:#ffffff; font-size:20px; margin:0 0 16px 0; font-weight:700;">
                ¡Felicitaciones, ${customerName}!
              </h2>

              <p style="color:#cbd5e1; font-size:15px; line-height:1.6; margin:0 0 20px 0;">
                Nos complace darte la bienvenida oficial a la plataforma universitaria <strong>PhysicsAILab</strong>. Tu pago por el curso <strong style="color:#38bdf8;">«${course.title}»</strong> ha sido procesado y aprobado con éxito.
              </p>

              <!-- Tarjeta de Contraseña Asignada -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0; background:linear-gradient(135deg, rgba(99,102,241,0.12), rgba(30,41,59,0.8)); border:2px dashed #6366f1; border-radius:14px; text-align:center;">
                <tr>
                  <td style="padding:24px 20px;">
                    <div style="color:#a5b4fc; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">
                      🔑 Tu Contraseña de Acceso Asignada:
                    </div>
                    <div style="color:#ffffff; font-size:26px; font-weight:800; font-family:'Courier New', monospace; letter-spacing:3px; background:#0f172a; display:inline-block; padding:10px 22px; border-radius:8px; border:1px solid #4338ca; box-shadow:0 4px 12px rgba(0,0,0,0.4);">
                      ${uniquePassword}
                    </div>
                    <div style="color:#94a3b8; font-size:12px; margin-top:10px;">
                      Válida para licencia permanente del curso
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Aviso de Seguridad Estricto (Contraseña Única e Intransferible) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:rgba(239,68,68,0.08); border-left:4px solid #ef4444; border-radius:8px; margin-bottom:26px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <div style="color:#f87171; font-weight:700; font-size:13px; margin-bottom:4px; display:flex; align-items:center;">
                      ⚠️ AVISO DE SEGURIDAD ESTRICTO: CONTRASEÑA ÚNICA
                    </div>
                    <div style="color:#fca5a5; font-size:13px; line-height:1.5;">
                      Esta contraseña es <strong>personal, única e intransferible</strong>. El sistema ha registrado digitalmente tu correo <strong>${customerEmail}</strong> y vinculará la firma de tu navegador en tu primer ingreso. <strong>Por ningún motivo compartas tu contraseña</strong>; si el sistema detecta intentos de acceso simultáneos o desde múltiples ubicaciones no autorizadas, la licencia será revocada y bloqueada automáticamente de forma permanente.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Pasos para Desbloquear -->
              <div style="background:#1e293b; border-radius:12px; padding:18px 20px; margin-bottom:26px;">
                <h3 style="color:#ffffff; font-size:14px; margin:0 0 12px 0; text-transform:uppercase; letter-spacing:0.5px;">
                  📋 Cómo Activar tu Curso en 3 Pasos:
                </h3>
                <ol style="margin:0; padding-left:20px; color:#cbd5e1; font-size:13.5px; line-height:1.6;">
                  <li style="margin-bottom:6px;">Ingresa a la plataforma oficial: <a href="https://www.physicsailab.com" style="color:#38bdf8; text-decoration:none; font-weight:600;">physicsailab.com</a></li>
                  <li style="margin-bottom:6px;">En la tarjeta del curso <strong>«${course.title}»</strong>, haz clic en el botón <strong>"🔑 Clave Alumno"</strong>.</li>
                  <li>Pega tu clave <strong>${uniquePassword}</strong> y haz clic en <strong>Desbloquear</strong>.</li>
                </ol>
              </div>

              <!-- Botón CTA -->
              <div style="text-align:center; margin:30px 0 20px 0;">
                <a href="https://www.physicsailab.com" target="_blank" style="display:inline-block; background:linear-gradient(135deg, #6366f1, #8b5cf6); color:#ffffff; font-size:15px; font-weight:700; text-decoration:none; padding:14px 32px; border-radius:10px; box-shadow:0 6px 18px rgba(99,102,241,0.4);">
                  🚀 Entrar a PhysicsAILab y Desbloquear
                </a>
              </div>

              <!-- Datos de Contacto y Docente -->
              <div style="border-top:1px solid #1f2937; margin-top:28px; padding-top:20px;">
                <p style="color:#94a3b8; font-size:13px; line-height:1.5; margin:0 0 8px 0;">
                  Si tienes alguna duda académica, técnica o necesitas asistencia con los laboratorios virtuales, puedes comunicarte directamente con el docente:
                </p>
                <p style="color:#ffffff; font-size:13.5px; margin:0; line-height:1.5;">
                  <strong>Mg. Manuel Alejandro Obando</strong><br>
                  <span style="color:#94a3b8;">Docente del Departamento de Física — Universidad del Cauca</span><br>
                  💬 WhatsApp: <a href="https://wa.me/573137115473" style="color:#34d399; text-decoration:none; font-weight:600;">+57 313 711 5473</a> · ✉️ Correo: <a href="mailto:profesor@physicsailab.com" style="color:#38bdf8; text-decoration:none;">profesor@physicsailab.com</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer del correo -->
          <tr>
            <td style="background-color:#0f172a; padding:18px 30px; text-align:center; border-top:1px solid #1f2937;">
              <p style="color:#64748b; font-size:11.5px; margin:0; line-height:1.5;">
                Comprobante de compra de Wompi Bancolombia · Transacción ID: ${txId}<br>
                © 2026 PhysicsAILab.com · Popayán, Colombia · Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        // Despachar con Resend
        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Mg. Manuel Alejandro Obando <profesor@physicsailab.com>',
                to: customerEmail,
                bcc: ['manuelobando@unicauca.edu.co', 'manuel.obando.0328@gmail.com'], // Notificar al docente inmediatamente
                subject: `🎉 ¡Felicitaciones! Acceso activado a tu curso «${course.title}» — PhysicsAILab`,
                html: emailHtml
            })
        });

        const resendData = await resendRes.json();
        console.log('[Wompi Webhook] Correo despachado con éxito vía Resend:', resendData);

        return res.status(200).json({
            success: true,
            message: 'Pago procesado, clave única generada y correo enviado con éxito',
            transaccionId: txId,
            estudiante: customerName,
            email: customerEmail,
            curso: course.title,
            codigoAsignado: uniquePassword,
            resendId: resendData.id
        });

    } catch (error) {
        console.error('[Wompi Webhook] Error interno:', error);
        return res.status(500).json({ error: error.message || 'Error procesando webhook' });
    }
};

