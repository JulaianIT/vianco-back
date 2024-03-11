document.addEventListener('DOMContentLoaded', () => {
    const consultaForm = document.getElementById('consulta-form');

    consultaForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evitar que el formulario se envíe por defecto

        const placaSeleccionada = document.getElementById('placa').value;
        const infoContabilidadDiv = document.getElementById('info-vehiculo');

        // Enviar la solicitud POST al servidor
        fetch('/consulta-contabilidad', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ placa: placaSeleccionada })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al consultar la contabilidad');
            }
            return response.json();
        })
        .then(contabilidad => {
            // Mostrar la información de la contabilidad
            infoContabilidadDiv.innerHTML = `
                 <h2>Información de Contabilidad</h2>
                <p><strong>PLACA:</strong> ${contabilidad.placa}</p>
                <p><strong>ACTIVIDAD ECONÓMICA:</strong> ${contabilidad.Actividad_economica}</p>
                <p><strong>NOMBRE DEL BANCO:</strong> ${contabilidad.Nombre_del_banco}</p>
                <p><strong>TIPO DE CUENTA BANCARIA:</strong> ${contabilidad.Tipo_de_cuenta_bancaria}</p>
                <p><strong>NÚMERO DE CUENTA:</strong> ${contabilidad.Numero_de_cuenta}</p>
                <p><strong>TIPO DE DOCUMENTO:</strong> ${contabilidad.tipo_documento}</p>
                <p><strong>CÉDULA:</strong> ${contabilidad.Cedula}</p>
                <p><strong>IDENTIFICACIÓN:</strong> ${contabilidad.Identificacion}</p>
                <p><strong>NOMBRE:</strong> ${contabilidad.Nombre}</p>
                <p><strong>DIRECCIÓN:</strong> ${contabilidad.Direccion}</p>
                <p><strong>CELULAR:</strong> ${contabilidad.Celular}</p>
                <p><strong>EMAIL:</strong> ${contabilidad.Email}</p>
                <!-- Agregar más campos de contabilidad aquí -->
                <button id="editar-btn" class="btn editar-btn">Editar Información</button>

                <a href="/agregar-contabilidad" class="volver-btn">Agregar contabilidad</a>
                <a href="/" class="volver-btn">Volver al Menú</a>

            
                `;
            
        // Obtener el botón de editar
const editarBtn = document.getElementById('editar-btn');
editarBtn.addEventListener('click', () => {
    // Obtener la placa del vehículo seleccionado
    const placaSeleccionada = document.getElementById('placa').value;
    // Redirigir a la página de edición de contabilidad
    window.location.href = `/edicion-contabilidad/${placaSeleccionada}`;
});

        })
        .catch(error => {
            console.error('Error al consultar el vehículo:', error);
            infoVehiculoDiv.textContent = 'Error al consultar el vehículo';
        });
    });
});