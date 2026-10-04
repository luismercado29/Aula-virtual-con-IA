/**
 * Catalogo de ejemplo. Personas y cursos ficticios; el contenido es material
 * introductorio real escrito para la demo.
 */
import type { Nivel } from './esquema';

export const CATEGORIAS = [
  { slug: 'programacion', nombre: 'Programación', icono: 'code', color: '#4338CA', descripcion: 'Del primer programa a aplicaciones completas.' },
  { slug: 'datos', nombre: 'Ciencia de datos', icono: 'chart', color: '#0E7490', descripcion: 'Analiza, visualiza y modela datos.' },
  { slug: 'diseno', nombre: 'Diseño', icono: 'palette', color: '#BE185D', descripcion: 'Diseño de interfaces, marca y comunicación visual.' },
  { slug: 'negocios', nombre: 'Negocios', icono: 'briefcase', color: '#B45309', descripcion: 'Emprendimiento, finanzas y gestión.' },
  { slug: 'marketing', nombre: 'Marketing digital', icono: 'megaphone', color: '#7C3AED', descripcion: 'Contenido, redes y analítica.' },
  { slug: 'idiomas', nombre: 'Idiomas', icono: 'languages', color: '#15803D', descripcion: 'Comunícate con confianza en otros idiomas.' },
  { slug: 'bienestar', nombre: 'Desarrollo personal', icono: 'heart', color: '#C2410C', descripcion: 'Hábitos, productividad y bienestar.' },
  { slug: 'inclusion', nombre: 'Tecnología inclusiva', icono: 'accessibility', color: '#1D4ED8', descripcion: 'Accesibilidad digital y diseño para todas las personas.' },
] as const;

export const PROFESORES = [
  { clave: 'valentina', nombre: 'Valentina Ríos', titular: 'Ingeniera de software y mentora de desarrolladores', bio: 'Diez años construyendo productos web. Le encanta explicar lo complejo con ejemplos simples.' },
  { clave: 'andres', nombre: 'Andrés Cabarcas', titular: 'Científico de datos en el sector salud', bio: 'Trabaja con modelos predictivos y enseña estadística aplicada sin miedo a las fórmulas.' },
  { clave: 'camila', nombre: 'Camila Herrera', titular: 'Diseñadora de producto y especialista en accesibilidad', bio: 'Diseña experiencias que cualquiera pueda usar, incluidas personas con discapacidad.' },
  { clave: 'jorge', nombre: 'Jorge Marrugo', titular: 'Emprendedor y consultor de marketing', bio: 'Ha fundado dos empresas y asesora a pymes en crecimiento digital.' },
] as const;

type Leccion = { titulo: string; tipo?: 'lectura' | 'video'; min?: number; puntos: string[]; previa?: boolean };
type Pregunta = { enunciado: string; opciones: string[]; correcta: number; explicacion: string };
export type CursoSemilla = {
  slug: string; titulo: string; subtitulo: string; descripcion: string; categoria: string; profesor: string;
  nivel: Nivel; etiquetas: string[]; aprenderas: string[]; requisitos: string[]; diasDesdeCreacion: number;
  modulos: { titulo: string; lecciones: Leccion[] }[];
  evaluacion: Pregunta[];
};

export const CURSOS: CursoSemilla[] = [
  {
    slug: 'python-desde-cero', titulo: 'Python desde cero', subtitulo: 'Aprende a programar con el lenguaje más amigable del mundo',
    descripcion: 'Un curso para quienes nunca han programado. Escribirás tus primeros programas, entenderás cómo piensa una computadora y terminarás automatizando tareas reales.',
    categoria: 'programacion', profesor: 'valentina', nivel: 'principiante', diasDesdeCreacion: 240,
    etiquetas: ['Python', 'Lógica de programación', 'Automatización'],
    aprenderas: ['Escribir programas con variables, condiciones y ciclos', 'Organizar código en funciones', 'Leer y escribir archivos', 'Automatizar tareas repetitivas'],
    requisitos: ['Ninguno: empezamos desde cero', 'Un computador con conexión a internet'],
    modulos: [
      { titulo: 'Primeros pasos', lecciones: [
        { titulo: '¿Qué es programar?', previa: true, puntos: ['Un programa es una lista de instrucciones precisas', 'La computadora no adivina: hace exactamente lo que le dices', 'Python se lee casi como inglés, por eso es ideal para empezar'] },
        { titulo: 'Variables y tipos de datos', puntos: ['Una variable es un nombre que guarda un valor', 'Los tipos básicos son números, texto (cadenas) y booleanos', 'Ejemplo: `edad = 25` y `nombre = "Ana"`'] },
      ] },
      { titulo: 'Decisiones y repeticiones', lecciones: [
        { titulo: 'Condicionales con if', puntos: ['`if` ejecuta un bloque solo si la condición es verdadera', '`elif` y `else` cubren los demás casos', 'La sangría (indentación) define qué está dentro del bloque'] },
        { titulo: 'Ciclos for y while', puntos: ['`for` recorre una colección elemento por elemento', '`while` repite mientras una condición se cumpla', 'Evita los ciclos infinitos asegurando que la condición cambie'] },
      ] },
      { titulo: 'Funciones y archivos', lecciones: [
        { titulo: 'Funciones reutilizables', puntos: ['Una función agrupa pasos con un nombre: `def saludar(nombre):`', 'Recibe parámetros y devuelve resultados con `return`', 'Dividir el problema en funciones lo hace más fácil de entender'] },
        { titulo: 'Leer y escribir archivos', puntos: ['`open()` abre un archivo para leer o escribir', 'Usa `with` para que el archivo se cierre solo', 'Así puedes procesar listas, reportes y datos guardados'] },
      ] },
    ],
    evaluacion: [
      { enunciado: '¿Qué hace la instrucción `edad = 25`?', opciones: ['Compara edad con 25', 'Guarda el valor 25 en la variable edad', 'Imprime 25 en pantalla'], correcta: 1, explicacion: 'El signo = asigna un valor a una variable; para comparar se usa ==.' },
      { enunciado: '¿Qué ciclo usarías para recorrer cada elemento de una lista?', opciones: ['for', 'if', 'def'], correcta: 0, explicacion: 'for recorre una colección elemento por elemento.' },
      { enunciado: '¿Para qué sirve `return` dentro de una función?', opciones: ['Para repetir la función', 'Para devolver un resultado a quien la llamó', 'Para cerrar el programa'], correcta: 1, explicacion: 'return entrega el resultado de la función.' },
    ],
  },
  {
    slug: 'desarrollo-web-moderno', titulo: 'Desarrollo web moderno', subtitulo: 'HTML, CSS y JavaScript para crear sitios accesibles y rápidos',
    descripcion: 'Construye tu primer sitio web profesional. Aprenderás la estructura con HTML semántico, el diseño con CSS moderno y la interactividad con JavaScript.',
    categoria: 'programacion', profesor: 'valentina', nivel: 'principiante', diasDesdeCreacion: 200,
    etiquetas: ['HTML', 'CSS', 'JavaScript', 'Desarrollo web'],
    aprenderas: ['Estructurar páginas con HTML semántico', 'Maquetar con Flexbox y Grid', 'Agregar interactividad con JavaScript', 'Publicar tu sitio en internet'],
    requisitos: ['Saber usar un navegador y un editor de texto'],
    modulos: [
      { titulo: 'HTML con sentido', lecciones: [
        { titulo: 'La estructura de una página', previa: true, puntos: ['HTML describe el contenido: títulos, párrafos, enlaces e imágenes', 'Las etiquetas semánticas (`header`, `main`, `nav`) dan significado', 'Los lectores de pantalla usan esa estructura para navegar'] },
        { titulo: 'Formularios accesibles', puntos: ['Cada campo necesita una etiqueta `label` asociada', 'Los mensajes de error deben explicarse en texto, no solo con color', 'El orden del teclado debe seguir el orden visual'] },
      ] },
      { titulo: 'CSS moderno', lecciones: [
        { titulo: 'Flexbox y Grid', puntos: ['Flexbox organiza elementos en una dirección', 'Grid organiza en filas y columnas a la vez', 'Combinados resuelven casi cualquier diseño'] },
        { titulo: 'Diseño responsivo', puntos: ['Diseña primero para móvil y amplía', 'Usa unidades relativas como `rem` y `%`', 'Las media queries adaptan el diseño a cada pantalla'] },
      ] },
      { titulo: 'JavaScript esencial', lecciones: [
        { titulo: 'El DOM y los eventos', puntos: ['El DOM es la página representada como objetos', 'Con `addEventListener` reaccionas a clics y teclas', 'Usa botones reales (`button`) para que funcionen con teclado'] },
      ] },
    ],
    evaluacion: [
      { enunciado: '¿Por qué usar etiquetas semánticas como `nav` o `main`?', opciones: ['Hacen que la página cargue más rápido', 'Dan significado al contenido y ayudan a los lectores de pantalla', 'Son obligatorias para usar CSS'], correcta: 1, explicacion: 'La semántica permite a la tecnología asistiva entender la estructura.' },
      { enunciado: '¿Qué herramienta de CSS organiza filas y columnas a la vez?', opciones: ['Grid', 'Flexbox', 'Float'], correcta: 0, explicacion: 'Grid trabaja en dos dimensiones.' },
    ],
  },
  {
    slug: 'react-profesional', titulo: 'React profesional', subtitulo: 'Componentes, estado y buenas prácticas para apps reales',
    descripcion: 'Lleva tus habilidades de JavaScript al siguiente nivel construyendo interfaces con React: componentes, hooks, manejo de estado y rendimiento.',
    categoria: 'programacion', profesor: 'valentina', nivel: 'intermedio', diasDesdeCreacion: 90,
    etiquetas: ['React', 'JavaScript', 'Desarrollo web', 'Frontend'],
    aprenderas: ['Pensar la interfaz como componentes', 'Manejar estado con hooks', 'Consumir APIs', 'Optimizar el rendimiento'],
    requisitos: ['Bases de JavaScript y HTML'],
    modulos: [
      { titulo: 'Fundamentos', lecciones: [
        { titulo: 'Componentes y props', previa: true, puntos: ['Un componente es una función que devuelve interfaz', 'Las props son los datos que recibe desde afuera', 'Componentes pequeños son más fáciles de probar'] },
        { titulo: 'Estado con useState', puntos: ['El estado guarda datos que cambian con el tiempo', 'Al cambiar el estado, React vuelve a pintar el componente', 'Nunca modifiques el estado directamente: usa la función que lo actualiza'] },
      ] },
      { titulo: 'Datos y efectos', lecciones: [
        { titulo: 'Efectos y llamadas a APIs', puntos: ['`useEffect` sincroniza el componente con algo externo', 'Maneja los estados de carga, error y éxito', 'Limpia suscripciones al desmontar'] },
        { titulo: 'Rendimiento', puntos: ['Evita trabajo innecesario en cada render', '`useMemo` y `useCallback` ayudan solo cuando hay un costo real', 'Mide antes de optimizar'] },
      ] },
    ],
    evaluacion: [
      { enunciado: '¿Qué ocurre cuando cambia el estado de un componente?', opciones: ['Se recarga toda la página', 'React vuelve a pintar el componente', 'Nada, hay que llamar a render()'], correcta: 1, explicacion: 'El cambio de estado provoca un nuevo render.' },
      { enunciado: '¿Para qué sirve `useEffect`?', opciones: ['Para dar estilo', 'Para sincronizar el componente con sistemas externos', 'Para crear rutas'], correcta: 1, explicacion: 'Se usa para efectos secundarios como llamadas a APIs.' },
    ],
  },
  {
    slug: 'analisis-datos-python', titulo: 'Análisis de datos con Python', subtitulo: 'Pandas, visualización y preguntas que importan',
    descripcion: 'Aprende a limpiar, explorar y visualizar datos reales con Pandas. Al final sabrás convertir una tabla desordenada en conclusiones claras.',
    categoria: 'datos', profesor: 'andres', nivel: 'principiante', diasDesdeCreacion: 220,
    etiquetas: ['Python', 'Pandas', 'Visualización', 'Análisis de datos'],
    aprenderas: ['Cargar y limpiar datos con Pandas', 'Resumir y agrupar información', 'Crear gráficos claros', 'Comunicar hallazgos'],
    requisitos: ['Bases de Python (variables y funciones)'],
    modulos: [
      { titulo: 'Datos en tablas', lecciones: [
        { titulo: 'DataFrames', previa: true, puntos: ['Un DataFrame es una tabla con filas y columnas con nombre', 'Se carga desde CSV con `pd.read_csv()`', 'Revisa siempre las primeras filas y los tipos de datos'] },
        { titulo: 'Limpieza de datos', puntos: ['Detecta valores faltantes con `isna()`', 'Decide si eliminarlos o imputarlos según el contexto', 'Corrige tipos y formatos antes de analizar'] },
      ] },
      { titulo: 'Exploración y gráficos', lecciones: [
        { titulo: 'Agrupar y resumir', puntos: ['`groupby` agrupa filas por una categoría', 'Calcula promedios, conteos y totales por grupo', 'Las tablas dinámicas resumen dos dimensiones'] },
        { titulo: 'Visualización efectiva', puntos: ['Elige el gráfico según la pregunta: tendencia, comparación o distribución', 'Rotula ejes y usa títulos que digan la conclusión', 'No dependas solo del color: agrega etiquetas'] },
      ] },
    ],
    evaluacion: [
      { enunciado: '¿Qué función carga un archivo CSV en Pandas?', opciones: ['pd.read_csv()', 'pd.open()', 'pd.load()'], correcta: 0, explicacion: 'read_csv convierte el archivo en un DataFrame.' },
      { enunciado: '¿Qué hace `groupby`?', opciones: ['Ordena la tabla', 'Agrupa filas por una categoría para resumirlas', 'Elimina duplicados'], correcta: 1, explicacion: 'groupby agrupa para calcular resúmenes por grupo.' },
    ],
  },
  {
    slug: 'estadistica-practica', titulo: 'Estadística práctica', subtitulo: 'Entiende los números detrás de cada decisión',
    descripcion: 'Promedios, variabilidad, probabilidad y pruebas de hipótesis explicadas con ejemplos cotidianos y sin fórmulas innecesarias.',
    categoria: 'datos', profesor: 'andres', nivel: 'principiante', diasDesdeCreacion: 180,
    etiquetas: ['Estadística', 'Probabilidad', 'Análisis de datos'],
    aprenderas: ['Describir datos con medidas de tendencia y dispersión', 'Interpretar probabilidades', 'Leer un intervalo de confianza', 'Evitar errores comunes de interpretación'],
    requisitos: ['Matemáticas básicas de colegio'],
    modulos: [
      { titulo: 'Describir datos', lecciones: [
        { titulo: 'Media, mediana y moda', previa: true, puntos: ['La media es sensible a valores extremos', 'La mediana es el valor del medio y resiste extremos', 'Usa la mediana para ingresos o precios'] },
        { titulo: 'Variabilidad', puntos: ['La desviación estándar mide qué tan dispersos están los datos', 'Dos grupos con igual promedio pueden ser muy distintos', 'Siempre reporta el promedio junto a la dispersión'] },
      ] },
      { titulo: 'Inferencia', lecciones: [
        { titulo: 'Muestras y población', puntos: ['Una muestra representa a una población si se elige al azar', 'Muestras sesgadas llevan a conclusiones falsas', 'Más datos reducen la incertidumbre, pero no corrigen el sesgo'] },
        { titulo: 'Correlación no es causalidad', puntos: ['Dos variables pueden moverse juntas por una tercera causa', 'Los experimentos controlados permiten hablar de causas', 'Desconfía de titulares que confunden ambas cosas'] },
      ] },
    ],
    evaluacion: [
      { enunciado: '¿Qué medida resiste mejor a valores extremos?', opciones: ['Media', 'Mediana', 'Rango'], correcta: 1, explicacion: 'La mediana no se mueve por unos pocos valores extremos.' },
      { enunciado: 'Si dos variables están correlacionadas…', opciones: ['Una causa la otra', 'No necesariamente hay causalidad', 'Son independientes'], correcta: 1, explicacion: 'Correlación no implica causalidad.' },
    ],
  },
  {
    slug: 'machine-learning-aplicado', titulo: 'Machine Learning aplicado', subtitulo: 'Modelos predictivos de principio a fin con scikit-learn',
    descripcion: 'Entrena, evalúa y explica modelos de machine learning. Trabajarás con regresión, clasificación y sistemas de recomendación como el de esta plataforma.',
    categoria: 'datos', profesor: 'andres', nivel: 'intermedio', diasDesdeCreacion: 60,
    etiquetas: ['Machine Learning', 'Python', 'Inteligencia artificial', 'Scikit-learn'],
    aprenderas: ['Preparar datos para modelar', 'Entrenar modelos de regresión y clasificación', 'Evaluar con métricas adecuadas', 'Construir un recomendador simple'],
    requisitos: ['Python y Pandas', 'Estadística básica'],
    modulos: [
      { titulo: 'Cómo aprende una máquina', lecciones: [
        { titulo: 'Aprendizaje supervisado', previa: true, puntos: ['El modelo aprende de ejemplos con respuesta conocida', 'Se separan datos de entrenamiento y de prueba', 'El objetivo es generalizar a datos nuevos'] },
        { titulo: 'Sobreajuste', puntos: ['Un modelo sobreajustado memoriza en vez de aprender', 'Se detecta cuando va bien en entrenamiento y mal en prueba', 'La validación cruzada ayuda a medirlo'] },
      ] },
      { titulo: 'Recomendadores', lecciones: [
        { titulo: 'Filtrado colaborativo y por contenido', puntos: ['El colaborativo usa lo que hicieron usuarios parecidos', 'El basado en contenido compara características de los ítems', 'Los sistemas reales combinan ambos (híbridos), como esta plataforma'] },
        { titulo: 'Explicar las recomendaciones', puntos: ['Decir "por qué" genera confianza', 'Permite al usuario corregir al sistema', 'Es clave para un uso ético de la IA'] },
      ] },
    ],
    evaluacion: [
      { enunciado: '¿Cómo se detecta el sobreajuste?', opciones: ['Buen desempeño en entrenamiento y malo en prueba', 'Malo en ambos', 'Bueno en ambos'], correcta: 0, explicacion: 'Memorizar el entrenamiento no generaliza.' },
      { enunciado: 'Un recomendador colaborativo se basa en…', opciones: ['Las características del ítem', 'Lo que hicieron usuarios con gustos parecidos', 'El precio del producto'], correcta: 1, explicacion: 'Aprovecha patrones de comportamiento compartidos.' },
    ],
  },
  {
    slug: 'sql-para-analistas', titulo: 'SQL para analistas', subtitulo: 'Consulta bases de datos y responde preguntas de negocio',
    descripcion: 'Aprende a extraer información de bases de datos con SQL: filtrar, unir tablas y agregar resultados para responder preguntas reales.',
    categoria: 'datos', profesor: 'andres', nivel: 'principiante', diasDesdeCreacion: 120,
    etiquetas: ['SQL', 'Bases de datos', 'Análisis de datos'],
    aprenderas: ['Escribir consultas SELECT', 'Filtrar y ordenar resultados', 'Unir tablas con JOIN', 'Agregar con GROUP BY'],
    requisitos: ['Ninguno'],
    modulos: [
      { titulo: 'Consultas básicas', lecciones: [
        { titulo: 'SELECT y WHERE', previa: true, puntos: ['SELECT elige columnas', 'WHERE filtra filas que cumplen una condición', 'ORDER BY ordena el resultado'] },
        { titulo: 'JOIN', puntos: ['Une tablas relacionadas por una columna común', 'INNER JOIN devuelve solo coincidencias', 'LEFT JOIN conserva todas las filas de la izquierda'] },
      ] },
      { titulo: 'Resumir', lecciones: [
        { titulo: 'GROUP BY y agregaciones', puntos: ['COUNT, SUM y AVG resumen grupos', 'HAVING filtra después de agrupar', 'Piensa primero en la pregunta, luego en la consulta'] },
      ] },
    ],
    evaluacion: [
      { enunciado: '¿Qué cláusula filtra filas?', opciones: ['ORDER BY', 'WHERE', 'SELECT'], correcta: 1, explicacion: 'WHERE aplica condiciones a las filas.' },
      { enunciado: '¿Qué JOIN conserva todas las filas de la tabla izquierda?', opciones: ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN'], correcta: 1, explicacion: 'LEFT JOIN completa con nulos cuando no hay coincidencia.' },
    ],
  },
  {
    slug: 'diseno-ux-ui', titulo: 'Diseño UX/UI', subtitulo: 'Crea productos digitales útiles, usables y bellos',
    descripcion: 'Investiga a tus usuarios, diseña flujos y crea interfaces en Figma. Un curso práctico para empezar en diseño de producto.',
    categoria: 'diseno', profesor: 'camila', nivel: 'principiante', diasDesdeCreacion: 210,
    etiquetas: ['UX', 'UI', 'Figma', 'Diseño de producto'],
    aprenderas: ['Investigar necesidades de usuarios', 'Diseñar flujos y wireframes', 'Crear interfaces en Figma', 'Validar con pruebas de usabilidad'],
    requisitos: ['Ninguno'],
    modulos: [
      { titulo: 'Entender a las personas', lecciones: [
        { titulo: 'Qué es la experiencia de usuario', previa: true, puntos: ['UX es cómo se siente usar un producto de principio a fin', 'Se diseña a partir de necesidades reales, no de suposiciones', 'Incluye a personas con distintas capacidades'] },
        { titulo: 'Entrevistas y personas', puntos: ['Pregunta por experiencias pasadas, no por opiniones futuras', 'Agrupa hallazgos en patrones', 'Las "personas" resumen perfiles para decidir mejor'] },
      ] },
      { titulo: 'Diseñar la interfaz', lecciones: [
        { titulo: 'Wireframes y jerarquía', puntos: ['Empieza en baja fidelidad para iterar rápido', 'La jerarquía visual guía la atención', 'Una acción principal por pantalla'] },
        { titulo: 'Sistemas de diseño en Figma', puntos: ['Componentes y estilos reutilizables dan consistencia', 'Define colores con contraste suficiente', 'Documenta estados: normal, foco, error y deshabilitado'] },
      ] },
    ],
    evaluacion: [
      { enunciado: 'En una entrevista de usuario conviene preguntar por…', opciones: ['Experiencias pasadas concretas', 'Qué funciones quieren en el futuro', 'Su color favorito'], correcta: 0, explicacion: 'Lo que la gente hizo es más fiable que lo que dice que haría.' },
      { enunciado: '¿Cuántas acciones principales debería tener una pantalla?', opciones: ['Todas las posibles', 'Una', 'Ninguna'], correcta: 1, explicacion: 'Una acción principal clara reduce la carga cognitiva.' },
    ],
  },
  {
    slug: 'color-y-tipografia', titulo: 'Color y tipografía', subtitulo: 'Fundamentos visuales para comunicar con claridad',
    descripcion: 'Domina el uso del color y la tipografía en piezas digitales e impresas, con criterios de contraste y legibilidad.',
    categoria: 'diseno', profesor: 'camila', nivel: 'principiante', diasDesdeCreacion: 150,
    etiquetas: ['Color', 'Tipografía', 'Diseño gráfico'],
    aprenderas: ['Construir paletas armónicas', 'Elegir y combinar tipografías', 'Garantizar contraste accesible', 'Crear jerarquía con tipo y color'],
    requisitos: ['Ninguno'],
    modulos: [
      { titulo: 'Color', lecciones: [
        { titulo: 'Teoría del color aplicada', previa: true, puntos: ['Matiz, saturación y luminosidad describen cualquier color', 'Las paletas se construyen con relaciones: análogos, complementarios', 'El color nunca debe ser el único portador de información'] },
        { titulo: 'Contraste accesible', puntos: ['El texto normal necesita contraste 4.5:1 con el fondo', 'Los textos grandes, al menos 3:1', 'Comprueba siempre con una herramienta de contraste'] },
      ] },
      { titulo: 'Tipografía', lecciones: [
        { titulo: 'Elegir y combinar fuentes', puntos: ['Combina una fuente para títulos con otra para texto', 'Prioriza la legibilidad en tamaños pequeños', 'Usa pocas familias y varios pesos'] },
      ] },
    ],
    evaluacion: [
      { enunciado: '¿Qué contraste mínimo necesita el texto normal?', opciones: ['2:1', '4.5:1', '10:1'], correcta: 1, explicacion: 'WCAG AA exige 4.5:1 para texto normal.' },
    ],
  },
  {
    slug: 'accesibilidad-web', titulo: 'Accesibilidad web en la práctica', subtitulo: 'Diseña y desarrolla para todas las personas',
    descripcion: 'Aprende a crear sitios que funcionen con lectores de pantalla, teclado y tecnologías de apoyo. Basado en las pautas WCAG 2.2.',
    categoria: 'inclusion', profesor: 'camila', nivel: 'intermedio', diasDesdeCreacion: 45,
    etiquetas: ['Accesibilidad', 'WCAG', 'Lectores de pantalla', 'UX', 'HTML'],
    aprenderas: ['Aplicar los principios WCAG', 'Probar con lector de pantalla y teclado', 'Escribir textos alternativos útiles', 'Hacer accesibles formularios y videos'],
    requisitos: ['Bases de HTML o de diseño de interfaces'],
    modulos: [
      { titulo: 'Principios', lecciones: [
        { titulo: 'Perceptible, operable, comprensible y robusto', previa: true, puntos: ['WCAG organiza las pautas en cuatro principios', 'Más de mil millones de personas viven con alguna discapacidad', 'La accesibilidad mejora la experiencia de todos'] },
        { titulo: 'Lectores de pantalla', puntos: ['NVDA, JAWS, VoiceOver y TalkBack leen la estructura de la página', 'Los encabezados y regiones permiten saltar rápidamente', 'Todo control necesita un nombre accesible'] },
      ] },
      { titulo: 'Contenido accesible', lecciones: [
        { titulo: 'Textos alternativos', puntos: ['Describe la función de la imagen, no solo su apariencia', 'Las imágenes decorativas llevan `alt` vacío', 'Los gráficos necesitan una descripción o tabla equivalente'] },
        { titulo: 'Video y audio accesibles', puntos: ['Subtítulos para personas sordas', 'Transcripción completa para personas sordociegas o que prefieren leer', 'Audiodescripción cuando la información es visual'] },
      ] },
    ],
    evaluacion: [
      { enunciado: '¿Qué `alt` debe tener una imagen puramente decorativa?', opciones: ['La palabra "imagen"', 'Un alt vacío (alt="")', 'El nombre del archivo'], correcta: 1, explicacion: 'Así los lectores de pantalla la ignoran.' },
      { enunciado: '¿Qué necesita una persona sordociega para acceder a un video?', opciones: ['Solo subtítulos', 'Una transcripción completa', 'Mayor volumen'], correcta: 1, explicacion: 'La transcripción puede leerse con una línea braille.' },
    ],
  },
  {
    slug: 'emprendimiento-digital', titulo: 'Emprendimiento digital', subtitulo: 'De la idea al primer cliente',
    descripcion: 'Valida tu idea de negocio, define tu propuesta de valor y consigue tus primeros clientes con métodos de bajo costo.',
    categoria: 'negocios', profesor: 'jorge', nivel: 'principiante', diasDesdeCreacion: 230,
    etiquetas: ['Emprendimiento', 'Modelo de negocio', 'Ventas'],
    aprenderas: ['Validar una idea antes de invertir', 'Diseñar un modelo de negocio', 'Definir precios', 'Conseguir los primeros clientes'],
    requisitos: ['Una idea, aunque sea pequeña'],
    modulos: [
      { titulo: 'Validar', lecciones: [
        { titulo: 'El problema antes que la solución', previa: true, puntos: ['Enamórate del problema, no de tu producto', 'Habla con 20 posibles clientes antes de construir', 'Busca evidencia de que pagarían'] },
        { titulo: 'Producto mínimo viable', puntos: ['Construye lo mínimo para aprender', 'Mide comportamiento, no opiniones', 'Itera con lo aprendido'] },
      ] },
      { titulo: 'Crecer', lecciones: [
        { titulo: 'Precios', puntos: ['El precio comunica valor', 'Calcula costos y margen', 'Prueba distintos planes'] },
      ] },
    ],
    evaluacion: [
      { enunciado: '¿Qué conviene hacer antes de construir el producto?', opciones: ['Registrar la marca', 'Hablar con posibles clientes', 'Contratar un equipo'], correcta: 1, explicacion: 'Validar el problema evita construir algo que nadie quiere.' },
    ],
  },
  {
    slug: 'finanzas-personales', titulo: 'Finanzas personales inteligentes', subtitulo: 'Presupuesto, ahorro e inversión sin complicaciones',
    descripcion: 'Toma el control de tu dinero: arma un presupuesto realista, crea un fondo de emergencia y entiende las opciones básicas de inversión.',
    categoria: 'negocios', profesor: 'jorge', nivel: 'principiante', diasDesdeCreacion: 160,
    etiquetas: ['Finanzas', 'Ahorro', 'Presupuesto'],
    aprenderas: ['Armar un presupuesto mensual', 'Crear un fondo de emergencia', 'Manejar deudas', 'Entender el interés compuesto'],
    requisitos: ['Ninguno'],
    modulos: [
      { titulo: 'Ordenar', lecciones: [
        { titulo: 'Tu presupuesto en 30 minutos', previa: true, puntos: ['Registra ingresos y gastos de un mes', 'Separa necesidades, deseos y ahorro', 'Revisa y ajusta cada mes'] },
        { titulo: 'Deudas', puntos: ['Prioriza las deudas con mayor interés', 'Evita pagar solo el mínimo', 'Negocia cuando sea posible'] },
      ] },
      { titulo: 'Crecer', lecciones: [
        { titulo: 'Interés compuesto', puntos: ['Los rendimientos generan nuevos rendimientos', 'El tiempo es el factor más poderoso', 'Empezar temprano, aunque sea poco, hace la diferencia'] },
      ] },
    ],
    evaluacion: [
      { enunciado: '¿Qué deuda conviene pagar primero?', opciones: ['La de menor interés', 'La de mayor interés', 'La más reciente'], correcta: 1, explicacion: 'Es la que más dinero cuesta mantener.' },
    ],
  },
  {
    slug: 'marketing-de-contenidos', titulo: 'Marketing de contenidos y redes', subtitulo: 'Atrae clientes con contenido que la gente quiere ver',
    descripcion: 'Planea, crea y mide contenido para redes sociales y blog. Incluye estrategia, calendario editorial y analítica.',
    categoria: 'marketing', profesor: 'jorge', nivel: 'principiante', diasDesdeCreacion: 140,
    etiquetas: ['Contenido', 'Redes sociales', 'Estrategia', 'Ventas'],
    aprenderas: ['Definir tu audiencia', 'Crear un calendario editorial', 'Escribir textos que conecten', 'Medir resultados'],
    requisitos: ['Ninguno'],
    modulos: [
      { titulo: 'Estrategia', lecciones: [
        { titulo: 'Conoce a tu audiencia', previa: true, puntos: ['Define a quién le hablas y qué problema tiene', 'Escucha lo que pregunta en redes y comentarios', 'Crea contenido que responda esas preguntas'] },
        { titulo: 'Calendario editorial', puntos: ['La constancia vence a la intensidad', 'Mezcla contenido educativo, inspirador y de venta', 'Planea con un mes de anticipación'] },
      ] },
      { titulo: 'Medir', lecciones: [
        { titulo: 'Métricas que importan', puntos: ['Alcance y seguidores no son ventas', 'Mide conversiones y retención', 'Ajusta según los datos'] },
      ] },
    ],
    evaluacion: [
      { enunciado: '¿Qué vence a la intensidad en contenido?', opciones: ['La constancia', 'El presupuesto', 'El volumen de hashtags'], correcta: 0, explicacion: 'Publicar con regularidad construye audiencia.' },
    ],
  },
  {
    slug: 'analitica-web', titulo: 'Analítica web', subtitulo: 'Decide con datos qué funciona en tu sitio',
    descripcion: 'Configura la medición de tu sitio, crea embudos de conversión e interpreta los datos para mejorar resultados.',
    categoria: 'marketing', profesor: 'andres', nivel: 'intermedio', diasDesdeCreacion: 75,
    etiquetas: ['Analítica', 'Métricas', 'Análisis de datos', 'Estrategia'],
    aprenderas: ['Definir objetivos medibles', 'Construir embudos de conversión', 'Hacer pruebas A/B', 'Presentar informes accionables'],
    requisitos: ['Conocer marketing digital básico'],
    modulos: [
      { titulo: 'Medir bien', lecciones: [
        { titulo: 'Objetivos y KPIs', previa: true, puntos: ['Un KPI está ligado a un objetivo de negocio', 'Menos métricas, mejor elegidas', 'Define la línea base antes de cambiar algo'] },
        { titulo: 'Pruebas A/B', puntos: ['Cambia una sola cosa por prueba', 'Espera a tener suficientes datos', 'La significancia evita conclusiones por azar'] },
      ] },
    ],
    evaluacion: [
      { enunciado: 'En una prueba A/B conviene cambiar…', opciones: ['Todo a la vez', 'Una sola variable', 'Nada'], correcta: 1, explicacion: 'Así sabes qué causó la diferencia.' },
    ],
  },
  {
    slug: 'ingles-conversacional', titulo: 'Inglés conversacional', subtitulo: 'Habla con confianza en situaciones reales',
    descripcion: 'Practica el inglés que se usa en el día a día y en el trabajo: presentarte, pedir ayuda, participar en reuniones y escribir correos.',
    categoria: 'idiomas', profesor: 'valentina', nivel: 'intermedio', diasDesdeCreacion: 190,
    etiquetas: ['Inglés', 'Conversación', 'Comunicación'],
    aprenderas: ['Presentarte con naturalidad', 'Participar en reuniones', 'Escribir correos claros', 'Ganar fluidez con práctica guiada'],
    requisitos: ['Nivel básico de inglés (A2)'],
    modulos: [
      { titulo: 'En el trabajo', lecciones: [
        { titulo: 'Presentarte', previa: true, puntos: ['"I work as…" y "I\'m in charge of…" describen tu rol', 'Practica una presentación de 30 segundos', 'Sonríe: la confianza se nota en la voz'] },
        { titulo: 'Reuniones', puntos: ['"Could you clarify…?" para pedir aclaraciones', '"I\'d like to add…" para intervenir con cortesía', 'Resume acuerdos al final'] },
      ] },
      { titulo: 'Por escrito', lecciones: [
        { titulo: 'Correos efectivos', puntos: ['Asunto claro y específico', 'Una idea por párrafo', 'Cierra con la acción esperada'] },
      ] },
    ],
    evaluacion: [
      { enunciado: '¿Qué frase sirve para pedir una aclaración?', opciones: ['Could you clarify that?', 'I don\'t care', 'See you later'], correcta: 0, explicacion: 'Es una forma cortés de pedir más detalle.' },
    ],
  },
  {
    slug: 'productividad-y-habitos', titulo: 'Productividad y hábitos', subtitulo: 'Haz lo importante sin agotarte',
    descripcion: 'Organiza tu tiempo, construye hábitos que duren y cuida tu energía con técnicas basadas en evidencia.',
    categoria: 'bienestar', profesor: 'camila', nivel: 'principiante', diasDesdeCreacion: 20,
    etiquetas: ['Productividad', 'Hábitos', 'Bienestar'],
    aprenderas: ['Priorizar lo importante', 'Construir hábitos pequeños', 'Gestionar la energía', 'Evitar el agotamiento'],
    requisitos: ['Ninguno'],
    modulos: [
      { titulo: 'Tiempo y energía', lecciones: [
        { titulo: 'Lo importante primero', previa: true, puntos: ['Distingue lo urgente de lo importante', 'Bloquea tiempo para tu tarea principal', 'Di que no a lo que no suma'] },
        { titulo: 'Hábitos que duran', puntos: ['Empieza ridículamente pequeño', 'Asocia el hábito a una rutina existente', 'Celebra el progreso, no la perfección'] },
      ] },
    ],
    evaluacion: [
      { enunciado: '¿Cómo conviene empezar un hábito nuevo?', opciones: ['Con una meta enorme', 'Muy pequeño y constante', 'Solo los fines de semana'], correcta: 1, explicacion: 'Lo pequeño es sostenible y crece.' },
    ],
  },
];

/** Comentarios de resena por rango de estrellas. */
export const COMENTARIOS: Record<number, string[]> = {
  5: ['Excelente curso, muy claro y práctico.', 'Me encantó: ejemplos reales y explicaciones sencillas.', 'De lo mejor que he tomado, lo recomiendo.', 'La profesora explica increíble y todo es accesible con lector de pantalla.', 'Contenido de mucho valor, ya lo estoy aplicando en mi trabajo.'],
  4: ['Muy buen curso, aunque me hubiera gustado más práctica.', 'Bien estructurado y fácil de seguir.', 'Buen contenido, las evaluaciones ayudan a repasar.'],
  3: ['Correcto, cumple lo que promete.', 'Útil para empezar, se queda corto en temas avanzados.'],
  2: ['Esperaba más profundidad.'],
  1: ['No era lo que buscaba.'],
};

export const NOMBRES = ['Ana', 'Luis', 'María', 'Carlos', 'Daniela', 'Juan', 'Sofía', 'Andrés', 'Valeria', 'Mateo', 'Isabella', 'Santiago', 'Camila', 'Sebastián', 'Mariana', 'Nicolás', 'Laura', 'Diego', 'Paula', 'Felipe', 'Juliana', 'Tomás', 'Gabriela', 'Samuel', 'Natalia', 'David', 'Sara', 'Alejandro', 'Manuela', 'Esteban'];
export const APELLIDOS = ['Gómez', 'Rodríguez', 'Martínez', 'López', 'Pérez', 'Torres', 'Díaz', 'Ramírez', 'Castro', 'Vargas', 'Rojas', 'Moreno', 'Jiménez', 'Ortiz', 'Silva', 'Mejía', 'Cárdenas', 'Barrios', 'Puello', 'Julio'];

/** Perfiles de estudiantes: categorias con las que se identifican (crea patrones para la senal colaborativa). */
export const PERFILES: string[][] = [
  ['programacion', 'datos'], ['programacion', 'diseno'], ['datos', 'marketing'], ['diseno', 'inclusion'],
  ['negocios', 'marketing'], ['idiomas', 'bienestar'], ['negocios', 'bienestar'], ['datos', 'negocios'],
];
