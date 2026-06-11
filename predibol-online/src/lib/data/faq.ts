// ─── FAQ Data ──────────────────────────────────────────
// Each item describes a question + answer for the /help accordion.
// Add, remove, or reorder items freely — the UI reads this array.
//
// Images use `src` relative to /public. If an image does not exist yet,
// we still reference it and the UI will handle the fallback gracefully.
// Append missing images to /public/assets/not_found_image.txt.

export interface FaqImage {
  /** Path relative to /public, e.g. "/assets/images/help/help-img-1.png" */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Optional caption shown below the image */
  caption?: string;
}

export interface FaqItem {
  /** Unique stable key — never change after publishing */
  id: string;
  /** Question in Spanish */
  question: string;
  /** Answer in Spanish. Supports simple HTML: <strong>, <em>, <br>, <ul>, <ol>, <li>, <table>, etc. */
  answer: string;
  /** Optional images to illustrate the answer */
  images?: FaqImage[];
}

export const faqItems: FaqItem[] = [
  // ── 1 ──────────────────────────────────────────────
  {
    id: "completar-predicciones",
    question: "¿Cómo completo las predicciones por partido del mundial?",
    answer: `
      <p>Para completar tus predicciones seguí estos pasos:</p>
      <ol>
        <li><strong>Iniciá sesión</strong> con tu cuenta de Google desde la página principal.</li>
        <li>Navegá al <strong>Portal de Predicciones</strong> (se abre automáticamente al iniciar sesión).</li>
        <li>Seleccioná la <strong>fecha</strong> del partido usando las pestañas superiores.</li>
        <li>En cada tarjeta de partido, ingresá los <strong>goles</strong> que creés que hará cada equipo (valores de 0 a 30).</li>
        <li>Presioná el botón <strong>"Save"</strong> para guardar tu predicción.</li>
        <li>Verás un mensaje <strong>"✓ Saved!"</strong> verde cuando se haya guardado correctamente.</li>
      </ol>
      <p>Podés <strong>editar</strong> tus predicciones en cualquier momento <strong>hasta 10 minutos antes</strong> del inicio del partido (hora de Bolivia). Después de ese límite, la predicción queda bloqueada y solo podrás verla.</p>
      <p>Si un partido ya pasó su fecha límite y no guardaste ninguna predicción, verás el mensaje <em>"No prediction was saved"</em> en la tarjeta.</p>
    `,
    images: [
      {
        src: "/assets/images/help/help-img-1.png",
        alt: "Interfaz de predicción mostrando las tarjetas de partidos con campos de goles y botón Save",
        caption: "Vista del portal de predicciones con las tarjetas de partido.",
      },
      {
        src: "/assets/images/help/help-img-2.png",
        alt: "Vista completa del dashboard de predicciones con selector de fechas y múltiples partidos",
        caption: "Dashboard completo con pestañas de fecha y múltiples partidos.",
      },
    ],
  },

  // ── 2 ──────────────────────────────────────────────
  {
    id: "calculo-puntos",
    question: "¿Cómo se calculan los puntos de mis predicciones?",
    answer: `
      <p>Los puntos se calculan de la siguiente manera por cada partido:</p>
      <ul>
        <li><strong>+3 puntos</strong> si acertás el resultado exacto (ej: predijiste 2-1 y el partido terminó 2-1).</li>
        <li><strong>+1 punto</strong> si acertás el ganador o el empate, pero no el marcador exacto (ej: predijiste 1-0 y terminó 2-1, ganando el mismo equipo).</li>
        <li><strong>0 puntos</strong> si no acertás ni el resultado ni el ganador/empate.</li>
      </ul>
      <table>
        <tr><th>Resultado Real</th><th>Tu Predicción</th><th>Puntos</th><th>Motivo</th></tr>
        <tr><td>Bolivia 2 - 1 Brasil</td><td>Bolivia 2 - 1 Brasil</td><td>3 pts</td><td>Resultado exacto</td></tr>
        <tr><td>Bolivia 2 - 1 Brasil</td><td>Bolivia 1 - 0 Brasil</td><td>1 pto</td><td>Acertó el ganador</td></tr>
        <tr><td>Bolivia 2 - 1 Brasil</td><td>Bolivia 2 - 3 Brasil</td><td>0 pts</td><td>No acertó ganador ni marcador</td></tr>
        <tr><td>Argentina 1 - 1 Italia</td><td>Francia 0 - 0 Italia</td><td>1 pto</td><td>Acertó el empate</td></tr>
      </table>
      <p><strong>Importante:</strong> Solo se consideran los goles del tiempo reglamentario + alargues. Los penales no cuentan para el marcador de la predicción.</p>
    `,
  },

  // ── 3 ──────────────────────────────────────────────
  {
    id: "prediccion-podio",
    question: "¿Cómo funciona la predicción del podio del mundial?",
    answer: `
      <p>Cada participante puede realizar <strong>una única predicción del podio</strong> antes del <strong>28 de junio de 2026</strong>.</p>
      <p>Debés seleccionar:</p>
      <ul>
        <li><strong>1ᵉʳ lugar (Campeón):</strong> +20 puntos si acertás.</li>
        <li><strong>2ᵈᵒ lugar (Subcampeón):</strong> +10 puntos si acertás.</li>
        <li><strong>3ᵉʳ lugar:</strong> +5 puntos si acertás.</li>
      </ul>
      <p><strong>Restricción:</strong> No podés repetir el mismo país en dos posiciones diferentes. Por ejemplo, no es válido poner a España como 1° y 2° lugar al mismo tiempo.</p>
      <p>Una vez pasada la fecha límite (28 de junio), la predicción del podio <strong>no se puede modificar</strong>.</p>
    `,
    images: [
      {
        src: "/assets/images/help/help-podium-prediction.png",
        alt: "Modal de predicción del podio con selectores de países para 1er, 2do y 3er lugar",
        caption: "(Imagen sugerida: modal con los 3 selectores de países para campeón, subcampeón y tercer lugar.)",
      },
    ],
  },

  // ── 4 ──────────────────────────────────────────────
  {
    id: "limite-tiempo",
    question: "¿Hasta cuándo puedo modificar mis predicciones?",
    answer: `
      <p>Podés crear o modificar tus predicciones <strong>hasta 10 minutos antes del inicio de cada partido</strong> (hora de Bolivia, UTC-4).</p>
      <p>Cuando faltan 10 minutos o menos para el inicio:</p>
      <ul>
        <li>La tarjeta del partido cambia a color <strong>ámbar</strong> con un badge de <strong>"Locked"</strong>.</li>
        <li>Los campos de goles se <strong>deshabilitan</strong> y pasan a modo solo lectura.</li>
        <li>Ya <strong>no podés guardar</strong> nuevas predicciones ni modificar las existentes para ese partido.</li>
      </ul>
      <p>Los demás partidos que todavía no alcanzaron su fecha límite <strong>siguen estando disponibles</strong> para editar.</p>
    `,
  },

  // ── 5 ──────────────────────────────────────────────
  {
    id: "eliminacion-empate",
    question: "¿Qué pasa si un partido de eliminación directa termina en empate?",
    answer: `
      <p>En los partidos de eliminación directa (octavos, cuartos, semifinales, final), si el partido termina empatado, podés indicar opcionalmente <strong>qué equipo avanza en penales</strong>.</p>
      <p>Tené en cuenta:</p>
      <ul>
        <li>Esta predicción <strong>no otorga puntos adicionales</strong>.</li>
        <li>Se usa únicamente como <strong>criterio de desempate</strong> en el ranking final (ver "¿Cómo se resuelven los empates en el ranking?").</li>
        <li>Los puntos del partido se calculan normalmente sobre el marcador de los 120 minutos (tiempo reglamentario + alargue).</li>
      </ul>
      <p><strong>Ejemplo:</strong> Predijiste Argentina 1 - 1 Francia (pasa Argentina). El partido terminó 1-1 y Francia ganó en penales. Recibís <strong>1 punto</strong> por acertar el empate. Tu predicción de que pasaba Argentina queda registrada para desempates.</p>
    `,
  },

  // ── 6 ──────────────────────────────────────────────
  {
    id: "poza-diaria",
    question: "¿Cómo funciona la poza diaria?",
    answer: `
      <p>La poza diaria es un sistema opcional de premios por partido. Cada día puede designarse un <strong>"Partido del Día"</strong> con una poza especial.</p>
      <p><strong>¿Cómo participar?</strong></p>
      <ol>
        <li>Realizá un <strong>pago extra</strong> del monto definido (ej: 10 Bs) para ese partido.</li>
        <li>Subí el <strong>comprobante de pago</strong> (JPG, PNG o WEBP, máximo 5 MB).</li>
        <li>Tu predicción para ese partido ahora participa en la poza diaria.</li>
      </ol>
      <p><strong>Reglas importantes:</strong></p>
      <ul>
        <li>Mínimo <strong>3 jugadores</strong> para que se active la poza. Si no se llega al mínimo, recibís un crédito.</li>
        <li>Distribución: <strong>90% para ganadores</strong> y <strong>10% para mantenimiento</strong> de la plataforma.</li>
        <li>Si nadie acierta el resultado exacto, el 90% se <strong>acumula</strong> para la siguiente poza diaria.</li>
        <li>Podés hacer <strong>múltiples predicciones</strong> para el mismo partido, pero los valores no pueden repetirse. En ese caso, solo podés ganar los 3 puntos del resultado exacto, no el punto por tendencia.</li>
      </ul>
      <p>El resultado válido para la poza diaria es el marcador al finalizar el partido <strong>incluyendo alargues, sin contar penales</strong>.</p>
    `,
    images: [
      {
        src: "/assets/images/help/help-daily-pool.png",
        alt: "Interfaz de la poza diaria mostrando el Partido del Día destacado con borde dorado y opción de pago extra",
        caption: "(Imagen sugerida: tarjeta del Partido del Día con borde dorado, badge \"Match of the Day\", y botón para agregar predicción extra con carga de comprobante.)",
      },
    ],
  },

  // ── 7 ──────────────────────────────────────────────
  {
    id: "desempates-ranking",
    question: "¿Cómo se resuelven los empates en el ranking?",
    answer: `
      <p>Si dos o más jugadores terminan el mundial con los <strong>mismos puntos totales</strong>, se aplican los siguientes criterios en orden:</p>
      <ol>
        <li><strong>Mayor número de resultados exactos</strong> (3 puntos).</li>
        <li><strong>Mayor número de aciertos de ganador/empate</strong> (1 punto).</li>
        <li><strong>Mayor número de aciertos de ganador en penales</strong> en partidos de eliminación directa.</li>
      </ol>
      <p>Si después de aplicar los 3 criterios <strong>el empate persiste</strong>, se fusionan las posiciones y el dinero correspondiente se reparte en partes iguales entre los empatados.</p>
      <p><strong>Ejemplo:</strong> Dos jugadores empatan en 1ᵉʳ lugar en absolutamente todo. Se suma el premio de 1° (50%) + 2° (25%) = 75% del pozo total, y cada uno recibe el 37.5%.</p>
    `,
  },

  // ── 8 ──────────────────────────────────────────────
  {
    id: "creditos",
    question: "¿Qué son los créditos y cómo se usan?",
    answer: `
      <p>Los <strong>créditos</strong> son fichas virtuales que podés usar para participar en pozas diarias sin necesidad de pagar nuevamente.</p>
      <p><strong>¿Cómo se obtienen?</strong></p>
      <ul>
        <li>Cuando una poza diaria se <strong>cancela</strong> por no alcanzar el mínimo de 3 jugadores.</li>
        <li>Cuando un premio diario no se cobra a tiempo y se <strong>convierte automáticamente</strong> en créditos.</li>
        <li>Por <strong>ajustes administrativos</strong> manuales.</li>
      </ul>
      <p><strong>¿Cómo se usan?</strong></p>
      <ul>
        <li><strong>1 crédito = 1 entrada a poza diaria</strong> (equivalente a 10 Bs).</li>
        <li>Al momento de participar en una poza diaria, podés elegir entre <em>"Subir comprobante"</em> o <em>"Usar crédito disponible"</em>.</li>
      </ul>
      <p>Podés ver tu saldo de créditos disponibles en tu <strong>perfil</strong> (botón flotante en la esquina inferior derecha).</p>
    `,
  },

  // ── 9 ──────────────────────────────────────────────
  {
    id: "pagos-premios",
    question: "¿Cómo y cuándo se entregan los premios?",
    answer: `
      <p><strong>Premios de poza diaria:</strong></p>
      <ul>
        <li>Se publica la lista de ganadores al finalizar la jornada.</li>
        <li>El ganador debe enviar su <strong>QR de cobro</strong> (a su nombre) antes del siguiente partido.</li>
        <li>Si no se envía el QR a tiempo, el premio se convierte en <strong>créditos</strong> automáticamente.</li>
        <li>El pago se realiza el mismo día, salvo casos de fuerza mayor.</li>
      </ul>
      <p><strong>Premio del pozo mundialero:</strong></p>
      <ul>
        <li>Se entrega en un plazo máximo de <strong>1 día</strong> después de la final del mundial.</li>
        <li>Distribución: 1° lugar (50%), 2° (25%), 3° (15%), 4° (5%), Donación Refugio Esperanza (5%).</li>
      </ul>
      <p>Todos los participantes deben ser <strong>mayores de edad</strong> y contar con una cuenta bancaria para recibir premios.</p>
    `,
  },

  // ── 10 ─────────────────────────────────────────────
  {
    id: "partido-reprogramado",
    question: "¿Qué pasa si un partido se reprograma o cancela?",
    answer: `
      <p>Si un partido se <strong>reprograma</strong> para otra fecha:</p>
      <ul>
        <li>Las predicciones existentes se mantienen para la nueva fecha.</li>
        <li><strong>No se pueden agregar nuevas predicciones</strong> después de la fecha original.</li>
        <li>Si el partido tenía poza diaria, esta se transfiere a la nueva fecha.</li>
      </ul>
      <p>Si un partido se <strong>cancela definitivamente</strong>:</p>
      <ul>
        <li>El partido se marca como <em>"Canceled"</em> en la plataforma.</li>
        <li>No otorga puntos a nadie.</li>
        <li>Si tenía poza diaria, las predicciones pagadas generan <strong>créditos</strong> para los participantes.</li>
      </ul>
    `,
  },

  // ── 11 ─────────────────────────────────────────────
  {
    id: "predicciones-vacias",
    question: "¿Es obligatorio predecir todos los partidos?",
    answer: `
      <p><strong>No es obligatorio.</strong> Podés dejar partidos sin predecir.</p>
      <p>Sin embargo, tené en cuenta que:</p>
      <ul>
        <li>Los partidos sin predicción <strong>no suman puntos</strong>.</li>
        <li>No hay penalización por no predecir, pero perdés la oportunidad de sumar.</li>
        <li>Si no hacés ninguna predicción en todo el mundial, tu puntaje final será <strong>0</strong>.</li>
      </ul>
      <p>Te recomendamos predecir la mayor cantidad de partidos posibles para maximizar tus chances en el ranking.</p>
    `,
  },

  // ── 12 ─────────────────────────────────────────────
  {
    id: "acceso-plataforma",
    question: "¿Quiénes pueden acceder a la plataforma?",
    answer: `
      <p>Predibol Online es una plataforma <strong>privada y cerrada</strong>.</p>
      <p>Solo pueden participar:</p>
      <ul>
        <li>Personas previamente <strong>registradas en la lista blanca</strong> por los administradores.</li>
        <li>Usuarios que hayan completado el <strong>pago de entrada</strong>.</li>
        <li>Participantes que inicien sesión con <strong>Google</strong> (mismo email con el que fueron registrados).</li>
      </ul>
      <p>Si intentás acceder sin estar autorizado, verás un mensaje: <em>"You are not authorized to submit predictions. Please contact the administrator."</em></p>
      <p>Esta es una actividad <strong>entre amigos y conocidos</strong>, sin fines de lucro, creada para vivir la pasión mundialera.</p>
    `,
  },
];
