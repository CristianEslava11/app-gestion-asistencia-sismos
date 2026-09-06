import { useEffect, useMemo, useState } from 'react';
import { api } from './services/solicitudes.js';
import { ayudas, estados } from './catalogos.js';
import SolicitudForm from './components/SolicitudForm.jsx';
import SolicitudesTable from './components/SolicitudesTable.jsx';
import MetricIcon from './components/MetricIcon.jsx';

function SeismicMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        d="M5 27h7l4-12 7 20 6-15 3 7h11"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.5"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

export default function App() {
  const [query, setQuery] = useState({ estado: '', cursor: null, revision: 0 });
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState(null);
  const [editor, setEditor] = useState(null);

  // Filtros operativos locales
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAyuda, setSelectedAyuda] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    if (!query.cursor) setItems([]);
    setNextCursor(null);

    Promise.all([
      api.config(controller.signal),
      api.list({ ...query, signal: controller.signal }),
    ])
      .then(([configuration, result]) => {
        if (controller.signal.aborted) return;
        setMode(configuration.data.storageMode);
        setItems((previous) =>
          query.cursor
            ? [...new Map([...previous, ...result.data].map((item) => [item.solicitudId, item])).values()]
            : result.data
        );
        setNextCursor(result.nextCursor);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query]);

  const refresh = () =>
    setQuery((previous) => ({ ...previous, cursor: null, revision: previous.revision + 1 }));

  async function open(id) {
    setWorking(true);
    setError('');
    setNotice('');
    try {
      setEditor((await api.get(id)).data);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setWorking(false);
    }
  }

  async function changeState(id, estado) {
    setWorking(true);
    setError('');
    setNotice('');
    try {
      await api.changeState(id, estado);
      setNotice(`Estado actualizado a "${estados[estado]}".`);
      refresh();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setWorking(false);
    }
  }

  async function save(data) {
    if (editor?.solicitudId) await api.update(editor.solicitudId, data);
    else await api.create(data);
    setEditor(null);
    setNotice(editor?.solicitudId ? 'Solicitud actualizada correctamente.' : 'Nueva solicitud registrada en DynamoDB.');
    refresh();
  }

  // Métricas calculadas en tiempo real para las KPI cards
  const kpis = useMemo(() => {
    let pendientes = 0;
    let enAtencion = 0;
    let atendidas = 0;
    let maxMagnitud = 0;

    for (const item of items) {
      if (item.estado === 'PENDIENTE') pendientes++;
      else if (item.estado === 'EN_ATENCION') enAtencion++;
      else if (item.estado === 'ATENDIDA') atendidas++;

      if (typeof item.magnitud === 'number' && item.magnitud > maxMagnitud) {
        maxMagnitud = item.magnitud;
      }
    }

    return {
      total: items.length,
      pendientes,
      enAtencion,
      atendidas,
      maxMagnitud: maxMagnitud > 0 ? `${maxMagnitud} M` : 'N/A',
    };
  }, [items]);

  // Filtrado reactivo en pantalla (por texto de búsqueda y tipo de ayuda)
  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        !term ||
        item.nombre.toLowerCase().includes(term) ||
        item.documento.toLowerCase().includes(term) ||
        item.municipio.toLowerCase().includes(term) ||
        item.direccion.toLowerCase().includes(term);

      const matchAyuda = !selectedAyuda || item.tipoAyuda === selectedAyuda;

      return matchSearch && matchAyuda;
    });
  }, [items, searchTerm, selectedAyuda]);

  const busy = loading || working;
  const connectionLabel =
    mode === 'dynamodb'
      ? 'Amazon DynamoDB (Activo)'
      : mode === 'memory'
      ? 'Modo Demostración (Memoria)'
      : 'Verificando servicio';

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <SeismicMark />
            </span>
            <div className="brand-text">
              <span>Sistema de Asistencia Humanitaria</span>
              <strong>Gestión ante Desastres Sísmicos</strong>
            </div>
          </div>
          <div className="header-meta">
            <span className="course-badge">UPTC · Electiva BD</span>
            <span
              className={`connection-pill ${
                mode === 'dynamodb' ? 'live' : mode === 'memory' ? 'demo' : ''
              }`}
              title={mode === 'dynamodb' ? 'Conexión activa a tabla SolicitudesAsistencia' : 'Modo memoria volátil'}
            >
              <i className="status-dot" aria-hidden="true" />
              <span>{connectionLabel}</span>
            </span>
          </div>
        </div>
      </header>

      <main>
        {/* Encabezado de operaciones de mando */}
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Puesto de Mando y Coordinación de Emergencias</p>
            <h1 id="page-title">Registro y Seguimiento de Damnificados</h1>
            <p className="heading-sub">
              Plataforma de recepción de solicitudes de asistencia, censo de familias afectadas y control logístico de atención tras sismos.
            </p>
          </div>
          <button
            className="primary-action"
            disabled={Boolean(editor) || working}
            onClick={() => {
              setEditor({});
              setNotice('');
            }}
          >
            <PlusIcon />
            <span>Registrar Damnificado</span>
          </button>
        </section>

        {/* Panel de Métricas Operativas (KPI Cards) */}
        <section className="kpi-panel" aria-label="Métricas del operativo de asistencia">
          <div
            className={`kpi-card ${query.estado === '' ? 'active-filter' : ''}`}
            onClick={() => setQuery((prev) => ({ ...prev, estado: '', cursor: null, revision: prev.revision + 1 }))}
            role="button"
            tabIndex={0}
            title="Ver todas las solicitudes"
          >
            <div className="kpi-header">
              <span className="kpi-title">Total Solicitudes</span>
              <span className="kpi-icon"><MetricIcon name="requests" /></span>
            </div>
            <span className="kpi-value">{kpis.total}</span>
            <span className="kpi-sub">Cargadas en la sesión</span>
          </div>

          <div
            className={`kpi-card kpi-warning ${query.estado === 'PENDIENTE' ? 'active-filter' : ''}`}
            onClick={() => setQuery((prev) => ({ ...prev, estado: 'PENDIENTE', cursor: null, revision: prev.revision + 1 }))}
            role="button"
            tabIndex={0}
            title="Filtrar por casos pendientes"
          >
            <div className="kpi-header">
              <span className="kpi-title">Pendientes (Urgente)</span>
              <span className="kpi-badge-pulse" aria-hidden="true" />
            </div>
            <span className="kpi-value">{kpis.pendientes}</span>
            <span className="kpi-sub">Esperando despacho</span>
          </div>

          <div
            className={`kpi-card kpi-info ${query.estado === 'EN_ATENCION' ? 'active-filter' : ''}`}
            onClick={() => setQuery((prev) => ({ ...prev, estado: 'EN_ATENCION', cursor: null, revision: prev.revision + 1 }))}
            role="button"
            tabIndex={0}
            title="Filtrar por casos en atención"
          >
            <div className="kpi-header">
              <span className="kpi-title">En Atención</span>
              <span className="kpi-icon"><MetricIcon name="attention" /></span>
            </div>
            <span className="kpi-value">{kpis.enAtencion}</span>
            <span className="kpi-sub">Equipos en terreno</span>
          </div>

          <div
            className={`kpi-card kpi-success ${query.estado === 'ATENDIDA' ? 'active-filter' : ''}`}
            onClick={() => setQuery((prev) => ({ ...prev, estado: 'ATENDIDA', cursor: null, revision: prev.revision + 1 }))}
            role="button"
            tabIndex={0}
            title="Filtrar por solicitudes atendidas"
          >
            <div className="kpi-header">
              <span className="kpi-title">Atendidas</span>
              <span className="kpi-icon"><MetricIcon name="complete" /></span>
            </div>
            <span className="kpi-value">{kpis.atendidas}</span>
            <span className="kpi-sub">Ayuda entregada</span>
          </div>
        </section>

        {/* Notificaciones y alertas */}
        {mode === 'memory' && (
          <p className="notice warning">
            <strong>Modo de Demostración Local:</strong> Los registros se guardan en memoria temporal y se reiniciarán con el backend. Para persistencia permanente, asegúrate de correr conectado a AWS DynamoDB.
          </p>
        )}
        {notice && (
          <p className="notice success" role="status">
            <span>{notice}</span>
            <button className="notice-close" aria-label="Cerrar aviso" onClick={() => setNotice('')}>
              ×
            </button>
          </p>
        )}
        {error && (
          <p className="notice error" role="alert">
            <span>{error}</span>
            <button className="text-button" onClick={refresh}>
              Reintentar
            </button>
          </p>
        )}

        {/* Modal / Formulario enfocado */}
        {editor && (
          <SolicitudForm
            key={editor.solicitudId ?? 'nueva'}
            initial={editor.solicitudId ? editor : null}
            onSave={save}
            onClose={() => setEditor(null)}
            onStateChange={changeState}
          />
        )}

        {/* Panel de Tabla y Operaciones de Búsqueda */}
        <section className="list-panel" aria-labelledby="list-title" aria-busy={busy}>
          <div className="list-heading">
            <div>
              <p className="eyebrow">Censo de Población Afectada</p>
              <h2 id="list-title">Registro de Asistencia y Estado de Ayudas</h2>
              <p>Haz clic en "Expediente" para consultar el reporte completo, evaluar daños o avanzar el estado.</p>
            </div>
          </div>

          {/* Barra de Filtros Operativos y Búsqueda */}
          <div className="search-filter-bar">
            <div className="search-input-wrapper">
              <span className="search-icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="search-field"
                placeholder="Buscar por persona, documento o municipio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar solicitudes por nombre, cédula o municipio"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpiar búsqueda"
                >
                  ×
                </button>
              )}
            </div>

            <div className="filters-group">
              <label className="filter-select-label" htmlFor="filtro-ayuda">
                <span className="sr-only">Tipo de Asistencia</span>
                <select
                  id="filtro-ayuda"
                  value={selectedAyuda}
                  onChange={(e) => setSelectedAyuda(e.target.value)}
                  disabled={working}
                >
                  <option value="">Todas las ayudas</option>
                  {Object.entries(ayudas).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-select-label" htmlFor="filtro-estado">
                <span className="sr-only">Estado del Proceso</span>
                <select
                  id="filtro-estado"
                  disabled={working || Boolean(editor)}
                  value={query.estado}
                  onChange={(event) =>
                    setQuery({
                      estado: event.target.value,
                      cursor: null,
                      revision: query.revision + 1,
                    })
                  }
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(estados).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Tabla de Registros */}
          {filteredItems.length > 0 && (
            <SolicitudesTable
              items={filteredItems}
              busy={busy || Boolean(editor)}
              onOpen={open}
              onState={changeState}
            />
          )}

          {/* Estados vacíos */}
          {!loading && !error && filteredItems.length === 0 && (
            <div className="empty">
              <div className="empty-icon" aria-hidden="true"><SearchIcon /></div>
              <h3>
                {searchTerm || selectedAyuda
                  ? 'Sin coincidencias para los filtros aplicados'
                  : nextCursor
                  ? 'Sin registros en esta página de DynamoDB'
                  : 'No hay solicitudes de asistencia registradas'}
              </h3>
              <p>
                {searchTerm || selectedAyuda
                  ? 'Prueba ajustando el término de búsqueda o seleccionando otro tipo de ayuda.'
                  : nextCursor
                  ? 'Presiona "Cargar más" para consultar la siguiente página evaluada en DynamoDB.'
                  : 'Utiliza el botón "+ Registrar Damnificado" para ingresar el primer reporte de asistencia.'}
              </p>
              {(searchTerm || selectedAyuda) && (
                <button
                  type="button"
                  className="reset-filters-btn"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedAyuda('');
                  }}
                >
                  Restablecer filtros locales
                </button>
              )}
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <span className="spinner" aria-hidden="true" />
              <p className="loading" role="status">
                Sincronizando con DynamoDB…
              </p>
            </div>
          )}

          <div className="list-footer">
            <span className="items-counter">
              Mostrando <strong>{filteredItems.length}</strong> de <strong>{items.length}</strong> solicitudes cargadas
            </span>
            {nextCursor && (
              <button
                className="secondary load-more-btn"
                disabled={busy || Boolean(editor)}
                onClick={() => setQuery((previous) => ({ ...previous, cursor: nextCursor }))}
              >
                Cargar más registros (Scan DynamoDB)
              </button>
            )}
            <button
              className="text-button refresh-btn"
              disabled={busy || Boolean(editor)}
              onClick={refresh}
              title="Refrescar datos desde la base de datos"
            >
              ↻ Actualizar listado
            </button>
          </div>
        </section>

        <footer className="page-footer">
          <div>
            <strong>Taller de DynamoDB · Electiva de Bases de Datos</strong>
            <span className="footer-sub">Arquitectura: React + Node Express + AWS DynamoDB</span>
          </div>
          <span className="footer-time">Fechas registradas en Hora Legal de Colombia (UTC-5)</span>
        </footer>
      </main>
    </>
  );
}
