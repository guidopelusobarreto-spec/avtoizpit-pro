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
      var f1done = BRAIN.countDominated(IDS_FASE1);
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
    var f1done = BRAIN.countDominated(IDS_FASE1);
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
    return BRAIN.countDominated((VIDS||[]).map(function(q){return q.id;}));
  }

  function _countPts3Dominados(s) {
    if(typeof PTS3 === 'undefined') return 0;
    return BRAIN.countDominated((PTS3||[]).map(function(q){return q.id;}));
  }

  var TIPS = [
    'Las señales de R3 dominan el examen (17-19 de 45 preguntas). Domínalas y tienes el 40% ganado.',
    'Para terminar en 20 min: no leas respuestas que ya sabes. Reconocimiento instantáneo = velocidad.',
    'Los videos siempre son 2 en el examen. Si los dominas, son 6pts rápidos y seguros.',
    'Técnica de velocidad: en el examen real, responde primero las que sabes al 100%. Deja las dudosas para el final.',
    'Los 8 IDs casi-seguros salen en 1 de cada 4 exámenes. Fallarlos es perder 16pts de golpe.',
    'R4 (Normas) tiene 22 preguntas por test — el bloque más grande. 1 hora en R4 = +22pts potenciales.',
    'Examen seco cronometrado 2x por semana: la única forma de entrenar la velocidad real.',
    'Las multirespuesta: selecciona la 1ª, PAUSA, busca la 2ª antes de confirmar.',
  ];
  function _getTip() { return TIPS[new Date().getDay()%TIPS.length]; }

  // ─── AGENTE 2: SRS con pesos reales ──────────────────────────────
  function getSRSQueue(all) {
    // Delegamos en BRAIN: alli esta la puntuacion completa (errores, confianza,
    // vocabulario, lentitud, atraso) combinada con fase y valor estrategico.
    return BRAIN.getSRSQueue(all, 25);
  }

  // ═══════════════════════════════════════════════════════════════
  // EL PROFESOR — plan diario cerrable y medicion semanal
  // ═══════════════════════════════════════════════════════════════
  // Cada bloque responde a un principio concreto de aprendizaje, no a un
  // capricho de orden: recuperacion espaciada primero (lo vencido pierde
  // valor cada dia), correccion de errores sistematicos despues (mientras
  // hay atencion fresca), material nuevo en el medio, y cierre con practica
  // cronometrada para entrenar la velocidad, que es un objetivo aparte.

  function _diasHastaExamen() {
    try {
      var ed = localStorage.getItem('exam_date');
      if (!ed) return null;
      var ex = new Date(ed + 'T00:00:00'), hoy = new Date(); hoy.setHours(0,0,0,0);
      return Math.round((ex - hoy) / 86400000);
    } catch(e) { return null; }
  }

  // Cuantas preguntas NUEVAS toca hoy para llegar al examen sin atracones
  function _cargaNuevas(all) {
    var s = BRAIN.get();
    var pendientes = all.filter(function(q){ return !s.seen[q.id]; }).length;
    var dias = _diasHastaExamen();
    if (pendientes === 0) return 0;
    if (dias === null || dias <= 0) return 20;              // sin fecha: ritmo comodo
    var necesarias = Math.ceil(pendientes / Math.max(1, dias));
    // REACCIÓN A LA ÚLTIMA MEDICIÓN: si la prueba patrón salió por debajo de
    // lo que hace falta, se sube la carga; si salió holgada, se relaja. Medir
    // sin reaccionar no sirve de nada.
    var cps = BRAIN.getCheckpoints();
    if (cps.length) {
      var pts = cps[cps.length-1].pts;
      if (pts < 70)       necesarias = Math.ceil(necesarias * 1.35);
      else if (pts < 87)  necesarias = Math.ceil(necesarias * 1.15);
      else if (pts >= 94) necesarias = Math.ceil(necesarias * 0.85);
    }
    return Math.max(10, Math.min(45, necesarias));
  }

  // ═══════════════════════════════════════════════════════════════
  // FAMILIAS DE REGLAS
  // ═══════════════════════════════════════════════════════════════
  // Fallar 3 preguntas sueltas no dice nada. Fallar 3 de las 8 que dependen
  // de la MISMA regla madre dice exactamente que estudiar. Cada caso de la
  // seccion Leyes es una familia: lleva la lista de preguntas que dependen
  // de el, asi que el diagnostico sale de ahi sin inventar agrupaciones.

  function _idsDeCaso(c) {
    return String(c.p || '').split(',')
      .map(function(x){ return parseInt(x, 10); })
      .filter(function(x){ return !isNaN(x); });
  }

  function getFamilias() {
    if (typeof CASOS === 'undefined' || !CASOS.length) return [];
    var s = BRAIN.get();
    return CASOS.map(function(c) {
      var ids = _idsDeCaso(c);
      var dom = 0, fall = 0, vistas = 0, aciertos = 0, intentos = 0;
      ids.forEach(function(id) {
        var r = (s.seen || {})[id];
        if (BRAIN.isDominated(id)) dom++;
        if ((s.err || {})[id]) fall++;
        if (r) {
          vistas++;
          aciertos += (r.c || 0);
          intentos += (r.c || 0) + (r.w || 0);
        }
      });
      return {
        id: c.id, t: c.t, art: c.art || '', total: ids.length, ids: ids,
        dominadas: dom, falladas: fall, vistas: vistas,
        pct: ids.length ? Math.round(dom / ids.length * 100) : 0,
        acierto: intentos ? Math.round(aciertos / intentos * 100) : null,
        leida: BRAIN.leyLeida(c.id)
      };
    });
  }

  // Familia debil: la has tocado lo suficiente para tener datos y aun asi
  // fallas en varias de sus preguntas. Ordenadas por cuantas fallas.
  function familiasDebiles(minFallos) {
    var min = minFallos || 2;
    return getFamilias()
      .filter(function(f){ return f.falladas >= min && f.pct < 70; })
      .sort(function(a, b){
        if (b.falladas !== a.falladas) return b.falladas - a.falladas;
        return a.pct - b.pct;
      });
  }

  function familiaPorId(id) {
    return getFamilias().filter(function(f){ return f.id === id; })[0] || null;
  }

  // Frase de diagnostico lista para mostrar
  function fraseFamilia(f) {
    if (!f) return '';
    if (f.falladas) {
      return 'Fallas ' + f.falladas + ' de las ' + f.total + ' preguntas de «' + f.t + '»' +
             (f.leida ? '' : ' — y todavía no has leído la regla');
    }
    return 'Dominas ' + f.dominadas + ' de ' + f.total + ' en «' + f.t + '»';
  }

  // ═══════════════════════════════════════════════════════════════
  // PROYECCIÓN: ¿vas a llegar?
  // ═══════════════════════════════════════════════════════════════
  // El plan no debe salir de tus errores, debe salir de tu objetivo.
  // Aquí se calcula hacia atrás: cuántas te faltan, cuántos días quedan,
  // a qué ritmo vas de verdad, y si con ese ritmo llegas o no.

  var META_PTS = 97, APROBADO = 87;

  function proyeccion(all) {
    var banco = all || (typeof ALL !== 'undefined' ? ALL : []);
    if (!banco.length) return null;
    var dias = _diasHastaExamen();
    var pendientes = banco.filter(function(q){ return !BRAIN.isDominated(q.id); }).length;
    var dominadas = banco.length - pendientes;
    var ritmo = BRAIN.ritmoDominio(7);
    var est = BRAIN.getSkillEstimate(banco) || {pts:0};
    var cps = BRAIN.getCheckpoints();

    var necesario = (dias && dias > 0) ? pendientes / dias : null;
    var proyectadas = (ritmo && dias && dias > 0) ? dominadas + ritmo.porDia * dias : null;
    var pctProy = proyectadas !== null ? Math.min(1, proyectadas / banco.length) : null;
    // el nivel proyectado no es lineal con las dominadas: se apoya en la
    // misma estimación que ya usamos, escalada por la cobertura prevista
    var ptsProy = pctProy !== null
      ? Math.round(97 * (0.42 + 0.55 * pctProy))
      : null;

    var veredicto = 'sin_datos', margen = null;
    if (ritmo && necesario !== null) {
      margen = ritmo.porDia - necesario;
      if (ritmo.porDia >= necesario * 1.15)      veredicto = 'holgado';
      else if (ritmo.porDia >= necesario * 0.95) veredicto = 'justo';
      else                                       veredicto = 'no_llegas';
    }

    return {
      dias: dias, total: banco.length, dominadas: dominadas, pendientes: pendientes,
      necesarioPorDia: necesario !== null ? Math.ceil(necesario) : null,
      ritmoPorDia: ritmo ? Math.round(ritmo.porDia * 10) / 10 : null,
      diasDeHistoria: ritmo ? ritmo.muestras : 0,
      ptsHoy: est.pts, ptsProyectados: ptsProy,
      veredicto: veredicto, margen: margen,
      mediciones: cps.length,
      ultima: cps.length ? cps[cps.length-1] : null,
      fiable: !!ritmo && cps.length >= 3
    };
  }

  // ─── Qué ley toca leer hoy ────────────────────────────────────────
  // Elegimos el caso de estudio que cubre MÁS preguntas que aún no dominas.
  // Leer la regla antes de practicarla es lo que convierte el acierto en
  // comprensión: sin la regla delante, aciertas por reconocimiento visual
  // y eso no se transfiere a las preguntas gemelas del examen.
  function leyDeHoy() {
    if (typeof CASOS === 'undefined' || !CASOS.length) return null;
    // Prioridad 1: la familia en la que MAS fallas y cuya regla no has leido.
    // Es el diagnostico mas directo que existe: fallas ahi porque no sabes
    // la regla, no porque te despistes.
    var debiles = familiasDebiles(2).filter(function(f){ return !f.leida; });
    if (debiles.length) {
      var c1 = CASOS.filter(function(c){ return c.id === debiles[0].id; })[0];
      return { caso: c1, pendientes: debiles[0].total - debiles[0].dominadas,
               total: debiles[0].total, motivo: 'fallos', fam: debiles[0] };
    }
    // Prioridad 2: la que cubre mas preguntas sin dominar.
    var mejor = null, mejorN = 0;
    CASOS.forEach(function(c) {
      if (BRAIN.leyLeida(c.id)) return;
      var ids = _idsDeCaso(c);
      if (!ids.length) return;
      var pendientes = ids.filter(function(id){ return !BRAIN.isDominated(id); }).length;
      if (pendientes > mejorN) { mejorN = pendientes; mejor = c; }
    });
    if (!mejor) return null;
    return { caso: mejor, pendientes: mejorN, total: _idsDeCaso(mejor).length,
             motivo: 'cobertura' };
  }

  // ═══════════════════════════════════════════════════════════════
  // ETAPA A · aprender a LEER antes de practicar
  // ═══════════════════════════════════════════════════════════════
  function _clavesLex() {
    var k = [];
    if (typeof LEX_PARES !== 'undefined')
      LEX_PARES.forEach(function(p){ k.push(p.bg); if (p.op) k.push(p.op.bg); });
    if (typeof LEX_BLOQUES !== 'undefined')
      LEX_BLOQUES.forEach(function(b){ k.push(b.bg); });
    if (typeof LEX_GRAM !== 'undefined')
      LEX_GRAM.forEach(function(g){ k.push(g.bg); });
    if (typeof LEX_PALABRAS !== 'undefined')
      LEX_PALABRAS.forEach(function(w){ k.push(w.bg); });
    // sin duplicados: una palabra que aparezca en dos pares saldría dos
    // veces en la cola y falsearía el recuento
    var visto = {};
    return k.filter(function(x){ if (visto[x]) return false; visto[x] = 1; return true; });
  }

  // Se sale de la Etapa A por RENDIMIENTO, no por tiempo: hay que reconocer
  // las decisivas y la mayoría de los bloques por debajo de 2 segundos.
  function etapaA() {
    var claves = _clavesLex();
    if (!claves.length) return { activa: false };
    var dec = [];
    if (typeof LEX_PARES !== 'undefined')
      LEX_PARES.forEach(function(p){ dec.push(p.bg); if (p.op) dec.push(p.op.bg); });
    var eD = BRAIN.estadoLex(dec), eT = BRAIN.estadoLex(claves);
    var superada = eD.pct >= 100 && eT.pct >= 70;
    return {
      activa: !superada, superada: superada,
      decisivas: eD, todo: eT, claves: claves,
      pendientes: BRAIN.colaLex(claves, 999).length
    };
  }

  // OJO: no vale (x.prio||5). En JS el 0 es falso, así que un bloque con
  // prioridad 0 — el máximo — caería al valor por defecto y perdería.
  function _n(v) { return (v === undefined || v === null) ? 5 : v; }

  function planDia(all, vids, presupuesto) {
    var s = BRAIN.get();
    var m = BRAIN.getMetrics();
    var hechos = BRAIN.bloquesHechos();
    var fase = _detectarFaseActual(s);
    var nuevas = _cargaNuevas(all);
    var dias = _diasHastaExamen();
    var confus = BRAIN.getConfusiones(2).length;
    var hoy = new Date().toDateString();
    var falladasHoy = Object.keys(s.err || {}).filter(function(id){
      var r = s.seen[id]; return r && r.last === hoy && (r.streak||0) === 0;
    }).length;

    var b = [];

    // ETAPA A: mientras no sepas leer el búlgaro del examen, es lo único
    // que tiene sentido hacer. Practicar preguntas antes es memorizar la
    // forma del texto en vez de entenderlo.
    var eA = etapaA();
    if (eA.activa) {
      var pendLex = Math.min(24, Math.max(8, eA.pendientes));
      b.push({ prio:0, orden:0, id:'lex', emoji:'🔤', escalable:1, n:pendLex,
        t:'Aprender a leer el examen',
        detalle: eA.decisivas.automatizadas + '/' + eA.decisivas.total + ' palabras decisivas · ' +
                 eA.todo.automatizadas + '/' + eA.todo.total + ' en total',
        porque:'El examen es entero en búlgaro y hay que leerlo a una palabra por segundo. A esa velocidad no se lee, se reconoce. Primero las palabras que invierten la respuesta, después los bloques que más se repiten. Se sale de aquí reconociéndolos en menos de 2 segundos, no por tiempo.',
        min: Math.max(6, Math.round(pendLex * 0.5)), fn:"mod('lex')" });
    }

    // La lectura va PRIMERA: la regla antes que la práctica.
    var ley = leyDeHoy();
    if (ley) {
      b.push({ prio:1, orden:1, id:'ley', emoji:'📖', t:'Estudiar la ley: ' + ley.caso.t,
        detalle: ley.pendientes + ' de ' + ley.total + ' preguntas sin dominar dependen de ella',
        porque:'Va primero a propósito. Si practicas sin haber leído la regla aciertas por reconocer la foto, y eso no te sirve cuando el examen te pregunta lo mismo con otra imagen. Léela, escúchala si quieres, y márcala como estudiada.',
        min: 6, fn: "abrirLey('" + ley.caso.id + "')", ley: ley.caso.id });
    }

    if (m.due > 0) {
      b.push({ prio:2, orden:5, id:'srs', emoji:'🔁', escalable:1, n:m.due, t:'Repaso vencido',
        detalle: m.due + ' preguntas tocan hoy',
        porque:'Lo vencido es lo que estas a punto de olvidar. Repasarlo hoy vale mucho mas que manana.',
        min: Math.max(2, Math.round(m.due * 0.4)), fn:"mod('srs')" });
    }

    // Los pares trampa van ANTES que el refuerzo de familia: una incoherencia
    // es la senal mas fuerte que existe de que estas memorizando en vez de
    // aplicar la regla, y ademas son preguntas de f x p muy alto.
    var inco = BRAIN.incoherencias(false);
    if (inco.length) {
      var npreg = inco.reduce(function(a,g){ return a + g.ids.length; }, 0);
      b.push({ prio:4, orden:3, id:'pares', emoji:'🎭', t:'Pares trampa: aciertas una y fallas su gemela',
        detalle: inco.length + (inco.length===1?' grupo':' grupos') + ' · ' + npreg + ' preguntas',
        porque:'Estas preguntas tienen el MISMO enunciado y las MISMAS opciones que otra, y distinta respuesta porque cambia la imagen. Que aciertes una y falles la otra significa que respondes por el texto, no por la regla. Se estudian juntas y seguidas.',
        min: Math.max(4, Math.round(npreg * 0.7)), fn:"mod('pares')" });
    }

    // DESTETE: preguntas que ya dominas CON la traducción delante y que
    // todavía no has confirmado en búlgaro puro. El examen no lleva español,
    // así que hasta que no las aciertes sin muleta no están realmente hechas.
    var sinDestetar = BRAIN.colaDestete(all, 60);
    if (sinDestetar.length >= 5) {
      var lote = Math.min(20, sinDestetar.length);
      b.push({ prio:4, orden:3, id:'destete', emoji:'🇧🇬', escalable:1, n:lote,
        t:'Confirmar en búlgaro',
        detalle: lote + ' de ' + sinDestetar.length + ' que dominas solo con traducción',
        porque:'Ya sabes la respuesta; lo que falta es reconocer la pregunta sin español delante. El examen es entero en búlgaro, así que una pregunta dominada con muleta todavía no está dominada.',
        min: Math.max(4, Math.round(lote * 0.5)), fn:"mod('destete')" });
    }

    var debil = familiasDebiles(2)[0];
    if (debil) {
      b.push({ prio:5, orden:4, id:'familia', emoji:'🧩', t:'Reforzar: ' + debil.t,
        detalle: 'fallas ' + debil.falladas + ' de sus ' + debil.total + ' preguntas',
        porque:'No son fallos sueltos: las ' + debil.total + ' dependen de la misma regla. ' +
               'Arreglar la regla arregla todas de golpe, y es lo que separa aprobar de ir aprobando.',
        min: Math.max(4, Math.round(debil.total * 0.6)), fn: "mod('fam_" + debil.id + "')",
        familia: debil.id });
    }

    if (confus > 0) {
      b.push({ prio:6, orden:6, id:'confus', emoji:'🔀', t:'Corregir confusiones',
        detalle: confus + ' donde fallas siempre igual',
        porque:'No son despistes: eliges siempre la misma opcion equivocada. Hasta que no rompas el patron seguiran costandote puntos.',
        min: Math.max(3, Math.round(confus * 0.5)), fn:"mod('confus')" });
    }

    if (nuevas > 0) {
      var nomFase = FASE_INFO[fase];
      b.push({ prio:3, orden:2, id:'nuevas', emoji: nomFase.emoji, escalable:1, n:nuevas, t:'Material nuevo — ' + nomFase.n,
        detalle: nuevas + ' preguntas que aun no has visto',
        porque: dias !== null
          ? 'A este ritmo cubres todo el banco antes del examen (' + dias + ' dias). Menos hoy significa mas manana.'
          : nomFase.desc,
        min: Math.round(nuevas * 0.6), fn: "mod('fase" + fase + "')" });
    }

    if (falladasHoy > 0) {
      b.push({ prio:7, orden:7, id:'errores', emoji:'🎯', t:'Cerrar los fallos de hoy',
        detalle: falladasHoy + ' falladas sin recuperar',
        porque:'Una pregunta fallada y no vuelta a acertar el mismo dia se pierde. Volver a acertarla hoy es lo que la fija.',
        min:4, fn:"mod('errors')" });
    }

    b.push({ prio:8, orden:8, id:'velocidad', emoji:'⚡', t:'Cierre cronometrado',
      detalle:'10 preguntas contrarreloj',
      porque:'Acertar y acertar RAPIDO son dos habilidades distintas. Los <20 min se entrenan aparte.',
      min:5, fn:"mod('quick')" });

    var toca = BRAIN.tocaCheckpoint();
    if (toca) {
      b.push({ prio:9, orden:9, id:'prueba', emoji:'📏', t:'Prueba patron semanal',
        detalle:'45 preguntas • 97 puntos • forma nueva',
        porque:'Misma estructura que el examen real y mismo reparto de puntos cada semana, para que la nota de una semana se pueda comparar con la de otra.',
        min:25, fn:"mod('prueba')" });
    }

    b.forEach(function(x){ x.hecho = !!hechos[x.id]; });
    var hechosN = b.filter(function(x){ return x.hecho; }).length;

    // PRESUPUESTO DE TIEMPO. Si declaras cuántos minutos tienes hoy, los
    // bloques entran por PRIORIDAD (lo que más importa si el tiempo es corto)
    // y se muestran por ORDEN (lo que más cabeza exige, primero).
    var pres = presupuesto || null;
    if (pres) {
      var acum = 0;
      b.slice().sort(function(x,y){ return _n(x.prio) - _n(y.prio); })
       .forEach(function(x){
         if (x.hecho) { x.cabe = true; return; }
         if (acum + x.min <= pres) { x.cabe = true; acum += x.min; return; }
         // Un bloque por cantidad no se tira: se RECORTA. Si no, en los dias
         // cortos nunca avanzas en material nuevo, que es justo lo que mas
         // cuesta recuperar despues.
         var resto = pres - acum;
         if (x.escalable && x.n > 0 && resto >= 4) {
           var porPreg = x.min / x.n;
           var caben = Math.max(3, Math.floor(resto / porPreg));
           if (caben < x.n) {
             x.recortado = x.n;
             x.n = caben;
             x.min = Math.max(3, Math.round(caben * porPreg));
             x.detalle = caben + ' de ' + x.recortado + ' (recortado a tu tiempo)';
           }
           x.cabe = true; acum += x.min; return;
         }
         x.cabe = false;
       });
    } else {
      b.forEach(function(x){ x.cabe = true; });
    }
    b.sort(function(x,y){
      if (!!x.cabe !== !!y.cabe) return x.cabe ? -1 : 1;   // lo que no cabe, al final
      return _n(x.orden) - _n(y.orden);
    });

    return {
      bloques: b,
      hechos: hechosN,
      total: b.length,
      cerrado: hechosN >= b.length,
      minutos: b.reduce(function(a,x){ return a + ((x.hecho || x.cabe === false) ? 0 : x.min); }, 0),
      presupuesto: presupuesto || null,
      fuera: b.filter(function(x){ return x.cabe === false; }).length,
      minutosTotal: b.reduce(function(a,x){ return a + x.min; }, 0),
      fase: fase,
      dias: dias,
      semana: BRAIN.semanaDeEstudio(),
      tocaPrueba: toca
    };
  }

  // ─── Prueba patron: formas paralelas ──────────────────────────────
  // Para poder comparar semana con semana hace falta un instrumento estable.
  // Repetir el MISMO test lo invalida (te lo aprendes). Repetir uno aleatorio
  // tampoco sirve (la nota oscila por suerte). La solucion estandar son formas
  // PARALELAS: preguntas distintas cada semana pero con el mismo reparto exacto
  // de puntos que el examen real (12 de 1pt + 14 de 2pt + 19 de 3pt = 97).
  function _prng(seed) {
    var a = seed >>> 0;
    return function() {
      a += 0x6D2B79F5; var x = a;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  var CUOTA = {1:12, 2:14, 3:19};   // 12 + 28 + 57 = 97 puntos exactos

  function buildPrueba(all, semana) {
    var sem = semana || BRAIN.semanaDeEstudio();
    var rnd = _prng(sem * 7919 + 13);
    var out = [];
    [1,2,3].forEach(function(pts) {
      var pool = all.filter(function(q){ return (q.p||1) === pts; });
      // barajado determinista: la misma semana da siempre la misma forma
      var orden = pool.map(function(q){ return {q:q, k:rnd()}; })
                      .sort(function(a,b){ return a.k - b.k; })
                      .map(function(x){ return x.q; });
      out = out.concat(orden.slice(0, CUOTA[pts]));
    });
    return _shA(_int(out));
  }

  function _int(qs) {
    return (BRAIN.interleave ? BRAIN.interleave(qs) : qs);
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
        if(BRAIN.isDominated(q.id)) score -= 15; // dominada, baja prioridad
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
        if(BRAIN.isDominated(q.id)) score -= 10;
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
        if(BRAIN.isDominated(q.id)) score-=20;
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
    var f1done=BRAIN.countDominated(IDS_FASE1);
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
    planDia, buildPrueba, leyDeHoy, proyeccion, etapaA, clavesLex: _clavesLex,
    getFamilias, familiasDebiles, familiaPorId, fraseFamilia,
    runCoach, getSRSQueue, buildFase1,
    buildRealExam, buildAdaptive, buildUltimaHora,
    buildFlash, buildVideoCrit, buildCorrectiveFeedback, buildExamFrom,
    detectPatterns, getFullAnalysis,
    IDS_FASE1, TOP_VIDS, DIST_REAL, FASE_INFO
  };

})();
