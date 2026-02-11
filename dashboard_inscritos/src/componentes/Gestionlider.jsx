import React, { useState, useEffect } from "react";
import "./gestionlider.css";
import AsistenciaLideres from "./AsistenciaLideres";

const Gestionlider = ({ onVolver }) => {
    const [lideres, setLideres] = useState({ administracion: [], puntoVenta: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [vistaActual, setVistaActual] = useState('inicial'); 
    const [paginaActual, setPaginaActual] = useState(1);
    const [lideresExpandidos, setLideresExpandidos] = useState({});
    const tarjetasPorPagina = 8;

    useEffect(() => {
        fetchLideres();
    }, []);

    const fetchLideres = async () => {
        try {
            setLoading(true);
            const response = await fetch('https://apialohav2.crepesywaffles.com/buk/empleados3');
            const text = await response.text();
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error('La API no devolvió JSON válido');
            }
            
            const empleadosArray = data.data || [];
            

            const lideresArray = empleadosArray.filter(empleado => empleado.lider === 1);

            const lideresAdmin = [];
            const lideresPuntoVenta = [];
            
            lideresArray.forEach(lider => {
                const department = lider.departamento?.toLowerCase() || '';

                if (department.includes('admin') || 
                    department.includes('gerencia') || 
                    department.includes('oficina') ||
                    department.includes('corporativo') ||
                    department.includes('rrhh') ||
                    department.includes('recursos humanos') ||
                    department.includes('financ') ||
                    department.includes('contab') ||
                    department.includes('sistema') ||
                    department.includes('ti ') ||
                    department.includes('marketing') ||
                    department.includes('compras') ||
                    department.includes('logistica')) {
                    lideresAdmin.push(lider);
                } else {
                    lideresPuntoVenta.push(lider);
                }
            });
            
            lideresAdmin.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            lideresPuntoVenta.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            
            setLideres({ administracion: lideresAdmin, puntoVenta: lideresPuntoVenta });
            setLoading(false);
        } catch (err) {
            setError('Error al cargar los líderes: ' + err.message);
            setLoading(false);
        }
    };

    const filtrarLideres = () => {
        let todosLideres = [];
        

        if (vistaActual === 'administracion') {
            todosLideres = lideres.administracion;
        } else if (vistaActual === 'punto_venta') {
            todosLideres = lideres.puntoVenta;
        }
        

        if (searchTerm) {
            todosLideres = todosLideres.filter(lider => 
                (lider.nombre?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (lider.departamento?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (lider.document_number?.toString().includes(searchTerm))
            );
        }
        
        return todosLideres;
    };

    useEffect(() => {
        setPaginaActual(1);
    }, [vistaActual, searchTerm]);

    const handleCategoryClick = (categoria) => {
        setVistaActual(categoria);
        setSearchTerm('');
        setPaginaActual(1);
    };

    const volverAInicio = () => {
        setVistaActual('inicial');
        setSearchTerm('');
        setPaginaActual(1);
        setLideresExpandidos({});
    };

    const toggleLiderInfo = (index) => {
        setLideresExpandidos(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const mostrarAsistencia = () => {
        setVistaActual('asistencia');
    };

    if (loading) {
        return (
            <div className="gestion-lider-container">
                
            </div>
        );
    }

    if (error) {
        return (
            <div className="gestion-lider-container">
                <div className="error-message">
                    <i className="bi bi-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button className="btn-retry" onClick={fetchLideres}>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }


    if (vistaActual === 'asistencia') {
        return <AsistenciaLideres onVolver={volverAInicio} />;
    }


    if (vistaActual === 'inicial') {
        return (
            <div className="gestion-lider-container">
                <div className="gestion-header">
                    <button className="btn-volver" onClick={onVolver}>
                        <i className="bi bi-arrow-left"></i> Volver
                    </button>
                    <h1 className="gestion-title">
                        <i className="bi bi-people-fill"></i> Gestión de Líderes
                    </h1>
                    <button className="btn-refresh" onClick={fetchLideres}>
                        <i className="bi bi-arrow-clockwise"></i>
                    </button>
                </div>

                <div className="categoria-cards-container">
                    <div 
                        className="categoria-card administracion"
                        onClick={() => handleCategoryClick('administracion')}
                    >
                        <div className="categoria-icon">
                            <i className="bi bi-briefcase-fill"></i>
                        </div>
                        <h2 className="categoria-title">Administración</h2>
                        <p className="categoria-count">{lideres.administracion.length} Líderes</p>
                        <div className="categoria-arrow">
                            <i className="bi bi-arrow-right-circle"></i>
                        </div>
                    </div>

                    <div 
                        className="categoria-card punto-venta"
                        onClick={() => handleCategoryClick('punto_venta')}
                    >
                        <div className="categoria-icon">
                            <i className="bi bi-shop"></i>
                        </div>
                        <h2 className="categoria-title">Punto de Venta y Heladerías</h2>
                        <p className="categoria-count">{lideres.puntoVenta.length} Líderes</p>
                        <div className="categoria-arrow">
                            <i className="bi bi-arrow-right-circle"></i>
                        </div>
                    </div>
                </div>

                <div className="stats-container">
                    <div className="stat-card total">
                        <i className="bi bi-people"></i>
                        <div>
                            <p className="stat-number">{lideres.administracion.length + lideres.puntoVenta.length}</p>
                            <p className="stat-label">Total Líderes</p>
                        </div>
                    </div>
                </div>

                <div className="asistencia-btn-container">
                    <button className="btn-ver-asistencia" onClick={mostrarAsistencia}>
                        <i className="bi bi-clipboard-check"></i>
                        <span>Ver Asistencia de Líderes</span>
                        <i className="bi bi-arrow-right"></i>
                    </button>
                </div>
            </div>
        );
    }


    const lideresFiltrados = filtrarLideres();
    const totalLideres = lideresFiltrados.length;
    const indiceInicio = (paginaActual - 1) * tarjetasPorPagina;
    const indiceFin = indiceInicio + tarjetasPorPagina;
    const lideresPaginados = lideresFiltrados.slice(indiceInicio, indiceFin);
    const tituloCategoria = vistaActual === 'administracion' ? 'Líderes de Administración' : 'Líderes de Punto de Venta y Heladerías';

    return (
        <div className="gestion-lider-container">
            <div className="gestion-header">
                <button className="btn-volver" onClick={volverAInicio}>
                    <i className="bi bi-arrow-left"></i> Volver
                </button>
                <h1 className="gestion-title">
                    <i className="bi bi-people-fill"></i> {tituloCategoria}
                </h1>
                <span className="pagination-info-header">
                    Mostrando {indiceInicio + 1} - {Math.min(indiceFin, totalLideres)} de {totalLideres} líderes
                </span>
                <button className="btn-refresh" onClick={fetchLideres}>
                    <i className="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            {/* Buscador */}
            <div className="search-container">
                <i className="bi bi-search"></i>
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, documento o departamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input-lider"
                />
                {searchTerm && (
                    <i 
                        className="bi bi-x-circle clear-icon" 
                        onClick={() => setSearchTerm('')}
                    ></i>
                )}
            </div>

            {/* Stats */}
            <div className="stats-container">
                <div className="stat-card total">
                    <i className="bi bi-people"></i>
                    <div>
                        <p className="stat-number">{totalLideres}</p>
                        <p className="stat-label">Líderes en esta categoría</p>
                    </div>
                </div>
            </div>

            {/* Grid de Líderes */}
            <section className="lideres-section">
                <div className="lideres-grid">
                    {lideresPaginados.length > 0 ? (
                        lideresPaginados.map((lider, index) => {
                            const liderKey = `${vistaActual}-${indiceInicio + index}`;
                            const estaExpandido = lideresExpandidos[liderKey];
                            return (
                            <div key={liderKey} className="lider-card">
                                <button 
                                    className="btn-toggle-info"
                                    onClick={() => toggleLiderInfo(liderKey)}
                                    title={estaExpandido ? 'Ocultar información' : 'Ver información'}
                                >
                                    <i className={`bi ${estaExpandido ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                </button>
                                
                                <div className="lider-avatar">
                                    {lider.foto ? (
                                        <img src={lider.foto} alt={lider.nombre} className="lider-foto" />
                                    ) : (
                                        <i className="bi bi-person-circle"></i>
                                    )}
                                </div>
                                
                                <div className="lider-info">
                                    <h3 className="lider-name">{lider.nombre || 'Sin nombre'}</h3>
                                    
                                    {estaExpandido && (
                                        <div className="lider-detalles">
                                            {lider.cargo && (
                                                <p className="lider-cargo">{lider.cargo}</p>
                                            )}
                                            <p className="lider-department">{lider.departamento || 'Sin departamento'}</p>
                                            <p className="lider-document">CC: {lider.document_number || 'N/A'}</p>
                                            {lider.email && (
                                                <p className="lider-email">{lider.email}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="lider-badge">
                                    <i className="bi bi-star-fill"></i>
                                    <span>Líder</span>
                                </div>
                            </div>
                            );
                        })
                    ) : (
                        <div className="no-results">
                            <i className="bi bi-inbox"></i>
                            <p>No se encontraron líderes</p>
                        </div>
                    )}
                </div>

                {/* Paginación */}
                {totalLideres > tarjetasPorPagina && (
                    <div className="pagination-container-lider">
                        <button 
                            className="pagination-btn-lider"
                            onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                            disabled={paginaActual === 1}
                        >
                            ←
                        </button>
                        
                        {(() => {
                            const totalPaginas = Math.ceil(totalLideres / tarjetasPorPagina);
                            const maxPaginasVisibles = 3;
                            let paginasAMostrar = [];
                            
                            if (totalPaginas <= maxPaginasVisibles) {
                                paginasAMostrar = Array.from({ length: totalPaginas }, (_, i) => i + 1);
                            } else {
                                let inicio = Math.max(1, paginaActual - 1);
                                let fin = Math.min(totalPaginas, inicio + maxPaginasVisibles - 1);
                                
                                if (fin - inicio < maxPaginasVisibles - 1) {
                                    inicio = Math.max(1, fin - maxPaginasVisibles + 1);
                                }
                                
                                paginasAMostrar = Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
                            }
                            
                            return paginasAMostrar.map(numero => (
                                <button
                                    key={numero}
                                    className={`pagination-number-lider ${paginaActual === numero ? 'active' : ''}`}
                                    onClick={() => setPaginaActual(numero)}
                                >
                                    {numero}
                                </button>
                            ));
                        })()}
                        
                        <button 
                            className="pagination-btn-lider"
                            onClick={() => setPaginaActual(prev => Math.min(prev + 1, Math.ceil(totalLideres / tarjetasPorPagina)))}
                            disabled={paginaActual === Math.ceil(totalLideres / tarjetasPorPagina)}
                        >
                            →
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Gestionlider;
