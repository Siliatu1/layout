import React, { useState, useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Dashboard_act.css";
import DetallePersonas from "./DetallePersonas";

const Dashboard_act = () => {
    const [datosIntegrados, setDatosIntegrados] = useState([]);
    const [datosFiltrados, setDatosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroSeleccionado, setFiltroSeleccionado] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const tarjetasPorPagina = 8;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // A: Fetch reservas data (Macfer API)
            const reservasResponse = await fetch('https://macfer.crepesywaffles.com/api/Sintonizarte-v2-reservas');
            const reservasData = await reservasResponse.json();
            
            // B: Fetch empleados data (Aloha API)
            const empleadosResponse = await fetch('https://apialohav2.crepesywaffles.com/intellinexTot');
            const empleadosData = await empleadosResponse.json();
            
            
            
            const reservasArray = Array.isArray(reservasData) ? reservasData : 
                                   reservasData.data ? reservasData.data : [];
            
            
            const reservasPorArea = {};
            const asistentesPorArea = {};
            reservasArray.forEach(reserva => {
                const area = reserva.attributes.pdv_area || 'Sin área';
                reservasPorArea[area] = (reservasPorArea[area] || 0) + 1;
                const confirmado = reserva.attributes?.confirm;
                if (confirmado !== null) {
                    asistentesPorArea[area] = (asistentesPorArea[area] || 0) + 1;
                }
            });
            
            
            
            
            const empleadosArray = Array.isArray(empleadosData) ? empleadosData : 
                                    empleadosData.data ? empleadosData.data : [];
            
            const empleadosPorDepartamento = {};
            empleadosArray.forEach(empleado => {
                const department = empleado.department || empleado.departamento || 'Sin departamento';
                const totalPerson = parseInt(empleado.total_person) || 1;
                
                if (!empleadosPorDepartamento[department]) {
                    empleadosPorDepartamento[department] = 0;
                }
                empleadosPorDepartamento[department] += totalPerson;
            });
            
            
            
            
            const datosIntegrados = [];
            
            
            const todasLasClaves = new Set([
                ...Object.keys(reservasPorArea),
                ...Object.keys(empleadosPorDepartamento)
            ]);
            
            todasLasClaves.forEach(clave => {
                // Filtrar claves vacías o con solo espacios
                if (!clave || clave.trim() === '' || clave === 'Sin área' || clave === 'Sin departamento') {
                    return;
                }
                
                const total_res = reservasPorArea[clave] || 0;
                const total_person = empleadosPorDepartamento[clave] || 0;
                const total_asistentes = asistentesPorArea[clave] || 0;
                
                // Calcula participación
                const participacion = total_person > 0 ? (total_res / total_person) : 0;
                
                // Calcula faltantes
                const faltantes = Math.max(0, total_person - total_res);
                
                datosIntegrados.push({
                    department: clave,
                    total_person: total_person,
                    total_res: total_res,
                    total_asistentes: total_asistentes,
                    participacion: participacion,
                    porcentaje_participacion: (participacion * 100).toFixed(2),
                    faltantes: faltantes
                });
            });
            
            
            datosIntegrados.sort((a, b) => a.department.localeCompare(b.department));
            
            setDatosIntegrados(datosIntegrados);
            setDatosFiltrados(datosIntegrados);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Error al cargar los datos: ' + err.message);
            setLoading(false);
        }
    };

    
    useEffect(() => {
        let datosFiltrados = [...datosIntegrados];

        // Filtrar por categoría
        if (filtroSeleccionado === 'alta') {
            datosFiltrados = datosFiltrados.filter(item => item.porcentaje_participacion >= 50);
        } else if (filtroSeleccionado === 'baja') {
            datosFiltrados = datosFiltrados.filter(item => item.porcentaje_participacion < 50);
        }

        // Filtrar por búsqueda
        if (searchTerm) {
            datosFiltrados = datosFiltrados.filter(item => 
                item.department.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setDatosFiltrados(datosFiltrados);
        setPaginaActual(1);
    }, [filtroSeleccionado, searchTerm, datosIntegrados]);

    const CircularProgress = ({ percentage, label }) => {
        const radius = 50;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        return (
            <div className="circular-progress-container">
                <svg className="circular-progress" width="150" height="150">
                    <circle
                        className="circular-progress-bg"
                        cx="75"
                        cy="75"
                        r={radius}
                    />
                    <circle
                        className="circular-progress-bar"
                        cx="75"
                        cy="75"
                        r={radius}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                    <text
                        x="75"
                        y="75"
                        className="circular-progress-text"
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {percentage}%
                    </text>
                </svg>
                <p className="circular-progress-label">{label}</p>
            </div>
        );
    };

    const getIconForDepartment = (department) => {
        const departmentLower = department.toLowerCase();
        if (departmentLower.includes('punto') || departmentLower.includes('venta') || departmentLower.includes('tienda')) {
            return 'bi-shop';
        } else if (departmentLower.includes('domicilio') || departmentLower.includes('delivery')) {
            return 'bi-house-door';
        } else if (departmentLower.includes('cocina') || departmentLower.includes('kitchen')) {
            return 'bi-egg-fried';
        } else if (departmentLower.includes('admin')) {
            return 'bi-briefcase';
        } else if (departmentLower.includes('rrhh') || departmentLower.includes('recursos')) {
            return 'bi-people';
        }
        return 'bi-building';
    };

    if (loading) {
        return <div className="loading">Cargando datos...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

   
    const totalReservas = datosIntegrados.reduce((sum, item) => sum + item.total_res, 0);
    const totalEmpleados = datosIntegrados.reduce((sum, item) => sum + item.total_person, 0);
    const promedioParticipacion = totalEmpleados > 0 
        ? ((totalReservas / totalEmpleados) * 100).toFixed(2)
        : 0;

    // filtrados
    const totalReservasFiltradas = datosFiltrados.reduce((sum, item) => sum + item.total_res, 0);
    const totalEmpleadosFiltrados = datosFiltrados.reduce((sum, item) => sum + item.total_person, 0);

    
    if (departamentoSeleccionado) {
        return (
            <DetallePersonas 
                departamento={departamentoSeleccionado}
                onVolver={() => setDepartamentoSeleccionado(null)}
            />
        );
    }

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">Dashboard</h1>
            
            {/* Sección de Totales */}
            <div className="totals-section">
                <div className="total-card">
                    <p className="total-label">Total Reservas</p>
                    <p className="total-value primary">{totalReservas}</p>
                </div>
                <div className="total-card">
                    <p className="total-label">Total Empleados</p>
                    <p className="total-value">{totalEmpleados}</p>
                </div>
                <div className="total-card">
                    <p className="total-label">Promedio Participación</p>
                    <p className="total-value success">{promedioParticipacion}%</p>
                </div>
            </div>

            {/* Sección de Filtros */}
            <div className="filters-section">
                <div className="filters-top-row">
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input 
                            type="text" 
                            placeholder="Buscar departamento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <i 
                                className="bi bi-x-circle clear-search" 
                                onClick={() => setSearchTerm('')}
                            ></i>
                        )}
                    </div>

                    <div className="filter-select-container">
                        <i className="bi bi-funnel"></i>
                        <select 
                            value={filtroSeleccionado}
                            onChange={(e) => setFiltroSeleccionado(e.target.value)}
                            className="filter-select"
                        >
                            <option value="todos">Todos los departamentos ({datosIntegrados.length})</option>
                            <option value="alta">Participación Alta (≥50%)</option>
                            <option value="baja">Participación Baja (&lt;50%)</option>
                        </select>
                    </div>
                </div>
                
                <div className="filter-buttons">
                    <button 
                        className={`filter-btn ${filtroSeleccionado === 'todos' ? 'active' : ''}`}
                        onClick={() => setFiltroSeleccionado('todos')}
                    >
                        <i className="bi bi-grid-3x3-gap"></i> Todos ({datosIntegrados.length})
                    </button>
                    <button 
                        className={`filter-btn ${filtroSeleccionado === 'alta' ? 'active' : ''}`}
                        onClick={() => setFiltroSeleccionado('alta')}
                    >
                        <i className="bi bi-graph-up-arrow"></i> Participación Alta
                    </button>
                    <button 
                        className={`filter-btn ${filtroSeleccionado === 'baja' ? 'active' : ''}`}
                        onClick={() => setFiltroSeleccionado('baja')}
                    >
                        <i className="bi bi-graph-down-arrow"></i> Participación Baja
                    </button>
                </div>

                <div className="filter-info">
                    <span className="filter-count">
                        Mostrando {datosFiltrados.length} de {datosIntegrados.length} departamentos
                    </span>
                    <span className="filter-stats">
                        Reservas: {totalReservasFiltradas} | Empleados: {totalEmpleadosFiltrados}
                    </span>
                </div>
            </div>

            {/* Tarjetas por Departamento */}
            <section className="dashboard-section">
                <div className="cards-container">
                    {datosFiltrados
                        .slice((paginaActual - 1) * tarjetasPorPagina, paginaActual * tarjetasPorPagina)
                        .map((item, index) => (
                        <div 
                            key={`integrado-${index}`} 
                            className="department-card"
                            onClick={() => setDepartamentoSeleccionado(item.department)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="card-header">
                                <i className={`bi ${getIconForDepartment(item.department)} card-icon`}></i>
                                <i className={`bi ${item.porcentaje_participacion >= 50 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'} card-trend ${item.porcentaje_participacion >= 50 ? 'trend-up' : 'trend-down'}`}></i>
                            </div>
                            
                            <div className="card-percentage">
                                <svg className="percentage-circle" width="140" height="140" viewBox="0 0 140 140">
                                    <circle
                                        className="percentage-bg"
                                        cx="70"
                                        cy="70"
                                        r="60"
                                    />
                                    <circle
                                        className="percentage-fill"
                                        cx="70"
                                        cy="70"
                                        r="60"
                                        strokeDasharray={`${2 * Math.PI * 60}`}
                                        strokeDashoffset={`${2 * Math.PI * 60 * (1 - item.porcentaje_participacion / 100)}`}
                                    />
                                    <text
                                        x="70"
                                        y="70"
                                        className="percentage-text"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                    >
                                        {item.porcentaje_participacion}%
                                    </text>
                                </svg>
                            </div>

                            <h3 className="card-title">{item.department}</h3>
                            
                            <div className="card-stats">
                                <p className="stats-numbers">
                                    <span className="stats-reservas">{item.total_res}</span>
                                    <span className="stats-separator"> / </span>
                                    <span className="stats-empleados">{item.total_person}</span>
                                </p>
                                <p className="stats-label">Reservas / Empleados</p>
                            </div>
                            
                            <div className="card-details">
                                <hr className="divider" />
                                <div className="detail-item">
                                    <span className="detail-label">Total Personas:</span>
                                    <span className="detail-value">{item.total_person}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Total Reservas:</span>
                                    <span className="detail-value">{item.total_res}</span>
                                </div>
                                <div className="detail-item" style={{background: '#fff7ed', borderRadius: '8px'}}>
                                    <span className="detail-label">Total Asistentes:</span>
                                    <span className="detail-value" style={{color: '#f59e0b', fontWeight: '700'}}>{item.total_asistentes}</span>
                                </div>
                                <div className="detail-item warning">
                                    <span className="detail-label">Faltantes:</span>
                                    <span className="detail-value faltantes-clickable">
                                        {item.faltantes} →
                                    </span>
                                </div>
                                <div className="detail-item highlight">
                                    <span className="detail-label">Participación:</span>
                                    <span className="detail-value">
                                        {item.porcentaje_participacion}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Paginación */}
                {datosFiltrados.length > tarjetasPorPagina && (
                    <div className="pagination-container">
                        <button 
                            className="pagination-btn"
                            onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                            disabled={paginaActual === 1}
                        >
                            ←
                        </button>
                        
                        {Array.from({ length: Math.ceil(datosFiltrados.length / tarjetasPorPagina) }, (_, i) => i + 1).map(numero => (
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
                            onClick={() => setPaginaActual(prev => Math.min(prev + 1, Math.ceil(datosFiltrados.length / tarjetasPorPagina)))}
                            disabled={paginaActual === Math.ceil(datosFiltrados.length / tarjetasPorPagina)}
                        >
                            →
                        </button>
                        
                        <span className="pagination-info">
                            Mostrando {((paginaActual - 1) * tarjetasPorPagina) + 1} - {Math.min(paginaActual * tarjetasPorPagina, datosFiltrados.length)} de {datosFiltrados.length} elementos
                        </span>
                    </div>
                )}
            </section>

            <button className="refresh-button" onClick={fetchData}>
                <i className="bi bi-arrow-clockwise"></i> Actualizar Datos
            </button>
        </div>
    );
};

export default Dashboard_act;
