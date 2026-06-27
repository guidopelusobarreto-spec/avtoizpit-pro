if(typeof MREST==='undefined')var MREST=[];
// ═══════════════════════════════════════════════
// APP.JS — Авто Изпит PRO v2.0
// ═══════════════════════════════════════════════

var IMG      = 'https://avtoizpit.com/api/pictures/';
var VID      = 'https://avtoizpit.com/api/videos/video';
var IMG_LOC  = 'file:///storage/emulated/0/Download/avtoizpit_offline/img/';
var VID_LOC  = 'file:///storage/emulated/0/Download/avtoizpit_offline/vid/av_';

// loadImg maneja 3 casos:
// 1. URL completa (rta.government.bg o http): extrae filename para local, usa URL como fallback online
// 2. ID numérico (respuestas MREST): local img/{ID}.png, fallback avtoizpit API
// 3. null/undefined: oculta el elemento
function loadImg(el, id) {
  if (!id) { el.style.display='none'; return; }
  var localSrc, onlineSrc;

  if (typeof id === 'string' && id.startsWith('http')) {
    // Caso 1: URL completa — extraer solo el nombre del archivo para local
    var filename = id.split('/').pop(); // ej: "60317.png"
    localSrc  = IMG_LOC + filename;
    onlineSrc = id; // usar la URL original directamente
  } else {
    // Caso 2: ID numérico de avtoizpit
    localSrc  = IMG_LOC + id + '.png';
    onlineSrc = IMG + id + '.png?quality=2';
  }

  el.src = localSrc;
  el.onerror = function() {
    if (this.src === localSrc) {
      // Local falló — intentar online
      this.src = onlineSrc;
    } else {
      // Online también falló — ocultar
      this.style.display = 'none';
    }
  };
}

// loadVid: q.v es siempre un número (48 → av_48.mp4 local)
// Fallback: avtoizpit → rta.government.bg
function loadVid(el, vidId, rtaUrl) {
  if (!vidId && !rtaUrl) { el.style.display='none'; return; }
  var localSrc  = VID_LOC + vidId + '.mp4';
  var onlineSrc = VID + vidId + '.mp4';
  var rtaSrc    = rtaUrl || null;

  el.src = localSrc;
  el.onerror = function() {
    if (this.src === localSrc) {
      this.src = onlineSrc;
    } else if (rtaSrc && this.src === onlineSrc) {
      this.src = rtaSrc;
    } else {
      this.style.display = 'none';
    }
  };
}
var SC  = ['#f97316','#3b82f6','#22c55e','#eab308','#a855f7','#ec4899','#06b6d4','#84cc16'];
var APP_PW = localStorage.getItem('app_pw') || 'guido2024';
var TTS_SPEED = parseFloat(localStorage.getItem('tts_speed') || '0.85');
var _deferredInstall = null;

// ── PASSWORD ──────────────────────────────────
// checkPW handled by doPW in index.html
function changePassword() {
  var np = document.getElementById('new-pw-inp').value.trim();
  if (!np || np.length < 4) { toast('Minimo 4 caracteres'); return; }
  APP_PW = np;
  localStorage.setItem('app_pw', np);
  document.getElementById('new-pw-inp').value = '';
  toast('Contrasena cambiada');
}

// ── PWA ───────────────────────────────────────
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  _deferredInstall = e;
  if (!localStorage.getItem('pwa_installed')) {
    document.getElementById('install-banner').classList.add('show');
  }
});
window.addEventListener('appinstalled', function() {
  localStorage.setItem('pwa_installed', '1');
  document.getElementById('install-banner').classList.remove('show');
  toast('App instalada!');
});
function installPWA() {
  if (_deferredInstall) {
    _deferredInstall.prompt();
    _deferredInstall.userChoice.then(function(r) {
      if (r.outcome === 'accepted') {
        localStorage.setItem('pwa_installed', '1');
        document.getElementById('install-banner').classList.remove('show');
      }
    });
  }
}
function dismissBanner() {
  document.getElementById('install-banner').classList.remove('show');
  localStorage.setItem('pwa_installed', '1');
}

// ── SETTINGS ──────────────────────────────────
function saveAPIKey() {
  var key = document.getElementById('api-key-inp').value.trim();
  if (!key || !key.startsWith('sk-')) { toast('API key invalida — debe empezar con sk-'); return; }
  localStorage.setItem('claude_api_key', key);
  document.getElementById('api-key-inp').value = '';
  document.getElementById('api-key-status').textContent = 'API key guardada';
  toast('API key guardada');
}
function getAPIKey() { return localStorage.getItem('claude_api_key') || ''; }
function setSpeed(s) {
  TTS_SPEED = s;
  localStorage.setItem('tts_speed', String(s));
  toast('Velocidad: ' + (s === 0.6 ? 'lenta' : s === 0.85 ? 'normal' : 'rapida'));
}

// ── TTS ───────────────────────────────────────
var _ttsVoice = null;
function initTTS() {
  if (!window.speechSynthesis) return;
  function findVoice() {
    var voices = window.speechSynthesis.getVoices();
    _ttsVoice = voices.find(function(v) { return v.lang && v.lang.toLowerCase().startsWith('bg'); }) || null;
  }
  findVoice();
  window.speechSynthesis.onvoiceschanged = findVoice;
}
function speak(text) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  var utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'bg-BG';
  utt.rate = TTS_SPEED;
  if (_ttsVoice) utt.voice = _ttsVoice;
  window.speechSynthesis.speak(utt);
}

// ── BANCO ─────────────────────────────────────
var ALL_MAP = {}, ALL = [];
function buildAll() {
  [].concat(RANKED, TRAPS, PTS3, MULTI, MREST, VIDS).forEach(function(q) {
    if (q && q.id && typeof q.id === 'number' && !ALL_MAP[q.id]) ALL_MAP[q.id] = q;
  });
  ALL = Object.values(ALL_MAP);
  // Inicializar frecuencias reales en BRAIN
  BRAIN.initFreq(ALL);
  document.getElementById('hero-sub').textContent =
    ALL.length + ' preg \u2022 6 agentes \u2022 Simulacro Real \u2022 TTS bulgaro';
}

// ── UI ────────────────────────────────────────
function show(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  if (id === 'home') { uhome(); doCoach(); }
  if (id === 's-prog') rendProg();
  if (id === 's-sett') {
    var k = getAPIKey();
    document.getElementById('api-key-status').textContent = k ? 'API key configurada' : 'Sin API key — el instructor no funcionara';
  }
}
function toast(msg, ms) {
  var t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, ms || 2500);
}
function uhome() {
  var m = BRAIN.getMetrics();
  document.getElementById('s-seen').textContent = m.seen;
  var dom = Object.values(BRAIN.get().seen).filter(function(r) { return r.c >= 3 && r.w === 0; }).length;
  document.getElementById('s-dom').textContent = dom;
  document.getElementById('s-str').textContent = m.streak || 0;
  document.getElementById('gpct').textContent = m.pct + '%';
  document.getElementById('gbar').style.width = m.pct + '%';
}
function doCoach() {
  AGENTS.runCoach(function(res) {
    document.getElementById('coach-msg').innerHTML = res.msg;
    var ac = document.getElementById('coach-acts'); ac.innerHTML = '';
    res.acts.forEach(function(a) {
      var btn = document.createElement('button'); btn.className = 'cbtn';
      btn.innerHTML = a.t; btn.setAttribute('onclick', a.fn); ac.appendChild(btn);
    });
    var pb = document.getElementById('predict-box');
    var m = BRAIN.getMetrics();
    if (res.prediction && m.seen >= 50) {
      pb.classList.add('show');
      var p = res.prediction;
      if (m.avgScore >= 90 && m.examsCount >= 3 && m.pct >= 60) {
        pb.className = 'predict-box show go';
        pb.innerHTML = '\u2705 Listo para presentarte &mdash; ' + p.date;
      } else if (m.avgScore >= 80) {
        pb.className = 'predict-box show soon';
        pb.innerHTML = '\u26A1 Estimado listo: ' + p.date + ' (' + p.days + ' dias)';
      } else {
        pb.className = 'predict-box show notyet';
        pb.innerHTML = '\uD83D\uDCAA Estimado: ' + p.date + ' &mdash; ' + p.days + ' dias a este ritmo';
      }
    } else {
      pb.className = 'predict-box';
    }
  });
}
function bdg(p, cls, txt) {
  var b = document.createElement('span'); b.className = 'b ' + cls; b.textContent = txt; p.appendChild(b);
}
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── SETS ──────────────────────────────────────
function openSets() {
  var c = document.getElementById('sets-c'); c.innerHTML = '';
  for (var i = 0; i < 8; i++) {
    var qs = RANKED.slice(i*45, (i+1)*45);
    var af = (qs.reduce(function(s,q){return s+(q.f||0);},0)/45/200*100).toFixed(1);
    var sp = BRAIN.get().sp['s'+i] || {seen:0};
    var pct = Math.round(sp.seen/45*100); var col = SC[i];
    var withES = qs.filter(function(q){return q.es;}).length;
    var d = document.createElement('div'); d.className = 'set-row';
    (function(idx){ d.onclick = function(){ startSet(idx); }; })(i);
    d.innerHTML = '<div class="set-c" style="background:'+col+'22;color:'+col+'">'+(i+1)+'</div>'+
      '<div class="set-i"><div class="set-t">Set '+(i+1)+' \u2014 Ranks '+(i*45+1)+'\u2013'+((i+1)*45)+'</div>'+
      '<div class="set-m">Frec. '+af+'% &bull; '+sp.seen+'/45 vistas &bull; '+withES+'/45 ES</div>'+
      '<div class="set-b"><div class="set-bf" style="width:'+pct+'%;background:'+col+'"></div></div></div>'+
      '<div class="set-p" style="color:'+col+'">'+pct+'%</div>';
    c.appendChild(d);
  }
  show('s-sets');
}
function startSet(i) {
  begin({mode:'set', title:'Set '+(i+1), sub:'Ranks '+(i*45+1)+'-'+((i+1)*45),
    qs:BRAIN.shA(RANKED.slice(i*45,(i+1)*45)), si:i, explain:true, exam:false, timed:false});
}

// ── MODOS ─────────────────────────────────────
function mod(m) {
  var qs, title, sub, explain=true, exam=false, timed=false, timeLimit=0;
  if (m === 'srs') {
    qs = AGENTS.getSRSQueue(ALL);
    if (!qs.length) { toast('Sin preguntas pendientes hoy!'); return; }
    title = 'Plan SRS'; sub = qs.length + ' preg SRS inteligente';
  } else if (m === 'adaptive') {
    qs = AGENTS.buildAdaptive(ALL, VIDS);
    title = 'Examen Adaptativo'; sub = '4 agentes coordinados'; explain=false; exam=true;
  } else if (m === 'exam') {
    qs = AGENTS.buildExamFrom(ALL, VIDS);
    title = 'Simulacro Oficial'; sub = '45 preg \u2022 40 min como el real';
    explain=false; exam=true; timed=true; timeLimit=2400;
  } else if (m === 'quick') {
    qs = BRAIN.shA(AGENTS.buildAdaptive(ALL,VIDS).slice(0,10));
    title = 'Prueba Rapida'; sub = '10 preg \u2022 5 min'; timed=true; timeLimit=300;
  } else if (m === 'pts3') {
    qs = BRAIN.shA(BRAIN.shuffle([].concat(PTS3)).slice(0,45));
    title = '3 Puntos'; sub = '508 preg de maximo valor';
  } else if (m === 'traps') {
    qs = BRAIN.shA(BRAIN.shuffle([].concat(TRAPS)).slice(0,30));
    title = 'Trampas'; sub = 'Respuestas casi identicas';
  } else if (m === 'multi') {
    qs = BRAIN.shA(BRAIN.shuffle([].concat(MULTI)).slice(0,30));
    title = 'Multirespuesta'; sub = '259 preg con varias correctas';
  } else if (m === 'video') {
    if (!VIDS.length) { toast('Sin preguntas de video'); return; }
    qs = BRAIN.shA(BRAIN.shuffle([].concat(VIDS)));
    title = 'Videos RTA'; sub = VIDS.length + ' situaciones reales';
  } else if (m === 'errors') {
    var ids = Object.entries(BRAIN.get().err).sort(function(a,b){return b[1]-a[1];})
      .slice(0,40).map(function(e){return +e[0];});
    qs = BRAIN.shA(ids.map(function(id){return ALL_MAP[id];}).filter(Boolean));
    if (!qs.length) { toast('Sin errores aun!'); return; }
    title = 'Mis Errores'; sub = qs.length + ' preguntas mas falladas';
  } else if (m === 'realexam') {
    // AGENTE 5: Simulacro Examen Real — distribución exacta de 200 tests
    qs = AGENTS.buildRealExam(ALL, VIDS);
    title = '📋 Simulacro Real'; sub = '45 preg • distribución real • 40 min';
    explain=false; exam=true; timed=true; timeLimit=2400;
  } else if (m === 'ultimahora') {
    // AGENTE 6: Última Hora — Top frecuentes no dominadas
    qs = AGENTS.buildUltimaHora(ALL, VIDS, 60);
    if (!qs.length) { toast('¡Todas dominadas! Haz un Simulacro Real.'); return; }
    title = '⚡ Última Hora'; sub = qs.length + ' preg más probables del examen';
    explain=true; exam=false; timed=false;
  } else if (m === 'videocrit') {
    // Videos Críticos — los más frecuentes del examen
    qs = AGENTS.buildVideoCrit(VIDS);
    if (!qs.length) { toast('Sin preguntas de video'); return; }
    title = '🎬 Videos Críticos'; sub = qs.length + ' situaciones reales más frecuentes';
    explain=true; exam=false; timed=false;
  } else if (m === 'examdry') {
    // Examen Seco — sin feedback, condiciones reales КАТ
    qs = AGENTS.buildRealExam(ALL, VIDS);
    title = '📋 Examen Seco'; sub = 'Sin feedback • 45 preg • 40 min • condiciones reales';
    explain=false; exam=true; timed=true; timeLimit=2400;
    opts = Object.assign({}, opts||{}, {dryRun:true});
  } else if (m === 'fase1') {
    qs = AGENTS.buildFase1(ALL);
    if (!qs.length) { toast('Sin preguntas F1'); return; }
    title = '🎯 F1: Casi-Seguras'; sub = '8 preg >20% • salen 1 de cada 4 tests • 2pt c/u';
    explain=true; exam=false; timed=false;
  } else if (m === 'fase2') {
    qs = AGENTS.buildVideoCrit(VIDS);
    if (!qs.length) { toast('Sin videos'); return; }
    title = '🎬 F2: Videos Críticos'; sub = '20 videos • 3pt c/u • siempre 2 en el examen';
    explain=true; exam=false; timed=false;
  } else if (m === 'fase3') {
    var f3pool = ALL.filter(function(q){ return q.fase===3; })
      .sort(function(a,b){ return (b.val||0)-(a.val||0); });
    if (!f3pool.length) f3pool = ALL.filter(function(q){ return q.p===3&&!q.v; });
    var s3=BRAIN.get();
    f3pool.sort(function(a,b){
      var ra=s3.seen[a.id],rb=s3.seen[b.id];
      var ea=ra?ra.w/(ra.c+ra.w+0.1):1, eb=rb?rb.w/(rb.c+rb.w+0.1):1;
      return eb-ea;
    });
    qs = BRAIN.shA(f3pool.slice(0,40));
    if (!qs.length) { toast('Sin preguntas F3'); return; }
    title = '💎 F3: 3 Puntos'; sub = '360 preg • 47% de los pts • priorizando las no dominadas';
    explain=true; exam=false; timed=false;
  } else if (m === 'fase4') {
    var s4=BRAIN.get();
    var f4pool = ALL.filter(function(q){ return !q.v; })
      .sort(function(a,b){
        var ra=s4.seen[a.id],rb=s4.seen[b.id];
        if(!ra&&!rb) return (b.val||0)-(a.val||0);
        if(!ra) return -1; if(!rb) return 1;
        return (rb.w/(rb.c+rb.w+0.1))-(ra.w/(ra.c+ra.w+0.1));
      });
    qs = BRAIN.shA(f4pool.slice(0,40));
    if (!qs.length) { toast('Sin preguntas F4'); return; }
    title = '📚 F4: Banco Completo'; sub = '911 preg • cobertura total • priorizando débiles';
    explain=true; exam=false; timed=false;
  } else if (m === 'flash') {
    qs = AGENTS.buildFlash(ALL);
    if (!qs.length) { toast('Sin preguntas disponibles'); return; }
    title = '⚡ Relámpago'; sub = '5 preg • 2 min • máxima frecuencia';
    explain=true; exam=false; timed=true; timeLimit=120;
  } else if (m === 'signals') {
    // Señales visuales — solo preguntas de señales (Раздел 3)
    qs = BRAIN.shA(BRAIN.shuffle(ALL.filter(function(q){
      return (q.s||'').indexOf('3')>=0 && !q.v;
    }))).slice(0,30);
    if (!qs.length) { toast('Sin señales disponibles'); return; }
    title = '🚦 Señales'; sub = '30 señales más frecuentes de la sección 3';
    explain=true; exam=false; timed=false;
  } else if (m === 'corrective') {
    // Corrective Feedback — las más falladas para reintento
    var failedIds = Object.entries(BRAIN.get().err||{})
      .sort(function(a,b){return b[1]-a[1];})
      .slice(0,15).map(function(e){return +e[0];});
    qs = AGENTS.buildCorrectiveFeedback(ALL, failedIds);
    if (!qs.length) { toast('¡Sin errores! Haz un simulacro primero.'); return; }
    title = '🎯 Mis Errores'; sub = qs.length+' preguntas más falladas • enfoque máximo';
    explain=true; exam=false; timed=false;
  } else if (typeof m === 'string' && m.startsWith('sec_')) {
    // Modo por sección específica
    var secNum = m.replace('sec_','');
    var SNOMS = {1:'Vehículo',2:'Vías',3:'Señales',4:'Normas',5:'Factores',6:'Obligaciones'};
    var secName = SNOMS[secNum] || ('Sección '+secNum);
    var secPool = ALL.filter(function(q){ return (q.s||'').indexOf(secNum)>=0 && !q.v; });
    if (!secPool.length) { toast('Sin preguntas para Раздел '+secNum); return; }
    var sS = BRAIN.get();
    secPool.sort(function(a,b){
      var ea = (sS.err[a.id]||0)*2 + (sS.seen[a.id]?0:8) + BRAIN.getFreq(a.id)*0.1;
      var eb = (sS.err[b.id]||0)*2 + (sS.seen[b.id]?0:8) + BRAIN.getFreq(b.id)*0.1;
      return eb-ea;
    });
    qs = BRAIN.shA(secPool.slice(0,40));
    title = 'Раздел '+secNum+' — '+secName;
    sub = qs.length+' preg • priorizando débiles y frecuentes';
    explain=true; exam=false; timed=false;
  } else if (m === 'search') {
    // Búsqueda — qs viene por parámetro global
    if (!window._searchResults || !window._searchResults.length) { toast('Sin resultados'); return; }
    qs = BRAIN.shA(window._searchResults);
    title = '🔍 Búsqueda'; sub = qs.length+' resultados';
    explain=true; exam=false; timed=false;
  } else if (m === 'banco') {
    qs = BRAIN.shA(BRAIN.shuffle([].concat(ALL)).slice(0,45));
    title = 'Banco Completo'; sub = ALL.length + ' preg disponibles';
  }
  if (!qs || !qs.length) { toast('Sin preguntas disponibles'); return; }
  begin({mode:m, title:title, sub:sub, qs:qs, explain:explain, exam:exam, timed:timed, timeLimit:timeLimit});
}

// ── SESION ────────────────────────────────────
var S=null, TIMER=null, EXAM_LOG=[], _qStart=0;

function begin(opts) {
  if (TIMER) { clearInterval(TIMER); TIMER=null; }
  S = Object.assign({}, opts, {
    idx:0, score:0, ok:0, ko:0, t0:Date.now(),
    sel:[], done:false, showES:true, confidence:null,
    maxS: opts.qs.reduce(function(s,q){return s+(q.p||1);},0),
    dryRun: opts.dryRun||false,  // Examen Seco: sin feedback inmediato
    failedIds: []  // para corrective feedback
  });
  EXAM_LOG = []; _qStart = Date.now();
  document.getElementById('qtit').textContent = opts.title;
  // Banner de examen seco
  var dryBanner = document.getElementById('dry-banner');
  if (dryBanner) dryBanner.style.display = S.dryRun ? '' : 'none';
  if (opts.timed && opts.timeLimit) {
    document.getElementById('qtimer').style.display = '';
    document.getElementById('timer-bar').style.display = '';
    startTimer(opts.timeLimit);
  } else {
    document.getElementById('qtimer').style.display = 'none';
    document.getElementById('timer-bar').style.display = 'none';
  }
  renderQ(); show('s-q');
}

function startTimer(sec) {
  var left = sec;
  var bar = document.getElementById('timer-bar');
  var lbl = document.getElementById('qtimer');
  function tick() {
    left--;
    var mm = Math.floor(left/60), ss = left%60;
    lbl.textContent = mm + ':' + (ss<10?'0':'') + ss;
    var pct = left/sec*100;
    bar.style.width = pct + '%';
    bar.style.background = pct>50 ? '#22c55e' : pct>20 ? '#eab308' : '#ef4444';
    if (left <= 0) { clearInterval(TIMER); TIMER=null; toast('Tiempo agotado!',3000); endS(); }
  }
  tick(); TIMER = setInterval(tick, 1000);
}

function renderQ() {
  var q = S.qs[S.idx]; if (!q) { endS(); return; }
  S.sel=[]; S.done=false; S.confidence=null; _qStart=Date.now();

  document.getElementById('qpf').style.width = (S.qs.length>1 ? S.idx/S.qs.length*100 : 0)+'%';
  document.getElementById('qn').textContent = (S.idx+1)+'/'+S.qs.length;

  // ── VELOCIDAD: puntuación + proyección de tiempo ──────────────────
  var ptsStr = S.score+' pts';
  if (S.idx > 0 && !S.dryRun) {
    var elapsed = Math.round((Date.now()-S.t0)/1000);
    var secPerQ = elapsed / S.idx;
    var remaining = Math.round(secPerQ * (S.qs.length - S.idx));
    var totalMin = Math.round((elapsed + remaining) / 60);
    ptsStr = S.score+'pts | ⏱'+totalMin+'min';
  }
  document.getElementById('qsc2').textContent = ptsStr;
  document.getElementById('qsub').textContent = S.sub||'';

  var bdb = document.getElementById('bdg'); bdb.innerHTML='';
  bdg(bdb,'bp',(q.p||1)+'pt');

  // NUEVO: Indicador de probabilidad real
  var prob = BRAIN.getProb(q.id);
  var heat = BRAIN.getHeatIcon(q.id);
  if (heat) bdg(bdb,'bheat',heat+' '+prob+'%');
  else if (q.f) bdg(bdb,'bf',(q.f/200*100).toFixed(0)+'%');

  if ((q.sim||0)>0.5) bdg(bdb,'bt','Trampa');
  var nc=(q.a||[]).filter(function(a){return a.ok;}).length;
  if (nc>1) bdg(bdb,'bm',nc+' correctas');
  if (q.v||q.rta_v) bdg(bdb,'bv','Video');

  var body = document.getElementById('qbody'); body.innerHTML='';

  // Video — orden: local → avtoizpit → rta.government.bg
  if (q.v||q.rta_v||q.rta_url) {
    var wd=document.createElement('div'); wd.className='qvid';
    var vid=document.createElement('video'); vid.controls=true; vid.preload='metadata';
    vid.style.cssText='width:100%;border-radius:8px;max-height:220px;background:#000';
    var vidId = q.v||q.rta_v;
    if (vidId) {
      loadVid(vid, vidId, q.rta_url); // local → avtoizpit → rta
    } else {
      vid.src=q.rta_url;
      vid.onerror=function(){this.style.display='none';};
    }
    wd.appendChild(vid); body.appendChild(wd);
  } else if (q.i) {
    // Imagen — loadImg maneja URL completa y ID numérico
    var img=document.createElement('img'); img.className='qimg';
    loadImg(img, q.i);
    img.alt='';
    body.appendChild(img);
  }

  // Question row: BG text + audio button
  var qrow=document.createElement('div'); qrow.style.cssText='display:flex;align-items:flex-start;gap:6px;margin-bottom:6px';
  var qt=document.createElement('div'); qt.className='qtxt'; qt.style.flex='1'; qt.textContent=q.bg||'';
  var abt=document.createElement('button'); abt.className='audio-btn'; abt.innerHTML='&#x1F50A;';
  (function(txt){ abt.onclick=function(e){e.stopPropagation();speak(txt);}; })(q.bg||'');
  qrow.appendChild(qt); qrow.appendChild(abt); body.appendChild(qrow);

  // ES translation (always visible)
  if (q.es) {
    var esb=document.createElement('div'); esb.id='qesbox'; esb.className='qes-box';
    esb.innerHTML='<div class="qes-lbl">Traduccion ES</div><div class="qes-txt">'+esc(q.es)+'</div>';
    body.appendChild(esb);
  }

  // Answers — LOCAL container (critical fix)
  var ad=document.createElement('div'); ad.className='answers'; ad.id='ans-box';
  (q.a||[]).forEach(function(a,i){
    var btn=document.createElement('button'); btn.className='ans'; btn.dataset.i=i;
    (function(idx){ btn.onclick=function(){selA(idx);}; })(i);
    var row=document.createElement('div'); row.className='ar';
    var lbl=document.createElement('span'); lbl.className='al'; lbl.textContent='ABCD'[i]||'?';
    var txd=document.createElement('div'); txd.className='at';
    // BG answer + audio
    var ar2=document.createElement('div'); ar2.style.cssText='display:flex;align-items:center;gap:4px';
    var atxt=document.createElement('div'); atxt.className='atxt'; atxt.textContent=a.t||'';
    var aab=document.createElement('button'); aab.className='audio-btn'; aab.innerHTML='&#x1F50A;';
    (function(txt){ aab.onclick=function(e){e.stopPropagation();speak(txt);}; })(a.t||'');
    ar2.appendChild(atxt); ar2.appendChild(aab); txd.appendChild(ar2);
    // ES answer (always visible)
    if (a.es) {
      var aes=document.createElement('div'); aes.className='aes'; aes.id='aes-'+i;
      aes.textContent=a.es; txd.appendChild(aes);
    }
    if (a.i) {
      var ai=document.createElement('img'); ai.className='aimg'; ai.alt='';
      loadImg(ai, a.i); txd.appendChild(ai);
    }
    row.appendChild(lbl); row.appendChild(txd); btn.appendChild(row); ad.appendChild(btn);
  });
  body.appendChild(ad);

  // Confidence selector
  var cr=document.createElement('div'); cr.id='conf-row'; cr.className='conf-row';
  cr.innerHTML='<button class="conf-btn" id="cb-s" onclick="setConf(\'sure\')">\u2705 Seguro</button>'+
    '<button class="conf-btn" id="cb-u" onclick="setConf(\'unsure\')">\u26A0 Inseguro</button>'+
    '<button class="conf-btn" id="cb-d" onclick="setConf(\'doubt\')">\u274C Dificil</button>';
  body.appendChild(cr);

  // Explanation (hidden until confirmed)
  var ex=document.createElement('div'); ex.id='expbox'; ex.className='exp-box'; body.appendChild(ex);

  document.getElementById('btn-lang').textContent = S.showES ? 'Solo BG' : 'BG+ES';
  document.getElementById('btn-ok').disabled = true;
  document.getElementById('btn-ok').style.display = '';
  document.getElementById('btn-nx').style.display = 'none';

  // ── VELOCIDAD INDIVIDUAL por pregunta ─────────────────────────────
  var speedEl = document.getElementById('q-speed');
  if (speedEl) speedEl.textContent = '';

  // ── AUTO-LEER pregunta al aparecer ───────────────────────────────
  if (TTS.isAutoRead()) {
    setTimeout(function(){ TTS.autoReadQuestion(q); }, 300);
  }
}

function setConf(c) {
  S.confidence=c;
  document.getElementById('cb-s').className='conf-btn'+(c==='sure'?' c-s':'');
  document.getElementById('cb-u').className='conf-btn'+(c==='unsure'?' c-u':'');
  document.getElementById('cb-d').className='conf-btn'+(c==='doubt'?' c-d':'');
}

function selA(i) {
  if (S.done) return;
  var q=S.qs[S.idx];
  var nc=(q.a||[]).filter(function(a){return a.ok;}).length;
  // CRITICAL FIX: use local container
  var box=document.getElementById('ans-box');
  if (!box) return;
  var btns=box.querySelectorAll('.ans');
  if (nc<=1) {
    S.sel=[i];
    for(var j=0;j<btns.length;j++) btns[j].classList.toggle('sel',j===i);
  } else {
    var p=S.sel.indexOf(i);
    if(p>=0){S.sel.splice(p,1);if(btns[i])btns[i].classList.remove('sel');}
    else{S.sel.push(i);if(btns[i])btns[i].classList.add('sel');}
  }
  document.getElementById('btn-ok').disabled = S.sel.length===0;
}

function confA() {
  if (S.done||!S.sel.length) return; S.done=true;
  var q=S.qs[S.idx];
  var timeSpent=Math.round((Date.now()-_qStart)/1000);
  var box=document.getElementById('ans-box');
  var btns=box?box.querySelectorAll('.ans'):[];
  var cis=(q.a||[]).reduce(function(acc,a,i){if(a.ok)acc.push(i);return acc;},[]);
  var isOK=cis.length===S.sel.length&&cis.every(function(i){return S.sel.indexOf(i)>=0;});

  for(var i=0;i<btns.length;i++){
    btns[i].disabled=true;
    // En modo seco: no colorear respuestas hasta el final
    if (!S.dryRun) {
      var cc=cis.indexOf(i)>=0, cs=S.sel.indexOf(i)>=0;
      if(cc&&cs) btns[i].classList.add('ok');
      else if(!cc&&cs) btns[i].classList.add('bad');
      else if(cc&&!cs) btns[i].classList.add('miss');
    } else {
      btns[i].classList.add('sel'); // solo marca seleccionada, sin revelar
    }
  }

  if(isOK){S.score+=(q.p||1);S.ok++;}
  else {
    S.ko++;
    S.failedIds = (S.failedIds||[]).concat(q.id);
  }
  BRAIN.recordAnswer(q.id,isOK,S.confidence,timeSpent);

  var ex=document.getElementById('expbox');
  if (S.dryRun) {
    // Modo seco: solo muestra "→ Respuesta guardada"
    ex.className='exp-box show';
    ex.innerHTML='<div class="exp-h ok">✏️ Respuesta registrada</div>'+
      '<div class="exp-b" style="color:var(--fg3);font-size:13px">El resultado se revela al final del examen.</div>';
  } else {
    ex.className='exp-box show'+(isOK?'':' err');
    ex.innerHTML='<div class="exp-h '+(isOK?'ok':'err')+'">'+(isOK?'✅ Correcto':'❌ Incorrecto')+'</div>'+
      '<div class="exp-b">'+(q.explain||(isOK?'Bien hecho!':'Repasa esta pregunta.'))+'</div>'+
      (q.explain?'<button class="btn-speak-es" onclick="speakES(\''+esc(q.explain||'')+'\')">🔊 Escuchar</button>':'');
  }

  EXAM_LOG.push({q:q,sel:S.sel.slice(),cis:cis,ok:isOK,time:timeSpent});
  document.getElementById('qsc2').textContent=S.dryRun?'?':S.score+' pts';

  // ── FEEDBACK DE VELOCIDAD individual ─────────────────────────────
  var speedEl = document.getElementById('q-speed');
  if (speedEl && timeSpent > 0) {
    var color = timeSpent<=20?'#22c55e':timeSpent<=35?'#eab308':'#ef4444';
    var icon  = timeSpent<=20?'⚡':timeSpent<=35?'✓':'🐢';
    speedEl.innerHTML = '<span style="color:'+color+';font-size:11px">'+icon+' '+timeSpent+'s</span>';
  }

  document.getElementById('btn-ok').style.display='none';
  document.getElementById('btn-nx').style.display='';
  setTimeout(function(){ex.scrollIntoView({behavior:'smooth',block:'nearest'});},120);
}

function nextQ() {
  S.idx++;
  if(S.idx>=S.qs.length){endS();return;}
  renderQ();
  document.getElementById('qbody').scrollTop=0;
}

function endS() {
  if(TIMER){clearInterval(TIMER);TIMER=null;}
  var el=Math.round((Date.now()-S.t0)/1000);
  var mm=Math.floor(el/60),ss=el%60;
  BRAIN.recordSession(S.mode,S.idx,el);

  if(S.exam||S.mode==='set'||S.mode==='examdry'||S.mode==='realexam'){
    var examData={date:new Date().toLocaleDateString('es'),score:S.score,max:S.maxS,
      pass:S.score>=87,mode:S.title,ok:S.ok,ko:S.ko,time:el};
    BRAIN.recordExam(examData);
    if(S.mode==='realexam'||S.mode==='examdry') {
      BRAIN.recordRealExam({
        date:new Date().toLocaleDateString('es'),
        pts:S.score, maxPts:S.maxS,
        pct:Math.round(S.score/(S.maxS||1)*100),
        pass:S.score>=87, secs:el
      });
    }
  }
  if(S.mode==='set'&&S.si!==undefined){
    BRAIN.get().sp['s'+S.si]={seen:S.qs.length,ok:S.ok};BRAIN.save();
  }

  var pass=S.score>=87;
  var pct=Math.round(S.score/(S.maxS||1)*100);
  var isExamMode=S.exam||S.mode==='realexam'||S.mode==='examdry'||S.mode==='set';

  document.getElementById('ri').textContent=isExamMode?(pass?'🎉':'😓'):(S.ok>S.ko?'💪':'📚');
  document.getElementById('rsc').textContent=S.dryRun?'Revelado →':S.score;
  document.getElementById('ro').textContent='de '+S.maxS+' puntos';
  document.getElementById('rok').textContent=S.ok;
  document.getElementById('rko').textContent=S.ko;
  document.getElementById('rp3').textContent=S.qs.filter(function(q){return q.p===3;}).length;
  document.getElementById('rt').textContent=mm+':'+(ss<10?'0':'')+ss;

  var rb=document.getElementById('rbdg');
  if(isExamMode){
    rb.textContent=pass?'✅ APROBADO ('+S.score+'/87 mín)':'❌ SUSPENDIDO (mín 87 pts) — '+pct+'%';
    rb.className='rbdg '+(pass?'pass':'fail');
  } else {
    rb.textContent=pct+'% acierto';rb.className='rbdg neut';
  }

  // Panel extra según modo
  var extra=document.getElementById('res-extra');
  if(extra) {
    if(S.mode==='realexam') {
      extra.innerHTML='<div style="padding:8px 0;font-size:14px;color:var(--fg2);text-align:center">'+
        '📊 Dist. real: R4=22 • R3=7 • R2=4 • Vid=2<br>'+
        (pass?'🚗 Nivel aprobado. Repite hasta estabilizar 90%':'📚 Revisa errores → Última Hora')+
        '</div>';
      extra.style.display='';
    } else if(S.mode==='examdry') {
      // Modo seco: ahora sí revelar resultados pregunta a pregunta
      var html='<div style="padding:10px 0">';
      html+='<div style="font-size:15px;font-weight:700;margin-bottom:10px;color:'+(pass?'var(--green)':'var(--red)')+'">'+
        (pass?'✅ APROBADO':'❌ SUSPENDIDO')+' — '+S.score+'/'+S.maxS+' pts ('+pct+'%)</div>';
      html+='<div style="font-size:13px;color:var(--fg3);margin-bottom:8px">Revisión completa:</div>';
      EXAM_LOG.forEach(function(log,idx){
        var q=log.q;
        var correctA=(q.a||[]).filter(function(a){return a.ok;}).map(function(a){return a.es||a.t||'';}).join(', ');
        html+='<div style="padding:8px;margin-bottom:6px;border-radius:8px;background:var(--bg2);border-left:3px solid '+(log.ok?'var(--green)':'var(--red)')+'">'+
          '<div style="font-size:13px;font-weight:600;color:'+(log.ok?'var(--green)':'var(--red)')+'">'+
          (log.ok?'✅':'❌')+' '+(idx+1)+'. '+(q.es||q.bg||'').substring(0,60)+'</div>'+
          (log.ok?'':'<div style="font-size:12px;color:var(--fg3);margin-top:3px">✓ '+correctA+'</div>')+
          (q.explain&&!log.ok?'<div style="font-size:12px;color:var(--acc2);margin-top:3px">'+q.explain.substring(0,120)+'</div>':'')+
          '</div>';
      });
      html+='</div>';
      extra.innerHTML=html;
      extra.style.display='';
    } else if(S.failedIds&&S.failedIds.length>0&&(S.mode==='adaptive'||S.mode==='ultimahora')) {
      // Corrective feedback disponible
      extra.innerHTML='<div style="padding:8px 0;font-size:14px;color:var(--red)">'+
        '❌ Fallaste '+S.ko+' pregunta'+(S.ko>1?'s':'')+'. ¿Repasar las falladas ahora?</div>';
      extra.style.display='';
    } else {
      extra.style.display='none';
    }
  }

  // Mostrar/ocultar botón corrective
  var btnCorr=document.getElementById('btn-corrective');
  if(btnCorr) {
    btnCorr.style.display=(S.failedIds&&S.failedIds.length>0)?'':'none';
  }

  show('s-res');
}

function startCorrectiveFeedback() {
  if(!S||!S.failedIds||!S.failedIds.length) return;
  var qs=AGENTS.buildCorrectiveFeedback(ALL,S.failedIds);
  if(!qs.length){toast('Sin errores para repasar');return;}
  begin({mode:'corrective',title:'🎯 Corrective',sub:qs.length+' falladas → segundo intento',
    qs:qs,explain:true,exam:false,timed:false});
}
window.startCorrectiveFeedback=startCorrectiveFeedback;
function retry(){
  if(TIMER){clearInterval(TIMER);TIMER=null;}
  begin(Object.assign({},S,{idx:0,score:0,ok:0,ko:0,t0:Date.now(),qs:BRAIN.shA(BRAIN.shuffle([].concat(S.qs)))}));
}
function backC(){
  if(TIMER){clearInterval(TIMER);TIMER=null;}
  if(!S||(!S.done&&S.idx===0)){show('home');return;}
  if(confirm('Salir?'))show('home');
}
function togLang(){
  S.showES=!S.showES;
  var esb=document.getElementById('qesbox');if(esb)esb.style.display=S.showES?'':'none';
  (S.qs[S.idx]&&S.qs[S.idx].a||[]).forEach(function(a,i){
    var el=document.getElementById('aes-'+i);if(el)el.style.display=S.showES?'':'none';
  });
  document.getElementById('btn-lang').textContent=S.showES?'Solo BG':'BG+ES';
}

// ── REVISION ──────────────────────────────────
function openReview(){
  var body=document.getElementById('rev-body'); body.innerHTML='';
  if(!EXAM_LOG.length){
    body.innerHTML='<div style="padding:20px;color:#8b949e;text-align:center">Sin datos de examen</div>';
    show('s-rev'); return;
  }

  // ── Resumen de velocidad ──────────────────────────────────────────
  var tiempos = EXAM_LOG.map(function(e){return e.time||0;}).filter(function(t){return t>0;});
  var avgTime = tiempos.length ? Math.round(tiempos.reduce(function(s,t){return s+t;},0)/tiempos.length) : 0;
  var lentas  = EXAM_LOG.filter(function(e){return e.time>40;});
  var rapidas = EXAM_LOG.filter(function(e){return e.time<=20;});
  var totalSec = tiempos.reduce(function(s,t){return s+t;},0);
  var totalMin = Math.round(totalSec/60*10)/10;

  var resumenVel = '';
  if (avgTime > 0) {
    var velColor = avgTime<=26?'#22c55e':avgTime<=35?'#eab308':'#ef4444';
    var velMsg   = avgTime<=26?'✅ Ritmo excelente — terminarías en <20 min':
                   avgTime<=35?'⚠️ Ritmo aceptable — ajusta para llegar a <20 min':
                   '🐢 Ritmo lento — entrena velocidad con F1 y F2';
    resumenVel =
      '<div style="padding:12px 16px;background:var(--bg2);border-radius:10px;margin-bottom:12px;border-left:3px solid '+velColor+'">'+
      '<div style="font-size:13px;font-weight:700;color:'+velColor+'">'+velMsg+'</div>'+
      '<div style="display:flex;gap:16px;margin-top:8px;font-size:12px;color:var(--fg3)">'+
      '<span>⏱ Media: <b style="color:var(--fg)">'+avgTime+'s</b>/preg</span>'+
      '<span>⚡ Rápidas ≤20s: <b style="color:#22c55e">'+rapidas.length+'</b></span>'+
      '<span>🐢 Lentas >40s: <b style="color:#ef4444">'+lentas.length+'</b></span>'+
      '<span>📋 Total: <b style="color:var(--fg)">'+totalMin+'min</b></span>'+
      '</div></div>';
  }

  var html = resumenVel;
  EXAM_LOG.forEach(function(entry,i){
    var t = entry.time||0;
    var velColor = t<=20?'#22c55e':t<=35?'#eab308':'#ef4444';
    var velIcon  = t<=20?'⚡':t<=35?'✓':'🐢';
    html += '<div class="rev-item">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
    html += '<div class="rev-q" style="flex:1">'+(entry.ok?'✅':'❌')+' '+(i+1)+'. '+esc(entry.q.bg||'')+'</div>';
    if (t>0) html += '<div style="font-size:11px;color:'+velColor+';font-weight:700;margin-left:6px;flex-shrink:0">'+velIcon+' '+t+'s</div>';
    html += '</div>';
    if (entry.q.es) html += '<div class="rev-q-es">'+esc(entry.q.es)+'</div>';
    (entry.q.a||[]).forEach(function(a,ai){
      var isSel=entry.sel.indexOf(ai)>=0, isCorr=entry.cis.indexOf(ai)>=0;
      if(!isSel&&!isCorr) return;
      var cls=isCorr?'ok':'bad';
      var lbl=isCorr&&isSel?'✅':isCorr&&!isSel?'⚠️ (correcta)':'❌ (error)';
      html += '<div class="rev-a '+cls+'">'+lbl+' '+'ABCD'[ai]+'. '+esc(a.t||'')+(a.es?'<br><small>'+esc(a.es)+'</small>':'')+'</div>';
    });
    if (entry.q.explain) html += '<div class="rev-exp">'+esc(entry.q.explain)+
      '<button class="btn-speak-es" onclick="TTS.speakES(\''+esc(entry.q.explain||'')+'\')">🔊</button></div>';
    // Preg lenta: sugerir práctica
    if (t>40 && entry.q.fase<=2) {
      html += '<div style="font-size:11px;color:var(--acc);margin-top:4px">⚡ Esta preg de F'+entry.q.fase+' debería salir en <15s — practica hasta reconocimiento inmediato</div>';
    }
    html += '</div>';
  });

  document.getElementById('rev-body').innerHTML=html;
  show('s-rev');
}

// ── ANALYTICS ─────────────────────────────────
function openAnalytics(){
  var body=document.getElementById('an-body');body.innerHTML='';
  var a=AGENTS.getFullAnalysis(ALL);
  if(!a.ready){
    body.innerHTML='<div style="padding:28px 16px;text-align:center;color:#8b949e">Estudia al menos 10 preguntas primero.<br><br><button class="cbtn" onclick="startSet(0)">Empezar Set 1</button></div>';
    show('s-an');return;
  }
  var m=a.metrics;var p=a.prediction;var html='';
  if(p){
    var cls2=m.avgScore>=90&&m.examsCount>=3?'g':m.avgScore>=80?'w':'i';
    html+='<div class="an-sec"><div class="an-t">Prediccion de preparacion</div>'+
      '<div class="ins '+cls2+'"><div class="ins-t">Listo en ~'+p.days+' dias &mdash; '+p.date+'</div>'+
      '<div class="ins-b">Ritmo: '+p.qPerDay+' preg/dia. Confianza: '+p.confidence+'.'+
      (p.blockers&&p.blockers.length?'<br>Pendiente: '+p.blockers.join('; '):'')+'</div></div></div>';
  }
  var sN={1:'Datos veh.',2:'Vias',3:'Senales',4:'Normas',5:'Factores',6:'Obligaciones'};
  var sS={},sE={};
  Object.entries(BRAIN.get().seen).forEach(function(e){
    var q=ALL_MAP[+e[0]];if(!q)return;
    var m2=(q.s||'').match(/[0-9]/);var s=m2?m2[0]:'4';
    sS[s]=(sS[s]||0)+1;if(BRAIN.get().err[e[0]])sE[s]=(sE[s]||0)+1;
  });
  html+='<div class="an-sec"><div class="an-t">Rendimiento por Razdel</div><div class="chart-wrap">';
  [1,2,3,4,5,6].forEach(function(s){
    var n=sS[s]||0;var er=n?Math.round((sE[s]||0)/n*100):0;var ok=100-er;
    var col=!n?'#6e7681':ok>=85?'#22c55e':ok>=65?'#eab308':'#ef4444';
    html+='<div class="bar-row"><div class="bar-lbl">R'+s+' '+sN[s]+'</div>'+
      '<div class="bar-bg"><div class="bar-fill" style="width:'+(n?ok:0)+'%;background:'+col+'"></div></div>'+
      '<div class="bar-val" style="color:'+col+'">'+(n?ok+'%':'-')+'</div></div>';
  });
  html+='</div></div>';
  var exs=BRAIN.get().exams.filter(function(e){return e.max>0;});
  if(exs.length>=2){
    html+='<div class="an-sec"><div class="an-t">Curva de mejora</div><div class="chart-wrap">';
    exs.slice(-8).forEach(function(e,i){
      var pct2=Math.round(e.score/e.max*100);
      var col2=pct2>=90?'#22c55e':pct2>=75?'#eab308':'#ef4444';
      html+='<div class="bar-row"><div class="bar-lbl">Ex.'+(exs.length-Math.min(8,exs.length)+i+1)+'</div>'+
        '<div class="bar-bg"><div class="bar-fill" style="width:'+pct2+'%;background:'+col2+'"></div></div>'+
        '<div class="bar-val" style="color:'+col2+'">'+pct2+'%</div></div>';
    });
    html+='</div></div>';
  }
  html+='<div class="an-sec"><div class="an-t">Insights</div>';
  (a.insights||[]).forEach(function(ins){
    html+='<div class="ins '+ins.c+'"><div class="ins-t">'+ins.t+'</div><div class="ins-b">'+ins.b+'</div></div>';
  });
  if(!a.insights||!a.insights.length)html+='<div class="ins i"><div class="ins-t">Sin alertas</div><div class="ins-b">Continua con el SRS.</div></div>';
  html+='</div>';
  if(a.topErrors&&a.topErrors.length){
    html+='<div class="an-sec"><div class="an-t">Top 5 mas falladas</div>';
    a.topErrors.forEach(function(e){
      html+='<div class="ins b"><div class="ins-t">ID '+e.id+' \u2014 fallada '+e.n+' veces</div>'+
        '<div class="ins-b">'+esc(e.bg||'')+(e.es?'<br><i>'+esc(e.es)+'</i>':'')+'</div></div>';
    });
    html+='</div>';
  }
  body.innerHTML=html;show('s-an');
}

// ── GLOSARIO ──────────────────────────────────
var _glosAll=[];
function openGlos(){
  _glosAll=[];
  if(typeof VOCAB_DATA!=='undefined')VOCAB_DATA.forEach(function(v){_glosAll.push({bg:v.bg,bg2:'',es:v.es,explain:v.explain});});
  if(typeof GLOS!=='undefined')GLOS.forEach(function(g){_glosAll.push({bg:g[0],bg2:g[1],es:g[2],explain:''});});
  _glosAll.sort(function(a,b){return a.bg.localeCompare(b.bg);});
  rendG(_glosAll);document.getElementById('gi').value='';show('s-glos');
}
function rendG(items){
  var c=document.getElementById('glist');c.innerHTML='';
  items.forEach(function(item){
    var d=document.createElement('div');d.className='gitem';
    d.innerHTML='<div class="gterm">'+esc(item.bg)+'</div>'+
      (item.bg2?'<div class="gbg">'+esc(item.bg2)+'</div>':'')+
      '<div class="ges">ES: '+esc(item.es)+'</div>'+
      (item.explain?'<div class="gexp">'+esc(item.explain)+'</div>':'');
    if(item.explain){d.onclick=function(){this.classList.toggle('open');};}
    c.appendChild(d);
  });
}
function filtG(v){
  var lv=v.toLowerCase();
  rendG(_glosAll.filter(function(i){
    return i.bg.toLowerCase().indexOf(lv)>=0||i.es.toLowerCase().indexOf(lv)>=0||(i.explain||'').toLowerCase().indexOf(lv)>=0;
  }));
}

// ── FLASHCARDS ────────────────────────────────
var FC={queue:[],idx:0};
function openFlash(){
  FC.queue=[];
  if(typeof VOCAB_DATA!=='undefined'){
    VOCAB_DATA.forEach(function(v){
      var vd=BRAIN.get().vocab&&BRAIN.get().vocab[v.key];
      var score=(BRAIN.get().unknownWords||[]).indexOf(v.key)>=0?20:(!vd||!vd.known?10:0);
      FC.queue.push({front:v.bg,back:v.es,hint:v.explain||'',key:v.key,score:score});
      FC.queue.push({front:v.es,back:v.bg,hint:'BG: '+v.bg,key:v.key+'_r',score:score-2});
    });
  }
  if(typeof GLOS!=='undefined'){
    GLOS.forEach(function(g){FC.queue.push({front:g[0],back:g[2],hint:g[1],key:'g_'+g[0],score:0});});
  }
  FC.queue.sort(function(a,b){return b.score-a.score;});
  FC.idx=0;
  document.getElementById('fc-sub').textContent=FC.queue.length+' tarjetas';
  renderFC();show('s-flash');
}
function renderFC(){
  if(!FC.queue.length){show('home');return;}
  var card=FC.queue[FC.idx%FC.queue.length];
  document.getElementById('fc-front').textContent=card.front;
  document.getElementById('fc-back').textContent=card.back;
  document.getElementById('fc-back').style.display='none';
  document.getElementById('fc-sub2').textContent=card.hint||'Toca para ver';
  document.getElementById('fc-btns').style.display='none';
  document.getElementById('fc-flip-btn').style.display='';
  document.getElementById('fc-prog').textContent=(FC.idx+1)+' / '+FC.queue.length;
}
function flipCard(){
  document.getElementById('fc-back').style.display='block';
  document.getElementById('fc-sub2').textContent='';
  document.getElementById('fc-flip-btn').style.display='none';
  document.getElementById('fc-btns').style.display='';
  var front=document.getElementById('fc-front').textContent;
  if(/[а-яА-Я]/.test(front))speak(front);
}
function fcAnswer(knew){
  var card=FC.queue[FC.idx%FC.queue.length];
  if(card.key&&!card.key.endsWith('_r')&&!card.key.startsWith('g_'))BRAIN.markWordKnown(card.key,knew);
  if(!knew){FC.queue.push(FC.queue.splice(FC.idx%FC.queue.length,1)[0]);}
  else{FC.queue.splice(FC.idx%FC.queue.length,1);}
  if(!FC.queue.length){toast('Ronda completada!');show('home');return;}
  FC.idx=FC.idx%FC.queue.length;renderFC();
}
function shuffleFlash(){FC.queue=BRAIN.shuffle([].concat(FC.queue));FC.idx=0;renderFC();toast('Mezcladas');}

// ── PROGRESO ──────────────────────────────────
function openProg(){rendProg();show('s-prog');}

// ── PODCAST — escuchar mientras caminas ───────────────────────────
function openPodcast() {
  show('s-podcast');
  rendPodcastOptions();
}
window.openPodcast = openPodcast;

function rendPodcastOptions() {
  var el = document.getElementById('pod-options');
  if (!el) return;
  var s = BRAIN.get();
  var fase = typeof AGENTS!=='undefined' ? AGENTS.detectPatterns() : {};

  // Listas para podcast
  var opciones = [
    {id:'f1',   label:'🎯 F1 Casi-Seguras',   n:8,   desc:'Las 8 más probables del examen'},
    {id:'f2',   label:'🎬 F2 Videos',          n:20,  desc:'Los 20 videos críticos'},
    {id:'f3',   label:'💎 F3 Tres Puntos',     n:40,  desc:'Las 40 de 3pt más frecuentes'},
    {id:'err',  label:'🎯 Mis Errores',        n:15,  desc:'Las que más has fallado'},
    {id:'all',  label:'📚 Banco Completo',     n:100, desc:'Todas las preguntas de alta frecuencia'},
    {id:'srs',  label:'📅 SRS Pendientes',     n:25,  desc:'Las que toca repasar hoy'},
  ];

  el.innerHTML = opciones.map(function(op){
    return '<button class="pod-option" onclick="startPodcastMode(\''+op.id+'\')" style="'+
      'display:flex;align-items:center;gap:12px;width:100%;background:var(--bg2);'+
      'border:1px solid var(--bg4);border-radius:10px;padding:14px 16px;'+
      'margin-bottom:8px;cursor:pointer;text-align:left">'+
      '<div style="font-size:22px">'+op.label.split(' ')[0]+'</div>'+
      '<div><div style="font-size:14px;font-weight:600;color:var(--fg)">'+op.label.substring(op.label.indexOf(' ')+1)+'</div>'+
      '<div style="font-size:12px;color:var(--fg3)">'+op.desc+' ('+op.n+' preg)</div></div>'+
      '</button>';
  }).join('');
}
window.rendPodcastOptions = rendPodcastOptions;

function startPodcastMode(tipo) {
  var pool = [];
  var s = BRAIN.get();

  if (tipo === 'f1') {
    pool = ALL.filter(function(q){ return AGENTS.IDS_FASE1.indexOf(q.id)>=0; });
  } else if (tipo === 'f2') {
    pool = (typeof VIDS!=='undefined') ? AGENTS.buildVideoCrit(VIDS) : [];
  } else if (tipo === 'f3') {
    pool = ALL.filter(function(q){ return q.fase===3; })
      .sort(function(a,b){return (b.val||0)-(a.val||0);}).slice(0,40);
  } else if (tipo === 'err') {
    var failIds = Object.entries(s.err||{}).sort(function(a,b){return b[1]-a[1];})
      .slice(0,15).map(function(e){return +e[0];});
    pool = ALL.filter(function(q){return failIds.indexOf(q.id)>=0;});
  } else if (tipo === 'srs') {
    pool = AGENTS.getSRSQueue(ALL).slice(0,25);
  } else {
    // all — top 100 por frecuencia
    pool = ALL.filter(function(q){return BRAIN.getFreq(q.id)>=5 && !q.v;})
      .sort(function(a,b){return (b.val||0)-(a.val||0);}).slice(0,100);
  }

  if (!pool.length) { toast('Sin preguntas para podcast'); return; }
  // Asegurar que tienen texto
  pool = pool.filter(function(q){ return q.bg||q.es; });
  TTS.startPodcast(pool);
  show('s-podcast');
}
window.startPodcastMode = startPodcastMode;
window.pausePodcast  = function(){ TTS.pausePodcast(); };
window.nextPodcast   = function(){ TTS.nextPodcast(); };
window.prevPodcast   = function(){ TTS.prevPodcast(); };
window.stopPodcast   = function(){ TTS.stopPodcast(); show('home'); };

// ── MISIÓN DEL DÍA ────────────────────────────────────────────────
function openMisionDia() {
  var panel = document.getElementById('mision-panel');
  if (!panel) { show('home'); return; }
  var m = BRAIN.getMetrics();
  var s = BRAIN.get();
  var fase = typeof AGENTS!=='undefined' ? AGENTS.IDS_FASE1 : [];

  // Calcular misión de hoy
  var f1done = fase.filter(function(id){var r=s.seen[id];return r&&r.c>=3&&r.w===0;}).length;
  var due = m.due;
  var hoy = new Date().toDateString();
  var pregHoy = (s.cal||{})[hoy]||0;

  var mision = [];

  if (due > 0) {
    mision.push({
      emoji:'📅', titulo:'SRS Pendiente', pts:due+' repasos',
      desc:'Repasar ahora consolida 3× más que mañana',
      fn:"mod('srs')", urgente:true
    });
  }
  if (f1done < 8) {
    mision.push({
      emoji:'🎯', titulo:'F1: Casi-Seguras', pts: f1done+'/8 dominadas',
      desc:'Cada una = 2pts garantizados en el examen',
      fn:"mod('fase1')", urgente:f1done===0
    });
  }
  mision.push({
    emoji:'📋', titulo:'Simulacro Seco', pts:'45 preg cronometrado',
    desc:'Meta: terminar en <20 min con >87pts',
    fn:"mod('examdry')", urgente:false
  });
  if (m.p3pct < 80) {
    mision.push({
      emoji:'💎', titulo:'F3: Tres Puntos', pts:m.p3pct+'% dominadas',
      desc:'Son el 47% de los puntos del examen',
      fn:"mod('fase3')", urgente:false
    });
  }

  // Tiempo estimado
  var minTotales = due*2 + (f1done<8?5:0) + 25 + 15;

  panel.innerHTML =
    '<div style="padding:16px">'+
    '<div style="font-size:13px;color:var(--fg3);margin-bottom:4px">'+new Date().toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long'})+'</div>'+
    '<div style="font-size:20px;font-weight:800;color:var(--fg);margin-bottom:4px">Tu misión de hoy</div>'+
    '<div style="font-size:13px;color:var(--fg3);margin-bottom:16px">⏱ ~'+minTotales+' min • '+pregHoy+' preg ya hoy</div>'+
    mision.map(function(t,i){
      return '<button onclick="'+t.fn+'" style="display:flex;gap:12px;width:100%;'+
        'background:'+(t.urgente?'rgba(249,115,22,.1)':'var(--bg2)')+';'+
        'border:1px solid '+(t.urgente?'var(--acc)':'var(--bg4)')+';border-radius:10px;'+
        'padding:12px 14px;margin-bottom:8px;cursor:pointer;text-align:left;align-items:center">'+
        '<div style="font-size:24px">'+t.emoji+'</div>'+
        '<div style="flex:1"><div style="font-size:14px;font-weight:700;color:var(--fg)">'+t.titulo+'</div>'+
        '<div style="font-size:12px;color:var(--acc);font-weight:600">'+t.pts+'</div>'+
        '<div style="font-size:11px;color:var(--fg3)">'+t.desc+'</div></div>'+
        '<div style="font-size:12px;color:var(--fg3)">'+(i===0&&t.urgente?'🔴':'▶')+'</div>'+
        '</button>';
    }).join('')+
    '</div>';

  show('s-mision');
}
window.openMisionDia = openMisionDia;

// ── REPASO NOCTURNO ───────────────────────────────────────────────
function modoNocturno() {
  // 10 preguntas F1+F2, máximo 5 min — para antes de dormir
  var f1 = ALL.filter(function(q){ return AGENTS.IDS_FASE1.indexOf(q.id)>=0; });
  var f2 = typeof VIDS!=='undefined' ?
    (VIDS||[]).sort(function(a,b){
      var ia=AGENTS.TOP_VIDS.indexOf(a.v||0), ib=AGENTS.TOP_VIDS.indexOf(b.v||0);
      return (ia<0?99:ia)-(ib<0?99:ib);
    }).slice(0,5) : [];
  var pool = BRAIN.shuffle([].concat(f1,f2)).slice(0,10);
  if (!pool.length) { toast('Sin preguntas para repaso nocturno'); return; }
  pool = BRAIN.shA(pool);
  begin({
    mode:'nocturno', title:'🌙 Repaso Nocturno',
    sub:'10 preg F1+F2 • 5 min • consolida mientras duermes',
    qs:pool, explain:true, exam:false, timed:true, timeLimit:300
  });
}
window.modoNocturno = modoNocturno;

// ── FLASHCARDS SEÑALES VISUALES ───────────────────────────────────
function modoSeñalesVisual() {
  // Solo señales con imagen — mostrar imagen, elegir nombre
  var señales = ALL.filter(function(q){
    return (q.s||'').indexOf('3')>=0 && q.i && !q.v && q.es;
  }).sort(function(a,b){return BRAIN.getFreq(b.id)-BRAIN.getFreq(a.id);});

  if (!señales.length) { toast('Sin señales con imagen'); return; }
  begin({
    mode:'señales_visual', title:'🚦 Señales Visuales',
    sub:señales.length+' señales • imagen → identificar • por frecuencia real',
    qs:BRAIN.shA(señales.slice(0,40)), explain:true, exam:false, timed:false
  });
}
window.modoSeñalesVisual = modoSeñalesVisual;

// ── MODO VELOCIDAD PURA ──────────────────────────────────────────
function modoVelocidad() {
  // Banco completo con cronómetro visible — meta <20s/preg
  var pool = BRAIN.shA(ALL.filter(function(q){return !q.v;})
    .sort(function(a,b){return (b.val||0)-(a.val||0);}).slice(0,45));
  begin({
    mode:'velocidad', title:'⚡ Modo Velocidad',
    sub:'45 preg • meta <20s/preg • terminar en <15 min',
    qs:pool, explain:false, exam:true, timed:true, timeLimit:2400
  });
}
window.modoVelocidad = modoVelocidad;

// ── TOGGLE AUTO-LEER ─────────────────────────────────────────────
function toggleAutoRead() { TTS.toggleAutoRead(); }
window.toggleAutoRead = toggleAutoRead;

// ── BÚSQUEDA DE PREGUNTA ──────────────────────────────────────────
function openSearch() {
  show('s-search');
  setTimeout(function(){ var inp=document.getElementById('search-inp'); if(inp) inp.focus(); }, 200);
}

function doSearch() {
  var inp = document.getElementById('search-inp');
  var q = (inp ? inp.value : '').trim().toLowerCase();
  var res = document.getElementById('search-results');
  if (!q || q.length < 2) { if(res) res.innerHTML='<div style="color:#8b949e;padding:12px 0">Escribe al menos 2 caracteres</div>'; return; }

  var found = ALL.filter(function(item){
    var bg = (item.bg||item.t||'').toLowerCase();
    var es = (item.es||'').toLowerCase();
    return bg.includes(q) || es.includes(q);
  }).slice(0, 30);

  if (!res) return;
  if (!found.length) { res.innerHTML='<div style="color:#8b949e;padding:12px 0">Sin resultados para "'+esc(q)+'"</div>'; return; }

  res.innerHTML = '<div style="color:#8b949e;font-size:12px;margin-bottom:8px">'+found.length+' resultado'+(found.length>1?'s':'')+'</div>' +
    found.map(function(item){
      var heat = BRAIN.getHeatIcon(item.id);
      var es = (item.es||'').substring(0,80);
      var bg = (item.bg||'').substring(0,60);
      return '<div class="search-result" onclick="launchSearch('+item.id+')" style="padding:10px;margin-bottom:6px;background:var(--bg2);border-radius:8px;cursor:pointer;border-left:3px solid '+(heat?'#f97316':'var(--bg4)')+'">'+
        '<div style="font-size:13px;font-weight:600;color:var(--fg)">'+esc(es||bg)+'</div>'+
        '<div style="font-size:11px;color:#8b949e;margin-top:2px">'+(item.p||1)+'pt • '+(item.s||'')+(heat?' • '+heat+' '+BRAIN.getProb(item.id)+'%':'')+'</div>'+
        '</div>';
    }).join('');
}
window.doSearch = doSearch;

function launchSearch(id) {
  var q = ALL.find(function(item){return item.id===id;});
  if (!q) return;
  window._searchResults = [q];
  mod('search');
}
window.launchSearch = launchSearch;

// ── NOTIFICACIONES PUSH (recordatorio diario) ─────────────────────
function setupNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    toast('Notificaciones no disponibles en este navegador'); return;
  }
  Notification.requestPermission().then(function(perm) {
    if (perm === 'granted') {
      var hour = document.getElementById('notif-hour');
      var h = hour ? parseInt(hour.value)||9 : 9;
      localStorage.setItem('notif_hour', String(h));
      scheduleDaily(h);
      toast('✅ Recordatorio diario a las '+h+'h activado');
    } else {
      toast('Permiso denegado. Activa en ajustes del navegador.');
    }
  });
}
window.setupNotifications = setupNotifications;

function scheduleDaily(hour) {
  var now = new Date();
  var target = new Date();
  target.setHours(hour, 0, 0, 0);
  if (target <= now) target.setDate(target.getDate()+1);
  var ms = target - now;
  setTimeout(function() {
    var m = BRAIN.getMetrics();
    var body = m.due > 0 ? m.due+' repasos SRS pendientes — 10 min y listo' :
               '¡Estudia hoy para mantener la racha de '+m.streak+' días!';
    new Notification('🚗 Авто Изпит PRO', {
      body: body, icon: './icon192.png', badge: './icon192.png',
      tag: 'daily-reminder', renotify: true
    });
    scheduleDaily(hour); // reagendar para mañana
  }, ms);
}

function checkAndScheduleNotif() {
  var h = localStorage.getItem('notif_hour');
  if (h && Notification.permission === 'granted') scheduleDaily(parseInt(h));
}

// ── PRE-CACHEAR IMÁGENES OFFLINE ──────────────────────────────────
function preCacheImages() {
  var btn = document.getElementById('cache-btn');
  if (btn) { btn.textContent='⏳ Cacheando...'; btn.disabled=true; }

  // Top 100 preguntas más frecuentes con imagen
  var toCache = ALL
    .filter(function(q){ return q.i && BRAIN.getFreq(q.id)>=5; })
    .sort(function(a,b){ return BRAIN.getFreq(b.id)-BRAIN.getFreq(a.id); })
    .slice(0,100);

  var urls = [];
  toCache.forEach(function(q){
    urls.push('https://avtoizpit.com/api/pictures/'+q.i+'.png?quality=2');
    (q.a||[]).forEach(function(a){ if(a.i) urls.push('https://avtoizpit.com/api/pictures/'+a.i+'.png?quality=2'); });
  });

  // Videos top 15
  [48,46,50,49,45,53,47,52,51,61,58,59,10,16,55].forEach(function(v){
    urls.push('https://avtoizpit.com/api/videos/video'+v+'.mp4');
  });

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    var ch = new MessageChannel();
    ch.port1.onmessage = function(e) {
      if (btn) { btn.textContent='✅ '+e.data.cached+' archivos en cache'; btn.disabled=false; }
      toast('Cache offline listo: '+e.data.cached+' archivos');
    };
    navigator.serviceWorker.controller.postMessage({type:'CACHE_IMAGES', urls:urls}, [ch.port2]);
  } else {
    // Fallback: fetch directo
    var cached=0;
    Promise.allSettled(urls.slice(0,50).map(function(u){ return fetch(u); })).then(function(results){
      cached = results.filter(function(r){return r.status==='fulfilled';}).length;
      if (btn) { btn.textContent='✅ '+cached+' archivos'; btn.disabled=false; }
      toast('Cache: '+cached+' archivos');
    });
  }
}
window.preCacheImages = preCacheImages;

// ═══════════════════════════════════════════════════════════════════
// TTS ENGINE — Motor bilingüe BG+ES
// Modos: manual (botón), auto-leer (toggle), podcast (solo escuchar)
// ═══════════════════════════════════════════════════════════════════

var TTS = (function() {
  var _speed_bg = parseFloat(localStorage.getItem('tts_speed')||'0.85');
  var _speed_es = parseFloat(localStorage.getItem('tts_speed_es')||'0.9');
  var _autoRead  = localStorage.getItem('tts_auto')==='1';
  var _voices    = [];
  var _voiceBG   = null;
  var _voiceES   = null;
  var _queue     = [];
  var _speaking  = false;
  var _podcastActive = false;
  var _podcastIdx    = 0;
  var _podcastList   = [];

  function init() {
    if (!window.speechSynthesis) return;
    function loadVoices() {
      _voices = window.speechSynthesis.getVoices();
      _voiceBG = _voices.find(function(v){return v.lang.startsWith('bg');}) || null;
      _voiceES = _voices.find(function(v){return v.lang.startsWith('es')&&!v.lang.includes('US');}) ||
                 _voices.find(function(v){return v.lang.startsWith('es');}) || null;
    }
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  function _utter(text, lang, rate, onEnd) {
    var u = new SpeechSynthesisUtterance(text);
    u.lang = lang || 'bg-BG';
    u.rate = rate || 0.85;
    var voice = lang && lang.startsWith('es') ? _voiceES : _voiceBG;
    if (voice) u.voice = voice;
    u.onend = onEnd || null;
    u.onerror = function() { if (onEnd) onEnd(); };
    window.speechSynthesis.speak(u);
  }

  // Leer texto en búlgaro
  function speakBG(text) {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    _utter(text, 'bg-BG', _speed_bg);
  }

  // Leer texto en español
  function speakES(text) {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    _utter(text, 'es-ES', _speed_es);
  }

  // Leer secuencia: [{text, lang}] en orden
  function speakSequence(items, onDone) {
    if (!window.speechSynthesis || !items || !items.length) { if(onDone)onDone(); return; }
    window.speechSynthesis.cancel();
    var i = 0;
    function next() {
      if (i >= items.length) { if(onDone)onDone(); return; }
      var item = items[i++];
      var pause = item.pause || 0;
      if (pause > 0) {
        setTimeout(function(){ _utter(item.text, item.lang||'bg-BG', item.rate||_speed_bg, next); }, pause);
      } else {
        _utter(item.text, item.lang||'bg-BG', item.rate||_speed_bg, next);
      }
    }
    next();
  }

  // Auto-leer pregunta cuando aparece (modo interactivo)
  function autoReadQuestion(q) {
    if (!_autoRead || !q) return;
    var items = [];
    // Pregunta en BG
    if (q.bg) items.push({text: q.bg, lang:'bg-BG', rate:_speed_bg});
    // Pausa 400ms
    if (q.es) items.push({text: q.es, lang:'es-ES', rate:_speed_es, pause:400});
    speakSequence(items);
  }

  // ── MODO PODCAST ──────────────────────────────────────────────────
  // Escucha pregunta BG → pregunta ES → respuestas BG+ES → explicación ES
  // Sin interacción del usuario
  function startPodcast(questions) {
    if (!questions || !questions.length) { toast('Sin preguntas para el podcast'); return; }
    _podcastActive = true;
    _podcastIdx = 0;
    _podcastList = questions;
    _showPodcastUI(true);
    _playPodcastItem();
  }

  function _buildPodcastItems(q) {
    var items = [];
    var correctAs = (q.a||[]).filter(function(a){return a.ok;});

    // 1. Número de pregunta
    items.push({text:'Pregunta '+((_podcastIdx)+1)+' de '+_podcastList.length, lang:'es-ES', rate:_speed_es});
    // Pausa
    items.push({text:' ', lang:'es-ES', rate:1, pause:300});

    // 2. Pregunta en BG
    if (q.bg) items.push({text:q.bg, lang:'bg-BG', rate:_speed_bg});
    // Pausa
    items.push({text:' ', lang:'es-ES', rate:1, pause:500});

    // 3. Pregunta en ES
    if (q.es) items.push({text:q.es, lang:'es-ES', rate:_speed_es});
    // Pausa
    items.push({text:' ', lang:'es-ES', rate:1, pause:600});

    // 4. "La respuesta correcta es:"
    items.push({text:'La respuesta correcta es:', lang:'es-ES', rate:_speed_es});
    items.push({text:' ', lang:'es-ES', rate:1, pause:200});

    // 5. Cada respuesta correcta BG → ES
    correctAs.forEach(function(a) {
      if (a.t) items.push({text:a.t, lang:'bg-BG', rate:_speed_bg});
      items.push({text:' ', lang:'es-ES', rate:1, pause:300});
      if (a.es) items.push({text:a.es, lang:'es-ES', rate:_speed_es});
      items.push({text:' ', lang:'es-ES', rate:1, pause:400});
    });

    // 6. Explicación en ES
    if (q.explain) {
      items.push({text:'Explicación:', lang:'es-ES', rate:_speed_es});
      items.push({text:' ', lang:'es-ES', rate:1, pause:200});
      // Limpiar emojis y ⚠️ para TTS
      var expClean = q.explain.replace(/[⚠️🔥⚡📍✅❌💎🎯📋🎬]/g,'').trim();
      items.push({text:expClean, lang:'es-ES', rate:_speed_es});
    }

    // Pausa larga entre preguntas
    items.push({text:' ', lang:'es-ES', rate:1, pause:1200});

    return items;
  }

  function _playPodcastItem() {
    if (!_podcastActive || _podcastIdx >= _podcastList.length) {
      _endPodcast();
      return;
    }
    var q = _podcastList[_podcastIdx];
    _updatePodcastUI();
    var items = _buildPodcastItems(q);
    // Filtrar items de pausa vacíos (SpeechSynthesis no admite texto vacío en todos los browsers)
    items = items.filter(function(it){ return it.text && it.text.trim(); });
    speakSequence(items, function() {
      _podcastIdx++;
      _playPodcastItem();
    });
  }

  function pausePodcast() {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      var btn = document.getElementById('pod-play');
      if (btn) btn.textContent = '⏸ Pausar';
    } else {
      window.speechSynthesis.pause();
      var btn = document.getElementById('pod-play');
      if (btn) btn.textContent = '▶ Continuar';
    }
  }

  function nextPodcast() {
    window.speechSynthesis.cancel();
    _podcastIdx++;
    if (_podcastIdx < _podcastList.length) _playPodcastItem();
    else _endPodcast();
  }

  function prevPodcast() {
    window.speechSynthesis.cancel();
    _podcastIdx = Math.max(0, _podcastIdx-1);
    _playPodcastItem();
  }

  function stopPodcast() {
    _podcastActive = false;
    _podcastIdx = 0;
    _podcastList = [];
    // Android necesita cancel + pequeño delay para limpiar la cola
    try {
      window.speechSynthesis.cancel();
      setTimeout(function(){ window.speechSynthesis.cancel(); }, 150);
    } catch(e) {}
    _showPodcastUI(false);
  }

  function _endPodcast() {
    _podcastActive = false;
    _showPodcastUI(false);
    toast('🎧 Podcast completado — '+_podcastList.length+' preguntas');
  }

  function _showPodcastUI(show) {
    var panel = document.getElementById('pod-panel');
    if (panel) panel.style.display = show ? 'flex' : 'none';
  }

  function _updatePodcastUI() {
    var lbl = document.getElementById('pod-lbl');
    if (lbl) lbl.textContent = 'Preg '+(_podcastIdx+1)+'/'+_podcastList.length;
  }

  // Toggle auto-leer
  function toggleAutoRead() {
    _autoRead = !_autoRead;
    localStorage.setItem('tts_auto', _autoRead?'1':'0');
    var btn = document.getElementById('btn-auto-read');
    if (btn) btn.textContent = _autoRead ? '🔊 Auto: ON' : '🔇 Auto: OFF';
    btn && (btn.style.background = _autoRead ? 'rgba(249,115,22,.2)' : '');
    toast(_autoRead ? '🔊 Auto-leer activado' : '🔇 Auto-leer desactivado');
  }

  function setSpeedBG(s) { _speed_bg=s; localStorage.setItem('tts_speed',s); }
  function setSpeedES(s) { _speed_es=s; localStorage.setItem('tts_speed_es',s); }
  function isAutoRead() { return _autoRead; }
  function isPodcastActive() { return _podcastActive; }

  init();

  return {
    speakBG, speakES, speakSequence,
    autoReadQuestion,
    startPodcast, pausePodcast, nextPodcast, prevPodcast, stopPodcast,
    toggleAutoRead, setSpeedBG, setSpeedES,
    isAutoRead, isPodcastActive
  };
})();

// Compatibilidad con código existente
function speak(t) { TTS.speakBG(t); }
function speakES(t) { TTS.speakES(t); }
window.speak = speak;
window.speakES = speakES;
window.TTS = TTS;

// ── TOGGLE TEMA CLARO/OSCURO ──────────────────────────────────────
var _theme = localStorage.getItem('theme') || 'dark';
function applyTheme(t) {
  _theme = t;
  localStorage.setItem('theme', t);
  document.documentElement.setAttribute('data-theme', t);
  var btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = t==='dark' ? '☀️ Claro' : '🌙 Oscuro';
}
function toggleTheme() { applyTheme(_theme==='dark'?'light':'dark'); }
window.toggleTheme = toggleTheme;
function rendProg(){
  var s=BRAIN.get();
  var m=BRAIN.getMetrics();

  // ── Racha ────────────────────────────────────────────────────────
  document.getElementById('stn').textContent=s.streak||0;

  // ── CALENDARIO MEJORADO (90 días, con actividad por día) ──────────
  var cal=document.getElementById('cal');
  cal.innerHTML='<div class="cal-months" id="cal-months"></div>';
  var grid=document.createElement('div');
  grid.className='cal-grid';
  var today=new Date();
  var monthLabels=document.getElementById('cal-months')||document.createElement('div');
  var lastMonth=-1;
  var monthsHtml='';

  for(var d=89;d>=0;d--){
    var dt=new Date(today);dt.setDate(dt.getDate()-d);
    var key=dt.toDateString();
    var n=s.cal[key]||0;
    // Ver sesiones de ese día para tooltip detallado
    var daySessions=(s.sessions||[]).filter(function(ss){return ss.date===key;});
    var modes=[...new Set(daySessions.map(function(ss){return ss.mode;}))].join(', ');

    // Etiqueta de mes (cada vez que cambia)
    if(dt.getMonth()!==lastMonth){
      lastMonth=dt.getMonth();
      monthsHtml+='<span style="grid-column:'+(90-d)+'">'+dt.toLocaleDateString('es',{month:'short'})+'</span>';
    }

    var div=document.createElement('div');
    div.className='cal-day'+(n>=20?' d4':n>=10?' d3':n>=5?' d2':n>=1?' d1':'');
    var dayStr=dt.toLocaleDateString('es',{weekday:'short',month:'short',day:'numeric'});
    div.title=dayStr+': '+(n?n+' preg'+(modes?' ('+modes+')':''):'sin actividad');
    // Marcar hoy
    if(d===0) div.style.outline='2px solid #f97316';
    grid.appendChild(div);
  }
  cal.appendChild(grid);

  // ── GRÁFICO DE PUNTUACIÓN EN EL TIEMPO ───────────────────────────
  var chartEl=document.getElementById('score-chart');
  if(chartEl){
    var history=(s.scoreHistory||[]).slice(-20);
    if(history.length>=2){
      var maxPct=100, minPct=50;
      var W=chartEl.offsetWidth||300, H=120;
      chartEl.innerHTML='';
      var svg='<svg width="100%" height="'+H+'" viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg">';

      // Líneas de referencia
      svg+='<line x1="0" y1="'+Math.round((1-(90-minPct)/(maxPct-minPct))*H)+'" x2="'+W+'" y2="'+Math.round((1-(90-minPct)/(maxPct-minPct))*H)+'" stroke="#22c55e" stroke-width="1" stroke-dasharray="4,4" opacity="0.4"/>';
      svg+='<text x="4" y="'+Math.round((1-(90-minPct)/(maxPct-minPct))*H-3)+'" fill="#22c55e" font-size="9" opacity="0.7">90%</text>';

      // Línea de puntuación
      var pts=history.map(function(h,i){
        var x=Math.round(i/(history.length-1)*(W-20)+10);
        var y=Math.round((1-(Math.max(minPct,h.pct)-minPct)/(maxPct-minPct))*(H-20)+10);
        return {x:x,y:y,pct:h.pct,date:h.date,mode:h.mode};
      });

      // Área rellena
      var pathD='M '+pts[0].x+' '+H+' L '+pts[0].x+' '+pts[0].y;
      pts.forEach(function(p){pathD+=' L '+p.x+' '+p.y;});
      pathD+=' L '+pts[pts.length-1].x+' '+H+' Z';
      svg+='<path d="'+pathD+'" fill="rgba(249,115,22,0.1)"/>';

      // Línea
      var lineD='M '+pts[0].x+' '+pts[0].y;
      pts.forEach(function(p){lineD+=' L '+p.x+' '+p.y;});
      svg+='<path d="'+lineD+'" fill="none" stroke="#f97316" stroke-width="2"/>';

      // Puntos
      pts.forEach(function(p){
        var col=p.pct>=90?'#22c55e':p.pct>=75?'#eab308':'#ef4444';
        svg+='<circle cx="'+p.x+'" cy="'+p.y+'" r="4" fill="'+col+'" stroke="#0d1117" stroke-width="2"/>';
        svg+='<title>'+p.date+' — '+p.pct+'% ('+p.mode+')</title>';
      });

      // Último valor
      var last=pts[pts.length-1];
      svg+='<text x="'+(last.x>W-30?last.x-22:last.x+6)+'" y="'+(last.y>10?last.y-6:last.y+14)+'" fill="#f97316" font-size="10" font-weight="bold">'+last.pct+'%</text>';

      svg+='</svg>';
      chartEl.innerHTML=svg;
    } else {
      chartEl.innerHTML='<div style="color:#8b949e;font-size:12px;text-align:center;padding:40px 0">Haz al menos 2 simulacros para ver el gráfico</div>';
    }
  }

  // ── ESTADÍSTICAS POR HORA ─────────────────────────────────────────
  var hourEl=document.getElementById('hour-stats');
  if(hourEl){
    var hs=s.hourStats||{};
    var hourData=[];
    for(var h=0;h<24;h++){
      if(hs[h]&&hs[h].total>=5){
        hourData.push({h:h,rate:Math.round(hs[h].ok/hs[h].total*100),total:hs[h].total});
      }
    }
    if(hourData.length>=2){
      var best=hourData.reduce(function(a,b){return b.rate>a.rate?b:a;});
      var html='<div style="margin-bottom:8px;font-size:12px;color:var(--fg3)">Tu mejor hora: <span style="color:#f97316;font-weight:700">'+best.h+'h-'+(best.h+1)+'h ('+best.rate+'% acierto)</span></div>';
      html+='<div class="hour-bars">';
      hourData.forEach(function(d){
        var col=d.rate>=85?'#22c55e':d.rate>=70?'#eab308':'#ef4444';
        html+='<div class="hour-bar-wrap" title="'+d.h+'h: '+d.rate+'% ('+d.total+' preg)">'+
          '<div class="hour-bar" style="height:'+Math.round(d.rate*0.6)+'px;background:'+col+'"></div>'+
          '<div class="hour-lbl">'+d.h+'h</div></div>';
      });
      html+='</div>';
      hourEl.innerHTML=html;
    } else {
      hourEl.innerHTML='<div style="color:#8b949e;font-size:12px;text-align:center;padding:12px 0">Estudia en distintas horas para ver cuándo rindes mejor</div>';
    }
  }

  // ── PROGRESO POR SETS ────────────────────────────────────────────
  var ps=document.getElementById('pp-sets');if(ps){ps.innerHTML='';
  for(var i=0;i<8;i++){
    var sp=s.sp['s'+i]||{seen:0};var pct=Math.round(sp.seen/45*100);
    ps.innerHTML+='<div class="pr"><div class="prl">Set '+(i+1)+'</div><div class="pm"><div class="pmf" style="width:'+pct+'%"></div></div><div class="prp">'+pct+'%</div></div>';
  }}

  // ── PROGRESO POR MÓDULO ──────────────────────────────────────────
  var pm=document.getElementById('pp-mods');if(pm){pm.innerHTML='';
  var mods=[];
  if(typeof RANKED!=='undefined') mods.push([RANKED,'Sets']);
  if(typeof TRAPS!=='undefined')  mods.push([TRAPS,'Trampas']);
  if(typeof PTS3!=='undefined')   mods.push([PTS3,'3 Pts']);
  if(typeof MULTI!=='undefined')  mods.push([MULTI,'Multi']);
  if(typeof VIDS!=='undefined')   mods.push([VIDS,'Videos']);
  if(typeof ALL!=='undefined')    mods.push([ALL,'Todo']);
  mods.forEach(function(item){
    var arr=item[0],n=item[1];
    var seen3=arr.filter(function(q){return s.seen[q.id];}).length;
    var pct=arr.length?Math.min(100,Math.round(seen3/arr.length*100)):0;
    pm.innerHTML+='<div class="pr"><div class="prl">'+n+'</div><div class="pm"><div class="pmf" style="width:'+pct+'%"></div></div><div class="prp">'+pct+'%</div></div>';
  });}

  // ── HISTORIAL DE SIMULACROS (con realExams) ───────────────────────
  var pe=document.getElementById('pp-ex');
  if(pe){
    // Combinar exams y realExams
    var allExams=[].concat(
      (s.exams||[]).map(function(e){return {date:e.date,label:e.mode||'Simulacro',score:e.score,max:e.max,pct:Math.round(e.score/e.max*100)};})
    ).concat(
      (s.realExams||[]).map(function(e){return {date:e.date,label:'Real',score:e.pts,max:e.maxPts,pct:e.pct};})
    ).sort(function(a,b){return new Date(b.date)-new Date(a.date);}).slice(0,12);

    pe.innerHTML=allExams.length?allExams.map(function(e){
      var col=e.pct>=90?'#22c55e':e.pct>=75?'#eab308':'#ef4444';
      return '<div class="pex"><div class="pex-l">'+e.label+' &bull; '+e.date+'</div>'+
        '<div class="pex-r" style="color:'+col+'">'+e.pct+'%'+(e.pct>=90?' ✅':'')+'</div></div>';
    }).join(''):'<div style="color:#8b949e;font-size:12px;padding:5px 0">Sin simulacros aún. Haz uno ahora.</div>';
  }

  // ── LOGROS ───────────────────────────────────────────────────────
  var ag=document.getElementById('ach-grid');
  if(ag){ag.innerHTML='';
  BRAIN.getAchievements().forEach(function(ach){
    var d=document.createElement('div');d.className='ach'+(ach.earned?' earned':'');
    d.innerHTML='<div class="ach-icon" style="opacity:'+(ach.earned?'1':'.3')+'">'+ach.icon+'</div>'+
      '<div class="ach-lbl">'+ach.label+(ach.earned?'<br><span style="font-size:9px;color:#f97316">'+ach.earned+'</span>':'')+'</div>';
    ag.appendChild(d);
  });}

  // ── MÉTRICAS RESUMEN ─────────────────────────────────────────────
  var msum=document.getElementById('m-summary');
  if(msum){
    msum.innerHTML=
      '<div class="msum-item"><div class="msum-n">'+m.totalHours+'h</div><div class="msum-l">Estudio total</div></div>'+
      '<div class="msum-item"><div class="msum-n">'+m.dominated+'</div><div class="msum-l">Dominadas</div></div>'+
      '<div class="msum-item"><div class="msum-n">'+m.freqCoverage+'%</div><div class="msum-l">Frecuentes</div></div>'+
      '<div class="msum-item"><div class="msum-n">'+(m.avgRealPts||m.avgScore)+'%</div><div class="msum-l">Nota media</div></div>';
  }
}

// ── INSTRUCTOR ────────────────────────────────
var TC=[];
function openTutor(){
  var q=S&&S.qs&&S.qs[S.idx];TC=[];
  var msgs=document.getElementById('tmsgs');msgs.innerHTML='';
  var key=getAPIKey();
  if(!key){
    addMsg('a','Necesitas configurar tu API key de Anthropic.\n\nVe a \u2699\uFE0F Ajustes \u2192 Instructor Claude \u2192 pega tu sk-ant-...');
    document.getElementById('tutor').classList.add('open');return;
  }
  if(q){
    var ctx='Examen teorico Bulgaria Cat.B.\nPregunta BG: "'+q.bg+'".\nES: "'+(q.es||'')+'"\n'+
      'Respuestas: '+(q.a||[]).map(function(a,i){return 'ABCD'[i]+'. '+a.t+(a.ok?' [CORRECTA]':'')+(a.es?' / ES:'+a.es:'');}).join(' | ')+
      '\nExplicacion: "'+(q.explain||'')+'"';
    TC=[{role:'user',content:ctx},{role:'assistant',content:'Listo.'}];
    addMsg('a','Listo para explicarte esta pregunta. Que quieres saber?');
  } else {
    addMsg('a','Hola! Soy tu instructor de conduccion bulgara. Preguntame en espanol.');
  }
  document.getElementById('tutor').classList.add('open');
}
function closeTutor(){document.getElementById('tutor').classList.remove('open');}
function addMsg(role,text){
  var msgs=document.getElementById('tmsgs');
  var d=document.createElement('div');d.className='tmsg '+role;d.textContent=text;
  msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;return d;
}
function sendT(){
  var inp=document.getElementById('tinp');var txt=inp.value.trim();if(!txt)return;
  var key=getAPIKey();
  if(!key){toast('Configura tu API key en Ajustes');return;}
  inp.value='';addMsg('u',txt);TC.push({role:'user',content:txt});
  var ld=addMsg('a','Pensando...');ld.classList.add('ld');
  fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},
    body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:700,
      system:'Eres instructor del examen teorico de conduccion de Bulgaria (Categoria B). Explica en espanol claro y conciso. Marca las TRAMPAS explicitamente. Max 3 parrafos cortos.',
      messages:TC})
  }).then(function(r){return r.json();})
  .then(function(d){
    var rep=(d.content||[]).find(function(b){return b.type==='text';});
    if(rep){ld.textContent=rep.text;ld.classList.remove('ld');TC.push({role:'assistant',content:rep.text});}
    else{ld.textContent='Error: '+(d.error&&d.error.message||'Intenta de nuevo');ld.classList.remove('ld');}
  }).catch(function(e){ld.textContent='Error de conexion: '+e.message;ld.classList.remove('ld');});
}

// ── INIT ──────────────────────────────────────
function initApp(){
  buildAll();
  initTTS();
  // Aplicar tema guardado
  applyTheme(localStorage.getItem('theme')||'dark');
  // Cargar voces TTS (asíncrono en algunos navegadores)
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function(){};
  }
  uhome();
  setTimeout(function(){
    try{doCoach();}catch(e){document.getElementById('coach-msg').textContent='Bienvenido! Empieza por el Set 1.';}
    checkAndScheduleNotif();
  },200);
}

// Init — wrapper
// init handled by inline script in index.html
