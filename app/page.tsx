'use client'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase' 
import { PlusCircle, Save, Loader2, Users, Wallet, UserPlus, X, CheckCircle2 } from 'lucide-react'

export default function TiendaPage() {
  const [docentes, setDocentes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Formulario Fiado
  const [docenteId, setDocenteId] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')

  // Modal Nuevo Docentes
  const [showModal, setShowModal] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoPuesto, setNuevoPuesto] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      setFetching(true)
      const { data, error } = await supabase
        .from('docentes')
        .select('*, deudas(monto)')
        .order('nombre')

      if (error) throw error
      setDocentes(data || [])
    } catch (err: any) {
      console.error("Error de conexión:", err.message)
    } finally {
      setFetching(false)
    }
  }

  const handleAgregarDocente = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase
        .from('docentes')
        .insert([{ nombre: nuevoNombre, puesto: nuevoPuesto }])
      if (error) throw error
      setNuevoNombre(''); setNuevoPuesto(''); setShowModal(false)
      await cargarDatos()
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const guardarFiado = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docenteId) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('deudas')
        .insert([{ 
          docente_id: docenteId, 
          monto: parseFloat(monto), 
          descripcion: descripcion 
        }])
      if (error) throw error
      
      // Limpieza de campos y actualización de lista
      setMonto(''); setDescripcion(''); setDocenteId('')
      await cargarDatos()
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const liquidarDeuda = async (docente: any) => {
    const saldoActual = docente.deudas?.reduce((sum: number, item: any) => sum + item.monto, 0) || 0;
    if (saldoActual <= 0) return;
    const confirmar = confirm(`¿Marcar como pagada la cuenta de Q${saldoActual.toFixed(2)} para ${docente.nombre}?`);
    if (confirmar) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('deudas')
          .insert([{ docente_id: docente.id, monto: -saldoActual, descripcion: 'PAGO TOTAL' }]);
        if (error) throw error;
        await cargarDatos();
      } catch (err: any) {
        alert("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const totalPorCobrar = docentes.reduce((acc, doc) => {
    const deuda = doc.deudas?.reduce((sum: number, d: any) => sum + d.monto, 0) || 0
    return acc + deuda
  }, 0)

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="w-full">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Tienda Control</h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Administración de créditos</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 w-full sm:w-auto">
            <div className="bg-green-100 p-2.5 rounded-xl text-green-600"><Wallet size={24}/></div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total a Cobrar</p>
              <p className="text-xl font-black text-green-700 leading-none mt-1">Q {totalPorCobrar.toFixed(2)}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Registro */}
          <section className="w-full">
            <div className="bg-white p-5 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100">
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-800">
                <PlusCircle className="text-blue-600" size={20} /> Nuevo Fiado
              </h2>
              <form onSubmit={guardarFiado} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Seleccionar Docente</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none"
                    value={docenteId} onChange={(e) => setDocenteId(e.target.value)} required
                  >
                    <option value="">Buscar Maestro...</option>
                    {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Monto (Q)</label>
                  <input 
                    type="number" step="0.01" placeholder="0.00"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg text-blue-600 outline-none"
                    value={monto} onChange={(e) => setMonto(e.target.value)} required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descripción</label>
                  <textarea 
                    placeholder="Ej. Desayuno y jugo"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-20 resize-none outline-none text-sm"
                    value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                  />
                </div>

                <button 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-100"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Registrar Fiado</>}
                </button>
              </form>
            </div>
          </section>

          {/* Listado de Docentes */}
          <section className="lg:col-span-2 w-full">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
              <div className="flex justify-between items-center mb-6 gap-2">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Users size={20} className="text-slate-400"/> Docentes
                </h2>
                <button 
                  onClick={() => setShowModal(true)}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95"
                >
                  <UserPlus size={16}/> Nuevo
                </button>
              </div>

              {fetching ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <Loader2 className="animate-spin mb-2" />
                  <p className="text-xs">Cargando...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {docentes.map(d => {
                    const saldo = d.deudas?.reduce((sum: number, item: any) => sum + item.monto, 0) || 0
                    return (
                      <div key={d.id} className="p-4 border border-slate-100 rounded-2xl bg-white flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start mb-3 overflow-hidden">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-bold text-slate-800 text-sm truncate">{d.nombre}</p>
                            <p className="text-[10px] text-slate-400 truncate">{d.puesto || 'Catedrático'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-black text-sm ${saldo > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                              Q {saldo.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {saldo > 0 && (
                          <button 
                            onClick={() => liquidarDeuda(d)}
                            className="w-full bg-green-50 text-green-700 py-2.5 rounded-xl text-[10px] font-black hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 size={12}/> MARCAR PAGADO
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Modal Agregar Docente */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
            <h3 className="text-xl font-black mb-5 text-slate-800">Nuevo Maestro</h3>
            <form onSubmit={handleAgregarDocente} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre Completo</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                  value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Puesto / Área</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                  value={nuevoPuesto} onChange={(e) => setNuevoPuesto(e.target.value)}
                />
              </div>
              <button 
                disabled={loading}
                className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl mt-2 active:scale-95 transition-transform"
              >
                {loading ? "Guardando..." : "Guardar Maestro"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
