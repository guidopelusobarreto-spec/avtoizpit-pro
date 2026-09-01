// Reglas de prioridad y casos de estudio — ЗДвП
// Cada entrada: t=titulo, art=articulo, txt=cuerpo, cl=clave para recordar
var LEYES=[
{id:"jer",t:"Quien manda sobre quien",art:"Jerarquia",
txt:"Antes de aplicar ninguna regla de prioridad, mira quien esta regulando. El orden es fijo y nunca se invierte: primero el REGULADOR o agente, que anula todo lo demas. Despues el SEMAFORO, que anula las senales de prioridad. Despues las SENALES VERTICALES, que anulan las marcas viales. Despues las MARCAS VIALES. Y por ultimo las reglas generales, que solo se aplican si no hay nada de lo anterior.",
cl:"El semaforo anula las senales de PRIORIDAD, pero no las de prohibicion ni las de obligacion. Un verde no te autoriza a girar donde una senal lo impide."},

{id:"a47",t:"Velocidad al acercarse al cruce",art:"чл. 47",
txt:"Al acercarte a un cruce debes circular a una velocidad que te permita parar y ceder el paso a quien tenga preferencia.",
cl:"No es una regla de prioridad: es la que hace posibles a las demas. Si llegas demasiado rapido ya has infringido, aunque despues cedas."},

{id:"a48",t:"Regla de la derecha",art:"чл. 48",
txt:"En un cruce de vias de igual valor, cede el paso a los vehiculos que se encuentran o se aproximan por tu derecha. Y todo vehiculo sin railes cede el paso a los vehiculos sobre railes, es decir a los tranvias, sea cual sea su posicion y su direccion de marcha.",
cl:"Dice se encuentran O se aproximan: tambien cuenta el que ya esta detenido en el cruce. Y el tranvia tiene preferencia siempre, incluso viniendo por tu izquierda. Es la unica excepcion real a la regla de la derecha."},

{id:"a49",t:"Salir de un camino de tierra",art:"чл. 49",
txt:"Quien sale de un camino de tierra a una via pavimentada cede el paso a los vehiculos y tambien a los peatones que circulan por la via pavimentada.",
cl:"Fijate en que menciona a los peatones expresamente, no solo a los vehiculos."},

{id:"a50a",t:"Via con prioridad",art:"чл. 50 apartado 1",
txt:"En un cruce donde una de las vias esta senalizada como via con prioridad, los conductores que vienen de las demas vias ceden el paso a los que circulan por ella.",
cl:"El rombo amarillo, el STOP y el ceda el paso son las senales que reparten esto."},

{id:"a50b",t:"Cuando la prioritaria cambia de direccion",art:"чл. 50 apartado 2",
txt:"Cuando en un cruce se indica que la via con prioridad cambia de direccion, los conductores que se encuentran en esa via se rigen entre si por las reglas del articulo 48, o sea por la regla de la derecha. Y por esas mismas reglas se rigen entre si los conductores que NO se encuentran en la via con prioridad.",
cl:"Cubre las dos capas a la vez. Prioritaria contra secundaria manda la prioritaria. Prioritaria contra prioritaria, regla de la derecha. Secundaria contra secundaria, regla de la derecha tambien. El panel bajo el rombo dibuja la prioritaria con trazo GRUESO y la secundaria con trazo FINO."},

{id:"a37",t:"Giro a la izquierda",art:"чл. 37 apartado 1",
txt:"Al girar a la izquierda para entrar en otra via, cedes el paso a los vehiculos que circulan en sentido contrario. En concreto a los que siguen de frente y a los que giran a la derecha.",
cl:"Es la regla que mas accidentes reparte. Si chocas girando a la izquierda contra uno que venia de frente, respondes tu. Y no te libra ir por la via con prioridad."},

{id:"a38",t:"Cambio de sentido o media vuelta",art:"чл. 38",
txt:"El cambio de sentido se hace hacia la izquierda desde el carril situado mas a la izquierda. Al hacerlo, cedes el paso a los vehiculos que circulan en sentido contrario.",
cl:"Girar a la izquierda y cambiar de sentido no son lo mismo. Una flecha verde a la izquierda te permite girar, pero no dar media vuelta."},

{id:"a39",t:"Donde esta prohibido cambiar de sentido",art:"чл. 39",
txt:"Esta prohibido cambiar de sentido en un paso de peatones, en un paso a nivel, en un puente, en un viaducto, en un tunel, en un paso subterraneo, con visibilidad limitada, o con visibilidad reducida por debajo de cincuenta metros.",
cl:"Memoriza los cincuenta metros: es el numero que suele preguntarse."},

{id:"a119",t:"Paso de peatones",art:"чл. 119 apartado 1",
txt:"Al aproximarte a un paso de peatones, el conductor de un vehiculo sin railes cede el paso a los peatones que lo estan utilizando.",
cl:"Si el paso esta regulado por semaforo o por agente, manda esa senal. Un peaton que cruza con su semaforo en rojo pierde la preferencia, pero eso no te libra de circular a velocidad segura."},

{id:"a117",t:"Ninos en la via",art:"чл. 117",
txt:"Al acercarte a un lugar donde hay ninos en la via o cerca de ella, debes reducir la velocidad y, si hace falta, detenerte.",
cl:"Es una obligacion activa, no solo de precaucion."},

{id:"orden",t:"Orden de decision paso a paso",art:"Metodo",
txt:"Uno. Hay un agente. Si lo hay, obedece solo sus senales y termina ahi. Dos. Hay semaforo en funcionamiento. Si lo hay, obedecelo, pero recuerda que las senales de prohibicion y de obligacion siguen vigentes. Tres. Hay senales de prioridad, STOP, ceda el paso o rombo. Aplica el articulo 50, y si el panel muestra que la prioritaria gira, aplica el apartado 2. Cuatro. No hay nada. Entonces son vias de igual valor y manda la regla de la derecha. Cinco. En cualquiera de los casos anteriores, ademas: si giras a la izquierda o das media vuelta cedes al de frente, si hay un tranvia tiene preferencia siempre, y si hay un paso de peatones cedes a los peatones.",
cl:"Aplicado en este orden, casi cualquier pregunta de prioridad se resuelve sin dudar."},

{id:"cebos",t:"Los cebos que se repiten",art:"Trampas",
txt:"Tengo prioridad porque voy recto: falso, la direccion nunca reparte preferencias. Tengo prioridad porque senalice primero: falso, el intermitente avisa pero no otorga derechos. Tengo prioridad porque llegue antes: falso, llegar antes no es tener preferencia. La moto tiene prioridad por ser de dos ruedas: falso, se rige por las mismas reglas. Voy por la prioritaria asi que no cedo a nadie: falso, si giras a la izquierda cedes al de frente igual. El verde me deja girar donde quiera: falso, no anula prohibiciones ni obligaciones. Con un STOP cedo a todo lo que se mueve: falso, solo a quien circula por la via con prioridad.",
cl:"Cuando una opcion empiece por porque voy recto, desconfia."}
];

// Casos singulares que han aparecido al estudiar preguntas concretas
var CASOS=[
{id:"k6546",im:[{f:"68490",q:"6546",a:"Giras a la izquierda. El rojo viene de frente recto y el azul cruza desde tu izquierda. EN EL EXAMEN: paso antes que los dos. EN CARRETERA: cede al de frente."}],t:"Bucle de prioridad",p:"6546",
txt:"Giras a la izquierda, un coche viene de frente siguiendo recto, y un tercero cruza desde tu izquierda. Aplicando la ley sale un circulo: tu cedes al de frente por el articulo 37, el de frente cede al que cruza porque le entra por su derecha, y el que cruza te cede a ti porque te llega por tu izquierda. Nadie puede arrancar primero. En bulgaro lo llaman zakleshtvane, atasco de prioridad.",
cl:"La ley no resuelve estos bucles con ninguna regla: se salen por acuerdo entre conductores. En esta pregunta la respuesta oficial del banco contradice al articulo 37. En el examen marca lo que dice el banco. En carretera, cede al que viene de frente."},

{id:"k6408",im:[{f:"71573",q:"6408",a:"Senal de prohibido adelantar y un motorista delante. QUE HACER: puedes adelantarle, la senal no cubre a las motos de dos ruedas sin sidecar."}],t:"Prohibido adelantar no incluye motos",p:"6408",
txt:"La senal circular roja con dos automoviles prohibe adelantar, pero deja fuera expresamente a los ciclomotores y a las motocicletas de dos ruedas sin sidecar.",
cl:"Se ve el circulo rojo y se asume prohibicion total. Lo que prohibe es adelantar automoviles, no motos."},

{id:"k5900",im:[{f:"41967",q:"5900",a:"Roja y ambar encendidas juntas. QUE HACER: permanecer detenido. Prepara la salida pero no arranques hasta el verde."}],t:"Roja y ambar encendidas a la vez",p:"5900",
txt:"Cuando se encienden la roja y la ambar juntas, no se autoriza a pasar. Avisa de que el verde esta a punto de llegar para que prepares la salida, pero hasta que aparezca sigues detenido.",
cl:"Si la roja esta encendida da igual lo que la acompane. El paso esta prohibido."},

{id:"ksem",im:[{f:"51516",q:"6608",a:"Verde encendido, triangulo de ceda el paso y disco azul de direccion obligatoria recto. QUE HACER: obedecer el semaforo Y la direccion obligatoria. La de prioridad no cuenta."},{f:"51499",q:"5952",a:"Verde encendido, STOP arriba y senal de prohibido girar a la derecha. QUE HACER: pasar con el verde pero sin girar a la derecha. El STOP queda anulado."}],t:"Que anula y que no anula el semaforo",p:"6608, 5952",
txt:"Un semaforo en funcionamiento deja sin efecto las senales de prioridad, incluido el STOP. Pero no toca las senales de prohibicion ni las de obligacion: una senal azul de direccion obligatoria o una de prohibido girar siguen vigentes con el verde encendido.",
cl:"El verde autoriza a pasar, no a tomar una direccion que otra senal impone o prohibe."},

{id:"kreg",im:[{f:"37240",q:"5871",a:"Brazo derecho extendido al frente y lo ves por su costado izquierdo. QUE HACER: puedes ir en todas las direcciones, incluida la media vuelta."},{f:"24081",q:"5837",a:"Brazos bajados y lo ves de perfil. QUE HACER: los de los costados siguen recto o giran a la derecha. Los del pecho y la espalda se detienen."},{f:"54674",q:"6668",a:"Brazo levantado en vertical. QUE HACER: detenerse. Solo siguen quien ya tenia el paso autorizado o quien no puede parar con seguridad."}],t:"Senales del regulador",p:"5871, 5837, 6668",
txt:"Brazos bajados: pasan los que lo ven de costado, por su izquierda o por su derecha, y pueden seguir recto o girar a la derecha. Los que ven su pecho o su espalda se detienen. Brazo derecho extendido al frente: desde su costado izquierdo se abre todo, recto, izquierda, derecha y media vuelta. Desde el pecho solo se permite girar a la derecha. Desde su derecha y desde su espalda esta prohibido. Brazo levantado en vertical: atencion, alto para todos, salvo quien ya tenia el paso autorizado o esta tan cerca que no puede detenerse con seguridad.",
cl:"Cuando hay agente, el semaforo deja de decidir."},

{id:"kcarril",im:[{f:"60500",q:"6076",a:"Fuera de poblacion, circulando por el carril izquierdo con el derecho libre. QUE HACER: bajarse al carril derecho. Asi es infraccion."},{f:"63839",q:"6099",a:"En poblacion, con varios carriles en el mismo sentido. QUE HACER: puedes seguir en el carril que te resulte mas comodo. Aqui no hay obligacion de ir a la derecha."}],t:"Carril: dentro y fuera de poblacion",p:"6076, 6077, 6099",
txt:"Fuera de poblacion hay que circular lo mas a la derecha posible: por el carril derecho si hay marcas que delimiten carriles, y lo mas a la derecha de la calzada si no las hay. Dentro de poblacion, con dos o mas carriles en el mismo sentido, el conductor elige el carril que le resulte mas comodo.",
cl:"La misma maniobra es correcta en ciudad e infraccion en carretera. Mira siempre si estas dentro o fuera de poblacion antes de responder."},

{id:"k6090",im:[{f:"62058",q:"6090",a:"Calzada de cuatro carriles o mas. QUE HACER: no invadir nunca los del sentido contrario, ni siquiera para adelantar."}],t:"Calzada de cuatro carriles o mas",p:"6090",
txt:"Cuando la calzada tiene cuatro carriles o mas, esta prohibido invadir los carriles del sentido contrario en cualquier circunstancia.",
cl:"No hay excepcion por adelantar, que es el cebo habitual. Con cuatro carriles se adelanta por el carril del propio sentido. Cuenta los carriles antes de pensar en cruzarte."},

{id:"kbus",im:[{f:"270043260",q:"9840",a:"Carril BUS con linea amarilla continua. QUE HACER: no entrar. Reservado a lineas regulares de transporte publico."},{f:"64672",q:"6446",a:"Senal que designa el carril BUS. QUE HACER: mismo criterio, solo lineas regulares."}],t:"Carril BUS",p:"9840, 6446",
txt:"El carril BUS esta reservado a los vehiculos de lineas regulares de transporte publico de pasajeros. La linea amarilla continua que lo delimita no se puede pisar.",
cl:"Manda el servicio de linea regular, no el tipo ni el tamano del vehiculo. Un autocar privado no entra, y los taxis tampoco salvo que una senal lo autorice."},

{id:"klento",im:[{f:"65857",q:"6492",a:"Tres carriles y un vehiculo lento delante. QUE HACER (si eres el lento): ir por el carril derecho; el central solo para rodear un obstaculo y el izquierdo solo para girar."}],t:"Vehiculo lento",p:"6492",
txt:"El vehiculo lento debe circular por el carril situado mas a la derecha. Puede salir de el en dos casos concretos: usar el carril central para rodear un obstaculo, y el carril izquierdo para girar.",
cl:"Lo que no puede es usar el carril izquierdo para adelantar. Sale de su carril para esquivar o para girar, nunca para adelantar."}
];
