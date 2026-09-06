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
  useEffect(() => { heading.current?.focus(); }, []);
  const field = (name) => ({ id: name, name, value: values[name], onChange: (event) =>
    setValues((previous) => ({ ...previous, [name]: event.target.value })) });
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await onSave({ ...values, magnitud: values.magnitud === '' ? null : Number(values.magnitud) });
    } catch (failure) { setError(failure.message); setBusy(false); }
  }
  return <section className="form-panel" aria-labelledby="form-title">
    <div className="panel-heading">
      <div><p className="eyebrow">{initial ? 'Detalle de la solicitud' : 'Nuevo registro'}</p>
        <h2 id="form-title" ref={heading} tabIndex={-1}>{initial ? 'Consultar y editar' : 'Registrar solicitud'}</h2></div>
      <button type="button" className="secondary" onClick={onClose} disabled={busy}>Cerrar</button>
    </div>
    {initial && <div className="record-meta">
      <p><strong>Identificador:</strong> {initial.solicitudId}</p>
      <p><strong>Estado:</strong> {estados[initial.estado]}</p>
      <p><strong>Solicitud:</strong> {fechaHora(initial.fechaSolicitud)}</p>
      <p><strong>Actualización:</strong> {fechaHora(initial.fechaActualizacion)}</p>
    </div>}
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend>Persona afectada</legend>
        <div className="fields">
          <label htmlFor="nombre">Nombre completo *<input {...field('nombre')} required minLength={2} maxLength={120} autoComplete="off" /></label>
          <label htmlFor="documento">Documento *<input {...field('documento')} required minLength={3} maxLength={30} /></label>
          <label htmlFor="telefono">Teléfono *<input {...field('telefono')} type="tel" required minLength={7} maxLength={25} /></label>
        </div>
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Ubicación y sismo</legend>
        <div className="fields">
          <label htmlFor="municipio">Municipio *<input {...field('municipio')} required minLength={2} maxLength={100} /></label>
          <label htmlFor="direccion">Dirección o referencia *<input {...field('direccion')} required minLength={3} maxLength={200} /></label>
          <label htmlFor="fechaSismo">Fecha del sismo *<input {...field('fechaSismo')} type="date" required max={new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())} /></label>
          <label htmlFor="magnitud">Magnitud, si se conoce<input {...field('magnitud')} type="number" min="0" max="10" step="0.1" placeholder="Sin información" /></label>
        </div>
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Asistencia</legend>
        <div className="fields">
          <label htmlFor="tipoAyuda">Tipo de ayuda *<select {...field('tipoAyuda')}>
            {Object.entries(ayudas).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label className="wide" htmlFor="observaciones">Observaciones<textarea {...field('observaciones')} rows={3} maxLength={1500} placeholder="Describe la afectación o la ayuda necesaria." /></label>
        </div>
      </fieldset>
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="form-footer"><span>* Campos obligatorios</span>
        <button disabled={busy}>{busy ? 'Guardando…' : initial ? 'Guardar cambios' : 'Registrar solicitud'}</button></div>
    </form>
  </section>;
}
