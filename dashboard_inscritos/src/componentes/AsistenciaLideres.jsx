import React, { useState, useEffect } from "react";
import "./AsistenciaLideres.css";

const AsistenciaLideres = ({ onVolver }) => {
    const [lideresAsistencia, setLideresAsistencia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroAsistencia, setFiltroAsistencia] = useState('todos');
    const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState('');
    const [departamentosUnicos, setDepartamentosUnicos] = useState([]);

    // cargos puntos de venta
    const cargosPermitidos = [
        'COORDINADORA HELADERIA',
        'COORDINADOR DE ZONA',
        'COORDINADOR (A) HELADERIA PRINCIPAL',
        'ADMINISTRADORA PUNTO DE VENTA',
        'COORDINADOR PUNTO DE VENTA',
        'COORDINADOR PUNTO DE VENTA (FDS)',
        'GERENTE PUNTO DE VENTA'
    ];

    useEffect(() => {
        fetchAsistenciaLideres();
    }, []);


    // Asistencias de lideres 
    const fetchAsistenciaLideres = async () => {
        try {
            setLoading(true);
            

            const empleadosResponse = await fetch('https://apialohav2.crepesywaffles.com/buk/empleados3');
            const empleadosText = await empleadosResponse.text();
            let empleadosData = JSON.parse(empleadosText);
            const empleadosArray = empleadosData.data || [];
            

            const lideresArray = empleadosArray.filter(empleado => {
                const cargo = empleado.cargo?.toUpperCase().trim() || '';
                return cargosPermitidos.some(cargoPermitido => 
                    cargo.includes(cargoPermitido) || cargoPermitido.includes(cargo)
                );
            });
            

            const reservasResponse = await fetch('https://macfer.crepesywaffles.com/api/Sintonizarte-v2-reservas');
            const reservasText = await reservasResponse.text();
            let reservasData = JSON.parse(reservasText);
            const reservasArray = reservasData.data || [];
            

            const reservasPorDocumento = new Map();
            reservasArray.forEach(reserva => {
                const documento = reserva.attributes?.documento?.toString().trim();
                const confirm = reserva.attributes?.confirm;
                const reservaId = reserva.id;
                
                if (documento) {
                    reservasPorDocumento.set(documento, {
                        tieneReserva: true,
                        confirm: confirm,
                        id: reservaId
                    });
                }
            });
            

            const lideresConAsistencia = lideresArray.map(lider => {
                const documento = lider.document_number?.toString().trim();
                const reservaInfo = reservasPorDocumento.get(documento);
                
                return {
                    ...lider,
                    tieneReserva: reservaInfo?.tieneReserva || false,
                    asistio: reservaInfo?.confirm === true,
                    reservaId: reservaInfo?.id || null
                };
            });
            
+
            lideresConAsistencia.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            const deptosUnicos = [...new Set(lideresConAsistencia
                .map(lider => lider.departamento)
                .filter(dept => dept && dept.trim() !== '')
            )].sort();
            
            setLideresAsistencia(lideresConAsistencia);
            setDepartamentosUnicos(deptosUnicos);
            setLoading(false);
        } catch (err) {
            setError('Error al cargar la asistencia: ' + err.message);
            setLoading(false);
        }
    };

    const filtrarLideresAsistencia = () => {
        let lideresFiltrados = [...lideresAsistencia];
        if (filtroAsistencia === 'asistieron') {
            lideresFiltrados = lideresFiltrados.filter(lider => lider.asistio);
        } else if (filtroAsistencia === 'no_asistieron') {
            lideresFiltrados = lideresFiltrados.filter(lider => lider.tieneReserva && !lider.asistio);
        } else if (filtroAsistencia === 'sin_reserva') {
            lideresFiltrados = lideresFiltrados.filter(lider => !lider.tieneReserva);
        }
        if (departamentoSeleccionado) {
            lideresFiltrados = lideresFiltrados.filter(lider =>
                lider.departamento === departamentoSeleccionado
            );
        }
        
        return lideresFiltrados;
    };


     // Configurar contenido CSV
    const exportarAExcel = () => {
        const lideresFiltrados = filtrarLideresAsistencia();
        
 
        const encabezados = ['Nombre', 'Cargo', 'Departamento', 'Documento', 'Email', 'Estado'];
        

        const filas = lideresFiltrados.map(lider => {
            let estado = 'Sin Reserva';
            if (lider.tieneReserva) {
                estado = lider.asistio ? 'Asisti\u00f3' : 'No Asisti\u00f3';
            }
            
            return [
                lider.nombre || 'Sin nombre',
                lider.cargo || '-',
                lider.departamento || 'Sin departamento',
                lider.document_number || 'N/A',
                lider.email || '-',
                estado
            ];
        });
        
      
        const csvContent = [
            encabezados.join(','),
            ...filas.map(fila => fila.map(celda => `"${celda}"`).join(','))
        ].join('\n');
        

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        

        const fecha = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
        link.setAttribute('download', `Asistencia_Coordinadores_${fecha}.csv`);
        

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="loading">
                Cargando datos...
                <span className="loading-dots">
                    <span className="dot dot1">.</span>
                    <span className="dot dot2">.</span>
                    <span className="dot dot3">.</span>
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="asistencia-lideres-container">
                <div className="error-message">
                    <i className="bi bi-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button className="btn-retry" onClick={fetchAsistenciaLideres}>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const lideresFiltrados = filtrarLideresAsistencia();
    const totalLideres = lideresAsistencia.length;
    const totalAsistieron = lideresAsistencia.filter(l => l.asistio).length;
    const totalConReserva = lideresAsistencia.filter(l => l.tieneReserva).length;
    const totalNoAsistieron = totalConReserva - totalAsistieron;
    const totalSinReserva = totalLideres - totalConReserva;
    const porcentajeAsistencia = totalConReserva > 0 ? ((totalAsistieron / totalConReserva) * 100).toFixed(1) : 0;

    return (
        <div className="asistencia-lideres-container">
            <div className="asistencia-header">
                <button className="btn-volver-asistencia" onClick={onVolver}>
                    <i className="bi bi-arrow-left"></i> Volver
                </button>
                <h1 className="asistencia-title">
                    <i className="bi bi-clipboard-check"></i> ASISTENCIA LIDERES
                </h1>
                <div className="header-actions">
                    <button className="btn-export-excel" onClick={exportarAExcel} title="Exportar a Excel">
                        <i className="bi bi-file-earmark-excel"></i>
                        
                    </button>
                    <button className="btn-refresh-asistencia" onClick={fetchAsistenciaLideres}>
                        <i className="bi bi-arrow-clockwise"></i>
                    </button>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="estadisticas-asistencia">
                <div className="stat-card-asistencia">
                    <div className="stat-icon-asistencia total">
                        <i className="bi bi-people-fill"></i>
                    </div>
                    <div className="stat-info-asistencia">
                        <p className="stat-number-asistencia">{totalLideres}</p>
                        <p className="stat-label-asistencia">Total lideres</p>
                    </div>
                </div>
                <div className="stat-card-asistencia">
                    <div className="stat-icon-asistencia asistieron">
                        <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <div className="stat-info-asistencia">
                        <p className="stat-number-asistencia">{totalAsistieron}</p>
                        <p className="stat-label-asistencia">Asistieron</p>
                    </div>
                </div>
                <div className="stat-card-asistencia">
                    <div className="stat-icon-asistencia no-asistieron">
                        <i className="bi bi-x-circle-fill"></i>
                    </div>
                    <div className="stat-info-asistencia">
                        <p className="stat-number-asistencia">{totalNoAsistieron}</p>
                        <p className="stat-label-asistencia">No Asistieron</p>
                    </div>
                </div>
                <div className="stat-card-asistencia">
                    <div className="stat-icon-asistencia sin-reserva">
                        <i className="bi bi-calendar-x"></i>
                    </div>
                    <div className="stat-info-asistencia">
                        <p className="stat-number-asistencia">{totalSinReserva}</p>
                        <p className="stat-label-asistencia">Sin Reserva</p>
                    </div>
                </div>
                <div className="stat-card-asistencia porcentaje">
                    <div className="stat-icon-asistencia porcentaje-icon">
                        <i className="bi bi-graph-up"></i>
                    </div>
                    <div className="stat-info-asistencia">
                        <p className="stat-number-asistencia">{porcentajeAsistencia}%</p>
                        <p className="stat-label-asistencia">% Asistencia</p>
                    </div>
                </div>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="filtros-asistencia">
                <div className="select-wrapper-asistencia">
                    <label htmlFor="departamento-select" className="select-label-asistencia">
                        <i className="bi bi-building"></i> Filtrar por Departamento
                    </label>
                    <select
                        id="departamento-select"
                        value={departamentoSeleccionado}
                        onChange={(e) => setDepartamentoSeleccionado(e.target.value)}
                        className="select-departamento-asistencia"
                    >
                        <option value="">Todos los departamentos</option>
                        {departamentosUnicos.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    {departamentoSeleccionado && (
                        <button 
                            className="btn-clear-filter-asistencia" 
                            onClick={() => setDepartamentoSeleccionado('')}
                            title="Limpiar filtro"
                        >
                            <i className="bi bi-x-circle"></i>
                        </button>
                    )}
                </div>

                <div className="botones-filtro-asistencia">
                    <button
                        className={`btn-filtro-asistencia ${filtroAsistencia === 'todos' ? 'active' : ''}`}
                        onClick={() => setFiltroAsistencia('todos')}
                    >
                        Todos ({totalLideres})
                    </button>
                    <button
                        className={`btn-filtro-asistencia asistieron ${filtroAsistencia === 'asistieron' ? 'active' : ''}`}
                        onClick={() => setFiltroAsistencia('asistieron')}
                    >
                        Asistieron ({totalAsistieron})
                    </button>
                    <button
                        className={`btn-filtro-asistencia no-asistieron ${filtroAsistencia === 'no_asistieron' ? 'active' : ''}`}
                        onClick={() => setFiltroAsistencia('no_asistieron')}
                    >
                        No Asistieron ({totalNoAsistieron})
                    </button>
                    <button
                        className={`btn-filtro-asistencia sin-reserva ${filtroAsistencia === 'sin_reserva' ? 'active' : ''}`}
                        onClick={() => setFiltroAsistencia('sin_reserva')}
                    >
                        Sin Reserva ({totalSinReserva})
                    </button>
                </div>
            </div>

            {/* Tabla de Líderes */}
            <div className="tabla-container">
                <table className="tabla-asistencia">
                    <thead>
                        <tr>
                            <th>Foto</th>
                            <th>Nombre</th>
                            <th>Cargo</th>
                            <th>Departamento</th>
                            <th>Documento</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lideresFiltrados.length > 0 ? (
                            lideresFiltrados.map((lider, index) => (
                                <tr key={index} className="fila-lider">
                                    <td>
                                        <div className="foto-container">
                                            {lider.foto ? (
                                                <img src={lider.foto} alt={lider.nombre} className="foto-lider-tabla" />
                                            ) : (
                                                <div className="foto-placeholder">
                                                    <i className="bi bi-person-circle"></i>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="nombre-lider">{lider.nombre || 'Sin nombre'}</td>
                                    <td>{lider.cargo || '-'}</td>
                                    <td>{lider.departamento || 'Sin departamento'}</td>
                                    <td>{lider.document_number || 'N/A'}</td>
                                    <td>
                                        {!lider.tieneReserva ? (
                                            <span className="badge-estado sin-reserva">
                                                <i className="bi bi-calendar-x"></i> Sin Reserva
                                            </span>
                                        ) : lider.asistio ? (
                                            <span className="badge-estado asistio">
                                                <i className="bi bi-check-circle-fill"></i> Asistió
                                            </span>
                                        ) : (
                                            <span className="badge-estado no-asistio">
                                                <i className="bi bi-x-circle-fill"></i> No Asistió
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="no-resultados-tabla">
                                    <i className="bi bi-inbox"></i>
                                    <p>No se encontraron coordinadores</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="info-resultados">
                Mostrando {lideresFiltrados.length} de {totalLideres} coordinadores
            </div>
        </div>
    );
};

export default AsistenciaLideres;
