document.addEventListener('DOMContentLoaded', () => {
    const consultaForm = document.getElementById('consulta-form');

    consultaForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evitar que el formulario se envíe por defecto

        const placaSeleccionada = document.getElementById('placa').value;
        const infoConductoresDiv = document.getElementById('info-conductores'); // Corregido el nombre del div

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
            console.log(conductor); // Para verificar los datos recibidos del servidor
        
             // Asigna conductor.foto a dynamicFotoURL
// Asigna conductor.foto a dynamicFotoURL
// Asigna conductor.foto a dynamicFotoURL
const dynamicFotoURL = conductor.foto ? conductor.foto.replaceAll('src/public/uploads/', '/uploads/') : '';


            // Mostrar la información del conductor
            infoConductoresDiv.innerHTML = `
                <h2>Información del Conductor</h2>
                <div class="conductor-image">
                    ${conductor.foto ? `<img src="${dynamicFotoURL}" alt="Foto del Conductor">` : ''}
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
