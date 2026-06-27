// ═══════════════════════════════════════════════════════════════════
// AGENTS.JS v6.0 — Plan Máxima Puntuación / Mínimo Tiempo
// Basado en 10.000 tests reales del plan 237 (±1% margen)
//
// OBJETIVO: 97/97 pts, terminar en <20 minutos
//
// FASES DE ENTRENAMIENTO (orden por ROI):
//   F1: 8 preguntas casi-seguras (>20% freq) → dominar PRIMERO
//   F2: 20 videos críticos (3pt, 5-11% freq) → ahorran tiempo en examen
//   F3: 360 preguntas de 3pt frecuentes → 47 pts esperados
//   F4: resto del banco → completar cobertura
//
// TOP 15 VIDEOS por frecuencia real (plan 237, 666 tests):
//   vid 61(11%) 58(11%) 48(10%) 46(9%) 51(9%) 52(9%) 53(9%)
//   45(8%) 47(7%) 49(7%) 50(7%) 17(5%) 59(5%) 62(5%) 55(4%)
// ═══════════════════════════════════════════════════════════════════

var AGENTS = (function() {

  // Distribución real del examen (confirmada con 10000 tests)
  var DIST_REAL = {1:1, 2:4, 3:7, 4:22, 5:3, 6:3};

  // Videos ordenados por frecuencia REAL (plan 237, 666 tests)
  var TOP_VIDS = [61,58,48,46,51,52,53,45,47,49,50,17,59,62,55,10,16,60,57,56];

  // IDs de las 8 preguntas CASI SEGURAS (>20% de tests)
  var IDS_FASE1 = [6325,6327,11733,5658,6034,5428,6326,11734];

  // Nombres de fases para el Coach
  var FASE_INFO = {
    1: {n:'Casi Seguras', desc:'8 preg >20% freq — salen 1 de cada 4 tests', emoji:'🎯'},
    2: {n:'Videos Críticos', desc:'20 videos 3pt — ahorran 2 min en examen', emoji:'🎬'},
    3: {n:'3 Puntos',  desc:'360 preg 3pt >3% freq — el 47% de los pts', emoji:'💎'},
    4: {n:'Banco Completo', desc:'resto del banco para cobertura total', emoji:'📚'},
  };

  // ─── AGENTE 1: Coach Máxima Puntuación ───────────────────────────
  function runCoach(onResult) {
    var m = BRAIN.getMetrics();
    var s = BRAIN.get();
    var prediction = BRAIN.predictReadyDate();
    var patterns = detectPatterns();
    var msg='', acts=[], urgency='normal';

    var h = new Date().getHours();
    var saludo;
    if(h<6) saludo='Madrugador';
    else if(h<12) saludo='Buenos días';
    else if(h<19) saludo='Buenas tardes';
    else saludo='Buenas noches';

    // Detectar fase actual del usuario
    var fase = _detectarFaseActual(s);

    // ALERTA REGRESIÓN — máxima prioridad
    if (m.regression) {
      urgency='high';
      msg='📉 Bajada detectada en últimas sesiones. SRS urgente ahora — recuperas en 15 min.';
      acts=[{t:'🔄 SRS Urgente', fn:"mod('srs')"},{t:'🎯 Fase '+fase, fn:"mod('fase"+fase+"')"}];

    } else if (m.due >= 10) {
      urgency='high';
      msg='⏰ '+m.due+' repasos SRS. La neurociencia: repasar HOY vale 3× más que mañana.';
      acts=[{t:'🔄 SRS ('+m.due+')', fn:"mod('srs')"},{t:'📋 Examen Seco', fn:"mod('examdry')"}];

    } else if (!m.seen) {
      // Primera vez
      urgency='high';
      msg=saludo+'! Meta: 97/97 pts, terminar en <20 min. '+
        'Empezamos por las 8 preguntas casi-seguras — salen en 1 de cada 4 exámenes. '+
        'Son señales (R3). 5 minutos hoy las cambia todo.';
      acts=[{t:'🎯 F1: 8 Casi-Seguras', fn:"mod('fase1')"},{t:'📋 Simulacro Real', fn:"mod('realexam')"}];

    } else if (fase === 1) {
      // Estudiando F1
      var f1done = IDS_FASE1.filter(function(id){ var r=s.seen[id]; return r&&r.c>=3&&r.w===0; }).length;
      if(f1done < IDS_FASE1.length) {
        msg='🎯 Fase 1 en progreso: '+f1done+'/8 casi-seguras dominadas. '+
          'Cada una que dominas vale 2pt garantizados en el examen. Quedan '+(IDS_FASE1.length-f1done)+'.';
        acts=[{t:'🎯 F1: Casi-Seguras', fn:"mod('fase1')"},{t:'🎬 F2: Videos', fn:"mod('videocrit')"}];
      } else {
        urgency='normal';
        msg='✅ F1 completada — las 8 casi-seguras dominadas (+4pts seguros). '+
          'Ahora los 20 videos críticos. Son 3pts cada uno y ahorran 2 minutos en el examen real.';
        acts=[{t:'🎬 F2: Videos Críticos', fn:"mod('videocrit')"},{t:'💎 F3: 3 Puntos', fn:"mod('pts3')"}];
      }

    } else if (fase === 2) {
      var vidsDone = _countVideoDominados(s);
      msg='🎬 Fase 2 — Videos: '+vidsDone+'/20 dominados. '+
        'Los videos son 3pt y aparecen SIEMPRE exactamente 2 en el examen. '+
        'Si los dominas, resuelves cada video en 5s en lugar de 60s.';
      acts=[{t:'🎬 Videos Críticos', fn:"mod('videocrit')"},{t:'🎯 Fase 1 repaso', fn:"mod('fase1')"}];

    } else if (fase === 3) {
      var pts3done = _countPts3Dominados(s);
      var pts3pct = m.p3pct;
      msg='💎 Fase 3 — '+pts3done+' preg de 3pt dominadas ('+pts3pct+'%). '+
        'Son el 47% de los puntos del examen. '+
        'Con 360 dominadas tienes 53/97 pts seguros.';
      acts=[{t:'💎 3 Puntos SRS', fn:"mod('pts3')"},{t:'📋 Simulacro Real', fn:"mod('realexam')"}];

    } else if (m.avgRealPts > 0 && m.avgRealPts < 90) {
      urgency='medium';
      var gap = 90 - m.avgRealPts;
      msg='📊 Simulacros: '+m.avgRealPts+'% media. Faltan '+gap+'pts para el 90% estable. '+
        'Sección más débil: '+(patterns.worstSection?'R'+patterns.worstSection:'en análisis')+'. '+
        'Examen seco esta semana para medir tiempo real.';
      acts=[{t:'📋 Examen Seco', fn:"mod('examdry')"},{t:'🧠 Adaptativo', fn:"mod('adaptive')"}];

    } else if (m.avgRealPts >= 90) {
      msg='🏆 '+m.avgRealPts+'% media en simulacros. '+
        '¿Terminas en menos de 20 minutos? Cronometra el próximo examen seco.';
      acts=[{t:'📋 Examen Seco Cronometrado', fn:"mod('examdry')"},{t:'⚡ Última Hora', fn:"mod('ultimahora')"}];

    } else {
      msg=saludo+'! '+_getTip()+' Hoy: '+FASE_INFO[fase].emoji+' '+FASE_INFO[fase].n+'.';
      acts=[{t:FASE_INFO[fase].emoji+' '+FASE_INFO[fase].n, fn:"mod('fase"+fase+"')"},{t:'📋 Simulacro', fn:"mod('realexam')"}];
    }

    if (m.hotStreak >= 5) msg='🔥 '+m.hotStreak+' seguidas! '+msg;
    if (prediction && m.seen>=50) msg+=' [📅 Listo: '+prediction.date+']';

    onResult({msg, acts, urgency, prediction, fase});
  }

  // ─── Detectar fase actual ─────────────────────────────────────────
  function _detectarFaseActual(s) {
    // F1: ¿tiene las 8 casi-seguras dominadas?
    var f1done = IDS_FASE1.filter(function(id){
      var r=(s.seen||{})[id]; return r&&r.c>=3&&r.w===0;
    }).length;
    if(f1done < IDS_FASE1.length) return 1;

    // F2: ¿tiene los videos críticos dominados?
    var vidsDone = _countVideoDominados(s);
    if(vidsDone < 15) return 2;

    // F3: ¿tiene el 60%+ de preguntas 3pt dominadas?
    var pts3done = _countPts3Dominados(s);
    if(pts3done < 200) return 3;

    return 4;
  }

  function _countVideoDominados(s) {
    if(typeof VIDS === 'undefined') return 0;
    return (VIDS||[]).filter(function(q){
      var r=(s.seen||{})[q.id]; return r&&r.c>=3&&r.w===0;
    }).length;
  }

  function _countPts3Dominados(s) {
    if(typeof PTS3 === 'undefined') return 0;
    return (PTS3||[]).filter(function(q){
      var r=(s.seen||{})[q.id]; return r&&r.c>=2&&r.w===0;
    }).length;
  }

  var TIPS = [
    'Las señales de R3 dominan el examen (17-19 de 45 preguntas). Domínalas y tienes el 40% ganado.',
    'Para terminar en 20 min: no leas respuestas que ya sabes. Reconocimiento instantáneo = velocidad.',
    'Los videos siempre son 2 en el examen. Si los dominas, son 6pts rápidos y seguros.',
    'Técnica de velocidad: en el examen real, responde primero las que sabes al 100%. Deja las dudosas para el final.',
    'Los 8 IDs casi-seguros salen en 1 de cada 4 exámenes. Falarlos es perder 16pts de golpe.',
    'R4 (Normas) tiene 22 preguntas por test — el bloque más grande. 1 hora en R4 = +22pts potenciales.',
    'Examen seco cronometrado 2x por semana: el único way de entrenar la velocidad real.',
    'Las multirespuesta: selecciona la 1ª, PAUSA, busca la 2ª antes de confirmar.',
  ];
  function _getTip() { return TIPS[new Date().getDay()%TIPS.length]; }

  // ─── AGENTE 2: SRS con pesos reales ──────────────────────────────
  function getSRSQueue(all) {
    var s = BRAIN.get();
    var now = new Date();

    // Prioridad: fase1 > fase2 > fase3 > fase4, dentro de cada fase por due date
    var due = all.filter(function(q){
      var r=s.seen[q.id]; return r && new Date(r.due)<=now;
    }).sort(function(a,b){
      var fa=a.fase||4, fb=b.fase||4;
      if(fa!==fb) return fa-fb; // fase más baja = más urgente
      // Dentro de la misma fase: por valor estratégico
      var va=a.val||0, vb=b.val||0;
      return vb-va;
    });

    var unseen = all.filter(function(q){return !s.seen[q.id];})
      .sort(function(a,b){
        var fa=a.fase||4, fb=b.fase||4;
        if(fa!==fb) return fa-fb;
        return (b.val||0)-(a.val||0);
      }).slice(0, Math.max(0,25-due.length));

    return _shA([].concat(due.slice(0,20),unseen)).slice(0,25);
  }

  // ─── AGENTE 3: Modo Fase 1 — Las 8 Casi-Seguras ─────────────────
  function buildFase1(all) {
    var f1 = all.filter(function(q){ return IDS_FASE1.indexOf(q.id)>=0; });
    if(!f1.length) f1 = all.filter(function(q){return q.fase===1;}).slice(0,8);
    return _shA(f1);
  }

  // ─── AGENTE 4: Simulacro Real con pesos reales ───────────────────
  function buildRealExam(all, vids) {
    var s = BRAIN.get();
    var byS={1:[],2:[],3:[],4:[],5:[],6:[],mrest:[]};

    all.forEach(function(q){
      if(q.v||q.rta_v) return;
      var m2=(q.s||'').match(/[0-9]/); var sec=m2?+m2[0]:0;
      if(sec>=1&&sec<=6) byS[sec].push(q); else byS.mrest.push(q);
    });

    function scoreQ(q) {
      var r=(s.seen||{})[q.id];
      // Score = valor estratégico + penalización si dominada + boost si fallada
      var score = q.val || BRAIN.getFreq(q.id)*q.p||0;
      if(r) {
        var er=r.w/(r.c+r.w+0.1);
        score += er*30;
        if(r.c>=3&&er<0.05) score -= 15; // dominada, reduce prioridad
        if((s.conf||{})[q.id]==='unsure') score += 10;
      } else {
        score += 20; // no vista aún
      }
      return score;
    }

    var out=[];
    Object.keys(DIST_REAL).forEach(function(sec){
      var pool=(byS[sec]||[]).sort(function(a,b){return scoreQ(b)-scoreQ(a);});
      out=out.concat(BRAIN.shuffle(pool.slice(0,DIST_REAL[sec]*3)).slice(0,DIST_REAL[sec]));
    });

    // Completar con MREST priorizando por valor
    var mrestPool=byS.mrest.sort(function(a,b){return scoreQ(b)-scoreQ(a);});
    out=out.concat(BRAIN.shuffle(mrestPool.slice(0,9)).slice(0,3));

    // Videos por frecuencia real
    var vidPool=(vids||[]).filter(function(q){return !out.find(function(o){return o.id===q.id;});})
      .sort(function(a,b){
        var ia=TOP_VIDS.indexOf(a.v||0), ib=TOP_VIDS.indexOf(b.v||0);
        return (ia<0?99:ia)-(ib<0?99:ib);
      });
    out=out.concat(BRAIN.shuffle(vidPool.slice(0,6)).slice(0,2));

    while(out.length>45) out.pop();
    while(out.length<45&&mrestPool.length){
      var e=mrestPool.shift();
      if(!out.find(function(o){return o.id===e.id;})) out.push(e);
    }
    return _shA(BRAIN.shuffle(out));
  }

  // ─── AGENTE 5: Adaptativo con Interleaving ────────────────────────
  function buildAdaptive(all, vids) {
    var s = BRAIN.get();
    var now = new Date();

    var scored = all.map(function(q){
      var r=(s.seen||{})[q.id];
      var score = (q.val||0) * 0.5; // base por valor estratégico real

      if(!r) {
        score += 15 + (q.val||0)*0.3;
      } else {
        var er=r.w/(r.c+r.w+0.1);
        score += er*35 + (new Date(r.due)<=now?8:0);
        if(r.c>=3&&er<0.05) score -= 10;
      }

      if((s.conf||{})[q.id]==='unsure'||(s.conf||{})[q.id]==='doubt') score += 12;
      // Boost por fase (F1 siempre prioritaria)
      var fase = q.fase||4;
      score += (5-fase)*5;

      return {q, score, sec: +((q.s||'').match(/[0-9]/)||[4])[0]};
    }).sort(function(a,b){return b.score-a.score;});

    // Interleaving: mezclar secciones
    var bySec={};
    scored.forEach(function(x){
      if(!bySec[x.sec]) bySec[x.sec]=[];
      bySec[x.sec].push(x.q);
    });
    var secs=Object.keys(bySec).sort(function(a,b){return (bySec[b]||[]).length-(bySec[a]||[]).length;});
    var result=[];
    for(var round=0;round<45;round++){
      var added=false;
      for(var i=0;i<secs.length;i++){
        if(bySec[secs[i]]&&bySec[secs[i]].length>0){
          result.push(bySec[secs[i]].shift());
          added=true; if(result.length>=40) break;
        }
      }
      if(!added||result.length>=40) break;
    }
    // Añadir videos top
    var topVids=(vids||[]).sort(function(a,b){
      var ia=TOP_VIDS.indexOf(a.v||0),ib=TOP_VIDS.indexOf(b.v||0);
      return (ia<0?99:ia)-(ib<0?99:ib);
    });
    return _shA(result.concat(BRAIN.shuffle(topVids).slice(0,Math.max(0,45-result.length))));
  }

  // ─── AGENTE 6: Última Hora ────────────────────────────────────────
  function buildUltimaHora(all, vids, n) {
    n=n||45;
    var s=BRAIN.get();
    var scored=all.map(function(q){
      var freq=BRAIN.getFreq(q.id);
      if(freq<2) return null;
      var r=(s.seen||{})[q.id];
      var score=freq + (q.val||0)*0.3;
      if(!r) score+=25;
      else {
        var er=r.w/(r.c+r.w+0.1);
        score+=er*20;
        if(r.c>=3&&er<0.05) score-=20;
        if((s.conf||{})[q.id]==='sure'&&r.c>=2) score-=15;
      }
      // F1 siempre en Última Hora
      if(IDS_FASE1.indexOf(q.id)>=0) score+=50;
      return {q,score};
    }).filter(Boolean).sort(function(a,b){return b.score-a.score;});

    var out=scored.slice(0,n).map(function(x){return x.q;});
    // Siempre incluir top 5 videos
    var topVids5=(vids||[]).sort(function(a,b){
      var ia=TOP_VIDS.indexOf(a.v||0),ib=TOP_VIDS.indexOf(b.v||0);
      return (ia<0?99:ia)-(ib<0?99:ib);
    }).slice(0,5);
    topVids5.forEach(function(v){
      if(!out.find(function(o){return o.id===v.id;})) out.push(v);
    });
    return _shA(out);
  }

  // ─── Builders de soporte ─────────────────────────────────────────
  function buildFlash(all) {
    var s=BRAIN.get();
    // Los 5 con mayor valor estratégico no dominados
    return _shA(all.filter(function(q){return BRAIN.getFreq(q.id)>=10;})
      .map(function(q){
        var r=(s.seen||{})[q.id];
        var score=(q.val||0)*2;
        if(!r) score+=30;
        else {var er=r.w/(r.c+r.w+0.1);score+=er*20;}
        if(IDS_FASE1.indexOf(q.id)>=0) score+=50;
        return {q,score};
      }).sort(function(a,b){return b.score-a.score;}).slice(0,5).map(function(x){return x.q;}));
  }

  function buildVideoCrit(vids) {
    if(!vids||!vids.length) return [];
    return _shA([].concat(vids).sort(function(a,b){
      var ia=TOP_VIDS.indexOf(a.v||0),ib=TOP_VIDS.indexOf(b.v||0);
      return (ia<0?99:ia)-(ib<0?99:ib);
    }));
  }

  function buildCorrectiveFeedback(all, failedIds) {
    // Ordenar falladas por valor estratégico
    return _shA(all.filter(function(q){return failedIds.indexOf(q.id)>=0;})
      .sort(function(a,b){return (b.val||0)-(a.val||0);}));
  }

  function buildExamFrom(pool, vids, useDist) {
    var dist=useDist||DIST_REAL;
    var byS={};
    pool.forEach(function(q){var s=+((q.s||'').match(/[0-9]/)||[4])[0];if(!byS[s])byS[s]=[];byS[s].push(q);});
    var out=[];
    [1,2,3,4,5,6].forEach(function(s){out=out.concat(BRAIN.shuffle(byS[s]||[]).slice(0,dist[s]));});
    var v2=(vids||[]).filter(function(q){return !out.find(function(o){return o.id===q.id;});});
    return BRAIN.shuffle(out.concat(BRAIN.shuffle(v2).slice(0,Math.max(0,45-out.length)))).slice(0,45);
  }

  // ─── Análisis completo ────────────────────────────────────────────
  function detectPatterns() {
    var s=BRAIN.get();
    var seenArr=Object.entries(s.seen||{});
    var mS=0,mE=0,tS=0,tE=0,vS=0,vE=0,secS={},secE={};
    seenArr.forEach(function(e){
      var q=(typeof ALL_MAP!=='undefined')?ALL_MAP[+e[0]]:null; if(!q) return;
      var nc=(q.a||[]).filter(function(a){return a.ok;}).length;
      if(nc>1){mS++;if(s.err[e[0]])mE++;}
      if((q.sim||0)>0.5){tS++;if(s.err[e[0]])tE++;}
      if(q.v){vS++;if(s.err[e[0]])vE++;}
      var m2=(q.s||'').match(/[0-9]/);var sec=m2?+m2[0]:4;
      secS[sec]=(secS[sec]||0)+1; if(s.err[e[0]])secE[sec]=(secE[sec]||0)+1;
    });
    var worstSection=null,worstRate=0;
    Object.keys(secS).forEach(function(sec){
      if(secS[sec]<5) return;
      var er=(secE[sec]||0)/secS[sec];
      if(er>worstRate){worstRate=er;worstSection=+sec;}
    });
    return {
      multiErrorRate:mS>5?mE/mS:0, trapErrorRate:tS>5?tE/tS:0,
      videoErrorRate:vS>3?vE/vS:0, worstSection, worstSectionRate:worstRate,
      secStats:{s:secS,e:secE}
    };
  }

  function getFullAnalysis(all) {
    var s=BRAIN.get(), m=BRAIN.getMetrics(), patterns=detectPatterns();
    var prediction=BRAIN.predictReadyDate();
    var insights=[], seenArr=Object.entries(s.seen||{});
    if(seenArr.length<5) return {ready:false};

    var fase=_detectarFaseActual(s);

    // Estado de la fase actual
    insights.push({c:'i',
      t:'🎯 Fase actual: F'+fase+' — '+FASE_INFO[fase].n,
      b:FASE_INFO[fase].desc
    });

    // F1: casi-seguras
    var f1done=IDS_FASE1.filter(function(id){var r=(s.seen||{})[id];return r&&r.c>=3&&r.w===0;}).length;
    insights.push({c:f1done===8?'g':f1done>=4?'w':'b',
      t:'F1 Casi-Seguras: '+f1done+'/8 dominadas',
      b:'Salen en 1 de cada 4 tests. Cada una = 2pts casi garantizados. IDs: '+IDS_FASE1.join(', ')
    });

    // F2: videos
    var vidsDone=_countVideoDominados(s);
    var totalVids=typeof VIDS!=='undefined'?VIDS.length:56;
    insights.push({c:vidsDone>=15?'g':vidsDone>=8?'w':'b',
      t:'F2 Videos: '+vidsDone+'/'+totalVids+' dominados',
      b:'Siempre exactamente 2 en el examen, 3pts cada uno. Dominarlos = 6pts seguros + 2min ahorrados.'
    });

    // F3: 3pt
    insights.push({c:m.p3pct>=80?'g':m.p3pct>=50?'w':'b',
      t:'F3 Tres Puntos: '+m.p3pct+'% dominadas',
      b:'37% de los puntos del examen. Con 360 preg de 3pt dominadas → 53/97 pts esperados.'
    });

    // Velocidad
    if(m.avgTime>0){
      insights.push({c:m.avgTime<25?'g':m.avgTime<40?'w':'b',
        t:'Velocidad: '+Math.round(m.avgTime)+'s/preg',
        b:'Meta: <27s/preg para terminar en 20 min. '+
          (m.avgTime>40?'Demasiado lento — practica reconocimiento instantáneo en F1 y videos.':
           m.avgTime<25?'¡Excelente velocidad! Mantén la precisión.':'Buen ritmo.')
      });
    }

    // Simulacros
    if(m.realExamsCount>0){
      var diff=m.avgRealPts-87;
      insights.push({c:m.avgRealPts>=90?'g':m.avgRealPts>=87?'w':'b',
        t:'Simulacros: '+m.avgRealPts+'% media ('+m.realPassed+'/'+m.realExamsCount+' aprobados)',
        b:diff>=0?'Aprobando. Meta final: 95%+ estable antes del КАТ real.':
          'Faltan '+(87-m.avgRealPts)+'% para aprobado. F3 es la clave — más preg de 3pt.'
      });
    }

    if(m.regression){
      insights.push({c:'b',t:'📉 Regresión detectada',
        b:'Tu nota bajó en las últimas sesiones. SRS inmediato para recuperar.'});
    }

    var sN={1:'Vehículo',2:'Vías',3:'Señales',4:'Normas',5:'Factores',6:'Obligaciones'};
    var sReal={1:1,2:4,3:7,4:22,5:3,6:3};
    var ss=patterns.secStats;
    [1,2,3,4,5,6].forEach(function(sec){
      var n=ss.s[sec]||0; if(n<5) return;
      var er=Math.round((ss.e[sec]||0)/n*100);
      if(er>35) insights.push({c:'b',
        t:'R'+sec+' ('+sN[sec]+'): '+er+'% error',
        b:'Salen '+sReal[sec]+'x por test. Esta sección te está costando puntos.'
      });
    });

    return {ready:true,insights,prediction,metrics:m,patterns,fase,
      f1done,vidsDone,topErrors:Object.entries(s.err||{})
        .sort(function(a,b){return b[1]-a[1];}).slice(0,5)
        .map(function(e){var q=(typeof ALL_MAP!=='undefined')?ALL_MAP[+e[0]]:null;
          return {id:+e[0],n:e[1],es:q?(q.es||'').substring(0,60):'?',
            val:q?q.val:0,freq:BRAIN.getFreq(+e[0])};})
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────
  function _shA(qs) {
    return qs.map(function(q){
      return Object.assign({},q,{a:q.a?BRAIN.shuffle([].concat(q.a)):q.a});
    });
  }

  return {
    runCoach, getSRSQueue, buildFase1,
    buildRealExam, buildAdaptive, buildUltimaHora,
    buildFlash, buildVideoCrit, buildCorrectiveFeedback, buildExamFrom,
    detectPatterns, getFullAnalysis,
    IDS_FASE1, TOP_VIDS, DIST_REAL, FASE_INFO
  };

})();
