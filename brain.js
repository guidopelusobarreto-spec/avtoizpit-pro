// ═══════════════════════════════════════════════════════════════════
// BRAIN.JS v4.0 — Cerebro Central
// Nuevo: probabilidad por pregunta, alerta regresión, stats por hora
// ═══════════════════════════════════════════════════════════════════

var BRAIN = (function() {

  var VERSION = 'aipro9';

  var STATE = loadState();

  function loadState() {
    try {
      var s = JSON.parse(localStorage.getItem(VERSION) || 'null');
      if (!s) {
        // Migrar desde versión anterior
        for (var v of ['aipro8','aipro7','aipro6']) {
          var old = localStorage.getItem(v);
          if (old) { s = JSON.parse(old); s._migrated = v; break; }
        }
      }
      s = s || defaultState();
      _migrarDominio(s);
      return s;
    } catch(e) { return defaultState(); }
  }

  // Migracion v5: el dominio pasa de "c>=3 && w===0" (historial limpio, imposible
  // de recuperar tras un fallo) a racha reciente + dias distintos + tiempo.
  // Sembramos cd y streak en estados antiguos para no perder progreso real.
  function _migrarDominio(s) {
    if (!s || s._domv5) return;
    Object.keys(s.seen || {}).forEach(function(id) {
      var r = s.seen[id];
      if (r.cd === undefined) r.cd = Math.min(r.c || 0, 2);
      if (r.streak === undefined) r.streak = (r.w === 0 ? (r.c || 0) : 0);
    });
    s._domv5 = 1;
  }

  function defaultState() {
    return {
      seen: {}, err: {}, conf: {}, vocab: {}, wrong: {},
      firstTry: {ok:0, total:0}, checkpoints: [], plan: {}, leidas: {}, hist: {},
      unknownWords: [], exams: [], sessions: [],
      cal: {}, streak: 0, lastDay: null,
      achievements: {}, sp: {}, fcDone: {},
      realExams: [],
      hotStreak: 0,
      totalStudySec: 0,
      // NUEVO: historial de puntuaciones para detectar regresión
      scoreHistory: [],  // [{date, pct, mode}]
      // NUEVO: stats por hora del día
      hourStats: {},     // {h: {ok, total}}
      profile: {
        avgTimePerQ: 0, bestHour: null,
        sessionsCount: 0, totalTime: 0,
        startDate: new Date().toDateString()
      }
    };
  }

  // ─── Escritura en disco con buffer ────────────────────────────────
  // Antes cada respuesta serializaba TODO el estado y lo escribia en
  // localStorage. Con 1487 preguntas el JSON crece y esa escritura es
  // sincrona: bloquea el hilo justo cuando el usuario pulsa. Ahora
  // marcamos el estado como sucio y volcamos como mucho cada segundo y
  // medio, mas un volcado inmediato en los momentos criticos.
  var _sucio = false, _temporizador = null, _MS = 1500, _escrituras = 0;

  function _volcar() {
    if (_temporizador) { clearTimeout(_temporizador); _temporizador = null; }
    if (!_sucio) return false;
    try {
      localStorage.setItem(VERSION, JSON.stringify(STATE));
      _sucio = false; _escrituras++;
      return true;
    } catch(e) {
      // si falla (cuota llena, modo privado) dejamos el estado sucio
      // para reintentarlo en el proximo volcado en vez de perderlo
      return false;
    }
  }

  function save() {
    _sucio = true;
    if (!_temporizador) _temporizador = setTimeout(_volcar, _MS);
  }

  // Volcado inmediato: fin de sesion, examen, checkpoint, reset.
  function saveNow() { _sucio = true; return _volcar(); }

  function statsEscritura() {
    return { pendiente: _sucio, escrituras: _escrituras, ms: _MS };
  }

  // Nunca perder datos al cerrar, minimizar o cambiar de pestana.
  // pagehide es el unico fiable en iOS; visibilitychange cubre Android.
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', function(){
      if (document.visibilityState === 'hidden') _volcar();
    });
  }
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('pagehide', _volcar);
    window.addEventListener('beforeunload', _volcar);
  }

  // ─── Frecuencias reales ───────────────────────────────────────────
  var FREQ_REAL = {};

  function initFreq(all) {
    all.forEach(function(q) { if (q.f) FREQ_REAL[q.id] = q.f; });
  }

  function getFreq(id) { return FREQ_REAL[id] || 0; }

  // Probabilidad REAL de aparecer en un examen: f = veces que salio en los
  // 200 tests analizados, asi que p = f/200. Sin multiplicadores inventados.
  function getProb(id) {
    var f = getFreq(id);
    if (!f) return 0;
    return Math.max(1, Math.round(f/200*100));
  }

  // Icono de calor, recalibrado a la escala real (el maximo del banco ronda 26%)
  function getHeatIcon(id) {
    var p = getProb(id);
    if (p >= 20) return '🔥🔥';
    if (p >= 10) return '🔥';
    if (p >= 5)  return '⚡';
    if (p >= 2)  return '📍';
    return '';
  }

  // ─── Registrar respuesta ──────────────────────────────────────────
  function recordAnswer(id, ok, confidence, timeSpentSec, modo) {
    var td = new Date().toDateString();
    var h  = new Date().getHours();

    var _primera = !STATE.seen[id];
    if (!STATE.seen[id]) STATE.seen[id] = {c:0,w:0,iv:1,due:td,streak:0,timeSpent:[]};
    var r = STATE.seen[id];
    // La primera vez que ves una pregunta mide tu nivel real de partida.
    // Es lo que usamos para estimar como te iria con las que aun no has visto.
    if (_primera) {
      if (!STATE.firstTry) STATE.firstTry = {ok:0, total:0};
      STATE.firstTry.total++;
      if (ok) STATE.firstTry.ok++;
    }
    r.last = td;

    // Stats por hora
    if (!STATE.hourStats[h]) STATE.hourStats[h] = {ok:0,total:0};
    STATE.hourStats[h].total++;
    if (ok) STATE.hourStats[h].ok++;

    // ── DESTETE DEL ESPAÑOL ────────────────────────────────────────
    // El examen es entero en búlgaro. Registramos CÓMO respondiste:
    //   'es'    = con la traducción delante
    //   'pista' = en búlgaro, pero destapaste la traducción antes de responder
    //   'bg'    = en búlgaro puro, sin mirar
    // Solo 'bg' hace subir de nivel. Y una pista rompe la racha en búlgaro,
    // porque acertar mirando no demuestra nada sobre el examen.
    if (modo) {
      r.modo = modo;
      if (modo === 'bg') {
        if (ok) { r.bg = (r.bg || 0) + 1; r.bgStreak = (r.bgStreak || 0) + 1; }
        else r.bgStreak = 0;
      } else if (modo === 'pista') {
        r.pistas = (r.pistas || 0) + 1;
        r.bgStreak = 0;
      }
    }

    if (timeSpentSec > 0) {
      r.timeSpent = (r.timeSpent||[]).concat(timeSpentSec).slice(-10);
      STATE.profile.avgTimePerQ = _calcAvgTime();
      STATE.profile.totalTime   = (STATE.profile.totalTime||0) + timeSpentSec;
      STATE.totalStudySec       = (STATE.totalStudySec||0) + timeSpentSec;
    }

    var freqBoost = getFreq(id) >= 30 ? 0 : getFreq(id) >= 15 ? 1 : 2;
    var iv = 1;
    if (ok) {
      r.c++; r.streak = (r.streak||0)+1;
      // dias DISTINTOS con acierto: es lo que hace que el dominio sea espaciado
      if (r.lastOkDay !== td) { r.cd = (r.cd||0)+1; r.lastOkDay = td; }
      STATE.hotStreak = (STATE.hotStreak||0)+1;
      if (confidence==='sure') {
        iv = r.streak>=4 ? Math.max(1,21-freqBoost) :
             r.streak>=3 ? Math.max(1,14-freqBoost) :
             r.streak>=2 ? Math.max(1,7-freqBoost)  : Math.max(1,4-freqBoost);
      } else if (confidence==='unsure') {
        iv = r.streak>=2 ? Math.max(1,7-freqBoost) : Math.max(1,3-freqBoost);
      } else {
        iv = Math.max(1,3-freqBoost);
      }
    } else {
      r.w++; r.streak=0;
      STATE.err[id] = (STATE.err[id]||0)+1;
      STATE.hotStreak = 0;
      iv = 1;
    }

    // Compresión por fecha de examen: cada pregunta debe caber ~3 repasos
    // antes del día D. Sin fecha configurada, intervalos normales.
    try {
      var _ed = localStorage.getItem('exam_date');
      if (_ed) {
        var _ex = new Date(_ed + 'T00:00:00');
        var _tdy = new Date(); _tdy.setHours(0,0,0,0);
        var _dLeft = Math.round((_ex - _tdy) / 86400000);
        if (_dLeft > 0) {
          iv = Math.min(iv, Math.max(1, Math.floor(_dLeft/3)));
          // Recta final: dos semanas antes, todo lo NO dominado se repasa a diario
          if (_dLeft <= 14 && !_dominada(r, STATE.conf[id])) iv = 1;
        }
      }
    } catch(e) {}

    r.iv = iv;
    var due = new Date(); due.setDate(due.getDate()+iv);
    r.due = due.toDateString();
    if (confidence) STATE.conf[id] = confidence;

    STATE.cal[td] = (STATE.cal[td]||0)+1;

    var y = new Date(); y.setDate(y.getDate()-1);
    if (STATE.lastDay !== td) {
      STATE.streak = STATE.lastDay===y.toDateString() ? STATE.streak+1 : 1;
      STATE.lastDay = td;
    }

    _checkAchievements();
    save();
  }

  // ─── DOMINIO: definicion unica para toda la app ───────────────────
  // Antes cada fichero usaba la suya (c>=3&&w===0 en unos sitios, c>=2&&w===0
  // en otros). Y w nunca se reseteaba, asi que un solo fallo bloqueaba la
  // pregunta para siempre y el Coach se quedaba clavado en Fase 1.
  // Ahora: 3 aciertos SEGUIDOS, en 2 dias distintos, sin marcarla como dificil
  // y respondiendo en menos de 25s la ultima vez.
  var DOM_RACHA = 3, DOM_DIAS = 2, DOM_SEG = 25;

  function _dominada(r, conf) {
    if (!r) return false;
    if ((r.streak||0) < DOM_RACHA) return false;
    if ((r.cd||0) < DOM_DIAS) return false;
    if (conf === 'doubt' || conf === 'unsure') return false;
    var ts = r.timeSpent || [];
    if (!ts.length) return false;
    return ts[ts.length-1] <= DOM_SEG;
  }

  function isDominated(id) {
    return _dominada(STATE.seen[id], STATE.conf[id]);
  }

  function countDominated(ids) {
    return (ids||[]).filter(function(id){ return isDominated(id); }).length;
  }

  // ─── Reset de progreso ────────────────────────────────────────────
  // Borra SOLO el estudio. Conserva contrasena, tema, tamano de letra,
  // clave de API y fecha de examen.
  function resetProgress() {
    try { localStorage.removeItem(VERSION); } catch(e) {}
    try {
      ['aipro8','aipro7','aipro6'].forEach(function(v){ localStorage.removeItem(v); });
    } catch(e) {}
    STATE = defaultState();
    saveNow();
    return true;
  }

  // ─── Confusiones: QUE respuesta elegiste mal ──────────────────────
  // Antes solo guardabamos un contador de fallos por pregunta. Ahora
  // guardamos la opcion concreta que elegiste, que es lo que permite
  // detectar el patron: "siempre confundes esta senal con esta otra".
  function recordWrongChoice(id, elegidas, correctas) {
    if (!id || !elegidas || !elegidas.length) return;
    if (!STATE.wrong) STATE.wrong = {};
    var w = STATE.wrong[id] || (STATE.wrong[id] = { opts: {}, ok: '' });
    w.ok = (correctas || []).join(' + ');
    elegidas.forEach(function(txt) {
      if (!txt) return;
      txt = String(txt).slice(0, 120);
      w.opts[txt] = (w.opts[txt] || 0) + 1;
    });
    save();
  }

  // Devuelve las confusiones REPETIDAS: misma opcion equivocada >= n veces
  function getConfusiones(minimo) {
    var min = minimo || 2, out = [];
    Object.keys(STATE.wrong || {}).forEach(function(id) {
      var w = STATE.wrong[id];
      Object.keys(w.opts || {}).forEach(function(txt) {
        if (w.opts[txt] >= min) out.push({ id: +id, elegida: txt, correcta: w.ok, veces: w.opts[txt] });
      });
    });
    return out.sort(function(a, b) { return b.veces - a.veces; });
  }

  // Cuantas veces has elegido ya esa misma opcion equivocada
  function vecesElegidaMal(id, txt) {
    var w = (STATE.wrong || {})[id];
    return (w && w.opts && w.opts[String(txt).slice(0, 120)]) || 0;
  }

  function recordExam(examData) {
    STATE.exams.push(examData);
    // NUEVO: guardar en historial de puntuaciones
    STATE.scoreHistory = (STATE.scoreHistory||[]).concat({
      date: new Date().toDateString(),
      pct: Math.round((examData.score||0)/(examData.max||1)*100),
      mode: examData.mode||'exam'
    }).slice(-30);
    if (STATE.exams.length>50) STATE.exams = STATE.exams.slice(-50);
    _checkAchievements();
    saveNow();
  }

  function recordRealExam(data) {
    STATE.realExams = (STATE.realExams||[]).concat(data);
    STATE.scoreHistory = (STATE.scoreHistory||[]).concat({
      date: new Date().toDateString(),
      pct: data.pct,
      mode: 'realexam'
    }).slice(-30);
    if (STATE.realExams.length>30) STATE.realExams = STATE.realExams.slice(-30);
    saveNow();
  }

  function recordSession(mode, questionsCount, durationSec) {
    STATE.sessions.push({
      date: new Date().toDateString(),
      hour: new Date().getHours(),
      mode: mode, questions: questionsCount, duration: durationSec
    });
    STATE.profile.sessionsCount = (STATE.profile.sessionsCount||0)+1;
    if (STATE.sessions.length>100) STATE.sessions = STATE.sessions.slice(-100);
    saveNow();
  }

  function markWordKnown(key, known) {
    if (!STATE.vocab[key]) STATE.vocab[key]={seen:0,known:false};
    STATE.vocab[key].known = known;
    STATE.vocab[key].lastSeen = new Date().toDateString();
    if (known) STATE.unknownWords = STATE.unknownWords.filter(function(w){return w!==key;});
    else if (STATE.unknownWords.indexOf(key)<0) STATE.unknownWords.push(key);
    save();
  }

  function seeWord(key) {
    if (!STATE.vocab[key]) STATE.vocab[key]={seen:0,known:false};
    STATE.vocab[key].seen++;
    STATE.vocab[key].lastSeen = new Date().toDateString();
    save();
  }

  // ─── Métricas ─────────────────────────────────────────────────────
  function getMetrics() {
    var now = new Date();
    var seenArr = Object.entries(STATE.seen||{});
    var total = (typeof ALL!=='undefined') ? ALL.length : 1487;

    var due       = seenArr.filter(function(e){ return new Date(e[1].due)<=now; }).length;
    var dominated = seenArr.filter(function(e){ return _dominada(e[1], STATE.conf[e[0]]); }).length;
    var dominatedBG = seenArr.filter(function(e){ return isDominatedBG(e[0]); }).length;
    var unsure    = Object.entries(STATE.conf||{}).filter(function(e){ return e[1]==='unsure'||e[1]==='doubt'; }).length;

    var exams     = (STATE.exams||[]).filter(function(e){ return e.max>0; });
    var avgScore  = exams.length ? Math.round(exams.reduce(function(s,e){return s+e.score/e.max*100;},0)/exams.length) : 0;
    var recentScores = exams.slice(-5).map(function(e){ return Math.round(e.score/e.max*100); });
    var trend     = recentScores.length>=2 ? recentScores[recentScores.length-1]-recentScores[0] : 0;

    var realExams    = STATE.realExams||[];
    var avgRealPts   = realExams.length ? Math.round(realExams.reduce(function(s,e){return s+(e.pct||0);},0)/realExams.length) : 0;
    var lastRealPts  = realExams.length ? realExams[realExams.length-1].pct : 0;
    var realPassed   = realExams.filter(function(e){return e.pass;}).length;

    var pct = Math.round(seenArr.length/total*100);

    var p3seen = (typeof PTS3!=='undefined') ? PTS3.filter(function(q){return STATE.seen[q.id];}).length : 0;
    var p3pct  = (typeof PTS3!=='undefined') ? Math.round(p3seen/PTS3.length*100) : 0;

    var freqSeen=0, freqTotal=0;
    if (typeof ALL!=='undefined') {
      ALL.filter(function(q){ return (q.f||0)>=10; }).forEach(function(q){
        freqTotal++;
        if (STATE.seen[q.id]) freqSeen++;
      });
    }
    var freqCoverage = freqTotal>0 ? Math.round(freqSeen/freqTotal*100) : 0;

    var avgTime = STATE.profile.avgTimePerQ||0;
    var slowQuestions = seenArr.filter(function(e){
      var ts=e[1].timeSpent||[];
      var avg=ts.length?ts.reduce(function(s,t){return s+t;},0)/ts.length:0;
      return avg>60;
    }).length;

    var totalHours = Math.round((STATE.totalStudySec||0)/3600*10)/10;

    // NUEVO: mejor hora del día
    var bestHour = null, bestRate = 0;
    Object.entries(STATE.hourStats||{}).forEach(function(e){
      if(e[1].total >= 5) {
        var rate = e[1].ok/e[1].total;
        if(rate > bestRate){ bestRate=rate; bestHour=+e[0]; }
      }
    });

    // NUEVO: detectar regresión (últimas 3 sesiones bajan)
    var sh = (STATE.scoreHistory||[]).slice(-6);
    var regression = false;
    if(sh.length >= 3) {
      var last3 = sh.slice(-3).map(function(s){return s.pct;});
      regression = last3[2] < last3[0] - 10;
    }

    return {
      total, seen: seenArr.length, dominated, dominatedBG, due, unsure,
      avgScore, trend, pct, p3pct, avgTime, slowQuestions,
      examsCount: exams.length, streak: STATE.streak,
      unknownWords: (STATE.unknownWords||[]).length,
      recentScores,
      avgRealPts, lastRealPts,
      realExamsCount: realExams.length, realPassed,
      freqCoverage, freqTotal,
      hotStreak: STATE.hotStreak||0,
      totalHours,
      bestHour,
      regression
    };
  }

  // ─── Estimacion de nivel ──────────────────────────────────────────
  // Cuantos de los 97 puntos sacarias HOY si te examinaras. No es una nota
  // de simulacro (que tiene mucho ruido): es la esperanza matematica sobre
  // TODO el banco, ponderando cada pregunta por sus puntos.
  // La probabilidad de acertar una que aun no has visto NO es un numero
  // inventado: es tu acierto real medido en primeras tentativas.
  function baseAcierto() {
    var f = STATE.firstTry || {ok:0,total:0};
    if (f.total < 30) return 0.5;          // sin datos suficientes, 50%
    return Math.max(0.2, Math.min(0.95, f.ok / f.total));
  }

  function pAcierto(id) {
    var r = STATE.seen[id];
    if (!r) return baseAcierto();
    if (_dominada(r, STATE.conf[id])) return 0.97;
    var st = r.streak || 0;
    if (st >= 2) return 0.90;
    if (st === 1) return 0.78;
    return 0.42;                            // vista y fallada la ultima vez
  }

  function getSkillEstimate(all) {
    var banco = all || (typeof ALL !== 'undefined' ? ALL : null);
    if (!banco || !banco.length) return null;
    var num = 0, den = 0;
    banco.forEach(function(q) {
      var pts = q.p || 1;
      den += pts;
      num += pts * pAcierto(q.id);
    });
    var frac = den ? num / den : 0;
    return {
      pct: Math.round(frac * 100),
      pts: Math.round(frac * 97),
      base: Math.round(baseAcierto() * 100),
      muestraBase: (STATE.firstTry || {}).total || 0
    };
  }

  // ─── Checkpoints semanales ────────────────────────────────────────
  function semanaDeEstudio() {
    var ini = (STATE.profile && STATE.profile.startDate) ? new Date(STATE.profile.startDate) : new Date();
    var dias = Math.floor((new Date() - ini) / 86400000);
    return Math.max(1, Math.floor(dias / 7) + 1);
  }

  function recordCheckpoint(datos) {
    STATE.checkpoints = (STATE.checkpoints || []).concat({
      fecha: new Date().toDateString(),
      ts: Date.now(),
      semana: semanaDeEstudio(),
      forma: datos.forma,
      pts: datos.pts,
      max: datos.max || 97,
      seg: datos.seg || 0,
      estimado: datos.estimado || null,
      fallos: (datos.fallos || []).slice(0, 60)
    }).slice(-30);
    saveNow();
  }

  function getCheckpoints() { return (STATE.checkpoints || []).slice(); }

  function tocaCheckpoint() {
    var c = STATE.checkpoints || [];
    if (!c.length) return (STATE.firstTry || {}).total >= 20;   // el primero, tras rodaje
    return (Date.now() - c[c.length-1].ts) >= 7 * 86400000;
  }

  // ─── Leyes estudiadas ─────────────────────────────────────────────
  // Una ley no se "estudia" una vez y ya está: se relee. Guardamos cuándo
  // la leíste por última vez y la damos por caducada a los 10 días, para
  // que vuelva a entrar en el plan.
  var CADUCA_LEY = 10 * 86400000;

  function marcarLeyLeida(id) {
    if (!STATE.leidas) STATE.leidas = {};
    STATE.leidas[id] = Date.now();
    save();
  }

  function leyLeida(id) {
    var ts = (STATE.leidas || {})[id];
    return !!ts && (Date.now() - ts) < CADUCA_LEY;
  }

  function diasDesdeLey(id) {
    var ts = (STATE.leidas || {})[id];
    if (!ts) return null;
    return Math.floor((Date.now() - ts) / 86400000);
  }

  // ─── NIVEL DE IDIOMA POR PREGUNTA ─────────────────────────────────
  // El destete es por pregunta, no global. Cada una sube sola cuando
  // demuestras que ya no necesitas la muleta en ESA pregunta.
  //   0 · BG + ES        primeras veces: hay que entender qué te preguntan
  //   1 · BG, ES a mano  la traducción existe pero hay que ir a buscarla
  //   2 · BG puro        como el examen
  var SUBE_A_1 = 2;   // aciertos con traducción para pasar a "ES a mano"
  var SUBE_A_2 = 2;   // aciertos en búlgaro puro para quedarse en BG puro

  function nivelIdioma(id) {
    var r = STATE.seen[id];
    if (!r) return 0;
    if ((r.bgStreak || 0) >= SUBE_A_2) return 2;
    if ((r.c || 0) >= SUBE_A_1) return 1;
    return 0;
  }

  // Dominada DE VERDAD: dominada por contenido Y confirmada en búlgaro puro.
  function isDominatedBG(id) {
    if (!isDominated(id)) return false;
    var r = STATE.seen[id];
    return !!r && (r.bgStreak || 0) >= SUBE_A_2;
  }

  function destete(all) {
    var banco = all || (typeof ALL !== 'undefined' ? ALL : []);
    var n = [0, 0, 0], domBG = 0, dom = 0, conPista = 0, vistas = 0;
    banco.forEach(function(q) {
      var r = STATE.seen[q.id];
      n[nivelIdioma(q.id)]++;
      if (!r) return;
      vistas++;
      if (isDominated(q.id)) dom++;
      if (isDominatedBG(q.id)) domBG++;
      if ((r.pistas || 0) > 0) conPista++;
    });
    return {
      total: banco.length, vistas: vistas,
      nivel0: n[0], nivel1: n[1], nivel2: n[2],
      dominadas: dom, dominadasBG: domBG,
      pctBG: dom ? Math.round(domBG / dom * 100) : 0,
      conPista: conPista
    };
  }

  // Las que ya dominas con muleta pero aún no has confirmado en búlgaro.
  // Es el motor del destete: material que ya sabes, ahora sin red.
  function colaDestete(all, limite) {
    var banco = all || (typeof ALL !== 'undefined' ? ALL : []);
    return banco.filter(function(q) {
      return isDominated(q.id) && !isDominatedBG(q.id);
    }).sort(function(a, b) {
      return (b.val || 0) - (a.val || 0);
    }).slice(0, limite || 20).map(function(q){ return q.id; });
  }

  // ─── RITMO REAL ───────────────────────────────────────────────────
  // Para saber si vas a llegar hace falta medir a qué velocidad DOMINAS,
  // no cuántas respondes. Guardamos una foto diaria del contador y de ahí
  // sale el ritmo de los últimos días. Sin al menos tres días de historia
  // no se puede proyectar nada, y así hay que decirlo.

  function _hoy() { return new Date().toISOString().slice(0, 10); }

  // Se llama una vez al día, al abrir la app o al cerrar una sesión.
  function fotoDelDia(all) {
    if (!STATE.hist) STATE.hist = {};
    var d = _hoy();
    var banco = all || (typeof ALL !== 'undefined' ? ALL : null);
    var dom = 0, vistas = Object.keys(STATE.seen || {}).length;
    if (banco) dom = banco.filter(function(q){ return isDominated(q.id); }).length;
    else dom = Object.keys(STATE.seen || {}).filter(isDominated).length;
    var dbg = banco ? banco.filter(function(q){ return isDominatedBG(q.id); }).length : 0;
    STATE.hist[d] = { dom: dom, vistas: vistas, domBG: dbg };
    // 120 días bastan para cualquier proyección
    var claves = Object.keys(STATE.hist).sort();
    while (claves.length > 120) { delete STATE.hist[claves.shift()]; }
    save();
    return STATE.hist[d];
  }

  // Dominadas nuevas por día en la ventana pedida. null si no hay historia.
  function ritmoDominio(dias) {
    var n = dias || 7;
    var h = STATE.hist || {};
    var claves = Object.keys(h).sort();
    if (claves.length < 3) return null;          // menos de 3 días: sin tendencia
    var hasta = claves[claves.length - 1];
    var lim = new Date(hasta); lim.setDate(lim.getDate() - n);
    var desde = claves.filter(function(k){ return new Date(k) >= lim; })[0] || claves[0];
    var d = (new Date(hasta) - new Date(desde)) / 86400000;
    if (d < 1) return null;
    return {
      porDia: Math.max(0, (h[hasta].dom - h[desde].dom) / d),
      dias: Math.round(d),
      muestras: claves.length
    };
  }

  // ─── TRANSFERENCIA ────────────────────────────────────────────────
  // 58 grupos del banco comparten enunciado y opciones palabra por palabra,
  // y en 37 de ellos la respuesta correcta CAMBIA porque cambia la imagen.
  // Eso permite medir algo que ninguna nota de simulacro mide: si sabes la
  // REGLA o solo has memorizado el texto. Si aciertas un miembro del grupo
  // y fallas su gemelo, no es despiste: estás respondiendo de memoria.

  function _acertada(id) {
    var r = STATE.seen[id];
    return !!r && (r.streak || 0) >= 1;
  }
  function _fallada(id) {
    var r = STATE.seen[id];
    return !!r && (r.streak || 0) === 0 && (r.w || 0) > 0;
  }

  function getGrupos() {
    return (typeof GRUPOS !== 'undefined') ? GRUPOS : [];
  }

  // Un grupo es INCOHERENTE si has acertado al menos uno y fallado al menos
  // otro. Es la firma de la memorizacion.
  function incoherencias(soloTrampa) {
    return getGrupos().filter(function(g) {
      if (soloTrampa && !g.trampa) return false;
      var ok = 0, ko = 0;
      g.ids.forEach(function(id) {
        if (_acertada(id)) ok++;
        else if (_fallada(id)) ko++;
      });
      return ok > 0 && ko > 0;
    });
  }

  // Indice de transferencia: de los grupos que has TOCADO entero, en cuantos
  // respondes bien a todos sus miembros. Es el porcentaje de reglas que de
  // verdad dominas, no de preguntas que recuerdas.
  function indiceTransferencia() {
    var tocados = 0, coherentes = 0, sueltas = 0;
    getGrupos().forEach(function(g) {
      var vistos = g.ids.filter(function(id){ return !!STATE.seen[id]; });
      if (vistos.length < 2) { if (vistos.length) sueltas++; return; }
      tocados++;
      var todosOk = g.ids.every(function(id){ return !STATE.seen[id] || _acertada(id); });
      if (todosOk) coherentes++;
    });
    return {
      grupos: getGrupos().length,
      tocados: tocados,
      coherentes: coherentes,
      pct: tocados ? Math.round(coherentes / tocados * 100) : null,
      aMedias: sueltas,
      incoherentes: incoherencias(false).length
    };
  }

  // Preguntas de los grupos incoherentes, agrupadas y en orden: primero el
  // grupo entero, despues el siguiente. Verlas seguidas es lo que ensena
  // que detalle mueve la respuesta.
  function colaPares(soloTrampa) {
    var out = [];
    incoherencias(soloTrampa).forEach(function(g){ out = out.concat(g.ids); });
    return out;
  }

  // ─── Plan diario: marcar bloques hechos ───────────────────────────
  function marcarBloque(idBloque) {
    var hoy = new Date().toDateString();
    if (!STATE.plan) STATE.plan = {};
    if (!STATE.plan[hoy]) STATE.plan[hoy] = {};
    STATE.plan[hoy][idBloque] = true;
    save();
  }

  function bloquesHechos() {
    var hoy = new Date().toDateString();
    return ((STATE.plan || {})[hoy]) || {};
  }

  // ─── Predictor ────────────────────────────────────────────────────
  function predictReadyDate() {
    var m = getMetrics();
    if (m.seen<30) return null;

    var recentCal = Object.entries(STATE.cal||{})
      .sort(function(a,b){return new Date(b[0])-new Date(a[0]);})
      .slice(0,7);
    var qPerDay = recentCal.length ?
      recentCal.reduce(function(s,e){return s+e[1];},0)/recentCal.length : 5;

    var scoreRef = m.realExamsCount>0 ? m.avgRealPts : m.avgScore;
    var scoreGap = Math.max(0, 90-scoreRef);
    var freqRemaining = Math.max(0, m.freqTotal - Math.round(m.freqTotal*m.freqCoverage/100));
    var daysForFreq  = qPerDay>0 ? Math.ceil(freqRemaining/qPerDay) : 999;
    var daysForScore = m.realExamsCount<2 ? 14 :
      scoreGap<=0 ? 0 : scoreGap<=5 ? 5 : scoreGap<=15 ? 14 : 28;
    var daysForVocab = Math.ceil((m.unknownWords||0)/10);

    var totalDays = Math.max(daysForFreq, daysForScore, daysForVocab);
    totalDays = Math.max(3, Math.min(totalDays, 90));

    var readyDate = new Date();
    readyDate.setDate(readyDate.getDate()+totalDays);

    var confidence = m.realExamsCount>=3&&m.avgRealPts>=85 ? 'alta' :
                     m.realExamsCount>=1 ? 'media' : 'baja';

    return {
      days: totalDays,
      date: readyDate.toLocaleDateString('es',{day:'numeric',month:'long',year:'numeric'}),
      qPerDay: Math.round(qPerDay),
      confidence,
      blockers: _getBlockers(m, daysForFreq, daysForScore, daysForVocab)
    };
  }

  function _getBlockers(m, df, ds, dv) {
    var b=[];
    if(df>ds&&df>dv) b.push('Preguntas frecuentes ('+m.freqCoverage+'% cubiertas)');
    if(ds>df&&ds>dv) b.push('Nota simulacros ('+Math.max(m.avgScore,m.avgRealPts)+'%, meta 90%)');
    if(dv>5) b.push('Vocabulario búlgaro ('+m.unknownWords+' palabras)');
    if(m.p3pct<60) b.push('Preguntas 3 pts ('+m.p3pct+'% cubiertas)');
    return b;
  }

  // ─── Achievements ─────────────────────────────────────────────────
  var ACHIEVEMENT_DEFS = [
    {id:'first_q',   label:'Primera pregunta',          icon:'🎯', check:function(m){return m.seen>=1;}},
    {id:'streak_3',  label:'3 días seguidos',            icon:'🔥', check:function(m){return m.streak>=3;}},
    {id:'streak_7',  label:'Semana completa',            icon:'💪', check:function(m){return m.streak>=7;}},
    {id:'streak_14', label:'2 semanas de racha',         icon:'⭐', check:function(m){return m.streak>=14;}},
    {id:'streak_30', label:'Un mes de estudio',          icon:'🏅', check:function(m){return m.streak>=30;}},
    {id:'dom_50',    label:'50 dominadas',               icon:'🏆', check:function(m){return m.dominated>=50;}},
    {id:'dom_200',   label:'200 dominadas',              icon:'🥇', check:function(m){return m.dominated>=200;}},
    {id:'dom_500',   label:'500 dominadas',              icon:'👑', check:function(m){return m.dominated>=500;}},
    {id:'first_pass',label:'Primer aprobado',            icon:'✅', check:function(m,s){return (s.exams||[]).some(function(e){return e.pass;})||(s.realExams||[]).some(function(e){return e.pass;});}},
    {id:'real_pass', label:'Simulacro Real aprobado',    icon:'🚗', check:function(m){return m.realPassed>=1;}},
    {id:'perfect',   label:'100% en simulacro',          icon:'💯', check:function(m,s){return (s.exams||[]).some(function(e){return e.score===e.max;});}},
    {id:'freq_50',   label:'50% frecuentes cubiertas',   icon:'📈', check:function(m){return m.freqCoverage>=50;}},
    {id:'freq_100',  label:'Frecuentes completas',       icon:'🔑', check:function(m){return m.freqCoverage>=100;}},
    {id:'hour_1',    label:'1h de estudio',              icon:'⏱️', check:function(m){return m.totalHours>=1;}},
    {id:'hour_10',   label:'10h de estudio',             icon:'📖', check:function(m){return m.totalHours>=10;}},
    {id:'hour_50',   label:'50h de estudio',             icon:'🎓', check:function(m){return m.totalHours>=50;}},
    {id:'hot_10',    label:'10 correctas seguidas',      icon:'🎪', check:function(m){return m.hotStreak>=10;}},
    {id:'hot_20',    label:'20 correctas seguidas',      icon:'🌟', check:function(m){return m.hotStreak>=20;}},
    {id:'speed',     label:'Menos de 30s/pregunta',      icon:'⚡', check:function(m){return m.avgTime>0&&m.avgTime<30;}},
    {id:'comeback',  label:'Superaste una regresión',    icon:'💪', check:function(m,s){
      var sh=s.scoreHistory||[];
      if(sh.length<4) return false;
      var prev=sh[sh.length-4].pct, low=sh[sh.length-3].pct, curr=sh[sh.length-1].pct;
      return low<prev-10 && curr>prev;
    }},
  ];

  function _checkAchievements() {
    var m = getMetrics();
    ACHIEVEMENT_DEFS.forEach(function(def) {
      if (!STATE.achievements[def.id] && def.check(m, STATE)) {
        STATE.achievements[def.id] = new Date().toDateString();
      }
    });
  }

  function getAchievements() {
    return ACHIEVEMENT_DEFS.map(function(def) {
      return {id:def.id, label:def.label, icon:def.icon, earned:STATE.achievements[def.id]||null};
    });
  }

  // ─── SRS ──────────────────────────────────────────────────────────
  // Puntuacion unica de urgencia. Combina lo que la app MIDE de ti
  // (errores, confianza, lentitud, vocabulario) con el valor estrategico
  // de la pregunta (fase y f x p). Antes existian dos colas: esta, que
  // usaba las senales de aprendizaje pero no se llamaba desde ningun sitio,
  // y la de AGENTS, que solo miraba fase y valor. Ahora es una sola.
  function srsScore(q) {
    var id = q.id;
    var s = 0;
    var err = STATE.err[id] || 0;
    var conf = STATE.conf[id];
    var r = STATE.seen[id];

    s += err * 4;                                   // fallar pesa mucho
    if (conf === 'doubt')  s += 10;                 // marcada dificil
    else if (conf === 'unsure') s += 7;             // insegura
    if (_hasUnknownVocab(q)) s += 5;                // vocabulario que no sabe
    s += getFreq(id) / 20;                          // frecuencia real
    if (getFreq(id) >= 30 && err) s += 10;          // frecuente Y fallada
    s += (q.val || 0) / 20;                         // valor estrategico f x p
    s += (4 - (q.fase || 4)) * 3;                   // fases bajas primero

    if (r) {                                        // lentitud
      var ts = r.timeSpent || [];
      if (ts.length) {
        var avg = ts.reduce(function(a,b){return a+b;},0) / ts.length;
        if (avg > 30) s += 4;
      }
      var atraso = Math.floor((new Date() - new Date(r.due)) / 86400000);
      if (atraso > 0) s += Math.min(atraso, 10);    // cuanto mas vencida, antes
    }
    return s;
  }

  function getSRSQueue(all, limite) {
    var now = new Date();
    var n = limite || 25;

    var due = all.filter(function(q){
      var r=STATE.seen[q.id];
      return r && new Date(r.due)<=now;
    }).sort(function(a,b){ return srsScore(b) - srsScore(a); });

    var unseen = all.filter(function(q){return !STATE.seen[q.id];})
      .sort(function(a,b){
        var fa=a.fase||4, fb=b.fase||4;
        if(fa!==fb) return fa-fb;
        return (b.val||0)-(a.val||0);
      })
      .slice(0, Math.max(0, n - Math.min(due.length, n-5)));

    return _shA(_interleave([].concat(due.slice(0, n-5), unseen))).slice(0, n);
  }

  function _hasUnknownVocab(q) {
    if(!q||!q.bg) return false;
    var words = q.bg.toLowerCase().split(/\s+/);
    return words.some(function(w){
      return (STATE.unknownWords||[]).indexOf(w.replace(/[^а-яёА-ЯЁ]/g,''))>=0;
    });
  }

  function _calcAvgTime() {
    var all=[];
    Object.values(STATE.seen||{}).forEach(function(r){(r.timeSpent||[]).forEach(function(t){all.push(t);});});
    return all.length ? Math.round(all.reduce(function(s,t){return s+t;},0)/all.length) : 0;
  }

  function _shA(qs) {
    return qs.map(function(q){
      return Object.assign({},q,{a:q.a?_shuffle([].concat(q.a)):q.a});
    });
  }

  // ─── Interleaving ─────────────────────────────────────────────────
  // Estudiar 40 preguntas seguidas de la misma seccion da sensacion de
  // dominio y poca retencion. Intercalar secciones distintas cuesta mas
  // en el momento y se recuerda bastante mejor. Reordena la lista para
  // que dos preguntas seguidas no compartan seccion siempre que se pueda.
  function _interleave(qs) {
    if (!qs || qs.length < 3) return qs || [];
    var grupos = {};
    qs.forEach(function(q) {
      var k = String(q.s || '?').slice(0, 12);
      (grupos[k] = grupos[k] || []).push(q);
    });
    var claves = Object.keys(grupos);
    if (claves.length < 2) return qs;
    var out = [], ultima = null, restantes = qs.length;
    while (restantes > 0) {
      // coge de la seccion mas llena que no sea la ultima usada
      var mejor = null;
      claves.forEach(function(k) {
        if (!grupos[k].length) return;
        if (k === ultima && claves.filter(function(x){return grupos[x].length;}).length > 1) return;
        if (!mejor || grupos[k].length > grupos[mejor].length) mejor = k;
      });
      if (!mejor) break;
      out.push(grupos[mejor].shift());
      ultima = mejor; restantes--;
    }
    return out;
  }

  function _shuffle(a) {
    var b=[].concat(a);
    for(var i=b.length-1;i>0;i--){
      var j=Math.floor(Math.random()*(i+1));
      var t=b[i]; b[i]=b[j]; b[j]=t;
    }
    return b;
  }

  return {
    get: function(){ return STATE; },
    save,
    initFreq, getFreq, getProb, getHeatIcon,
    recordAnswer, recordExam, recordRealExam, recordSession,
    markWordKnown, seeWord,
    getMetrics, predictReadyDate,
    getSRSQueue, srsScore, getAchievements,
    isDominated, countDominated, resetProgress,
    recordWrongChoice, getConfusiones, vecesElegidaMal,
    getSkillEstimate, baseAcierto, pAcierto,
    semanaDeEstudio, recordCheckpoint, getCheckpoints, tocaCheckpoint,
    marcarBloque, bloquesHechos,
    marcarLeyLeida, leyLeida, diasDesdeLey,
    getGrupos, incoherencias, indiceTransferencia, colaPares,
    fotoDelDia, ritmoDominio,
    nivelIdioma, isDominatedBG, destete, colaDestete,
    saveNow, flush: saveNow, statsEscritura,
    interleave: _interleave,
    shuffle: _shuffle, shA: _shA,
    VERSION
  };

})();
