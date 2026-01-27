import React, { useState, useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./DetallePersonas.css";

const DetallePersonas = ({ departamento, onVolver }) => {
    const [personasFaltantes, setPersonasFaltantes] = useState([]);
    const [personasInscritas, setPersonasInscritas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [vistaActual, setVistaActual] = useState('inscritos'); 
    const [totales, setTotales] = useState({
        totalPersonas: 0,
        conReserva: 0,
        sinReserva: 0,
        totalAsistentes: 0,
        participacion: 0
    });

    useEffect(() => {
        cargarDatos();
    }, [departamento]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            
            // Obtener reservas
            const reservasResponse = await fetch('https://macfer.crepesywaffles.com/api/Sintonizarte-v2-reservas');
            const reservasData = await reservasResponse.json();
            
            // Obtener empleados del departamento 
            const empleadosResponse = await fetch('https://apialohav2.crepesywaffles.com/intellinextAct');
            const empleadosData = await empleadosResponse.json();
            
            const reservasArray = reservasData.data || [];
            const empleadosArray = Array.isArray(empleadosData) ? empleadosData : [];
            
            console.log('Total empleados:', empleadosArray.length);
            console.log('Total reservas:', reservasArray.length);
            console.log('Departamento buscado:', departamento);
            console.log('Muestra empleado:', empleadosArray[0]);
            console.log('Muestra reserva:', reservasArray[0]);
            
            
            const reservasPorDocumento = new Map();
            
            
            reservasArray
                .filter(reserva => reserva.attributes?.pdv_area === departamento)
                .forEach(reserva => {
                    const documento = reserva.attributes?.documento?.toString().trim();
                    const confirm = reserva.attributes?.confirm;
                    
                    if (documento) {
                        reservasPorDocumento.set(documento, confirm);
                    }
                });
            
            // asistencia
            const asistentesConfirmados = Array.from(reservasPorDocumento.values())
                .filter(confirm => confirm !== null).length;
            
            console.log('Total reservas del departamento:', reservasPorDocumento.size);
            console.log('Asistentes confirmados:', asistentesConfirmados);
            

           
            const empleadosDepartamento = empleadosArray.filter(emp => emp.departament === departamento);
            
            // Separar inscritos y no inscritos
            const faltantes = [];
            const inscritos = [];
            
            empleadosDepartamento.forEach(empleado => {
                const documento = empleado.documento?.toString().trim();
                
                if (reservasPorDocumento.has(documento)) {
                    inscritos.push({
                        ...empleado,
                        confirm: reservasPorDocumento.get(documento)
                    });
                } else {
                    faltantes.push(empleado);
                }
            });
            
            const conReserva = empleadosDepartamento.length - faltantes.length;
            const participacion = empleadosDepartamento.length > 0 
                ? ((conReserva / empleadosDepartamento.length) * 100).toFixed(2)
                : 0;
            
            console.log('Empleados departamento:', empleadosDepartamento.length);
            console.log('Faltantes encontrados:', faltantes.length);
            console.log('Inscritos encontrados:', inscritos.length);
            console.log('Con reserva:', conReserva);
            
            setPersonasFaltantes(faltantes);
            setPersonasInscritas(inscritos);
            setTotales({
                totalPersonas: empleadosDepartamento.length,
                conReserva: inscritos.length,
                sinReserva: faltantes.length,
                totalAsistentes: asistentesConfirmados,
                participacion: participacion
            });
            
            setLoading(false);
        } catch (err) {
            console.error('Error cargando datos:', err);
            setError('Error al cargar los datos: ' + err.message);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="detalle-container">
                <div className="loading-box">
                    <i className="bi bi-hourglass-split spinner"></i>
                    <p>Cargando datos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detalle-container">
                <div className="error-box">
                    <i className="bi bi-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button onClick={onVolver} className="btn-volver">
                        Volver al dashboard
                    </button>
                </div>
            </div>
        );
    }

    const personasAMostrar = vistaActual === 'inscritos' ? personasInscritas : personasFaltantes;
    

    return (
        <div className="detalle-container">
            <div className="detalle-header">
                <button onClick={onVolver} className="btn-volver">
                    <i className="bi bi-arrow-left"></i> Volver
                </button>
                <div className="filtros-botones">
                    <button 
                        className={`btn-filtro ${vistaActual === 'inscritos' ? 'activo inscritos' : ''}`}
                        onClick={() => setVistaActual('inscritos')}
                    >
                        <i className="bi bi-person-check-fill"></i> Inscritos ({totales.conReserva})
                    </button>
                    <button 
                        className={`btn-filtro ${vistaActual === 'no-inscritos' ? 'activo no-inscritos' : ''}`}
                        onClick={() => setVistaActual('no-inscritos')}
                    >
                        <i className="bi bi-person-x-fill"></i> No Inscritos ({totales.sinReserva})
                    </button>
                </div>
            </div>

            <div className="detalle-title-section">
                <h1 className="detalle-title">
                    {vistaActual === 'inscritos' ? (
                        <><i className="bi bi-person-check-fill" style={{color: '#10b981'}}></i>
                        Personas Inscritas - {departamento}</>
                    ) : (
                        <><i className="bi bi-person-x-fill"></i>
                        Personas No Inscritas - {departamento}</>
                    )}
                </h1>
            </div>

            {/* Lista de personas */}
            <div className="personas-lista">
                {personasAMostrar.length > 0 ? (
                    personasAMostrar.map((persona, index) => (
                        <div key={index} className="persona-card">
                            <h3 className="persona-nombre">{persona.nombre}</h3>
                            <div className="persona-info">
                                <div className="detalle-row">
                                    <span className="detalle-label">Cédula:</span>
                                    <span className="detalle-texto">{persona.documento}</span>
                                </div>
                                <div className="detalle-row">
                                    <span className="detalle-label">Cargo:</span>
                                    <span className="detalle-texto">{persona.position}</span>
                                </div>
                                <div className="detalle-row">
                                    <span className="detalle-label">Área:</span>
                                    <span className="detalle-texto">{persona.departament}</span>
                                </div>
                                {vistaActual === 'inscritos' && (
                                    <div className="detalle-row">
                                        <span className="detalle-label">Estado:</span>
                                        {persona.confirm == true ? (
                                            <span className="badge-asistio">Asistió</span>
                                        ) :persona.confirm == false ?  (
                                            <span className="badge-no-asistio">No Asistio</span>
                                        ): <span className="badge-pendiente">Pendiente</span> }
                                    </div>
                                )}
                                <div className="detalle-row">
                                    <span className="detalle-label">Inscripción:</span>
                                    {vistaActual === 'inscritos' ? (
                                        <span className="badge-confirmada">Confirmada</span>
                                    ) : (
                                        <span className="badge-sin-reserva">Sin Reserva</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="sin-faltantes">
                        <i className={`bi ${vistaActual === 'inscritos' ? 'bi-x-circle-fill' : 'bi-check-circle-fill'}`} style={{color: vistaActual === 'inscritos' ? '#ef4444' : '#10b981'}}></i>
                        <p>{vistaActual === 'inscritos' ? 'No hay personas inscritas' : '¡Excelente! Todas las personas tienen reserva'}</p>
                    </div>
                )}
            </div>

            {/* Footer con estadísticas */}
            <div className="detalle-footer">
                <div className="footer-stat">
                    <span className="footer-label">Total Personas</span>
                    <span className="footer-value">{totales.totalPersonas}</span>
                </div>
                <div className="footer-stat">
                    <span className="footer-label">Total Reservas</span>
                    <span className="footer-value success">{totales.conReserva}</span>
                </div>
                <div className="footer-stat">
                    <span className="footer-label">Total Asistentes</span>
                    <span className="footer-value" style={{color: '#dfae58'}}>{totales.totalAsistentes}</span>
                </div>
                <div className="footer-stat">
                    <span className="footer-label">Faltantes</span>
                    <span className="footer-value danger">{totales.sinReserva}</span>
                </div>
                <div className="footer-stat">
                    <span className="footer-label">Participación</span>
                    <span className="footer-value info">{totales.participacion}%</span>
                </div>
            </div>
        </div>
    );
};

export default DetallePersonas;
