import { estados, ayudas, ayudasConfig, fechaHora } from '../catalogos.js';

export default function SolicitudesTable({ items, busy, onOpen, onState }) {
  return (
    <div className="table-scroll">
      <table>
        <caption className="sr-only">Solicitudes de asistencia humanitaria registradas</caption>
        <thead>
          <tr>
            <th scope="col">Persona y Contacto</th>
            <th scope="col">Zona y Sismo</th>
            <th scope="col">Fecha Solicitud</th>
            <th scope="col">Ayuda Requerida</th>
            <th scope="col">Estado de Atención</th>
            <th scope="col" className="text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const ayudaCfg = ayudasConfig[item.tipoAyuda] || { icon: '📦', badgeClass: 'ayuda-otra' };
            const tieneMagnitud = typeof item.magnitud === 'number';
            return (
              <tr key={item.solicitudId} className={`row-state-${item.estado.toLowerCase()}`}>
                <td data-label="Persona y Contacto">
                  <strong className="person-name">{item.nombre}</strong>
                  <div className="person-meta">
                    <span className="doc-badge">CC {item.documento}</span>
                    {item.telefono && (
                      <a
                        href={`tel:${item.telefono}`}
                        className="quick-call"
                        title={`Llamar a ${item.nombre}: ${item.telefono}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span aria-hidden="true">📞</span> {item.telefono}
                      </a>
                    )}
                  </div>
                </td>
                <td data-label="Zona y Sismo">
                  <div className="zone-info">
                    <strong className="municipio-text">📍 {item.municipio}</strong>
                    <span className="address-text" title={item.direccion}>{item.direccion}</span>
                    <div className="seismic-tags">
                      {tieneMagnitud ? (
                        <span
                          className={`seismic-badge ${item.magnitud >= 6.0 ? 'high-mag' : item.magnitud >= 4.5 ? 'mid-mag' : 'low-mag'}`}
                          title={`Magnitud sismo: ${item.magnitud}`}
                        >
                          〰 {item.magnitud} M
                        </span>
                      ) : null}
                      <span className="sismo-date" title="Fecha del sismo">{item.fechaSismo}</span>
                    </div>
                  </div>
                </td>
                <td data-label="Fecha Solicitud">
                  <span className="request-time">{fechaHora(item.fechaSolicitud)}</span>
                </td>
                <td data-label="Ayuda Requerida">
                  <span className={`ayuda-chip ${ayudaCfg.badgeClass}`}>
                    <span className="ayuda-icon" aria-hidden="true">{ayudaCfg.icon}</span>
                    <span className="ayuda-name">{ayudas[item.tipoAyuda]}</span>
                  </span>
                </td>
                <td data-label="Estado de Atención">
                  <div className="status-cell">
                    <span className={`status-pulse ${item.estado.toLowerCase()}`} aria-hidden="true" />
                    <select
                      className={`status-select ${item.estado.toLowerCase()}`}
                      aria-label={`Estado de atención para ${item.nombre}`}
                      value={item.estado}
                      disabled={busy}
                      onChange={(event) => onState(item.solicitudId, event.target.value)}
                    >
                      {Object.entries(estados).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td data-label="Acción" className="text-right">
                  <button
                    type="button"
                    className="open-detail-btn"
                    disabled={busy}
                    onClick={() => onOpen(item.solicitudId)}
                    title={`Ver expediente completo de ${item.nombre}`}
                  >
                    <span>Expediente</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
