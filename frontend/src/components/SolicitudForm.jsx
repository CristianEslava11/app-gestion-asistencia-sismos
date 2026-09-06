import { useEffect, useRef, useState } from 'react';
import { ayudas, ayudasConfig, estados, estadosConfig, fechaHora } from '../catalogos.js';

const empty = {
  nombre: '',
  documento: '',
  telefono: '',
  municipio: '',
  direccion: '',
  fechaSismo: '',
  magnitud: '',
  tipoAyuda: 'ALIMENTACION',
  observaciones: '',
};

export default function SolicitudForm({ initial, onSave, onClose, onStateChange }) {
  const [values, setValues] = useState(() =>
    initial ? Object.fromEntries(Object.keys(empty).map((key) => [key, initial[key] ?? ''])) : empty
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDbInfo, setShowDbInfo] = useState(false);
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

  const field = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: (event) => setValues((previous) => ({ ...previous, [name]: event.target.value })),
  });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({
        ...values,
        magnitud: values.magnitud === '' ? null : Number(values.magnitud),
      });
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  async function handleQuickState(nuevoEstado) {
    if (!initial?.solicitudId || !onStateChange) return;
    setBusy(true);
    setError('');
    try {
      await onStateChange(initial.solicitudId, nuevoEstado);
      onClose();
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  function copyId() {
    if (!initial?.solicitudId) return;
    navigator.clipboard?.writeText(initial.solicitudId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Orden de pasos de atención
  const currentStep = initial ? estadosConfig[initial.estado]?.step ?? 1 : 1;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        className="form-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-title"
        aria-describedby="form-description"
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">
              {editing ? 'Expediente de Asistencia Humanitaria' : 'Registro de Damnificado'}
            </p>
            <h2 id="form-title" ref={heading} tabIndex={-1}>
              {editing ? 'Detalle y Gestión del Caso' : 'Nueva Solicitud de Ayuda'}
            </h2>
            <p id="form-description" className="form-intro">
              {editing
                ? 'Actualiza los datos de la persona afectada o modifica la fase de atención humanitaria.'
                : 'Registra los datos de la persona damnificada y sus requerimientos prioritarios tras el sismo.'}
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Cerrar formulario"
            title="Cerrar formulario (Esc)"
            onClick={onClose}
            disabled={busy}
          >
            ×
          </button>
        </div>

        {/* Stepper de ciclo de vida del caso en casos existentes */}
        {editing && (
          <div className="case-lifecycle">
            <div className="stepper-track">
              <div className={`step-node ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'done' : ''}`}>
                <span className="step-number">{currentStep > 1 ? '✓' : '1'}</span>
                <span className="step-label">Pendiente</span>
              </div>
              <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`} />
              <div className={`step-node ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'done' : ''}`}>
                <span className="step-number">{currentStep > 2 ? '✓' : '2'}</span>
                <span className="step-label">En Atención</span>
              </div>
              <div className={`step-line ${currentStep >= 3 ? 'active' : ''}`} />
              <div className={`step-node ${currentStep >= 3 ? 'active' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-label">Atendida</span>
              </div>
            </div>

            {/* Botones de acción operativa rápida */}
            <div className="quick-state-actions">
              <span className="quick-state-title">Avanzar fase de asistencia:</span>
              {initial.estado === 'PENDIENTE' && (
                <button
                  type="button"
                  className="quick-btn btn-to-attention"
                  disabled={busy}
                  onClick={() => handleQuickState('EN_ATENCION')}
                  title="Marcar que un equipo de rescate o ayuda va en camino"
                >
                  🚚 Desplegar Equipo (Pasar a En Atención)
                </button>
              )}
              {initial.estado === 'EN_ATENCION' && (
                <button
                  type="button"
                  className="quick-btn btn-to-resolved"
                  disabled={busy}
                  onClick={() => handleQuickState('ATENDIDA')}
                  title="Confirmar que la ayuda fue entregada satisfactoriamente"
                >
                  ✅ Completar Entrega (Marcar Atendida)
                </button>
              )}
              {initial.estado === 'ATENDIDA' && (
                <button
                  type="button"
                  className="quick-btn btn-to-reopen"
                  disabled={busy}
                  onClick={() => handleQuickState('EN_ATENCION')}
                  title="Reabrir el caso si se requiere seguimiento adicional"
                >
                  🔄 Reabrir a En Atención
                </button>
              )}
            </div>
          </div>
        )}

        {/* Ficha técnica colapsable de DynamoDB */}
        {editing && (
          <div className="dynamo-tech-drawer">
            <button
              type="button"
              className="dynamo-toggle-btn"
              onClick={() => setShowDbInfo((prev) => !prev)}
              aria-expanded={showDbInfo}
            >
              <span className="dynamo-logo" aria-hidden="true">⚡</span>
              <span>Metadatos del Registro en DynamoDB (Partition Key & Auditoría)</span>
              <span className="drawer-arrow">{showDbInfo ? '▲ Ocultar' : '▼ Ver'}</span>
            </button>
            {showDbInfo && (
              <div className="dynamo-details-grid">
                <div className="db-field">
                  <span className="db-label">Partition Key (solicitudId):</span>
                  <div className="db-copy-wrapper">
                    <code className="db-value">{initial.solicitudId}</code>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={copyId}
                      title="Copiar identificador único"
                    >
                      {copied ? '¡Copiado!' : 'Copiar UUID'}
                    </button>
                  </div>
                </div>
                <div className="db-field">
                  <span className="db-label">Tabla AWS:</span>
                  <code className="db-value">SolicitudesAsistencia (HASH: solicitudId)</code>
                </div>
                <div className="db-field">
                  <span className="db-label">Registro Inicial (UTC):</span>
                  <span className="db-value">{fechaHora(initial.fechaSolicitud)}</span>
                </div>
                <div className="db-field">
                  <span className="db-label">Última Actualización (UTC):</span>
                  <span className="db-value">{fechaHora(initial.fechaActualizacion)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <legend>👤 Persona Afectada</legend>
            <div className="fields">
              <label htmlFor="nombre">
                Nombre completo *
                <input
                  {...field('nombre')}
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  placeholder="Ej. Carmen Lucía Morales"
                />
              </label>
              <label htmlFor="documento">
                Documento de identidad *
                <input
                  {...field('documento')}
                  required
                  minLength={3}
                  maxLength={30}
                  autoComplete="off"
                  placeholder="Ej. 1049624510"
                />
              </label>
              <label htmlFor="telefono">
                Teléfono de contacto *
                <input
                  {...field('telefono')}
                  type="tel"
                  required
                  minLength={7}
                  maxLength={25}
                  autoComplete="tel"
                  placeholder="Ej. 3105550123"
                />
              </label>
            </div>
          </fieldset>

          <fieldset disabled={busy}>
            <legend>📍 Zona y Características del Sismo</legend>
            <div className="fields">
              <label htmlFor="municipio">
                Municipio / Ciudad *
                <input
                  {...field('municipio')}
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="address-level2"
                  placeholder="Ej. Tunja, Boyacá"
                />
              </label>
              <label htmlFor="direccion">
                Dirección / Barrio / Referencia *
                <input
                  {...field('direccion')}
                  required
                  minLength={3}
                  maxLength={200}
                  autoComplete="street-address"
                  placeholder="Ej. Manzana B Lote 4, Barrio Los Patriotas"
                />
              </label>
              <label htmlFor="fechaSismo">
                Fecha del sismo *
                <input
                  {...field('fechaSismo')}
                  type="date"
                  required
                  max={new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())}
                />
              </label>
              <label htmlFor="magnitud">
                Magnitud registrada (Escala Richter)
                <input
                  {...field('magnitud')}
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  placeholder="Ej. 5.4 (opcional)"
                />
                <small>Dejar vacío si no se tiene reporte del Servicio Geológico.</small>
              </label>
            </div>
          </fieldset>

          <fieldset disabled={busy}>
            <legend>🆘 Asistencia Humanitaria Requerida</legend>
            <div className="fields">
              <label htmlFor="tipoAyuda">
                Tipo de ayuda prioritaria *
                <select {...field('tipoAyuda')}>
                  {Object.entries(ayudas).map(([value, label]) => {
                    const cfg = ayudasConfig[value];
                    return (
                      <option key={value} value={value}>
                        {cfg?.icon ? `${cfg.icon} ` : ''}{label}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="wide" htmlFor="observaciones">
                Observaciones y evaluación de daños
                <textarea
                  {...field('observaciones')}
                  rows={4}
                  maxLength={1500}
                  placeholder="Describe la situación de la vivienda (grietas, colapso parcial), personas vulnerables o necesidades específicas."
                />
                <small className="char-counter">
                  {values.observaciones.length} / 1500 caracteres
                </small>
              </label>
            </div>
          </fieldset>

          {error && <p className="notice error" role="alert">{error}</p>}

          <div className="form-footer">
            <button type="button" className="secondary" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button className="submit-btn" disabled={busy}>
              {busy ? 'Guardando en DynamoDB…' : editing ? 'Guardar Cambios' : 'Registrar Solicitud'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
