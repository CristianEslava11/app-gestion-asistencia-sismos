// Datos totalmente ficticios. IDs fijos para una carga repetible que no sobrescribe.
export const ejemplos = [
  {
    solicitudId: '00000000-0000-4000-8000-000000000001',
    nombre: 'Persona de ejemplo 1', documento: 'DEMO-001', telefono: '0000000001',
    municipio: 'Tunja', direccion: 'Dirección ficticia, zona norte', fechaSismo: '2026-08-20',
    fechaSolicitud: '2026-08-20T15:00:00.000Z', fechaActualizacion: '2026-08-20T15:00:00.000Z',
    magnitud: 5.2, tipoAyuda: 'ALOJAMIENTO', estado: 'PENDIENTE',
    observaciones: 'Caso ficticio para practicar el registro de una solicitud.',
  },
  {
    solicitudId: '00000000-0000-4000-8000-000000000002',
    nombre: 'Persona de ejemplo 2', documento: 'DEMO-002', telefono: '0000000002',
    municipio: 'Duitama', direccion: 'Dirección ficticia, zona centro', fechaSismo: '2026-08-20',
    fechaSolicitud: '2026-08-20T16:00:00.000Z', fechaActualizacion: '2026-08-21T14:00:00.000Z',
    magnitud: null, tipoAyuda: 'ALIMENTACION', estado: 'EN_ATENCION', observaciones: '',
  },
];
