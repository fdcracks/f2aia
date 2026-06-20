'use strict';

/* ============================================================
   F2AIA — Diagnóstico de Automatización Comercial
   main.js v20260619
   ============================================================ */

const PAGE_LOAD_TIME    = Date.now();
const MIN_FILL_TIME_MS  = 5000; // humanos tardan >5s en llenar 8 pasos

const CONFIG = {
  webhookUrl:     'https://n8n.f2aia.com/webhook/diagnostico-f2aia',
  whatsappUrl:    'https://wa.me/5491164858166',
  mainWebsiteUrl: 'https://f2aia.com',
  demoUrl:        'https://f2aia.com/demo',
  bookingUrl:     ''
};

// ─── DATOS DE CADA PASO ───────────────────────────────────────

const PROBLEMAS = [
  { value: 'seguimiento', label: 'Pierdo clientes por falta de seguimiento',        score: 30 },
  { value: 'lentitud',    label: 'Recibo consultas pero no respondo rápido',          score: 25 },
  { value: 'datos',       label: 'Mis datos están desordenados',                      score: 20 },
  { value: 'tareas',      label: 'Tengo muchas tareas manuales repetitivas',          score: 20 },
  { value: 'turnos',      label: 'Quiero automatizar reservas/turnos/cotizaciones',   score: 20 },
  { value: 'proceso',     label: 'Necesito ordenar mi proceso comercial',             score: 20 },
  { value: 'leads',       label: 'Quiero captar más leads',                           score: 10 },
  { value: 'nodonde',     label: 'No sé por dónde empezar',                           score:  5 }
];

const CONSULTAS = [
  { value: 'menos10',  label: 'Menos de 10',        score:  5 },
  { value: '10a30',    label: '10 a 30',             score: 15 },
  { value: '30a70',    label: '30 a 70',             score: 25 },
  { value: 'mas70',    label: 'Más de 70',           score: 35 },
  { value: 'nomedido', label: 'No lo tengo medido',  score: 10 }
];

const URGENCIA = [
  { value: 'ahora',     label: 'Lo necesito cuanto antes',   score: 30 },
  { value: 'estemes',   label: 'Quiero resolverlo este mes', score: 20 },
  { value: 'evaluando', label: 'Estoy evaluando opciones',   score: 10 },
  { value: 'info',      label: 'Solo quiero información',    score:  0 }
];

const INVERSION = [
  { value: 'menos100', label: 'Menos de USD 100',   score:  0 },
  { value: '100a300',  label: 'USD 100 a 300',       score: 10 },
  { value: '300a700',  label: 'USD 300 a 700',       score: 20 },
  { value: '700a1500', label: 'USD 700 a 1.500',     score: 30 },
  { value: 'mas1500',  label: 'Más de USD 1.500',    score: 40 },
  { value: 'nose',     label: 'Todavía no lo sé',    score: 10 }
];

const RECOMENDACIONES = {
  seguimiento: {
    sistema: 'CRM simple + secuencia de seguimiento automático',
    texto:   'Un sistema de seguimiento automatizado puede recordarte y contactar a cada lead en el momento justo, sin que tengas que hacerlo manualmente.'
  },
  lentitud: {
    sistema: 'WhatsApp IA + formulario inteligente + registro automático',
    texto:   'Un agente de IA en WhatsApp puede responder consultas al instante, las 24hs, y registrar cada lead automáticamente sin intervención humana.'
  },
  datos: {
    sistema: 'Sheets estructurado + CRM simple + automatización de entrada',
    texto:   'Podemos centralizar todos tus datos en un único lugar y automatizar el ingreso desde cada canal que usás, sin carga manual.'
  },
  tareas: {
    sistema: 'n8n + integraciones email/WhatsApp/Sheets',
    texto:   'Las tareas repetitivas son las más fáciles de automatizar. Con n8n conectamos tus herramientas actuales y eliminamos el trabajo manual.'
  },
  turnos: {
    sistema: 'Formulario inteligente + WhatsApp IA + notificación interna',
    texto:   'Un sistema de reservas automatizado puede recibir solicitudes, confirmar por WhatsApp y avisarte sin intermediarios.'
  },
  proceso: {
    sistema: 'CRM + pipeline de ventas + seguimiento + reporte básico',
    texto:   'Un proceso comercial claro y automatizado te da visibilidad total de cada oportunidad, sin depender de la memoria ni del WhatsApp.'
  },
  leads: {
    sistema: 'Landing de captación + formulario + seguimiento automático',
    texto:   'Podemos diseñar un sistema que atraiga leads calificados y los nutra automáticamente hasta que estén listos para comprar.'
  },
  nodonde: {
    sistema: 'Revisión del proceso + recomendación inicial personalizada',
    texto:   'Empezamos por mapear cómo funciona tu negocio hoy e identificamos el punto de mayor impacto para automatizar primero.'
  }
};

// ─── ESTADO ──────────────────────────────────────────────────

let currentStep = 1;
const TOTAL_STEPS = 8;
const formData = {};
let lastPayload = null;

// ─── SEGURIDAD: SANITIZACIÓN ─────────────────────────────────

function sanitizeText(str) {
  return String(str).trim().slice(0, 500);
}

function setTextSafe(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

// ─── VALIDACIÓN ──────────────────────────────────────────────

function cleanPhone(val) {
  return String(val).replace(/[\s\-\(\)\+]/g, '');
}

function isValidPhone(val) {
  const cleaned = cleanPhone(val);
  return /^\d{10,13}$/.test(cleaned);
}

function isValidEmail(val) {
  return /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(val.trim());
}

// ─── ERRORES DE CAMPO ────────────────────────────────────────

function showFieldError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('field-error');
  field.setAttribute('aria-invalid', 'true');
  let err = document.getElementById(fieldId + '-err');
  if (!err) {
    err = document.createElement('span');
    err.id = fieldId + '-err';
    err.className = 'error-msg';
    err.setAttribute('role', 'alert');
    field.parentElement.appendChild(err);
  }
  err.textContent = msg;
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.remove('field-error');
  field.removeAttribute('aria-invalid');
  const err = document.getElementById(fieldId + '-err');
  if (err) err.textContent = '';
}

function showStepError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function clearStepError(id) {
  const el = document.getElementById(id);
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}

// ─── NAVEGACIÓN ENTRE PASOS ──────────────────────────────────

function showStep(n, skipScroll = false) {
  document.querySelectorAll('.step-panel').forEach(p => {
    p.classList.remove('step-active', 'step-enter');
  });

  const panel = document.querySelector(`.step-panel[data-step="${n}"]`);
  if (!panel) return;

  panel.classList.add('step-active');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => panel.classList.add('step-enter'));
  });

  currentStep = n;
  updateProgress();

  if (!skipScroll) {
    const anchor = document.getElementById('diagnostico-anchor');
    if (anchor) {
      const top = anchor.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
}

function updateProgress() {
  const bar   = document.getElementById('progress-bar');
  const label = document.getElementById('progress-label');
  const track = document.querySelector('.progress-track');
  const pct   = Math.round((currentStep / TOTAL_STEPS) * 100);

  if (bar)   bar.style.width = pct + '%';
  if (label) label.textContent = 'Paso ' + currentStep + ' de ' + TOTAL_STEPS;
  if (track) track.setAttribute('aria-valuenow', currentStep);
}

// ─── VALIDADORES POR PASO ────────────────────────────────────

function validateStep1() {
  let valid = true;

  const nombre = document.getElementById('inp-nombre').value.trim();
  if (!nombre) { showFieldError('inp-nombre', 'Ingresá tu nombre'); valid = false; }

  const email = document.getElementById('inp-email').value.trim();
  if (!email) {
    showFieldError('inp-email', 'Ingresá tu email'); valid = false;
  } else if (!isValidEmail(email)) {
    showFieldError('inp-email', 'Ingresá un email válido (ej: nombre@dominio.com)'); valid = false;
  }

  const wa = document.getElementById('inp-wa').value;
  if (!wa.trim()) {
    showFieldError('inp-wa', 'Ingresá tu WhatsApp'); valid = false;
  } else if (!isValidPhone(wa)) {
    showFieldError('inp-wa', 'Ingresá un número válido con código de área (ej: +5491164858166)'); valid = false;
  }

  const negocio = document.getElementById('inp-negocio').value.trim();
  if (!negocio) { showFieldError('inp-negocio', 'Ingresá el nombre de tu negocio'); valid = false; }

  if (valid) {
    formData.nombre   = sanitizeText(nombre);
    formData.email    = sanitizeText(email);
    formData.whatsapp = cleanPhone(wa);
    formData.negocio  = sanitizeText(negocio);
  }
  return valid;
}

function validateStep2() {
  const sel = document.querySelector('input[name="rubro"]:checked');
  if (!sel) { showStepError('step2-error', 'Seleccioná el rubro de tu negocio'); return false; }
  clearStepError('step2-error');
  formData.rubro = sanitizeText(sel.value);
  if (sel.value === 'Otro') {
    const otro = document.getElementById('inp-rubro-otro');
    formData.rubroOtro = otro ? sanitizeText(otro.value) : '';
  } else {
    formData.rubroOtro = '';
  }
  return true;
}

function validateStep3() {
  const sel = document.querySelector('input[name="problema"]:checked');
  if (!sel) { showStepError('step3-error', 'Seleccioná tu problema principal'); return false; }
  clearStepError('step3-error');
  formData.problema = sanitizeText(sel.value);
  return true;
}

function validateStep4() {
  const sel = document.querySelector('input[name="consultas"]:checked');
  if (!sel) { showStepError('step4-error', 'Seleccioná el volumen de consultas'); return false; }
  clearStepError('step4-error');
  formData.consultas = sanitizeText(sel.value);
  return true;
}

function validateStep5() {
  const sels = document.querySelectorAll('input[name="canales"]:checked');
  if (sels.length === 0) { showStepError('step5-error', 'Seleccioná al menos un canal'); return false; }
  clearStepError('step5-error');
  formData.canales = Array.from(sels).map(s => sanitizeText(s.value));
  return true;
}

function validateStep6() {
  const sels = document.querySelectorAll('input[name="herramientas"]:checked');
  if (sels.length === 0) { showStepError('step6-error', 'Seleccioná al menos una herramienta'); return false; }
  clearStepError('step6-error');
  formData.herramientas = Array.from(sels).map(s => sanitizeText(s.value));
  return true;
}

function validateStep7() {
  const sel = document.querySelector('input[name="urgencia"]:checked');
  if (!sel) { showStepError('step7-error', 'Seleccioná tu nivel de urgencia'); return false; }
  clearStepError('step7-error');
  formData.urgencia = sanitizeText(sel.value);
  return true;
}

function validateStep8() {
  const sel = document.querySelector('input[name="inversion"]:checked');
  if (!sel) { showStepError('step8-error', 'Seleccioná un rango de inversión'); return false; }
  clearStepError('step8-error');
  formData.inversion = sanitizeText(sel.value);
  return true;
}

const STEP_VALIDATORS = [
  null,
  validateStep1, validateStep2, validateStep3, validateStep4,
  validateStep5, validateStep6, validateStep7, validateStep8
];

// ─── SCORING ─────────────────────────────────────────────────

function calculateScore(data) {
  let score = 0;
  const u = URGENCIA.find(x => x.value === data.urgencia);
  const i = INVERSION.find(x => x.value === data.inversion);
  const c = CONSULTAS.find(x => x.value === data.consultas);
  const p = PROBLEMAS.find(x => x.value === data.problema);
  if (u) score += u.score;
  if (i) score += i.score;
  if (c) score += c.score;
  if (p) score += p.score;
  return score;
}

function getTemperature(score) {
  if (score >= 71) return { temp: 'caliente', label: 'Caliente', priority: 'alta',  css: 'temp-hot'  };
  if (score >= 31) return { temp: 'tibio',    label: 'Tibio',    priority: 'media', css: 'temp-warm' };
  return             { temp: 'frio',      label: 'Frío',     priority: 'baja',  css: 'temp-cold' };
}

function getNextAction(temp) {
  if (temp === 'caliente') return 'Contactar hoy';
  if (temp === 'tibio')    return 'Seguimiento en 24-48hs';
  return 'Email educativo + guardar en Sheets';
}

// ─── PAYLOAD ─────────────────────────────────────────────────

function buildPayload(data, score, temperature, rec) {
  const problema  = PROBLEMAS.find(p => p.value === data.problema);
  const urgencia  = URGENCIA.find(u => u.value === data.urgencia);
  const inversion = INVERSION.find(i => i.value === data.inversion);
  const consultas = CONSULTAS.find(c => c.value === data.consultas);

  const hpEl = document.getElementById('hp-website');
  return {
    source:       'diagnostico_f2aia',
    submitted_at: new Date().toISOString(),
    _hp:          hpEl ? hpEl.value : '',
    contact: {
      name:      data.nombre,
      email:     data.email,
      whatsapp:  data.whatsapp
    },
    business: {
      name:           data.negocio,
      industry:       data.rubro,
      industry_other: data.rubroOtro || ''
    },
    diagnosis: {
      main_problem:     problema  ? problema.label  : '',
      weekly_inquiries: consultas ? consultas.label : '',
      channels:         Array.isArray(data.canales)      ? data.canales      : [],
      tools:            Array.isArray(data.herramientas) ? data.herramientas : [],
      urgency:          urgencia  ? urgencia.label  : '',
      investment_range: inversion ? inversion.label : ''
    },
    result: {
      score:              score,
      lead_temperature:   temperature.temp,
      priority:           temperature.priority,
      recommended_system: rec.sistema,
      recommendation:     rec.texto,
      next_action:        getNextAction(temperature.temp)
    }
  };
}

// ─── WEBHOOK ─────────────────────────────────────────────────

async function sendWebhook(payload) {
  try {
    const res = await fetch(CONFIG.webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function retryWebhook() {
  if (!lastPayload) return;
  const btn = document.getElementById('retry-btn');
  const msg = document.getElementById('retry-msg');
  if (btn) btn.disabled = true;
  const ok = await sendWebhook(lastPayload);
  if (ok) {
    if (msg) msg.textContent = 'Enviado correctamente.';
    if (btn) btn.style.display = 'none';
  } else {
    if (msg) msg.textContent = 'Seguimos sin poder enviarlo. Contactanos por WhatsApp.';
    if (btn) { btn.disabled = false; btn.textContent = 'Reintentar'; }
  }
}

// ─── PANTALLA DE RESULTADO ───────────────────────────────────

function showResult(data, score, temperature, rec) {
  const formEl   = document.getElementById('diagnostico-form');
  const resultEl = document.getElementById('result-screen');
  if (!formEl || !resultEl) return;

  formEl.style.display   = 'none';
  resultEl.style.display = 'block';

  // Texto — siempre textContent, nunca innerHTML con datos del usuario
  setTextSafe('res-nombre',       data.nombre);
  setTextSafe('res-problema',     PROBLEMAS.find(p => p.value === data.problema)?.label || '');
  setTextSafe('res-sistema',      rec.sistema);
  setTextSafe('res-recomendacion', rec.texto);
  setTextSafe('res-email',        data.email);
  setTextSafe('res-score',        score);

  // Badge de temperatura
  const badge = document.getElementById('res-temperatura');
  if (badge) {
    badge.textContent = temperature.label;
    badge.className   = 'temp-badge ' + temperature.css;
  }

  // Botón WhatsApp — URL hardcodeada, solo el mensaje es dinámico
  const waBtn = document.getElementById('res-wa-btn');
  if (waBtn) {
    const problemLabel = PROBLEMAS.find(p => p.value === data.problema)?.label || '';
    const msg = 'Hola F2AIA, acabo de hacer el diagnóstico. '
      + 'Mi negocio es ' + data.negocio + ' y el problema principal es: ' + problemLabel;
    waBtn.href = CONFIG.whatsappUrl + '?text=' + encodeURIComponent(msg);
  }

  // Botón agendar — solo se muestra si bookingUrl está configurada
  const bookBtn = document.getElementById('res-booking-btn');
  if (bookBtn) {
    if (CONFIG.bookingUrl) {
      bookBtn.href         = CONFIG.bookingUrl;
      bookBtn.style.display = '';
    } else {
      bookBtn.style.display = 'none';
    }
  }

  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── SUBMIT FINAL ────────────────────────────────────────────

async function handleSubmit() {
  // Anti-spam: honeypot — si está relleno, es un bot
  const hp = document.getElementById('hp-website');
  if (hp && hp.value.trim() !== '') return;

  // Anti-spam: tiempo mínimo — bots envían en milisegundos
  if (Date.now() - PAGE_LOAD_TIME < MIN_FILL_TIME_MS) return;

  const score       = calculateScore(formData);
  const temperature = getTemperature(score);
  const rec         = RECOMENDACIONES[formData.problema] || RECOMENDACIONES['nodonde'];
  const payload     = buildPayload(formData, score, temperature, rec);
  lastPayload       = payload;

  // Mostrar resultado inmediatamente, sin esperar webhook
  showResult(formData, score, temperature, rec);

  // Enviar webhook en background
  const ok = await sendWebhook(payload);
  if (!ok) {
    const errBox = document.getElementById('webhook-error');
    const retBtn = document.getElementById('retry-btn');
    if (errBox) errBox.style.display = 'block';
    if (retBtn) retBtn.style.display = 'inline-flex';
  }
}

// ─── ACCIÓN SIGUIENTE / ANTERIOR ─────────────────────────────

function goNext() {
  const validator = STEP_VALIDATORS[currentStep];
  if (validator && !validator()) return;

  if (currentStep === TOTAL_STEPS) {
    handleSubmit();
    return;
  }
  showStep(currentStep + 1);
}

function goPrev() {
  if (currentStep > 1) showStep(currentStep - 1);
}

// ─── NAV SCROLL ──────────────────────────────────────────────

function initNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
}

// ─── SCROLL REVEAL ───────────────────────────────────────────

function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ─── RUBRO "OTRO" TOGGLE ─────────────────────────────────────

function initRubroOtro() {
  document.querySelectorAll('input[name="rubro"]').forEach(r => {
    r.addEventListener('change', () => {
      const wrap = document.getElementById('rubro-otro-wrap');
      if (wrap) wrap.style.display = (r.value === 'Otro' && r.checked) ? 'block' : 'none';
      if (r.value !== 'Otro') clearStepError('step2-error');
    });
  });
}

// ─── LIVE VALIDATION EN STEP 1 ───────────────────────────────

function initLiveValidation() {
  ['inp-nombre', 'inp-email', 'inp-wa', 'inp-negocio'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => clearFieldError(id));
  });
}

// ─── EVENT DELEGATION (sin onclick en HTML) ──────────────────

function initEvents() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'next')  goNext();
    if (action === 'prev')  goPrev();
    if (action === 'start') {
      const anchor = document.getElementById('diagnostico-anchor');
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (action === 'retry') retryWebhook();
  });
}

// ─── INIT ────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal();
  initRubroOtro();
  initLiveValidation();
  initEvents();
  updateProgress();
  showStep(1, true);
});
