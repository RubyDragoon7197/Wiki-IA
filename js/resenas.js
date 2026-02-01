// Variables globales para el detalle
let iaActual = null;
let calificacionSeleccionada = 0;

console.log('resenas.js cargado correctamente');

// Abrir modal de detalle de IA
async function abrirDetalleIA(iaId) {
    console.log('Abriendo detalle de IA:', iaId);
    
    const modal = document.getElementById('iaDetalleModal');
    if (!modal) {
        console.error('Modal iaDetalleModal no encontrado');
        return;
    }

    abrirModal('iaDetalleModal');
}