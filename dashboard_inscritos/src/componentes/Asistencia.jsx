import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import { Table, Input, Button } from "antd";
import { SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import "./Asistencia.css";

const Asistencia = () => {
    const [asistenciaData, setAsistenciaData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [Fecha, setFecha] = useState("");
    const [fechasDisponibles, setFechasDisponibles] = useState([]);
    const [loadingFechas, setLoadingFechas] = useState(true);
    const [searchDocumento, setSearchDocumento] = useState("");
    const [fechaSeleccionada, setFechaSeleccionada] = useState("");
    const [loadingToggle, setLoadingToggle] = useState(false);

    useEffect(() => {
        const fetchFechas = async () => {
            try {
                setLoadingFechas(true);
                const response = await axios.get(
                    'https://macfer.crepesywaffles.com/api/sintonizarte-V2s'
                );
                
                console.log("Respuesta de fechas:", response.data);
                setFechasDisponibles(response.data.data || []);
                setLoadingFechas(false);
            } catch (err) {
                console.error("Error al cargar fechas:", err);
                setError(err.message);
                setLoadingFechas(false);
            }
        };
        fetchFechas();
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

                console.log("Respuesta de reservas:", response.data);

                setAsistenciaData(response.data.data || []);
                setLoading(false);
            } catch (err) {
                console.error("Error al cargar reservas:", err);
                setError(err.message);
                setLoading(false);
            }
        };
        fetchReservas();
    }, [Fecha]);

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
            console.error("Error al actualizar asistencia:", err);
            setLoadingToggle(false);
            alert("Error al actualizar la asistencia");
        }
    };


    const exportToExcel = () => {
        const dataToExport = filteredData.map((reserva, index) => ({
            'ID': reserva.id,
            'Documento': reserva.attributes?.documento || "N/A",
            'Nombre': reserva.attributes?.nombreUsuario || "N/A",
            'Fecha': fechaSeleccionada || reserva.attributes?.fecha || "N/A",
            'Estado': reserva.attributes?.confirm ? "Asistió" : "No asistió"
        }));

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

   
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Documento',
            dataIndex: ['attributes', 'documento'],
            key: 'documento',
            width: 150,
        },
        {
            title: 'Nombre',
            dataIndex: ['attributes', 'nombreUsuario'],
            key: 'nombreUsuario',
            width: 250,
        },
        {
            title: 'Fecha',
            key: 'fecha',
            width: 150,
            render: () => fechaSeleccionada || "N/A",
        },
        {
            title: 'Acción',
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
                        {record.attributes?.confirm ? 'Asistió' : 'No asistió'}
                    </span>
                </div>
            ),
        },
    ];

    if (error) return <div className="mensaje-estado">Error al cargar los datos: {error}</div>;

    return (
        <div className="asistencia-container">
            <h2 className="asistencia-titulo">Confirmación de Asistencia</h2>

            <div className="selector-fecha-container">
                <label className="selector-fecha-label" htmlFor="fecha">
                     Fechas del evento:
                </label>
                <select 
                    id="fecha"
                    className="selector-fecha"
                    value={Fecha}
                    onChange={handleFechaChange}
                    disabled={loadingFechas}
                >
                    <option value="">Seleccione la fecha del evento</option>
                    {fechasDisponibles.map((fecha) => (
                        <option key={fecha.id} value={fecha.id}>
                            {fecha.attributes?.fecha || `Evento ${fecha.id}`}
                        </option>
                    ))}
                </select>
            </div>

            {Fecha && (
                <>
                    <div className="filter-export-container">
                        <div className="filter-container">
                            <label className="filter-label">Buscar por número de documento:</label>
                            <Input
                                placeholder="Ingrese número de documento"
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
                        <div className="mensaje-estado">Cargando reservas...</div>
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
                                        pageSize: 10,
                                        showSizeChanger: true,
                                        showTotal: (total) => `Total ${total} registros`,
                                        pageSizeOptions: ['10', '20', '50', '100']
                                    }}
                                    className="tabla-asistencia-ant"
                                />
                            )}
                        </div>
                    )}
                </>
            )}

            {!Fecha && !loading && (
                <div className="mensaje-sin-datos">
                    Seleccione una fecha de evento para ver las reservas
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
