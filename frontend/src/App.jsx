import { useEffect, useState } from 'react';
import { api } from './services/solicitudes.js';
import { estados } from './catalogos.js';
import SolicitudForm from './components/SolicitudForm.jsx';
import SolicitudesTable from './components/SolicitudesTable.jsx';

function SeismicMark() {
  return <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path d="M5 27h7l4-12 7 20 6-15 3 7h11" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" />
  </svg>;
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
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

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    if (!query.cursor) setItems([]);
    setNextCursor(null);
    Promise.all([
      api.config(controller.signal),
      api.list({ ...query, signal: controller.signal }),
    ]).then(([configuration, result]) => {
      if (controller.signal.aborted) return;
      setMode(configuration.data.storageMode);
      setItems((previous) => query.cursor
        ? [...new Map([...previous, ...result.data].map((item) => [item.solicitudId, item])).values()]
        : result.data);
      setNextCursor(result.nextCursor);
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query]);

  const refresh = () => setQuery((previous) => ({ ...previous, cursor: null, revision: previous.revision + 1 }));
  async function open(id) {
    setWorking(true); setError(''); setNotice('');
    try { setEditor((await api.get(id)).data); }
    catch (failure) { setError(failure.message); }
    finally { setWorking(false); }
  }
  async function changeState(id, estado) {
    setWorking(true); setError(''); setNotice('');
    try {
      await api.changeState(id, estado);
      setNotice('Estado actualizado.'); refresh();
    } catch (failure) { setError(failure.message); }
    finally { setWorking(false); }
  }
  async function save(data) {
    if (editor?.solicitudId) await api.update(editor.solicitudId, data);
    else await api.create(data);
    setEditor(null); setNotice('Solicitud guardada.'); refresh();
  }
  const busy = loading || working;
  const connectionLabel = mode === 'dynamodb' ? 'Conectada a DynamoDB' : mode === 'memory'
    ? 'Modo de demostración' : 'Verificando almacenamiento';
  return <>
    <header className="app-header">
      <div className="header-content">
        <div className="brand"><span className="brand-mark"><SeismicMark /></span>
          <span>Asistencia <strong>Sismos</strong></span>
        </div>
        <div className="header-meta"><span className="course">Electiva de Bases de Datos</span>
          <span className={`connection ${mode === 'dynamodb' ? 'live' : mode === 'memory' ? 'demo' : ''}`}>
            <i aria-hidden="true" />{connectionLabel}
          </span>
        </div>
      </div>
    </header>
    <main>
      <section className="page-heading" aria-labelledby="page-title"><div><p className="eyebrow">Registro y seguimiento</p>
        <h1 id="page-title">Solicitudes de asistencia</h1><p>Registra y gestiona la ayuda requerida por personas afectadas por sismos.</p></div>
        <button className="primary-action" disabled={Boolean(editor) || working} onClick={() => { setEditor({}); setNotice(''); }}>
          <PlusIcon />Nueva solicitud
        </button>
      </section>
      <section className="guidance" aria-label="Información de uso">
        <span className="guidance-icon" aria-hidden="true">i</span>
        <p><strong>Usa datos ficticios.</strong> El identificador y las fechas de seguimiento se generan automáticamente.</p>
        <span className="guidance-divider" aria-hidden="true" />
        <p>Selecciona una fila para ver el detalle o editarla.</p>
      </section>
      {mode === 'memory' && <p className="notice warning">Modo de demostración en memoria: los cambios se pierden al reiniciar el backend. No se está usando DynamoDB.</p>}
      {notice && <p className="notice success" role="status">{notice}<button className="notice-close" aria-label="Cerrar mensaje" onClick={() => setNotice('')}>×</button></p>}
      {error && <p className="notice error" role="alert">{error} <button className="text-button" onClick={refresh}>Reintentar</button></p>}
      {editor && <SolicitudForm key={editor.solicitudId ?? 'nueva'} initial={editor.solicitudId ? editor : null}
        onSave={save} onClose={() => setEditor(null)} />}
      <section className="list-panel" aria-labelledby="list-title" aria-busy={busy}>
        <div className="list-heading"><div><p className="eyebrow">Panel de seguimiento</p><h2 id="list-title">Solicitudes registradas</h2><p>Consulta el detalle o actualiza el estado de atención.</p></div>
          <label className="filter" htmlFor="filtro-estado"><span>Filtrar por estado</span><select id="filtro-estado" disabled={working || Boolean(editor)} value={query.estado}
            onChange={(event) => setQuery({ estado: event.target.value, cursor: null, revision: query.revision + 1 })}>
            <option value="">Todos los estados</option>{Object.entries(estados).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select></label></div>
        {items.length > 0 && <SolicitudesTable items={items} busy={busy || Boolean(editor)} onOpen={open} onState={changeState} />}
        {!loading && !error && items.length === 0 && <div className="empty"><h3>{nextCursor ? 'Sin coincidencias en esta página' : 'No hay solicitudes para mostrar'}</h3>
          <p>{nextCursor ? 'Continúa cargando para revisar los siguientes registros.' : 'Registra una solicitud o selecciona otro estado.'}</p></div>}
        {loading && <p className="loading" role="status">Cargando solicitudes…</p>}
        <div className="list-footer"><span><strong>{items.length}</strong> solicitudes cargadas</span>
          {nextCursor && <button className="secondary" disabled={busy || Boolean(editor)} onClick={() => setQuery((previous) => ({ ...previous, cursor: nextCursor }))}>Cargar más</button>}
          <button className="text-button" disabled={busy || Boolean(editor)} onClick={refresh}>Actualizar listado</button>
        </div>
      </section>
      <footer className="page-footer">Taller de DynamoDB <span>Fechas de seguimiento en hora de Colombia</span></footer>
    </main>
  </>;
}
