import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Table, Tag, Space } from 'antd';
import "bootstrap-icons/font/bootstrap-icons.css";
import LoadingSpinner from "./LoadingSpinner";
import "./DetallePersonas.css";

const DetallePersonas = ({ departamento: departamentoProp, onVolver }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const departamento = departamentoProp || location.state?.departamento;
    
    const handleVolver = () => {
        if (onVolver) {
            onVolver();
        } else {
            navigate(-1);
        }
    };
    const [personasFaltantes, setPersonasFaltantes] = useState([]);
    const [personasInscritas, setPersonasInscritas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [vistaActual, setVistaActual] = useState('inscritos'); 
    const [currentPage, setCurrentPage] = useState(1);
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
            
            // Timeout de 5 segundos máximo para el loading
            const timeoutId = setTimeout(() => {
                setLoading(false);
            }, 5000);

            const reservasResponse = await fetch('https://macfer.crepesywaffles.com/api/Sintonizarte-v2-reservas');
            const reservasText = await reservasResponse.text();

            let reservasData;
            try {
                reservasData = JSON.parse(reservasText);
            } catch (e) {
                throw new Error('La API de reservas no devolvió JSON válido');
            }

            const empleadosResponse = await fetch('https://apialohav2.crepesywaffles.com/buk/empleados3');
            const empleadosText = await empleadosResponse.text();

            let empleadosData;
            try {
                empleadosData = JSON.parse(empleadosText);
            } catch (e) {
                throw new Error('La API de empleados no devolvió JSON válido');
            }

            const reservasArray = reservasData.data || [];
            const empleadosArray = empleadosData.data || [];

            const reservasPorDocumento = new Map();
                reservasArray
                .forEach(reserva => {
                    const documento = reserva.attributes?.documento?.toString().trim();
                    const confirm = reserva.attributes?.confirm;
                    
                    if  (documento) {
                        reservasPorDocumento.set(documento, confirm);
                    }
                });

            const asistentesConfirmados = Array.from(reservasPorDocumento.values())
                .filter(confirm => confirm !== null).length;

           
            const empleadosDepartamento = empleadosArray.filter(emp => emp.departamento === departamento);
            

            const faltantes = [];
            const inscritos = [];
            
            empleadosDepartamento.forEach(empleado => {
                const documento = empleado.document_number?.toString().trim();
                
                if (documento && reservasPorDocumento.has(documento)) {
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
            

            clearTimeout(timeoutId);
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

            setError('Error al cargar los datos: ' + err.message);
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Cargando detalles del departamento..." />;
    }

    if (error) {
        return (
            <div className="detalle-container">
                <div className="error-box">
                    <i className="bi bi-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button onClick={handleVolver} className="btn-volver">
                        Volver al dashboard
                    </button>
                </div>
            </div>
        );
    }

    const personasAMostrar = vistaActual === 'inscritos' ? personasInscritas : personasFaltantes;
    
    const pageSize = 8;

    // paginacion
    const itemRender = (current, type, originalElement) => {
        const totalPages = Math.ceil(personasAMostrar.length / pageSize);
        
        if (type === 'prev') {
            return <button className="pagination-btn-custom">←</button>;
        }
        if (type === 'next') {
            return <button className="pagination-btn-custom">→</button>;
        }
        if (type === 'page') {
            // Calcular el grupo de 3 páginas actual
            const groupSize = 3;
            const currentGroup = Math.floor((currentPage - 1) / groupSize);
            const startPage = currentGroup * groupSize + 1;
            const endPage = Math.min(startPage + groupSize - 1, totalPages);
            
            // Solo mostrar las 3 páginas del grupo actual
            if (current >= startPage && current <= endPage) {
                return originalElement;
            }
            return null;
        }
        if (type === 'jump-prev' || type === 'jump-next') {
            return null; // Ocultar los botones de salto (...)
        }
        return originalElement;
    };
    
    // Definir columnas 
    const columnasInscritos = [
        {
            title: 'Foto',
            key: 'foto',
            width: '10%',
            render: (_, record) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {record.foto ? (
                        <img 
                            src={record.foto} 
                            alt="Foto empleado" 
                            style={{ 
                                width: '50px', 
                                height: '50px', 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                border: '2px solid #d1d5db'
                            }} 
                        />
                    ) : (
                        <div style={{ 
                            width: '50px', 
                            height: '50px', 
                            borderRadius: '50%', 
                            backgroundColor: '#e5e7eb', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '24px',
                            color: '#9ca3af'
                        }}>
                            <i className="bi bi-person-circle"></i>
                        </div>
                    )}
                </div>
            ),
        },
        
        {
            title: 'Nombre',
            dataIndex: 'nombre',
            key: 'nombre',
            width: '25%',
            sorter: (a, b) => a.nombre.localeCompare(b.nombre),
        },
        {
            title: 'Cédula',
            dataIndex: 'document_number',
            key: 'document_number',
            width: '15%',
        },
        {
            title: 'Cargo',
            dataIndex: 'cargo',
            key: 'cargo',
            width: '20%',
        },
        {
            title: 'Área',
            dataIndex: 'departamento',
            key: 'departamento',
            width: '20%',
        },
        {
            title: 'Estado',
            key: 'confirm',
            width: '20%',
            render: (_, record) => (
                <Space size="middle">
                    {record.confirm === true ? (
                        <Tag color="success" style={{fontSize: '12px', padding: '4px 8px'}}>
                            <i className="bi bi-check-circle-fill"></i> Asistió
                        </Tag>
                    ) : record.confirm === false ? (
                        <Tag color="error" style={{fontSize: '12px', padding: '4px 8px'}}>
                            <i className="bi bi-x-circle-fill"></i> No Asistió
                        </Tag>
                    ) : (
                        <Tag color="warning" style={{fontSize: '12px', padding: '4px 8px'}}>
                            <i className="bi bi-clock-fill"></i> Pendiente
                        </Tag>
                    )}
                </Space>
            ),
        },
    ];

    const columnasNoInscritos = [
        {
            title: 'Foto',
            key: 'foto',
            width: '10%',
            render: (_, record) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {record.foto ? (
                        <img 
                            src={record.foto} 
                            alt="Foto empleado" 
                            style={{ 
                                width: '50px', 
                                height: '50px', 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                border: '2px solid #d1d5db'
                            }} 
                        />
                    ) : (
                        <div style={{ 
                            width: '50px', 
                            height: '50px', 
                            borderRadius: '50%', 
                            backgroundColor: '#e5e7eb', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '24px',
                            color: '#9ca3af'
                        }}>
                            <i className="bi bi-person-circle"></i>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Nombre',
            dataIndex: 'nombre',
            key: 'nombre',
            width: '30%',
            sorter: (a, b) => a.nombre.localeCompare(b.nombre),
        },
        {
            title: 'Cédula',
            dataIndex: 'document_number',
            key: 'document_number',
            width: '20%',
        },
        {
            title: 'Cargo',
            dataIndex: 'cargo',
            key: 'cargo',
            width: '25%',
        },
        {
            title: 'Área',
            dataIndex: 'departamento',
            key: 'departamento',
            width: '25%',
        },
    ];

    return (
        <div className="detalle-container">
            <div className="detalle-header">
                <button onClick={handleVolver} className="btn-volver">
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

            {/* Tabla de personas */}
            <div className="personas-tabla-container" style={{marginBottom: '20px'}}>
                <Table 
                    columns={vistaActual === 'inscritos' ? columnasInscritos : columnasNoInscritos}
                    dataSource={personasAMostrar.map((persona, index) => ({
                        ...persona,
                        key: index
                    }))}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: false,
                        onChange: (page) => setCurrentPage(page),
                        itemRender: itemRender,
                        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} personas`
                    }}
                    locale={{
                        emptyText: vistaActual === 'inscritos' 
                            ? 'No hay personas inscritas'
                            : '¡Excelente! Todas las personas tienen reserva'
                    }}
                    size="middle"
                    bordered
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '16px'
                    }}
                />
            </div>

          
        </div>
    );
};

export default DetallePersonas;
