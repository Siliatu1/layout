import { Routes, Route } from 'react-router-dom'
import Dashboard_act from './componentes/Dashboard_act'
import Asistencia from './componentes/Asistencia'
import AsistenciaLideres from './componentes/AsistenciaLideres'
import DetallePersonas from './componentes/DetallePersonas'
import Gestionlider from './componentes/Gestionlider'
import InscripcionDiplomado from './componentes/InscripcionDiplomado'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard_act />} />
      <Route path="/asistencia" element={<Asistencia />} />
      <Route path="/asistencia-lideres" element={<AsistenciaLideres />} />
      <Route path="/detalle-personas" element={<DetallePersonas />} />
      <Route path="/gestion-lider" element={<Gestionlider />} />
      <Route path="/inscripcion-diplomado" element={<InscripcionDiplomado />} />
    </Routes>
  )
}

export default App
