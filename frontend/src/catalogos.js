// Mantener los valores alineados con backend/src/validation/solicitud.js.
export const estados = { PENDIENTE: 'Pendiente', EN_ATENCION: 'En atención', ATENDIDA: 'Atendida' };

export const estadosConfig = {
  PENDIENTE: { label: 'Pendiente', desc: 'Esperando asignación de equipo', step: 1 },
  EN_ATENCION: { label: 'En atención', desc: 'Equipo de ayuda en terreno', step: 2 },
  ATENDIDA: { label: 'Atendida', desc: 'Asistencia humanitaria completada', step: 3 },
};

export const ayudas = {
  ALIMENTACION: 'Alimentación',
  ALOJAMIENTO: 'Alojamiento',
  ATENCION_MEDICA: 'Atención médica',
  RESCATE: 'Rescate',
  OTRA: 'Otra',
};

export const ayudasConfig = {
  ALIMENTACION: { label: 'Alimentación', badgeClass: 'ayuda-alimentacion' },
  ALOJAMIENTO: { label: 'Alojamiento', badgeClass: 'ayuda-alojamiento' },
  ATENCION_MEDICA: { label: 'Atención médica', badgeClass: 'ayuda-medica', urgent: true },
  RESCATE: { label: 'Rescate', badgeClass: 'ayuda-rescate', urgent: true },
  OTRA: { label: 'Otra', badgeClass: 'ayuda-otra' },
};

export const fechaHora = (value) => {
  if (!value) return 'Sin fecha';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota',
    }).format(new Date(value));
  } catch {
    return String(value);
  }
};
