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

{id:"a15",t:"Carril: donde debes circular",art:"Regla general",
txt:"Fuera de poblacion se circula lo mas a la derecha posible: por el carril derecho si hay marcas, y pegado al borde derecho si no las hay. En autopista, por el derecho, usando los de la izquierda solo para adelantar y volviendo al derecho al terminar. Dentro de poblacion puedes elegir el carril que te resulte mas comodo, pero solo si se cumplen tres condiciones a la vez: dos o mas carriles en el mismo sentido, el numero de carriles y sus direcciones senalizados, y velocidad permitida no superior a 80 kilometros por hora.",
cl:"Memoriza el 80. Y recuerda que el carril izquierdo se ocupa para adelantar y se abandona al terminar: nunca es un carril de viaje."},

{id:"amag",t:"Autopista: incorporacion y vehiculos lentos",art:"Autopista",
txt:"Quien entra en la autopista desde el carril de aceleracion cede el paso a quien ya circula por ella. La regla de la derecha no se aplica en una incorporacion: vale entre vias que se cruzan. El vehiculo lento, definido como el que no puede superar los treinta kilometros por hora, tiene su propio carril senalizado cuando existe, y en el pueden circular tanto los que llevan el distintivo de vehiculo lento como los que no alcanzan esa velocidad, sean tractores o camiones.",
txt2:"NUMEROS DE AUTOPISTA. Solo pueden circular vehiculos cuya velocidad maxima por construccion supere los CINCUENTA kilometros por hora: por eso el tractor tiene prohibida la entrada. Se circula siempre por el carril libre mas a la derecha. Cuando hay TRES o mas carriles en el mismo sentido, los vehiculos de mas de TRES COMA CINCO toneladas y los conjuntos de mas de SIETE metros de longitud total solo pueden usar el carril derecho y el contiguo. El carril de emergencia sirve unicamente para detenerse por averia.",
cl:"El criterio para el carril de lentos es la velocidad que alcanza el vehiculo, no su tipo. Y la velocidad nunca da preferencia a nadie, ni en autopista ni en ningun sitio. Numeros que caen: 50 para entrar en autopista, 30 para ser vehiculo lento, 3,5 toneladas y 7 metros para el carril izquierdo, 80 para elegir carril en poblacion."},

{id:"orden",t:"Orden de decision paso a paso",art:"Metodo",
txt:"Uno. Hay un agente. Si lo hay, obedece solo sus senales y termina ahi. Dos. Hay semaforo en funcionamiento. Si lo hay, obedecelo, pero recuerda que las senales de prohibicion y de obligacion siguen vigentes. Tres. Hay senales de prioridad, STOP, ceda el paso o rombo. Aplica el articulo 50, y si el panel muestra que la prioritaria gira, aplica el apartado 2. Cuatro. No hay nada. Entonces son vias de igual valor y manda la regla de la derecha. Cinco. En cualquiera de los casos anteriores, ademas: si giras a la izquierda o das media vuelta cedes al de frente, si hay un tranvia tiene preferencia siempre, y si hay un paso de peatones cedes a los peatones.",
cl:"Aplicado en este orden, casi cualquier pregunta de prioridad se resuelve sin dudar."},

{id:"cebos",t:"Los cebos que se repiten",art:"Trampas",
txt:"Tengo prioridad porque voy recto: falso, la direccion nunca reparte preferencias. Tengo prioridad porque senalice primero: falso, el intermitente avisa pero no otorga derechos. Tengo prioridad porque llegue antes: falso, llegar antes no es tener preferencia. La moto tiene prioridad por ser de dos ruedas: falso, se rige por las mismas reglas. Voy por la prioritaria asi que no cedo a nadie: falso, si giras a la izquierda cedes al de frente igual. El verde me deja girar donde quiera: falso, no anula prohibiciones ni obligaciones. Con un STOP cedo a todo lo que se mueve: falso, solo a quien circula por la via con prioridad.",
cl:"Cuando una opcion empiece por porque voy recto, desconfia."}
];

// Casos singulares que han aparecido al estudiar preguntas concretas
var CASOS=[
{id:"k6546",im:[{q:"6546",f:"68490",a:"Giras a la izquierda, el rojo viene de frente siguiendo recto y el azul cruza desde tu izquierda. Los tres se ceden en circulo. En el examen marca pasar antes que los dos. En carretera, detente y cede al que viene de frente."}],im:[{f:"68490",q:"6546",a:"Giras a la izquierda. El rojo viene de frente recto y el azul cruza desde tu izquierda. EN EL EXAMEN: paso antes que los dos. EN CARRETERA: cede al de frente."}],t:"Bucle de prioridad",p:"6546, 6543, 6550",
txt:"Giras a la izquierda, un coche viene de frente siguiendo recto, y un tercero cruza desde tu izquierda. Aplicando la ley sale un circulo: tu cedes al de frente por el articulo 37, el de frente cede al que cruza porque le entra por su derecha, y el que cruza te cede a ti porque te llega por tu izquierda. Nadie puede arrancar primero. En bulgaro lo llaman zakleshtvane, atasco de prioridad.",
cl:"La ley no resuelve estos bucles con ninguna regla: se salen por acuerdo entre conductores. En esta pregunta la respuesta oficial del banco contradice al articulo 37. En el examen marca lo que dice el banco. En carretera, cede al que viene de frente."},

{id:"k6408",im:[{q:"6408",f:"71573",a:"El circulo rojo con dos automoviles prohibe adelantar, pero la moto de dos ruedas queda fuera de la prohibicion. Comprueba que no lleva sidecar y adelanta con normalidad."}],im:[{f:"71573",q:"6408",a:"Senal de prohibido adelantar y un motorista delante. QUE HACER: puedes adelantarle, la senal no cubre a las motos de dos ruedas sin sidecar."}],t:"Prohibido adelantar no incluye motos",p:"6408",
txt:"La senal circular roja con dos automoviles prohibe adelantar, pero deja fuera expresamente a los ciclomotores y a las motocicletas de dos ruedas sin sidecar.",
cl:"Se ve el circulo rojo y se asume prohibicion total. Lo que prohibe es adelantar automoviles, no motos."},

{id:"k5900",im:[{q:"5900",f:"41967",a:"Roja y ambar encendidas a la vez. Mete la marcha y preparate para salir, pero no muevas el coche hasta que aparezca el verde."}],im:[{f:"41967",q:"5900",a:"Roja y ambar encendidas juntas. QUE HACER: permanecer detenido. Prepara la salida pero no arranques hasta el verde."}],t:"Roja y ambar encendidas a la vez",p:"5900",
txt:"Cuando se encienden la roja y la ambar juntas, no se autoriza a pasar. Avisa de que el verde esta a punto de llegar para que prepares la salida, pero hasta que aparezca sigues detenido.",
cl:"Si la roja esta encendida da igual lo que la acompane. El paso esta prohibido."},

{id:"ksem",im:[{q:"6608",f:"51516",a:"Verde encendido, un ceda el paso encima y una senal azul de direccion obligatoria recto. El verde anula el ceda el paso, pero la azul sigue mandando: solo puedes seguir de frente."},{q:"5952",f:"51499",a:"Verde encendido bajo un STOP y una senal de prohibido girar a la derecha. El verde anula el STOP; la prohibicion de giro sigue vigente."}],im:[{f:"51516",q:"6608",a:"Verde encendido, triangulo de ceda el paso y disco azul de direccion obligatoria recto. QUE HACER: obedecer el semaforo Y la direccion obligatoria. La de prioridad no cuenta."},{f:"51499",q:"5952",a:"Verde encendido, STOP arriba y senal de prohibido girar a la derecha. QUE HACER: pasar con el verde pero sin girar a la derecha. El STOP queda anulado."}],t:"Que anula y que no anula el semaforo",p:"6608, 5952",
txt:"Un semaforo en funcionamiento deja sin efecto las senales de prioridad, incluido el STOP. Pero no toca las senales de prohibicion ni las de obligacion: una senal azul de direccion obligatoria o una de prohibido girar siguen vigentes con el verde encendido.",
cl:"El verde autoriza a pasar, no a tomar una direccion que otra senal impone o prohibe."},

{id:"kreg",im:[{q:"5871",f:"37240",a:"Brazo derecho extendido al frente y lo ves por su costado izquierdo: se abren todas las direcciones, incluida la media vuelta."},{q:"5837",f:"24081",a:"Brazos bajados y lo ves de perfil: puedes seguir recto o girar a la derecha. Quien ve su pecho o su espalda se detiene."},{q:"6668",f:"54674",a:"Brazo levantado en vertical: alto para todos. Solo continua quien ya tenia el paso autorizado o quien esta tan cerca que no puede detenerse con seguridad."}],im:[{f:"37240",q:"5871",a:"Brazo derecho extendido al frente y lo ves por su costado izquierdo. QUE HACER: puedes ir en todas las direcciones, incluida la media vuelta."},{f:"24081",q:"5837",a:"Brazos bajados y lo ves de perfil. QUE HACER: los de los costados siguen recto o giran a la derecha. Los del pecho y la espalda se detienen."},{f:"54674",q:"6668",a:"Brazo levantado en vertical. QUE HACER: detenerse. Solo siguen quien ya tenia el paso autorizado o quien no puede parar con seguridad."}],t:"Senales del regulador",p:"5871, 5837, 6668",
txt:"Brazos bajados: pasan los que lo ven de costado, por su izquierda o por su derecha, y pueden seguir recto o girar a la derecha. Los que ven su pecho o su espalda se detienen. Brazo derecho extendido al frente: desde su costado izquierdo se abre todo, recto, izquierda, derecha y media vuelta. Desde el pecho solo se permite girar a la derecha. Desde su derecha y desde su espalda esta prohibido. Brazo levantado en vertical: atencion, alto para todos, salvo quien ya tenia el paso autorizado o esta tan cerca que no puede detenerse con seguridad.",
cl:"Cuando hay agente, el semaforo deja de decidir."},

{id:"ksemvsder",im:[{q:"5929",f:"48329",a:"Solo hay senales. Los de la via con prioridad pasan primero, y entre ellos se ordenan por la regla de la derecha. La regla del giro a la izquierda existe, pero aqui nadie gira a la izquierda, asi que no interviene."},{q:"5935",f:"103109",a:"Aqui hay semaforo. Pasan los que tienen verde, y los que giran a la izquierda ceden a los de frente. La regla de la derecha NO se aplica: el semaforo ya reparte el paso por fases."}],
t:"Con semaforo la regla de la derecha NO se aplica",p:"5929, 5935",
txt:"Cuando el cruce lo regula un semaforo, el orden de paso lo marcan las fases del semaforo y no la posicion relativa de los vehiculos. Entre dos conductores que tienen verde a la vez no se aplica la regla de la derecha. Lo que si sigue vigente es que el que gira a la izquierda cede el paso al que viene de frente, porque eso no depende del semaforo sino de la maniobra.",
cl:"Solo senales: manda la posicion, o sea la regla de la derecha. Con semaforo: mandan las fases. La unica regla que sobrevive en los dos casos es la del giro a la izquierda."},

{id:"kprohib",im:[{q:"5896",f:"48224",a:"Hay un agente regulando y ademas una senal de prohibido girar a la derecha. El agente decide quien pasa, pero no te autoriza a tomar una direccion prohibida por una senal. La respuesta es no."},{q:"6608",f:"51516",a:"Semaforo en verde, un ceda el paso y una senal azul de direccion obligatoria recto. El verde anula el ceda el paso, pero la azul sigue mandando."}],
t:"Que anulan el agente y el semaforo, y que no",p:"5896, 6608",
txt:"Tanto el agente como el semaforo dejan sin efecto las senales que reparten la PRIORIDAD: el STOP, el ceda el paso y el rombo de via con prioridad. Pero ninguno de los dos anula las senales de PROHIBICION ni las de OBLIGACION. Una senal de prohibido girar o una azul de direccion obligatoria siguen vigentes aunque haya un agente dirigiendo o el semaforo este en verde.",
cl:"Quien regula el paso decide QUIEN pasa, no HACIA DONDE puedes ir. Esa distincion se repite en todo el examen."},

{id:"kmag3",im:[{q:"5380",f:"41655",a:"Tres carriles mas el de emergencia. El tractor circula por el carril de emergencia y ademas no puede entrar en autopista. El turismo va por el central teniendo libre el derecho. El camion ocupa el carril izquierdo, vedado a los de mas de 3,5 toneladas cuando hay tres o mas carriles. Los tres infringen."},{q:"5375",f:"41441",a:"Circular por el carril izquierdo con el derecho libre. En autopista los carriles de la izquierda son solo para adelantar y se abandonan al terminar."}],
t:"Autopista: tres infracciones distintas",p:"5380, 5375",
txt:"En autopista concurren varias reglas a la vez y conviene revisarlas una por una. Primera: solo entran los vehiculos que superan los cincuenta kilometros por hora por construccion, asi que tractores y maquinaria lenta quedan fuera. Segunda: se circula por el carril libre mas a la derecha, y los de la izquierda son solo para adelantar. Tercera: con tres o mas carriles, los vehiculos de mas de tres coma cinco toneladas y los conjuntos de mas de siete metros solo pueden usar el derecho y el contiguo. Cuarta: el carril de emergencia sirve solo para detenerse por averia, nunca para circular.",
cl:"Cuando una pregunta de autopista ofrezca solo el tractor, solo el camion o solo el turismo, sospecha: suele fallar mas de uno. Revisa los cuatro puntos antes de elegir."},

{id:"kcarril",im:[{q:"6076",f:"60500",a:"Fuera de poblacion, el rojo circula por el carril izquierdo teniendo libre el derecho. Es infraccion aunque en ese momento no moleste a nadie."},{q:"6099",f:"63839",a:"En poblacion, con dos o mas carriles en el mismo sentido, eliges el carril que te resulte mas comodo. La misma maniobra de arriba, aqui es correcta."}],im:[{f:"60500",q:"6076",a:"Fuera de poblacion, circulando por el carril izquierdo con el derecho libre. QUE HACER: bajarse al carril derecho. Asi es infraccion."},{f:"63839",q:"6099",a:"En poblacion, con varios carriles en el mismo sentido. QUE HACER: puedes seguir en el carril que te resulte mas comodo. Aqui no hay obligacion de ir a la derecha."}],t:"Carril: dentro y fuera de poblacion",p:"6076, 6077, 6099",
txt:"Fuera de poblacion hay que circular lo mas a la derecha posible: por el carril derecho si hay marcas que delimiten carriles, y lo mas a la derecha de la calzada si no las hay. Dentro de poblacion, con dos o mas carriles en el mismo sentido, el conductor elige el carril que le resulte mas comodo.",
cl:"La misma maniobra es correcta en ciudad e infraccion en carretera. Mira siempre si estas dentro o fuera de poblacion antes de responder."},

{id:"k6090",im:[{q:"6090",f:"62058",a:"Calzada de cuatro carriles. Prohibido invadir los del sentido contrario en cualquier circunstancia, tampoco para adelantar."}],im:[{f:"62058",q:"6090",a:"Calzada de cuatro carriles o mas. QUE HACER: no invadir nunca los del sentido contrario, ni siquiera para adelantar."}],t:"Calzada de cuatro carriles o mas",p:"6090",
txt:"Cuando la calzada tiene cuatro carriles o mas, esta prohibido invadir los carriles del sentido contrario en cualquier circunstancia.",
cl:"No hay excepcion por adelantar, que es el cebo habitual. Con cuatro carriles se adelanta por el carril del propio sentido. Cuenta los carriles antes de pensar en cruzarte."},

{id:"kbus",im:[{q:"9840",f:"270043260",a:"Linea amarilla continua y BUS pintado en el asfalto. Reservado a lineas regulares de transporte publico; la continua no se pisa."},{q:"6446",f:"64672",a:"La senal indica que el carril derecho es BUS. Mismo criterio: solo el servicio de linea regular puede circular por el."}],im:[{f:"270043260",q:"9840",a:"Carril BUS con linea amarilla continua. QUE HACER: no entrar. Reservado a lineas regulares de transporte publico."},{f:"64672",q:"6446",a:"Senal que designa el carril BUS. QUE HACER: mismo criterio, solo lineas regulares."}],t:"Carril BUS",p:"9840, 6446",
txt:"El carril BUS esta reservado a los vehiculos de lineas regulares de transporte publico de pasajeros. La linea amarilla continua que lo delimita no se puede pisar.",
cl:"Manda el servicio de linea regular, no el tipo ni el tamano del vehiculo. Un autocar privado no entra, y los taxis tampoco salvo que una senal lo autorice."},

{id:"klento",im:[{q:"6492",f:"65857",a:"Tres carriles. El vehiculo lento va por el derecho. Puede usar el central para rodear un obstaculo y el izquierdo para girar, nunca para adelantar."}],im:[{f:"65857",q:"6492",a:"Tres carriles y un vehiculo lento delante. QUE HACER (si eres el lento): ir por el carril derecho; el central solo para rodear un obstaculo y el izquierdo solo para girar."}],t:"Vehiculo lento",p:"6492",
txt:"El vehiculo lento debe circular por el carril situado mas a la derecha. Puede salir de el en dos casos concretos: usar el carril central para rodear un obstaculo, y el carril izquierdo para girar.",
cl:"Lo que no puede es usar el carril izquierdo para adelantar. Sale de su carril para esquivar o para girar, nunca para adelantar."},
{id:"ksemcolor",im:[{f:"43199",q:"5912",a:"Cuatro semaforos y hay que elegir el del ambar solo. AMBAR FIJO significa Atencion, para. Solo sigue el que ya ha entrado en el cruce o no podria detenerse sin frenar bruscamente."},{f:"42122",q:"5902",a:"Rojo solo y rojo+ambar son los dos que significan prohibido el paso. El rojo+ambar solo anuncia que llega el verde: mientras el rojo este encendido, sigue prohibido."}],t:"Que significa cada foco del semaforo",art:"чл. 31 ППЗДвП",p:"5902, 5908, 5912",
txt:"Cada combinacion tiene un nombre oficial y el examen pregunta por ese nombre. VERDE: el paso esta permitido, y es la unica que autoriza a pasar. AMBAR FIJO: Atencion, para. Prohibe entrar en el cruce; solo continua quien ya entro o no puede detenerse sin frenado brusco. ROJO: el paso esta prohibido. ROJO MAS AMBAR: el paso sigue prohibido, solo anuncia que el verde esta a punto de llegar.",
cl:"Dos cebos. El rojo+ambar se lee como arranca ya, y no: mientras haya rojo, prohibido. Y si preguntan cuales significan prohibido el paso, son rojo y rojo+ambar; el ambar solo tiene nombre propio, Atencion para. Ojo tambien a la palabra nemigasti, no parpadeantes: el ambar intermitente significa otra cosa, cruce sin regular."},

{id:"ktricruce",im:[{f:"55267",q:"6675",a:"Triangulo con un aspa negra: cruce de vias de igual valor. Despues de esta senal cedes a los que llegan por tu DERECHA."},{f:"55266",q:"6675",a:"Triangulo con trazo vertical grueso y un ramal fino a la derecha: cruce con via secundaria por la derecha. Aqui el grueso eres tu, no cedes."}],t:"Triangulos de cruce: el grosor manda",p:"6675",
txt:"En los triangulos rojos que avisan de un cruce, el GROSOR del trazo dice quien tiene prioridad. Trazo grueso es la via con prioridad, trazo fino la secundaria. Si el dibujo lleva un trazo grueso, tu vas por el y no cedes a los ramales finos. El aspa negra es distinta: no tiene trazo grueso porque no hay jerarquia, es cruce de vias de igual valor y devuelve el cruce a la regla de la derecha del чл. 50 apartado 1.",
cl:"El aspa es la unica de la familia que te obliga a ceder por la derecha. La glorieta no vale como respuesta a esa pregunta: alli cede el que entra, y los del anillo te llegan por la IZQUIERDA."},

{id:"kportico",im:[{f:"64344",q:"6435",a:"Portico con dos paneles: aspa sobre mi carril y flecha hacia abajo sobre el derecho. QUE HACER: pasar al carril derecho."}],t:"Semaforos de carril (portico)",art:"чл. 33 ППЗДвП",p:"6435",
txt:"Los paneles que cuelgan de un portico son semaforos de carril (чл. 33 ППЗДвП): no regulan el cruce, regulan si ese carril concreto se puede usar ahora. La ley describe la luz roja como DOS BANDAS INCLINADAS QUE SE CRUZAN, un aspa, y significa que la circulacion por el carril esta prohibida. La luz verde tiene forma de FLECHA HACIA ABAJO y significa que la circulacion por el carril esta permitida. Se leen mirando el panel que esta justo encima de TU carril, no el mas visible.",
cl:"Aspa encima = fuera de ese carril, aunque este vacio y no haya obras a la vista. Flecha abajo = por ese si. Y si ninguna de las dos luces esta encendida, el sentido del carril lo marca la senal Д1 (чл. 33, ал. 5)."},

{id:"kflechascarril",im:[{f:"64417",q:"6438",a:"Senal blanca rectangular con tres flechas verticales: la de la izquierda hacia abajo, las otras dos hacia arriba. El carril izquierdo es del sentido contrario; los otros dos son nuestros."}],t:"Senal Д1: numero y sentido de los carriles",art:"Д1",p:"6438",
txt:"Se llama Д1, Broy na patnite lenti i posoki za dvizhenie po tyah: numero de carriles y sentidos de circulacion por ellos. Es del grupo D, senales con prescripciones especiales. Rectangulo blanco con una flecha vertical por carril; el numero de flechas coincide con el numero de carriles y la norma permite indicar tambien los carriles del sentido contrario. Flecha hacia arriba: carril de tu sentido. Flecha hacia abajo: carril del sentido contrario. Se coloca en vias con dos o mas carriles en un sentido y vale hasta la siguiente interseccion.",
cl:"Tres carriles no significa tres carriles tuyos. Antes de cambiar de carril en una calzada ancha sin separacion fisica, cuenta las flechas y mira cual apunta hacia abajo."}
];
