// ═══════════════════════════════════════════════════════════════════
// CIFRAS DURAS DEL BANCO
// ───────────────────────────────────────────────────────────────────
// Los datos arbitrarios no se razonan: o los sabes o los fallas. Están
// repartidos por 38 preguntas del banco (66 puntos) y se repiten entre
// ellas, así que 16 tarjetas los cubren casi todos.
// Cada tarjeta lleva el fragmento búlgaro LITERAL con el que aparece en
// el examen, para aprender el dato y su forma escrita a la vez.
// Todo está copiado del banco, con los ids de origen: nada inventado.
// Las tarjetas de tablillas llevan la imagen del banco: en ellas el
// dato vive en el dibujo y sin verlo no se puede aprender la regla.
// ═══════════════════════════════════════════════════════════════════
var CIFRAS = [

{ k:'cif:triangulo', t:'Triángulo de emergencia',
  q:'¿A qué distancia mínima del coche se coloca el triángulo?',
  r:'30 m si la vía permite HASTA 90 km/h · 100 m si permite MÁS de 90 km/h',
  bg:'до 90 km/h → не по-малко от 30 метра · по-висока от 90 km/h → 100 метра',
  bges:'hasta 90 km/h → no menos de 30 metros · superior a 90 km/h → 100 metros',
  nota:'Son las dos preguntas más frecuentes de todo el banco (salen 53 y 47 veces). Se diferencian en una sola palabra: до = hasta, по-висока от = superior a. Si no distingues esas dos, tienes 2 puntos jugándose a cara o cruz.',
  ids:[11734,11733] },

{ k:'cif:cruce5', t:'Cruce: 5 metros',
  q:'Parada breve y aparcamiento junto a una intersección: ¿a partir de qué distancia?',
  r:'Prohibidos a menos de 5 m ANTES y 5 m DESPUÉS del cruce',
  bg:'5 метра преди кръстовище · 5 метра след кръстовище',
  bges:'5 metros antes de la intersección · 5 metros después de la intersección',
  nota:'Aquí cuentan los dos lados. Es la excepción: en el paso de peatones y en el carril bici solo cuenta el lado de ANTES.',
  ids:[11893,11894] },

{ k:'cif:paso5', t:'Paso de peatones: 5 m antes',
  q:'Parada breve y paso de peatones: ¿dónde está prohibida?',
  r:'Sobre el paso, y a menos de 5 m ANTES de él. Después del paso, no',
  bg:'на пешеходна пътека · на разстояние по-малко от 5 метра преди пешеходна пътека',
  bges:'en el paso de peatones · a una distancia menor de 5 metros antes del paso',
  nota:'La trampa es la simetría: el examen ofrece «5 m después» como opción y es falsa. Solo antes, porque lo que tapa la visibilidad del peatón es el coche parado delante del paso.',
  ids:[11892] },

{ k:'cif:bici5', t:'Carril bici: 5 m antes',
  q:'Parada breve y carril bici: ¿dónde está prohibida?',
  r:'Sobre el carril bici, y a menos de 5 m ANTES. Misma regla que el paso de peatones',
  bg:'на велосипедна пътека · на разстояние, по-малко от 5 метра преди велосипедна пътека',
  bges:'en el carril bici · a una distancia menor de 5 metros antes del carril bici',
  nota:'Mismo patrón que el paso de peatones: solo el lado de antes.',
  ids:[5610,5630] },

{ k:'cif:marca3', t:'Marca continua: 3 metros',
  q:'¿Cuándo no puedes parar ni aparcar por culpa de la marca vial?',
  r:'Cuando entre el vehículo y la marca que no se puede cruzar quedarían menos de 3 m',
  bg:'разстоянието между ППС и пътната маркировка, забранена за пресичане, е по-малко от 3 метра',
  bges:'la distancia entre el vehículo y la marca vial prohibida de cruzar es menor de 3 metros',
  nota:'La razón es física, no burocrática: con menos de 3 metros el que te esquiva tiene que pisar la línea continua. Sale tanto en parada breve como en aparcamiento.',
  ids:[5642,5625] },

{ k:'cif:jp2', t:'Paso a nivel: 2 metros',
  q:'Al detenerte antes de un paso a nivel, ¿a qué distancia del primer raíl?',
  r:'No menos de 2 m',
  bg:'не по-малко от 2 метра',
  bges:'no menos de 2 metros',
  nota:'Se mide desde el PRIMER raíl, no desde la barrera ni desde la señal.',
  ids:[11891] },

{ k:'cif:aviso', t:'Señales de advertencia: 50-100 / 100-150',
  q:'¿A qué distancia del peligro se colocan las señales de advertencia?',
  r:'De 50 a 100 m dentro de población · de 100 a 150 m fuera de población',
  bg:'от 50 до 100 метра в населено място · от 100 до 150 метра извън населено място',
  bges:'de 50 a 100 metros en población · de 100 a 150 metros fuera de población',
  nota:'Fuera de población todo se estira porque se circula más rápido y hace falta más distancia para reaccionar. La lógica sirve para no confundir cuál es cuál.',
  ids:[11888] },

{ k:'cif:flexible', t:'Remolcar con cuerda: 4 a 6 m',
  q:'Remolcado con enganche flexible: ¿qué longitud y qué requisitos?',
  r:'De 4 a 6 m · señalizado con bandera roja al menos en dos puntos · el remolcado con la dirección en buen estado',
  bg:'дължината на връзката трябва да бъде от 4 до 6 метра · сигнализирана с червен флаг поне на две места',
  bges:'la longitud del enganche debe ser de 4 a 6 metros · señalizado con bandera roja al menos en dos puntos',
  nota:'Menos de 4 m está prohibido: es la respuesta correcta de otra pregunta del banco.',
  ids:[5733,6682] },

{ k:'cif:rigida', t:'Remolcar con barra: 2 a 4 m',
  q:'Remolcado con barra rígida: ¿qué longitud y cómo va pintada?',
  r:'De 2 a 4 m · pintada con franjas rojas y blancas · el remolcado con la dirección en buen estado',
  bg:'тегличът трябва да е с дължина от 2 до 4 метра · оцветен напречно с червени и бели ивици',
  bges:'la barra debe medir de 2 a 4 metros · pintada transversalmente con franjas rojas y blancas',
  nota:'Barra 2-4, cuerda 4-6. Se confunden entre sí: la rígida es más corta porque no se pliega.',
  ids:[5730] },

{ k:'cif:vis50', t:'Remolcar: visibilidad 50 m',
  q:'¿Con qué visibilidad está prohibido remolcar?',
  r:'Con visibilidad reducida por debajo de 50 m',
  bg:'теглене при намалена видимост под 50 метра',
  bges:'remolcar con visibilidad reducida por debajo de 50 metros',
  nota:'Sale en tres preguntas distintas del banco, siempre como opción correcta de lo prohibido.',
  ids:[5770,5760,5777] },

{ k:'cif:multa14', t:'Multa electrónica: 14 días, 70%',
  q:'Si pagas una multa por sanción electrónica dentro del plazo, ¿cuánto pagas y en cuánto tiempo?',
  r:'El 70% del importe, si pagas en 14 días desde que la recibes',
  bg:'в 14-дневен срок · се заплаща 70% от размера на глобата',
  bges:'en un plazo de 14 días · se paga el 70% del importe de la multa',
  nota:'Dos cifras en la misma frase: el plazo y el porcentaje. El examen cambia una de las dos.',
  ids:[8296] },

{ k:'cif:carril80', t:'Elegir carril en población: 80 km/h',
  q:'En población, ¿cuándo puedes usar un carril distinto del derecho?',
  r:'Si hay dos o más carriles en tu sentido, están marcados, y la velocidad permitida no pasa de 80 km/h',
  bg:'разрешената скорост за движение да е не по-голяма от 80 km/h',
  bges:'la velocidad permitida no debe ser superior a 80 km/h',
  nota:'Tres condiciones a la vez y hay que marcarlas las tres. La cifra que se olvida es la de 80.',
  ids:[11684] },

{ k:'cif:peaton1m', t:'Peatón: menos de 1 metro',
  q:'¿Quién empuja algo y sigue contando como peatón?',
  r:'Quien empuja un vehículo sin motor de menos de 1 m de ancho, una bicicleta, un ciclomotor o una moto',
  bg:'които бутат пътно превозно средство без двигател и с широчина, по-малка от 1 метър',
  bges:'los que empujan un vehículo sin motor y de anchura menor de 1 metro',
  nota:'Importa porque si es peatón tiene los derechos del peatón. La bici y la moto empujadas cuentan siempre, sin medir nada.',
  ids:[8215] },

{ k:'cif:intervalo2s', t:'Intervalo: 2 segundos',
  q:'Intervalo mínimo entre turismos en vía seca y buena visibilidad',
  r:'2 segundos',
  bg:'интервалът между леките автомобили трябва да бъде не по-малък от 2 секунди',
  bges:'el intervalo entre turismos no debe ser menor de 2 segundos',
  nota:'Se mide en tiempo, no en metros, y solo vale con la vía SECA. Mojada o con mala visibilidad, más.',
  ids:[5866,5864] },

{ k:'cif:camion3500', t:'Distintivo: 3500 kg y 7 m',
  q:'¿Qué camiones llevan obligatoriamente el signo distintivo?',
  r:'Los de masa máxima autorizada superior a 3500 kg Y longitud superior a 7 m',
  bg:'товарни автомобили с максимална допустима маса над 3500 kg и дължина над 7 метра',
  bges:'camiones con masa máxima autorizada superior a 3500 kg y longitud superior a 7 metros',
  nota:'Las dos condiciones a la vez, no una u otra. Es el par de cifras que más veces se repite en las preguntas de distintivos.',
  ids:[11813,11814,11815] },

// Las tres tablillas de distancia. Aquí la imagen ES el dato: el mismo
// número significa tres cosas distintas según lleve flechas o no, y sin
// verla la tarjeta no enseña nada. Por eso estas tres llevan foto, y la
// pregunta va sobre la REGLA, no sobre reconocer el dibujo.
{ k:'cif:tab-sin', t:'Tablilla sin flechas',
  q:'Debajo de la señal, una tablilla con un número y nada más. ¿Qué dice?',
  r:'La distancia desde la señal hasta donde empieza el peligro',
  bg:'стеснението започва на 200 метра след знака',
  bges:'el estrechamiento empieza 200 metros después de la señal',
  img:'https://rta.government.bg/services/proekt-masiv-2024/B/assets/1123828556.png',
  nota:'Sin flechas = «a partir de aquí, tantos metros». Es la tablilla que reemplaza a la regla general de colocación (50-100 m en poblado, 100-150 m fuera): cuando la distancia no es la de siempre, te la escriben.',
  ids:[11885] },

{ k:'cif:tab-dos', t:'Tablilla con dos flechas',
  q:'Tablilla con el número entre dos flechas (una arriba, una abajo). ¿Qué dice?',
  r:'La LONGITUD del tramo peligroso, no la distancia hasta él',
  bg:'стеснението е с ДЪЛЖИНА 200 метра',
  bges:'el estrechamiento tiene una LONGITUD de 200 metros',
  img:'https://rta.government.bg/services/proekt-masiv-2024/B/assets/1123828558.png',
  nota:'Dos flechas = el tramo dura eso. Es la trampa exacta del banco: la misma señal y el mismo 200, con tablilla distinta y respuesta contraria. Mira las flechas antes que el número.',
  ids:[11886,11889] },

{ k:'cif:tab-una', t:'Tablilla con una flecha',
  q:'Bajo una señal de prohibido aparcar, tablilla con una flecha hacia arriba y un número. ¿Qué dice?',
  r:'Aquí empieza un tramo de esa longitud con la prohibición en vigor',
  bg:'начало на участък с дължина 10 метра, където е забранено паркирането',
  bges:'inicio de un tramo de 10 metros de longitud donde está prohibido aparcar',
  img:'https://rta.government.bg/services/proekt-masiv-2024/B/assets/1123828560.png',
  nota:'Una flecha hacia arriba = empieza aquí y dura lo que dice. Resumen de las tres: sin flechas, distancia hasta el peligro; una flecha, empieza aquí y dura X; dos flechas, dura X.',
  ids:[11887] }

];
