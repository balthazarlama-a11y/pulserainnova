// Biblioteca de recomendaciones clínicas curadas (contenido, NO datos de persona).
// Se usa como respaldo cuando la IA (/api/recommendations) no está disponible.
// Las claves coinciden con getStressKey(): calm | mild | moderate | high.

export const RECOMMENDATIONS = {
  // Estado tranquilo: actividades de mantenimiento y bienestar general
  calm: [
    {
      title: "Dibujo tranquilo",
      detail: "5 minutos de colorear con tonos suaves y música baja.",
      duration: "5 min",
      icon: "book",
      deepExplanation: "Hacer garabatos o colorear ayuda a mantener la concentración, relajar la mente y disminuir los niveles de ansiedad. Cuando dibujamos sin un objetivo específico, el cerebro entra en un estado de calma activa que reduce el cortisol y favorece la creatividad. Es ideal como actividad de cierre de jornada.",
    },
    {
      title: "Pausa de agua",
      detail: "Tomar agua lentamente y contar 10 tragos juntos.",
      duration: "2 min",
      icon: "heart",
      deepExplanation: "Tomar agua lentamente activa el sistema nervioso parasimpático y favorece la hidratación cerebral, que influye directamente en el estado de ánimo. Contar los tragos redirige la atención y ayuda a salir del ciclo de pensamientos automáticos. Una pausa de agua también señala al cuerpo un momento de transición y calma.",
    },
    {
      title: "Estiramiento suave",
      detail: "Brazos arriba y respirar profundo tres veces.",
      duration: "3 min",
      icon: "wind",
      deepExplanation: "El movimiento suave libera la tensión muscular acumulada durante el estrés cotidiano. Al estirar los brazos y respirar profundo, enviamos señales al cerebro de que el cuerpo está seguro y relajado. Tres respiraciones profundas con estiramiento son suficientes para reducir el cortisol de manera perceptible.",
    },
  ],
  // Pre-episodio: intervención temprana cuando las métricas empiezan a subir
  mild: [
    {
      title: "Respira 4-4-6",
      detail: "Inhala 4 seg, mantén 4, exhala 6 con una mano en el pecho.",
      duration: "3 min",
      icon: "wind",
      deepExplanation: "La técnica 4-4-6 (inhala 4 seg, mantén 4, exhala 6) activa el nervio vago y reduce el ritmo cardíaco de forma natural. La exhalación más larga que la inhalación es la clave: indica al sistema nervioso autónomo que el peligro pasó. Apoyar la mano en el pecho añade retroalimentación táctil que ancla la atención en el cuerpo.",
    },
    {
      title: "Minijuego de burbujas",
      detail: "Reventar burbujas al ritmo de la respiración.",
      duration: "5 min",
      icon: "gamepad",
      deepExplanation: "Soplar burbujas obliga a realizar una exhalación lenta y controlada, lo que activa la respuesta de relajación del sistema nervioso parasimpático. El componente lúdico distrae la mente de los pensamientos ansiosos y activa el circuito de recompensa del cerebro. Es una de las técnicas más efectivas para niños en estado de alerta leve.",
    },
    {
      title: "Música lenta",
      detail: "Canción suave con palmas lentas para bajar la energía.",
      duration: "6 min",
      icon: "music",
      deepExplanation: "Los ritmos lentos de 60 a 80 BPM sincronizan con el ritmo cardíaco y lo guían hacia la calma mediante el fenómeno de 'arrastre rítmico'. Marcar el tempo con palmas añade un componente corporal que ancla la atención en el presente y reduce los pensamientos intrusivos. Ideal para transiciones entre actividades escolares.",
    },
  ],
  // Estrés moderado: intervención activa necesaria
  moderate: [
    {
      title: "Círculo de calma",
      detail: "Dibujar un círculo con el dedo y seguirlo con la respiración.",
      duration: "4 min",
      icon: "wind",
      deepExplanation: "Trazar un círculo con el dedo mientras se sincroniza la respiración activa el sistema sensoriomotriz, interrumpiendo el ciclo de ansiedad. La combinación de movimiento manual, visión y respiración es más efectiva que cada técnica por separado. Este ejercicio puede hacerse en cualquier superficie: la mesa del colegio, la rodilla o un papel.",
    },
    {
      title: "Historia corta",
      detail: "Leer un cuento breve juntos en un rincón tranquilo.",
      duration: "7 min",
      icon: "book",
      deepExplanation: "Leer un cuento juntos activa la imaginación y desvía la atención del malestar hacia un mundo narrativo seguro. Compartir la experiencia en un ambiente tranquilo refuerza el vínculo afectivo y la sensación de seguridad, lo cual es fundamental para regular las emociones en la infancia. La voz suave del cuidador también tiene efecto calmante.",
    },
    {
      title: "Abrazo mariposa",
      detail: "Cruzar brazos y dar toques suaves alternados.",
      duration: "3 min",
      icon: "heart",
      deepExplanation: "Los toques suaves alternados en los brazos cruzados estimulan los dos hemisferios cerebrales de forma bilateral. Esta técnica, utilizada en terapia EMDR, ayuda a integrar emociones difíciles y reducir la intensidad del estrés de manera rápida. Puede hacerse solo o con ayuda de un adulto. No requiere ningún material.",
    },
  ],
  // Durante/Post-episodio: acciones de crisis cuando el estrés está en su pico
  high: [
    {
      title: "Respiración 4-7-8",
      detail: "Inhala 4 seg, mantén 7, exhala 8 mientras miras un punto fijo.",
      duration: "4 min",
      icon: "wind",
      deepExplanation: "La técnica 4-7-8 del Dr. Andrew Weil es una de las más rápidas para calmar una crisis de ansiedad aguda. El tiempo prolongado de retención (7 seg) y exhalación (8 seg) activa fuertemente el sistema nervioso parasimpático y reduce el cortisol en pocos minutos. Mirar un punto fijo añade anclaje visual que corta el ciclo de pensamientos en espiral.",
    },
    {
      title: "Contacto con el suelo",
      detail: "Presionar los pies contra el suelo y sentir el peso del cuerpo.",
      duration: "3 min",
      icon: "heart",
      deepExplanation: "Presionar los pies contra el suelo (técnica de 'grounding') activa los receptores propioceptivos del cuerpo y ancla la conciencia en el momento presente. Ayuda a salir del estado de alarma activando la sensación de seguridad física y presencia corporal. Puede hacerse sentado o de pie en cualquier lugar. Puede acompañarse diciendo en voz baja: 'Estoy aquí, estoy seguro.'",
    },
    {
      title: "Rincón seguro",
      detail: "Ir a un lugar cómodo con luz baja, manta suave y silencio.",
      duration: "6 min",
      icon: "book",
      deepExplanation: "Un espacio físico con baja estimulación sensorial (luz suave, manta, silencio) reduce la sobrecarga del sistema nervioso que ocurre durante un pico de estrés. El entorno calmo comunica al cerebro que no hay amenaza real y permite que el sistema nervioso autónomo vuelva al equilibrio. Tener un 'rincón seguro' predefinido acelera la recuperación porque el cerebro ya lo asocia con la calma.",
    },
  ],
};
