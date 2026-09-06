// Mantener los valores alineados con backend/src/validation/solicitud.js.
export const estados = { PENDIENTE: 'Pendiente', EN_ATENCION: 'En atención', ATENDIDA: 'Atendida' };
export const ayudas = {
  ALIMENTACION: 'Alimentación', ALOJAMIENTO: 'Alojamiento',
  ATENCION_MEDICA: 'Atención médica', RESCATE: 'Rescate', OTRA: 'Otra',
};
export const fechaHora = (value) => new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota',
}).format(new Date(value));
