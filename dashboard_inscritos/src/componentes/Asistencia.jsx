import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Input, Button } from "antd";
import { SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import LoadingSpinner from "./LoadingSpinner";
import "./Asistencia.css";

const Asistencia = () => {
    const navigate = useNavigate();
    const [asistenciaData, setAsistenciaData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [Fecha, setFecha] = useState("");
    const [fechasDisponibles, setFechasDisponibles] = useState([]);
    const [loadingFechas, setLoadingFechas] = useState(true);
    const [searchDocumento, setSearchDocumento] = useState("");
    const [fechaSeleccionada, setFechaSeleccionada] = useState("");
    const [loadingToggle, setLoadingToggle] = useState(false);
    const [empleadosMap, setEmpleadosMap] = useState(new Map());
    const [currentPage, setCurrentPage] = useState(1);
    const [mesSeleccionado, setMesSeleccionado] = useState("");
    const [fechasFiltradas, setFechasFiltradas] = useState([]);

    useEffect(() => {
        const fetchFechas = async () => {
            try {
                setLoadingFechas(true);
                const response = await axios.get(
                    'https://macfer.crepesywaffles.com/api/sintonizarte-V2s'
                );
                
                setFechasDisponibles(response.data.data || []);
                setLoadingFechas(false);
            } catch (err) {
                
                setError(err.message);
                setLoadingFechas(false);
            }
        };
        fetchFechas();
    }, []);

    useEffect(() => {
        const fetchEmpleados = async () => {
            try {
                const response = await axios.get(
                    'https://apialohav2.crepesywaffles.com/buk/empleados3'
                );
                
                const empleadosArray = response.data.data || [];
                const empleadosMapTemp = new Map();
                
                empleadosArray.forEach(empleado => {
                    const documento = empleado.document_number?.toString().trim();
                    if (documento) {
                        empleadosMapTemp.set(documento, {
                            cargo: empleado.cargo || "N/A",
                            area_nombre: empleado.area_nombre || "N/A",
                            departamento: empleado.departamento || "N/A",
                            direction: empleado.direction || "N/A",
                            foto: empleado.foto || null
                        });
                    }
                });
                
                setEmpleadosMap(empleadosMapTemp);
            } catch (err) {
                console.error("Error al cargar empleados:", err);
            }
        };
        fetchEmpleados();
    }, []);

    useEffect(() => {
        const fetchReservas = async () => {
            if (!Fecha) {
                setAsistenciaData([]);
                return;
            }
            
            try {
                setLoading(true);
                const response = await axios.get(
                    `https://macfer.crepesywaffles.com/api/sintonizarte-v2-reservas?populate=*&filters[sintonizarte_v_2_][id]=${Fecha}&pagination[pageSize]=200`
                );

                

                setAsistenciaData(response.data.data || []);
                setLoading(false);
            } catch (err) {
               
                setError(err.message);
                setLoading(false);
            }
        };
        fetchReservas();
    }, [Fecha]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchDocumento, Fecha]);

    const handleFechaChange = (e) => {
        const selectedId = e.target.value;
        setFecha(selectedId);
        
        
        const fechaObj = fechasDisponibles.find(f => f.id === parseInt(selectedId));
        if (fechaObj) {
            setFechaSeleccionada(fechaObj.attributes?.fecha || "");
        } else {
            setFechaSeleccionada("");
        }
    };

  
    const handleMesChange = (e) => {
        const mes = e.target.value;
        setMesSeleccionado(mes);
        setFecha(""); // Resetear fecha seleccionada
        setFechaSeleccionada("");
        
        if (mes) {
            const fechasFiltradas = fechasDisponibles.filter(fecha => {
                const fechaStr = fecha.attributes?.fecha || "";
                if (!fechaStr) return false;
                
                let mesEvento = null;
                

                if (fechaStr.includes('/')) {
                    const partes = fechaStr.split("/");
                    if (partes.length >= 2) {
                        mesEvento = partes[1].padStart(2, '0');
                    }
                } else if (fechaStr.includes('-')) {
                    const partes = fechaStr.split("-");
                    if (partes.length === 3) {
                        if (partes[0].length === 4) {

                            mesEvento = partes[1].padStart(2, '0');
                        } else {

                            mesEvento = partes[1].padStart(2, '0');
                        }
                    }
                }
                
                return mesEvento === mes;
            });
            

            fechasFiltradas.sort((a, b) => {
                const fechaA = a.attributes?.fecha || "";
                const fechaB = b.attributes?.fecha || "";
 
                const parseDate = (fechaStr) => {
                    if (fechaStr.includes('/')) {
                        const [dia, mes, año] = fechaStr.split("/");
                        return new Date(año, mes - 1, dia);
                    } else if (fechaStr.includes('-')) {
                        const partes = fechaStr.split("-");
                        if (partes[0].length === 4) {

                            return new Date(fechaStr);
                        } else {
         
                            const [dia, mes, año] = partes;
                            return new Date(año, mes - 1, dia);
                        }
                    }
                    return new Date(0);
                };
                
                return parseDate(fechaA) - parseDate(fechaB);
            });
            
            setFechasFiltradas(fechasFiltradas);
        } else {
            setFechasFiltradas([]);
        }
    };

    // Obtener meses disponibles de las fechas
    const obtenerMesesDisponibles = () => {
        const meses = new Set();
        
        fechasDisponibles.forEach(fecha => {
            const fechaStr = fecha.attributes?.fecha || "";
            
            if (fechaStr) {
                let mes = null;

                if (fechaStr.includes('/')) {
                    const partes = fechaStr.split("/");
                    if (partes.length >= 2) {
                        mes = partes[1].padStart(2, '0');
                    }
                } else if (fechaStr.includes('-')) {
                    const partes = fechaStr.split("-");
                    if (partes.length === 3) {
                        if (partes[0].length === 4) {
                            // YYYY-MM-DD
                            mes = partes[1].padStart(2, '0');
                        } else {
                            // DD-MM-YYYY
                            mes = partes[1].padStart(2, '0');
                        }
                    }
                }
                
                if (mes) {
                    meses.add(mes);
                }
            }
        });
        
        const mesesArray = Array.from(meses).sort();
        return mesesArray;
    };


    const nombreMes = (numeroMes) => {
        const meses = {
            '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
            '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
            '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
        };
        return meses[numeroMes] || numeroMes;
    };

    const handleCardClick = (fechaId, fecha) => {
        setFecha(fechaId);
        setFechaSeleccionada(fecha);
    };

    
    const handleAsistenciaToggle = async (reservaId, estadoActual) => {
        try {
            setLoadingToggle(true);
            const nuevoEstado = !estadoActual;
            
            await axios.put(
                `https://macfer.crepesywaffles.com/api/sintonizarte-v2-reservas/${reservaId}`,
                {
                    data: {
                        confirm: nuevoEstado
                    }
                }
            );

            setAsistenciaData(prevData => 
                prevData.map(reserva => 
                    reserva.id === reservaId 
                        ? { 
                            ...reserva, 
                            attributes: { 
                                ...reserva.attributes, 
                                confirm: nuevoEstado 
                            } 
                        }
                        : reserva
                )
            );
            
            setLoadingToggle(false);
        } catch (err) {
          
            setLoadingToggle(false);
            alert("Error al actualizar la asistencia");
        }
    };

    const handleAcompananteToggle = async (reservaId, estadoActual) => {
        try {
            setLoadingToggle(true);
            const nuevoEstado = !estadoActual;
            
            await axios.put(
                `https://macfer.crepesywaffles.com/api/sintonizarte-v2-reservas/${reservaId}`,
                {
                    data: {
                        llevaAcompanante: nuevoEstado
                    }
                }
            );

            setAsistenciaData(prevData => 
                prevData.map(reserva => 
                    reserva.id === reservaId 
                        ? { 
                            ...reserva, 
                            attributes: { 
                                ...reserva.attributes, 
                                llevaAcompanante: nuevoEstado 
                            } 
                        }
                        : reserva
                )
            );
            
            setLoadingToggle(false);
        } catch (err) {
          
            setLoadingToggle(false);
            alert("Error al actualizar el acompañante");
        }
    };


    const exportToExcel = () => {
        const dataToExport = filteredData.map((reserva, index) => {
            const documento = reserva.attributes?.documento?.toString().trim();
            const empleado = empleadosMap.get(documento) || {};
            const llevaAcompanante = reserva.attributes?.llevaAcompanante;
            
            return {
                'Documento': reserva.attributes?.documento || "N/A",
                'Nombre': reserva.attributes?.nombreUsuario || "N/A",
                'Cargo': empleado.cargo || "N/A",
                'Departamento': empleado.departamento || "N/A",
                'Dirección': empleado.direction || "N/A",
                'Acompañante': llevaAcompanante === true ? "Sí" : llevaAcompanante === false ? "No" : "No definido",
                'Fecha': fechaSeleccionada || reserva.attributes?.fecha || "N/A",
                'Estado': reserva.attributes?.confirm === true ? "Asistió" : reserva.attributes?.confirm === false ? "No asistió" : "Pendiente"
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Asistencia");
        
    
        const fileName = `Asistencia_${fechaSeleccionada || 'datos'}_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

   
    const filteredData = asistenciaData.filter(reserva => {
        const documento = reserva.attributes?.documento || "";
        return documento.toString().includes(searchDocumento);
    });


    const pageSize = 8;

    const itemRender = (current, type, originalElement) => {
        const totalPages = Math.ceil(filteredData.length / pageSize);
        
        if (type === 'prev') {
            return <button className="pagination-btn-custom">←</button>;
        }
        if (type === 'next') {
            return <button className="pagination-btn-custom">→</button>;
        }
        if (type === 'page') {
        
            const groupSize = 3;
            const currentGroup = Math.floor((currentPage - 1) / groupSize);
            const startPage = currentGroup * groupSize + 1;
            const endPage = Math.min(startPage + groupSize - 1, totalPages);
   
            if (current >= startPage && current <= endPage) {
                return originalElement;
            }
            return null;
        }
        if (type === 'jump-prev' || type === 'jump-next') {
            return null; 
        }
        return originalElement;
    };

   
    const columns = [
        {
            title: 'FOTO',
            key: 'foto',
            width: 90,
            render: (_, record) => {
                const documento = record.attributes?.documento?.toString().trim();
                const empleado = empleadosMap.get(documento);
                const nombre = record.attributes?.nombreUsuario || "";
                const iniciales = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                
                return (
                    <div className="foto-container">
                        {empleado?.foto ? (
                            <img src={empleado.foto} alt="Foto empleado" className="foto-empleado-tabla" />
                        ) : (
                            <div className="foto-placeholder">
                                {iniciales || <i className="bi bi-person"></i>}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'DOCUMENTO',
            dataIndex: ['attributes', 'documento'],
            key: 'documento',
            width: 150,
        },
        {
            title: 'NOMBRE',
            dataIndex: ['attributes', 'nombreUsuario'],
            key: 'nombreUsuario',
            width: 250,
        },
        {
            title: 'CARGO',
            key: 'cargo',
            width: 200,
            render: (_, record) => {
                const documento = record.attributes?.documento?.toString().trim();
                const empleado = empleadosMap.get(documento);
                return empleado?.cargo || "N/A";
            },
        },
        {
            title: 'DEPARTAMENTO',
            key: 'departamento',
            width: 200,
            render: (_, record) => {
                const documento = record.attributes?.documento?.toString().trim();
                const empleado = empleadosMap.get(documento);
                return empleado?.departamento || "N/A";
            },
        },
        {
            title: 'DIRECCIÓN',
            key: 'direction',
            width: 220,
            render: (_, record) => {
                const documento = record.attributes?.documento?.toString().trim();
                const empleado = empleadosMap.get(documento);
                return empleado?.direction || "N/A";
            },
        },
        
        {
            title: 'ESTADO',
            key: 'accion',
            width: 200,
            render: (_, record) => (
                <div 
                    className={`toggle-container ${record.attributes?.confirm ? 'active' : ''}`}
                    onClick={() => handleAsistenciaToggle(record.id, record.attributes?.confirm)}
                >
                    <div className="toggle-switch">
                        <div className="toggle-slider"></div>
                    </div>
                    <span className="toggle-label">
                        {record.attributes?.confirm === true ? (
                            <span style={{ 
                                background: '#D1FAE5', 
                                color: '#065F46', 
                                padding: '4px 10px', 
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600'
                            }}>
                                Asistió
                            </span>
                        ) : record.attributes?.confirm === false ? 'No asistió' : 'Pendiente'}
                    </span>
                </div>
                
            ),
        },

        {
            title: 'ACOMPAÑANTE',
            key: 'acompanante',
            width: 200,
            render: (_, record) => (
                <div 
                    className={`toggle-container ${record.attributes?.llevaAcompanante ? 'active' : ''}`}
                    onClick={() => handleAcompananteToggle(record.id, record.attributes?.llevaAcompanante)}
                >
                    <div className="toggle-switch">
                        <div className="toggle-slider"></div>
                    </div>
                    <span className="toggle-label">
                        {record.attributes?.llevaAcompanante ? (
                            <span style={{ 
                                background: '#D1FAE5', 
                                color: '#065F46', 
                                padding: '4px 10px', 
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600'
                            }}>
                                Sí
                            </span>
                        ) : 'No'}
                    </span>
                </div>
            ),
        },
    ];

    if (loadingFechas) return <LoadingSpinner message="Cargando eventos disponibles..." />;
    if (error) return <div className="mensaje-estado">Error al cargar los datos: {error}</div>;

    return (
        <div className="asistencia-container">
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '10px', width: '100%', maxWidth: '1100px' }}>
                <button 
                    className="btn-volver-dashboard" 
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #8B7355 0%, #6B5D4F 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.3s ease',
                        fontSize: '14px'
                    }}
                >
                    <i className="bi bi-arrow-left"></i> Volver
                </button>
            </div>
            <h2 className="asistencia-titulo">CONFIRMAR ASISTENCIA</h2>

            {/* Selector de Mes */}
            <div className="selector-fecha-container">
                <label className="selector-fecha-label" htmlFor="mes">
                    Seleccionar mes
                </label>
                <select 
                    id="mes"
                    className="selector-fecha"
                    value={mesSeleccionado}
                    onChange={handleMesChange}
                    disabled={loadingFechas}
                >
                    <option value="">Seleccione un mes</option>
                    {obtenerMesesDisponibles().map((mes) => (
                        <option key={mes} value={mes}>
                            {nombreMes(mes)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tarjetas de fechas */}
            {mesSeleccionado && fechasFiltradas.length > 0 && (
                <div className="fechas-cards-container">
                    <h3 className="fechas-cards-titulo">Seleccione una fecha</h3>
                    <div className="fechas-cards-grid">
                        {fechasFiltradas.map((fecha) => (
                            <div
                                key={fecha.id}
                                className={`fecha-card ${Fecha === fecha.id.toString() ? 'fecha-card-selected' : ''}`}
                                onClick={() => handleCardClick(fecha.id.toString(), fecha.attributes?.fecha || "")}
                            >
                                <div className="fecha-card-icono">
                                    
                                </div>
                                <div className="fecha-card-fecha">
                                    {fecha.attributes?.fecha || `Evento ${fecha.id}`}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

         

            {Fecha && (
                <>
                    <div className="filter-export-container">
                        <div className="filter-container">
                            <Input
                                placeholder="Buscar por número de documento..."
                                prefix={<SearchOutlined />}
                                value={searchDocumento}
                                onChange={(e) => setSearchDocumento(e.target.value)}
                                className="filter-input"
                                allowClear
                            />
                        </div>
                        
                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={exportToExcel}
                            className="btn-export-excel"
                            disabled={filteredData.length === 0}
                        >
                            Exportar a Excel
                        </Button>
                    </div>

                    {loading ? (
                        <LoadingSpinner message="Cargando reservas del evento..." />
                    ) : (
                        <div className="tabla-container">
                            {filteredData.length === 0 ? (
                                <p className="mensaje-sin-datos">
                                    {searchDocumento 
                                        ? "No se encontraron resultados con ese documento" 
                                        : "No hay reservas para mostrar"}
                                </p>
                            ) : (
                                <Table
                                    columns={columns}
                                    dataSource={filteredData}
                                    rowKey="id"
                                    pagination={{
                                        current: currentPage,
                                        pageSize: pageSize,
                                        showSizeChanger: true,
                                        showTotal: (total, range) => `Mostrando ${range[0]} - ${range[1]} de ${total} elementos`,
                                        pageSizeOptions: ['8', '16', '24', '50'],
                                        position: ['bottomCenter'],
                                        showLessItems: false,
                                        itemRender: itemRender,
                                        onChange: (page) => setCurrentPage(page)
                                    }}
                                    className="tabla-asistencia-ant"
                                    scroll={{ x: 'max-content' }}
                                />
                            )}
                        </div>
                    )}
                </>
            )}

            {!Fecha && !loading && mesSeleccionado && (
                <div className="mensaje-sin-datos">
                    Seleccione una fecha del mes para ver las reservas
                </div>
            )}

            {!mesSeleccionado && !loading && (
                <div className="mensaje-sin-datos">
                    Seleccione un mes para ver las fechas disponibles
                </div>
            )}

            {/* Overlay de loading */}
            {loadingToggle && (
                <div className="loading-overlay">
                    <div className="loading-container">
                        <div className="loading-text">
                            Actualizando
                            <span className="loading-dots">
                                <span className="dot dot1">.</span>
                                <span className="dot dot2">.</span>
                                <span className="dot dot3">.</span>
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Asistencia;
