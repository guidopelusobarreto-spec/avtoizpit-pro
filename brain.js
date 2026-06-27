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
      return s || defaultState();
    } catch(e) { return defaultState(); }
  }

  function defaultState() {
    return {
      seen: {}, err: {}, conf: {}, vocab: {},
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

  function save() {
    try { localStorage.setItem(VERSION, JSON.stringify(STATE)); } catch(e) {}
  }

  // ─── Frecuencias reales ───────────────────────────────────────────
  var FREQ_REAL = {};

  function initFreq(all) {
    all.forEach(function(q) { if (q.f) FREQ_REAL[q.id] = q.f; });
  }

  function getFreq(id) { return FREQ_REAL[id] || 0; }

  // NUEVO: Probabilidad de aparecer en el examen real (0-100)
  function getProb(id) {
    var f = getFreq(id);
    if (f >= 50) return 99;
    if (f >= 30) return Math.round(f/200*100*2);
    if (f >= 15) return Math.round(f/200*100*1.5);
    if (f >= 5)  return Math.round(f/200*100);
    return Math.round(f/200*100);
  }

  // Icono de calor por probabilidad
  function getHeatIcon(id) {
    var p = getProb(id);
    if (p >= 25) return '🔥🔥';
    if (p >= 15) return '🔥';
    if (p >= 8)  return '⚡';
    if (p >= 3)  return '📍';
    return '';
  }

  // ─── Registrar respuesta ──────────────────────────────────────────
  function recordAnswer(id, ok, confidence, timeSpentSec) {
    var td = new Date().toDateString();
    var h  = new Date().getHours();

    if (!STATE.seen[id]) STATE.seen[id] = {c:0,w:0,iv:1,due:td,streak:0,timeSpent:[]};
    var r = STATE.seen[id];
    r.last = td;

    // Stats por hora
    if (!STATE.hourStats[h]) STATE.hourStats[h] = {ok:0,total:0};
    STATE.hourStats[h].total++;
    if (ok) STATE.hourStats[h].ok++;

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
    save();
  }

  function recordRealExam(data) {
    STATE.realExams = (STATE.realExams||[]).concat(data);
    STATE.scoreHistory = (STATE.scoreHistory||[]).concat({
      date: new Date().toDateString(),
      pct: data.pct,
      mode: 'realexam'
    }).slice(-30);
    if (STATE.realExams.length>30) STATE.realExams = STATE.realExams.slice(-30);
    save();
  }

  function recordSession(mode, questionsCount, durationSec) {
    STATE.sessions.push({
      date: new Date().toDateString(),
      hour: new Date().getHours(),
      mode: mode, questions: questionsCount, duration: durationSec
    });
    STATE.profile.sessionsCount = (STATE.profile.sessionsCount||0)+1;
    if (STATE.sessions.length>100) STATE.sessions = STATE.sessions.slice(-100);
    save();
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
    var dominated = seenArr.filter(function(e){ return e[1].c>=3&&e[1].w===0; }).length;
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
      total, seen: seenArr.length, dominated, due, unsure,
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
  function getSRSQueue(all) {
    var now = new Date();
    var due = all.filter(function(q){
      var r=STATE.seen[q.id];
      return r && new Date(r.due)<=now;
    }).sort(function(a,b){
      var sa=(STATE.err[a.id]||0)*4 + getFreq(a.id)/20;
      var sb=(STATE.err[b.id]||0)*4 + getFreq(b.id)/20;
      if(STATE.conf[a.id]==='unsure'||STATE.conf[a.id]==='doubt') sa+=8;
      if(STATE.conf[b.id]==='unsure'||STATE.conf[b.id]==='doubt') sb+=8;
      if(_hasUnknownVocab(a)) sa+=5;
      if(_hasUnknownVocab(b)) sb+=5;
      if(getFreq(a.id)>=30&&STATE.err[a.id]) sa+=10;
      if(getFreq(b.id)>=30&&STATE.err[b.id]) sb+=10;
      return sb-sa;
    });

    var unseen = all.filter(function(q){return !STATE.seen[q.id];})
      .sort(function(a,b){return getFreq(b.id)-getFreq(a.id);})
      .slice(0, Math.max(0,20-due.length));

    return _shA([].concat(due.slice(0,15),unseen)).slice(0,20);
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
    getSRSQueue, getAchievements,
    shuffle: _shuffle, shA: _shA,
    VERSION
  };

})();
