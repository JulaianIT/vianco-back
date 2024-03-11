document.addEventListener('DOMContentLoaded', () => {
    const consultaForm = document.getElementById('consulta-form');

    consultaForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evitar que el formulario se envíe por defecto

        const placaSeleccionada = document.getElementById('placa').value;
        const infoVehiculoDiv = document.getElementById('info-vehiculo'); // Mover la inicialización aquí

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
            // Mostrar la información del vehículo
            infoVehiculoDiv.innerHTML = `
                 <h2>Información del Vehículo</h2>
                <p><strong>PLACA:</strong> ${vehiculo.Placa}</p>
                <p><strong>BASE:</strong> ${vehiculo.Base}</p>
                <p><strong>CONDUCTOR:</strong> ${vehiculo.Conductor}</p>
                <p><strong>N° MOVIL:</strong> ${vehiculo.No_movil}</p>
                <p><strong>MATRICULA:</strong> ${vehiculo.Matricula}</p>
                <p><strong>CLASE:</strong> ${vehiculo.Clase_vehiculo	}</p>
                <p><strong>CAPACIDAD:</strong> ${vehiculo.Capacidad}</p>
                <p><strong>PROPIETARIO CONTRATO:</strong> ${vehiculo.Propietario_contrato}</p>
                <p><strong>PROPIETARIO LICENCIA:</strong> ${vehiculo.Propietario_licencia}</p>
                <p><strong>AFILIADO A:</strong> ${vehiculo.Afiliado_a}</p>
                <p><strong>N° DE PUESTOS:</strong> ${vehiculo.Num_puestos}</p>
                <p><strong>N° DE EJES:</strong> ${vehiculo.Num_ejes}</p>
                <p><strong>N° CHASIS:</strong> ${vehiculo.Numero_chasis}</p>
                <p><strong>N° MOTOR:</strong> ${vehiculo.Numero_motor}</p>
                <p><strong>COLOR:</strong> ${vehiculo.Color}</p>
                <p><strong>CILINDRAJE:</strong> ${vehiculo.Cilindraje}</p>
                <p><strong>COMBUSTIBLE:</strong> ${vehiculo.Combustible}</p>
                <p><strong>CARROCERIA:</strong> ${vehiculo.Carroceria}</p>
                <p><strong>FECHA MATRICULA:</strong> ${vehiculo.Fecha_matricula}</p>
                <p><strong>N°SOAT:</strong> ${vehiculo.Num_soat}</p>
                <p><strong>FECHA VIGENCIA SOAT:</strong> ${vehiculo.Fecha_vigencia_soat}</p>
                <p><strong>N° TECNOMECANICA:</strong> ${vehiculo.Num_tecnomecanica}</p>
                <p><strong>CDA:</strong> ${vehiculo.Cda}</p>
                <p><strong>FECHA INICIO TECNOMECANICA:</strong> ${vehiculo.Fecha_inicio_tecnomecanica}</p>
                <p><strong>FECHA VIGENCIA:</strong> ${vehiculo.Fecha_vigencia}</p>
                <p><strong>N° POLIZAS RCC RCE:</strong> ${vehiculo.Num_polizas_rcc_rce}</p>
                <p><strong>COMPANIA ASEGURADORA:</strong> ${vehiculo.Compania_aseguradora}</p>
                <p><strong>VIGENCIA POLIZAS:</strong> ${vehiculo.Vigencia_polizas}</p>
                <p><strong>N° TARJETA OPERACION:</strong> ${vehiculo.Num_tarjeta_operacion}</p>
                <p><strong>EMPRESA AFILIACION:</strong> ${vehiculo.Empresa_afiliacion}</p>
                <p><strong>FECHA FINAL OPERACION:</strong> ${vehiculo.Fecha_final_operacion}</p>
                <p><strong>N° PREVENTIVA 1:</strong> ${vehiculo.Num_preventiva_1}</p>
                <p><strong>CDA PREVENTIVA:</strong> ${vehiculo.Cda_preventiva}</p>
                <p><strong>FECHA INICIAL PREVENTIVA 1:</strong> ${vehiculo.Fecha_inicial_preventiva_1}</p>
                <p><strong>FECHA FINAL PREVENTIVA 1:</strong> ${vehiculo.Fecha_final_preventiva_1}</p>
                

                <button id="editar-btn" class="btn editar-btn">Editar Información</button>
                <a href="/agregar-vehiculo" class="volver-btn">Agregar Nuevo Vehículo</a>

                <a href="/" class="volver-btn">Volver al Menú</a>

                `;
            
                // Obtener la placa del vehículo mostrada en la página de consulta
                const placaSeleccionada = vehiculo.Placa;

                // Ahora registramos el evento click en el botón de editar
                const editarBtn = document.getElementById('editar-btn');
                editarBtn.addEventListener('click', () => {
                    // Redirigir a la página de edición con la placa del vehículo como parámetro
                    window.location.href = `./edicion/${placaSeleccionada}`;
                });
            })
            .catch(error => {
                console.error('Error al consultar el vehículo:', error);
                infoVehiculoDiv.textContent = 'Error al consultar el vehículo';
            });
        });
    });