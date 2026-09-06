import { estados, ayudas, fechaHora } from '../catalogos.js';

export default function SolicitudesTable({ items, busy, onOpen, onState }) {
  return <div className="table-scroll">
    <table>
      <caption className="sr-only">Solicitudes de asistencia registradas</caption>
      <thead><tr><th scope="col">Persona afectada</th><th scope="col">Municipio</th>
        <th scope="col">Solicitud</th><th scope="col">Ayuda</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
      <tbody>{items.map((item) => <tr key={item.solicitudId}>
        <td data-label="Persona afectada"><strong>{item.nombre}</strong><small>{item.documento}</small></td>
        <td data-label="Municipio">{item.municipio}</td><td data-label="Solicitud">{fechaHora(item.fechaSolicitud)}</td><td data-label="Ayuda">{ayudas[item.tipoAyuda]}</td>
        <td data-label="Estado"><select className={`status ${item.estado.toLowerCase()}`} aria-label={`Estado de ${item.nombre}`}
          value={item.estado} disabled={busy} onChange={(event) => onState(item.solicitudId, event.target.value)}>
          {Object.entries(estados).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></td>
        <td data-label="Acciones"><button className="text-button" disabled={busy} onClick={() => onOpen(item.solicitudId)}>Ver detalle<span className="sr-only"> {item.nombre}</span><span aria-hidden="true"> →</span></button></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
