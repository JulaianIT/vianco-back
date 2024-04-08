

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
        const infoConductoresDiv = document.getElementById('info-conductores');

        // Enviar la solicitud POST al servidor
        fetch('/consulta-conductores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ placa: placaSeleccionada })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al consultar el conductor');
            }
            return response.json();
        })
        .then(conductor => {
            const fotoURL = conductor.fotoURL; // Corrección: usar 'fotoURL' en lugar de 'fotoURNL'
            
            // Mostrar la información del conductor
            infoConductoresDiv.innerHTML = `
                <h2>Información del Conductor</h2>
                <div class="conductor-image">
                    <img src="${fotoURL}" alt="Foto del Conductor" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <p><strong>NOMBRES Y APELLIDOS :</strong> ${conductor.conductor}</p>
                <p><strong>TIPO DE DOCUMENTO :</strong> ${conductor.tipo_documento}</p>
                <p><strong>N° DE DOCUMENTO :</strong> ${conductor.cedula}</p>
                <p><strong>FECHA DE NACIMIENTO :</strong> ${conductor.fecha_nacimiento}</p>
                <p><strong>FECHA DE EXPEDICION :</strong> ${conductor.fecha_expedicion}</p>

                <p><strong>TIPO DE SANGRE :</strong> ${conductor.tipo_sangre}</p>
                <p><strong>DIRECCION :</strong> ${conductor.direccion}</p>

                <p><strong>CELULAR :</strong> ${conductor.celular}</p>
                <p><strong>EMAIL :</strong> ${conductor.email}</p>
                <p><strong>CATEGORIA LICENCIA:</strong> ${conductor.categoria}</p>
                <p><strong>FECHA DE VIGENCIA:</strong> ${conductor.fecha_vigencia}</p>

                <p><strong>ARL:</strong> ${conductor.arl}</p>
                <p><strong>EPS :</strong> ${conductor.eps}</p>
                <p><strong>SEGURIDAD SOCIAL:</strong> ${conductor.seguridad_social}</p>
                <p><strong>EXAMENES MEDICOS:</strong> ${conductor.fecha_vencimiento_examen}</p>


                <p><strong> CONTACTO EN CASO DE EMERGENCIA :</strong> ${conductor.contacto_emergencia}</p>
                <p><strong>TELEFONO EN CASO DE EMERGENCIA:</strong> ${conductor.celular_emergencia}</p>
                <!-- Agrega más campos de información del conductor aquí -->
                <button id="editar-conductor-btn" class="btn editar-btn">Editar Información</button>
            `;
            
            // Agregar botón de editar con un id único
            infoConductoresDiv.innerHTML += `
                <a href="/agregar-conductor" class="volver-btn">Agregar Nuevo Conductor</a>
                <a href="/" class="volver-btn">Volver al Menú</a>
            `;

            // Ahora registramos el evento click en el botón de editar
            const editarBtn = document.getElementById('editar-conductor-btn');
            editarBtn.addEventListener('click', () => {
                // Redirigir a la página de edición del conductor
                window.location.href = `./edicionC/${placaSeleccionada}`;
            });
        })
        .catch(error => {
            console.error('Error al consultar el conductor:', error);
            infoConductoresDiv.textContent = 'Error al consultar el conductor';
        });
    });
});
