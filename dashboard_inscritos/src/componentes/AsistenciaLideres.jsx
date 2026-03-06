import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import LoadingSpinner from "./LoadingSpinner";
import "./AsistenciaLideres.css";

const AsistenciaLideres = () => {
    const navigate = useNavigate();
    const [lideresAsistencia, setLideresAsistencia] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filtroAsistencia, setFiltroAsistencia] = useState('todos');
    const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState('');
    const [departamentosUnicos, setDepartamentosUnicos] = useState([]);
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

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



    const fetchAsistenciaLideres = async () => {
        try {
            setLoading(true);
            
            // Timeout de 5 segundos máximo para el loading
            const timeoutId = setTimeout(() => {
                setLoading(false);
            }, 5000);

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

            lideresConAsistencia.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            const deptosUnicos = [...new Set(lideresConAsistencia
                .map(lider => lider.departamento)
                .filter(dept => dept && dept.trim() !== '')
            )].sort();
            
            clearTimeout(timeoutId);
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


    const exportarAExcel = () => {
        const lideresFiltrados = filtrarLideresAsistencia();
        
        // Preparar datos para exportar
        const dataToExport = lideresFiltrados.map(lider => {
            let estado = 'Sin Reserva';
            if (lider.tieneReserva) {
                estado = lider.asistio ? 'Asistió' : 'No Asistió';
            }
            
            return {
                'Nombre': lider.nombre || 'Sin nombre',
                'Cargo': lider.cargo || '-',
                'Departamento': lider.departamento || 'Sin departamento',
                'Documento': lider.document_number || 'N/A',
                'Correo': lider.correo || '-',
                'Estado': estado
            };
        });

        // Crear hoja de Excel
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        
        // Ajustar ancho de columnas automáticamente
        const colWidths = [
            { wch: 30 },  // Nombre
            { wch: 35 },  // Cargo
            { wch: 25 },  // Departamento
            { wch: 15 },  // Documento
            { wch: 30 },  // Correo
            { wch: 15 }   // Estado
        ];
        ws['!cols'] = colWidths;

        // Crear libro de Excel
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Asistencia Coordinadores");
        
        // Descargar archivo
        const fecha = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
        const fileName = `Asistencia_Coordinadores_${fecha}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    if (loading) {
        return <LoadingSpinner message="Cargando asistencia de líderes..." />;
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
                <button className="btn-volver-asistencia" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left"></i> Volver
                </button>
                <h1 className="asistencia-title">
                    ASISTENCIA LIDERES
                </h1>
                
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={exportarAExcel}
                    className="btn-export-excel"
                    disabled={lideresFiltrados.length === 0}
                >
                    Exportar a Excel
                </Button>
                <button className="btn-refresh-asistencia" onClick={fetchAsistenciaLideres}>
                    <i className="bi bi-arrow-clockwise"></i>
                </button>
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
                            lideresFiltrados
                                .slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina)
                                .map((lider, index) => (
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

            {/* Paginación */}
            {lideresFiltrados.length > itemsPorPagina && (() => {
                const totalPaginas = Math.ceil(lideresFiltrados.length / itemsPorPagina);
                const maxPaginasVisibles = 3;
                
                let paginaInicio = Math.max(1, paginaActual - Math.floor(maxPaginasVisibles / 2));
                let paginaFin = Math.min(totalPaginas, paginaInicio + maxPaginasVisibles - 1);
                
                if (paginaFin - paginaInicio < maxPaginasVisibles - 1) {
                    paginaInicio = Math.max(1, paginaFin - maxPaginasVisibles + 1);
                }
                
                const numeros = [];
                for (let i = paginaInicio; i <= paginaFin; i++) {
                    numeros.push(i);
                }
                
                return (
                    <div className="pagination-container">
                        <button 
                            className="pagination-btn"
                            onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                            disabled={paginaActual === 1}
                        >
                            ←
                        </button>
                        
                        {numeros.map(numero => (
                            <button
                                key={numero}
                                className={`pagination-number ${paginaActual === numero ? 'active' : ''}`}
                                onClick={() => setPaginaActual(numero)}
                            >
                                {numero}
                            </button>
                        ))}
                        
                        <button 
                            className="pagination-btn"
                            onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                            disabled={paginaActual === totalPaginas}
                        >
                            →
                        </button>
                        
                        <span className="pagination-info">
                            Mostrando {((paginaActual - 1) * itemsPorPagina) + 1} - {Math.min(paginaActual * itemsPorPagina, lideresFiltrados.length)} de {lideresFiltrados.length} elementos
                        </span>
                    </div>
                );
            })()}
        </div>
    );
};

export default AsistenciaLideres;
