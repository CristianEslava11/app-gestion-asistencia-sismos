import { useEffect, useRef, useState } from 'react';
import { ayudas, estados, fechaHora } from '../catalogos.js';

const empty = { nombre: '', documento: '', telefono: '', municipio: '', direccion: '',
  fechaSismo: '', magnitud: '', tipoAyuda: 'ALIMENTACION', observaciones: '' };

export default function SolicitudForm({ initial, onSave, onClose }) {
  const [values, setValues] = useState(() => initial
    ? Object.fromEntries(Object.keys(empty).map((key) => [key, initial[key] ?? ''])) : empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef(null);
  const editing = Boolean(initial);
  useEffect(() => {
    heading.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [busy, onClose]);
  const field = (name) => ({ id: name, name, value: values[name], onChange: (event) =>
    setValues((previous) => ({ ...previous, [name]: event.target.value })) });
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await onSave({ ...values, magnitud: values.magnitud === '' ? null : Number(values.magnitud) });
    } catch (failure) { setError(failure.message); setBusy(false); }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget && !busy) onClose();
  }}>
    <section className="form-panel" role="dialog" aria-modal="true" aria-labelledby="form-title" aria-describedby="form-description">
      <div className="panel-heading">
        <div><p className="eyebrow">{editing ? 'Detalle de la solicitud' : 'Nuevo registro'}</p>
          <h2 id="form-title" ref={heading} tabIndex={-1}>{editing ? 'Consultar y editar' : 'Registrar solicitud'}</h2>
          <p id="form-description" className="form-intro">Completa la información conocida. Los campos con asterisco son obligatorios.</p>
        </div>
        <button type="button" className="icon-button" aria-label="Cerrar formulario" title="Cerrar formulario" onClick={onClose} disabled={busy}>×</button>
      </div>
    {editing && <div className="record-meta">
      <p><strong>Identificador:</strong> {initial.solicitudId}</p>
      <p><strong>Estado:</strong> {estados[initial.estado]}</p>
      <p><strong>Solicitud:</strong> {fechaHora(initial.fechaSolicitud)}</p>
      <p><strong>Actualización:</strong> {fechaHora(initial.fechaActualizacion)}</p>
    </div>}
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend>Persona afectada</legend>
        <div className="fields">
          <label htmlFor="nombre">Nombre completo *<input {...field('nombre')} required minLength={2} maxLength={120} autoComplete="name" placeholder="Ej. Persona ficticia" /></label>
          <label htmlFor="documento">Documento *<input {...field('documento')} required minLength={3} maxLength={30} autoComplete="off" placeholder="Ej. 000123" /></label>
          <label htmlFor="telefono">Teléfono *<input {...field('telefono')} type="tel" required minLength={7} maxLength={25} autoComplete="tel" placeholder="Ej. 0000000000" /></label>
        </div>
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Ubicación y sismo</legend>
        <div className="fields">
          <label htmlFor="municipio">Municipio *<input {...field('municipio')} required minLength={2} maxLength={100} autoComplete="address-level2" placeholder="Ej. Tunja" /></label>
          <label htmlFor="direccion">Dirección o referencia *<input {...field('direccion')} required minLength={3} maxLength={200} autoComplete="street-address" placeholder="Ej. Zona norte, dirección ficticia" /></label>
          <label htmlFor="fechaSismo">Fecha del sismo *<input {...field('fechaSismo')} type="date" required max={new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())} /></label>
          <label htmlFor="magnitud">Magnitud, si se conoce<input {...field('magnitud')} type="number" min="0" max="10" step="0.1" placeholder="Sin información" /><small>Déjalo vacío si no se conoce.</small></label>
        </div>
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Asistencia</legend>
        <div className="fields">
          <label htmlFor="tipoAyuda">Tipo de ayuda *<select {...field('tipoAyuda')}>
            {Object.entries(ayudas).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label className="wide" htmlFor="observaciones">Observaciones<textarea {...field('observaciones')} rows={4} maxLength={1500} placeholder="Describe la afectación o la ayuda necesaria." /><small>{values.observaciones.length}/1500 caracteres</small></label>
        </div>
      </fieldset>
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="form-footer"><button type="button" className="secondary" onClick={onClose} disabled={busy}>Cancelar</button>
        <button disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar solicitud'}</button></div>
    </form>
    </section>
  </div>;
}
