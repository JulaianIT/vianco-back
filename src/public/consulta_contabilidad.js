
document.addEventListener('DOMContentLoaded', () => {
    const busquedaInput = document.getElementById('busqueda-placa');
    const placaSelect = document.getElementById('placa');
    const opcionesPlacas = Array.from(placaSelect.querySelectorAll('option'));

    busquedaInput.addEventListener('input', () => {
        const busqueda = busquedaInput.value.trim().toLowerCase();

        // Vaciar la lista desplegable
        placaSelect.innerHTML = '';

        // Filtrar las opciones y volver a llenar la lista desplegable
        opcionesPlacas.forEach(opcion => {
            const placa = opcion.textContent.trim().toLowerCase();
            if (placa.includes(busqueda)) {
                placaSelect.appendChild(opcion.cloneNode(true));
            }
        });
    });

    const consultaForm = document.getElementById('consulta-form');

    consultaForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evitar que el formulario se envíe por defecto

        const placaSeleccionada = placaSelect.value;
        const infoVehiculoDiv = document.getElementById('info-vehiculo');

        // Enviar la solicitud POST al servidor
        fetch('/consulta-vehiculos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ placa: placaSeleccionada })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al consultar el vehículo');
            }
            return response.json();
        })
        .then(vehiculo => {
            // Mostrar la información del vehículo como se muestra en tu código actual
        })
        .catch(error => {
            console.error('Error al consultar el vehículo:', error);
            infoVehiculoDiv.textContent = 'Error al consultar el vehículo';
        });
    });
});




document.addEventListener('DOMContentLoaded', () => {
    const busquedaInput = document.getElementById('busqueda-placa');
    const placaSelect = document.getElementById('placa');
    const opcionesPlacas = Array.from(placaSelect.querySelectorAll('option'));

    busquedaInput.addEventListener('input', () => {
        const busqueda = busquedaInput.value.trim().toLowerCase();

        // Vaciar la lista desplegable
        placaSelect.innerHTML = '';

        // Filtrar las opciones y volver a llenar la lista desplegable
        opcionesPlacas.forEach(opcion => {
            const placa = opcion.textContent.trim().toLowerCase();
            if (placa.includes(busqueda)) {
                placaSelect.appendChild(opcion.cloneNode(true));
            }
        });
    });

    const consultaForm = document.getElementById('consulta-form');

    consultaForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evitar que el formulario se envíe por defecto

        const placaSeleccionada = placaSelect.value;
        const infoVehiculoDiv = document.getElementById('info-vehiculo');

        // Enviar la solicitud POST al servidor
        fetch('/consulta-vehiculos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ placa: placaSeleccionada })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al consultar el vehículo');
            }
            return response.json();
        })
        .then(vehiculo => {
            // Mostrar la información del vehículo como se muestra en tu código actual
        })
        .catch(error => {
            console.error('Error al consultar el vehículo:', error);
            infoVehiculoDiv.textContent = 'Error al consultar el vehículo';
        });
    });
});


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
                 <h2>Información de licencia</h2>
                 <p><strong>PLACA:</strong> ${contabilidad.placa}</p>
                 <p><strong>NOMBRES Y APELLIDOS:</strong> ${contabilidad.NOMBRES_LICENCIA}</p>
                 <p><strong>TIPO DE DOCUMENTO:</strong> ${contabilidad.TIPO_DE_DOCUMENTO_LICENCIA	}</p>
                 <p><strong>N° DE DOCUMENTO:</strong> ${contabilidad.NUMERO_DE_DOCUMENTO_LICENCIA	}</p>
                <hr>
                <br>
                <h2>Información de Contrato</h2>
                           
                <p><strong>FECHA DE INICIO:</strong> ${contabilidad.FECHA_DE_INICIO_CONTRATO}</p>
                <p><strong>FECHA FINAL:</strong> ${contabilidad.FECHA_FINAL}</p>
                <p><strong>MOTIVO DEL RETIRO:</strong> ${contabilidad.MOTIVO_RETIRO}</p>
                <p><strong>NOMBRES Y APELLIDOS:</strong> ${contabilidad.NOMBRES_CONTRATO}</p>
                <p><strong>TIPO DE DOCUMENTO:</strong> ${contabilidad.TIPO_DE_DOCUMENTO_CONTRATO	}</p>
                <p><strong>NUMERO DE DOCUMENTO:</strong> ${contabilidad.NUMERO_DE_DOCUMENTO_CONTRATO}</p>
                <p><strong>DIRECCION:</strong> ${contabilidad.DIRECCION_CONTRATO}</p>
                <p><strong>CELULAR:</strong> ${contabilidad.CELULAR_CONTRATO}</p>
                <p><strong>EMAIL:</strong> ${contabilidad.EMAIL_CONTRATO}</p>
                <p><strong>ACTIVIDAD ECONOMICA:</strong> ${contabilidad.ACTIVIDAD_ECONOMICA_CONTRATO}</p>
                <p><strong>VALOR ADMINISTRACION:</strong> ${contabilidad.VALOR_ADMINISTRACION}</p>





                <hr>
                <br>
                <h2>Cuenta bancaria</h2>

                <p><strong>NOMBRES Y APELLIDOS:</strong> ${contabilidad.Nombre}</p>
                <p><strong>TIPO DE DOCUMENTO:</strong> ${contabilidad.tipo_documento}</p>
                <p><strong>N° DE DOCUMENTO:</strong> ${contabilidad.Cedula}</p>

                <p><strong> BANCO:</strong> ${contabilidad.Nombre_del_banco}</p>
                <p><strong>TIPO DE CUENTA BANCARIA:</strong> ${contabilidad.Tipo_de_cuenta_bancaria}</p>
                <p><strong>N° CUENTA:</strong> ${contabilidad.Numero_de_cuenta}</p>
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