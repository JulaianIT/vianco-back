// Importar los módulos necesarios
const express = require("express");
const session = require("express-session");
const mysql = require("mysql2");
const { engine } = require("express-handlebars");
const multer = require('multer');
const upload = multer();
const bodyParser = require('body-parser');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const html2canvas = require('html2canvas');
const nodemailer = require('nodemailer');
const db = require('./app'); // Asegúrate de que la ruta sea correcta
let turnoIniciado = false;
const flash = require('express-flash');
// Establecer la zona horaria de la aplicación Node.js
process.env.TZ = 'America/Bogota';

function htmlToPdf(html, options, callback) {
    pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) {
            callback(err);
        } else {
            callback(null, buffer);
        }
    });
}



// Importar el manejador de webhook
const webhookHandler = require("./webhook/webhookHandler");

// Importar las rutas de login
const loginRoutes = require("./routes/login");

// Crear una instancia de la aplicación Express
const app = express();

app.set("port", process.env.PORT || 3000);

// Configuración de Handlebars
app.set("views", __dirname + "/views");
app.engine(".hbs", engine({
    extname: ".hbs"
}));
app.set("view engine", "hbs");
app.use(express.static(__dirname + '/public'));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

const connection = mysql.createConnection({
    host: "69.61.31.131",
    user: "viancote_soporte",
    password: "MXPwPzz4zlU=",
    database: "viancote_nodelogin",
    port: "3306"
});


// Función para enviar un ping a la base de datos periódicamente
function sendPing() {
    connection.ping(err => {
        if (err) {
            console.error("Error al enviar ping a la base de datos:", err);
        } else {
            console.log("Ping enviado a la base de datos");
        }
    });
}

// Configura el intervalo para enviar el ping cada 5 minutos (300,000 milisegundos)
const pingInterval = setInterval(sendPing, 300000);

// Maneja los eventos de error y cierre de la conexión
connection.on('error', err => {
    console.error("Error en la conexión a la base de datos:", err);
    clearInterval(pingInterval); // Detiene el intervalo cuando se produce un error
});

connection.on('close', () => {
    console.log("Conexión a la base de datos cerrada");
    clearInterval(pingInterval); // Detiene el intervalo cuando se cierra la conexión
});

// Conecta con la base de datos
connection.connect(err => {
    if (err) {
        console.error("Error al conectar con la base de datos:", err);
        return;
    }
    console.log("Conectado a la base de datos");

    // Envía el primer ping después de conectar
    sendPing();
});

app.use((req, res, next) => {
    req.db = connection;
    next();
});

app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
}));

// Configurar la ruta para el webhook y usar el manejador de webhook
app.post("/webhook", webhookHandler.handleWebhook);

// Rutas para el login
app.use("/login", loginRoutes);








// Ruta para la programación de vehículos
// Ruta para la programación de vehículos
app.get("/programacion-vehiculos", (req, res) => {
    if (req.session.loggedin === true) {
        const rolesString = req.session.roles;
        const roles = Array.isArray(rolesString) ? rolesString : [];
        
        const ejecutivo1 = roles.includes('ejecutivo1');
        const ejecutivo2 = roles.includes('ejecutivo2');
        const ejecutivo3 = roles.includes('ejecutivo3');
        const ejecutivo4 = roles.includes('ejecutivo4');
        const ejecutivo5 = roles.includes('ejecutivo5');
        const ejecutivo6 = roles.includes('ejecutivo6');
        const ejecutivo7 = roles.includes('ejecutivo7');
        const ejecutivo8 = roles.includes('ejecutivo8');
        
        const isExecutive = roles.includes('ejecutivo');
        
        // Consulta SQL para obtener las bases y placas
        connection.query("SELECT base, placa FROM vehiculos", (error, results) => {
            if (error) {
                console.error("Error al obtener las bases y placas:", error);
                res.status(500).send("Error al obtener las bases y placas");
                return;
            }
            // Renderizar la vista de programación de vehículos con los datos de las bases y placas
            res.render("programacion/programacion", { 
                basesPlacas: results,
                name: req.session.name, 
                isExecutive, 
                ejecutivo1, 
                ejecutivo2, 
                ejecutivo3,
                ejecutivo4,
                ejecutivo5,
                ejecutivo6,
                ejecutivo7,
                ejecutivo8,
                // Otros roles ejecutivos...
            });
        });
    } else {
        res.redirect("/login/index");
    }
});

        



function otraFuncion(req, res, next) {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
    } else {
        console.log('El usuario no está autenticado.');
    }
}




// Ruta para la página principal
app.get("/", (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        console.log(`El usuario ${nombreUsuario} está autenticado.`);
        req.session.nombreGuardado = nombreUsuario; // Guarda el nombre en la sesión

        const rolesString = req.session.roles;
        const roles = Array.isArray(rolesString) ? rolesString : [];
        otraFuncion(req, res); // Llama a otraFuncion para obtener el nombre de usuario

//EJECUTIVOS

const ejecutivo1 = roles.includes('ejecutivo1');
const ejecutivo2 = roles.includes('ejecutivo2');
const ejecutivo3 = roles.includes('ejecutivo3');
const ejecutivo4 = roles.includes('ejecutivo4');
const ejecutivo5 = roles.includes('ejecutivo5');
const ejecutivo6 = roles.includes('ejecutivo6');
const ejecutivo7 = roles.includes('ejecutivo7');
const ejecutivo8 = roles.includes('ejecutivo8');








        const isControl = roles.includes('seguimiento');
        const isAdmin = roles.includes('gerencia');
        const isExecutive = roles.includes('ejecutivo');
        const isOperative = roles.includes('operativo'); // Verificar si el usuario tiene el rol de 'operativo'

        res.render("home",{ name: req.session.name, isAdmin, isExecutive, isOperative,isControl,ejecutivo1,ejecutivo2,ejecutivo3,ejecutivo4,ejecutivo5,ejecutivo6,ejecutivo7,ejecutivo8 }); // Pasar los roles a la plantilla
    } else {
        res.redirect("/login/index");
    }
});


// Ruta para logout
app.get("/logout", (req, res) => {
    if (req.session.loggedin === true) {
        req.session.destroy();
    }
    res.redirect("/login/index");
});

// Ruta para administrar roles
app.get("/admin/roles", (req, res) => {
    // Verificar si el usuario tiene permisos de administrador
    if (req.session.loggedin && req.session.roles.includes('gerencia')) {
        // Obtener los usuarios y sus roles desde la base de datos
        connection.query("SELECT id, email, name, roles FROM user", (error, results) => {
            if (error) {
                console.error("Error al obtener usuarios y roles:", error);
                res.status(500).send("Error al obtener usuarios y roles");
                return;
            }
            // Renderizar la vista de administración de roles con los datos de los usuarios
            res.render("admin/roles", { users: results });
        });
    } else {
        res.redirect("/"); // Redirigir a la página principal si el usuario no tiene permisos de administrador
    }
});


// Ruta para la página de ajustes de roles
app.get("/admin/roles", (req, res) => {
    // Verificar si el usuario tiene permisos de administrador
    if (req.session.loggedin && req.session.roles.includes('gerencia')) {
        // Aquí puedes agregar la lógica para mostrar la página de ajustes de roles
        res.render("admin/roles"); // Esto renderiza una vista llamada "roles.hbs", por ejemplo
    } else {
        res.redirect("/"); // Redirigir a la página principal si el usuario no tiene permisos de administrador
    }
});

// Ruta para mostrar el formulario de edición de roles
app.get("/admin/roles/:id/edit", (req, res) => {
    // Verificar si el usuario tiene permisos de administrador
    if (req.session.loggedin && req.session.roles.includes('gerencia')) {
        const userId = req.params.id;
        // Obtener información del usuario y sus roles desde la base de datos
        connection.query("SELECT id, email, name, roles FROM user WHERE id = ?", [userId], (error, results) => {
            if (error) {
                console.error("Error al obtener información del usuario:", error);
                res.status(500).send("Error al obtener información del usuario");
                return;
            }
            // Renderizar el formulario de edición de roles con los datos del usuario
            res.render("admin/editRole", { user: results[0] });
        });
    } else {
        res.redirect("/"); // Redirigir a la página principal si el usuario no tiene permisos de administrador
    }
});
// Ruta para procesar la edición de roles
app.post("/admin/editRole/:id/edit", (req, res) => {
    // Verificar si el usuario tiene permisos de administrador
    if (req.session.loggedin && req.session.roles.includes('gerencia')) {
        const userId = req.params.id;
        const newRole = req.body.newRole; // Obtener el nuevo rol del cuerpo de la solicitud
        
        // Actualizar el rol del usuario en la base de datos
        connection.query("UPDATE user SET roles = ? WHERE id = ?", [newRole, userId], (error, results) => {
            if (error) {
                console.error("Error al actualizar el rol del usuario:", error);
                res.status(500).send("Error al actualizar el rol del usuario");
                return;
            }
            // Redirigir a la página de administración de roles después de la actualización
            res.redirect("/admin/roles");
        });
    } else {
        res.redirect("/"); // Redirigir a la página principal si el usuario no tiene permisos de administrador
    }
});
// Ruta para obtener la lista de bases
app.get('/api/bases', (req, res) => {
    connection.query('SELECT DISTINCT base FROM vehiculos', (error, results) => {
        if (error) {
            console.error('Error al obtener las bases:', error);
            res.status(500).json({ error: 'Error al obtener las bases' });
            return;
        }
        const bases = results.map(result => result.base);
        res.json(bases);
    });
});

// Ruta para obtener la lista de placas según la base seleccionada
app.get('/api/placas', (req, res) => {
    const baseSeleccionada = req.query.base;
    connection.query('SELECT placa FROM vehiculos WHERE base = ?', [baseSeleccionada], (error, results) => {
        if (error) {
            console.error('Error al obtener las placas:', error);
            res.status(500).json({ error: 'Error al obtener las placas' });
            return;
        }
        const placas = results.map(result => result.placa);
        res.json(placas);
    });
});
// Ruta para manejar la programación de vehículos
app.post("/programacion-vehiculos", (req, res) => {
    // Aquí puedes agregar la lógica para manejar los datos enviados desde el formulario
    // Por ejemplo, puedes obtener los datos del cuerpo de la solicitud (req.body) y realizar la programación de vehículos en la base de datos
    
    // Después de manejar los datos, puedes redirigir a una página de éxito o renderizar una vista que indique que la programación fue exitosa
});


// Definir las rutas
app.get("/consulta-vehiculos", (req, res) => {
    // Consulta SQL para obtener las placas disponibles
    connection.query("SELECT placa FROM vehiculos", (error, results) => {
        if (error) {
            console.error("Error al obtener las placas:", error);
            res.status(500).send("Error al obtener las placas");
            return;
        }
        // Renderizar la vista de consulta de vehículos con los datos de las placas
        res.render("consulta", { placas: results.map(result => result.placa) });
    });
});

app.post("/consulta-vehiculos", (req, res) => {
    const placaSeleccionada = req.body.placa; // Obtener la placa seleccionada del cuerpo de la solicitud
    // Consulta SQL para obtener la información del vehículo correspondiente a la placa seleccionada
    connection.query("SELECT * FROM vehiculos WHERE placa = ?", [placaSeleccionada], (error, results) => {
        if (error) {
            console.error("Error al obtener la información del vehículo:", error);
            res.status(500).send("Error al obtener la información del vehículo");
            return;
        }
        if (results.length === 0) {
            // Si no se encuentra ningún vehículo con la placa seleccionada, enviar un mensaje de error
            res.status(404).send("Vehículo no encontrado");
            return;
        }
        const vehiculo = results[0]; // Obtener el primer vehículo encontrado (debería haber solo uno)
        // Enviar la información del vehículo al cliente en formato JSON
      
        
           // Convertir los datos binarios de la imagen en una URL base64
         
           const fotoURL = vehiculo.foto_vehiculo ? `data:image/jpeg;base64,${vehiculo.foto_vehiculo.toString('base64')}` : null;
           res.json({ ...vehiculo, fotoURL });
        });
});

// Ruta para la página de edición en el servidor
app.get('/edicion/:placa', (req, res) => {
    const placa = req.params.placa;
    
    // Realizar una consulta a la base de datos para obtener los datos del vehículo
    connection.query('SELECT * FROM vehiculos WHERE placa = ?', placa, (error, results) => {
        if (error) {
            console.error("Error al obtener los datos del vehículo:", error);
            res.status(500).send("Error al obtener los datos del vehículo");
            return;
        }

        if (results.length === 0) {
            console.error("No se encontró ningún vehículo con la placa proporcionada:", placa);
            res.status(404).send("No se encontró ningún vehículo con la placa proporcionada");
            return;
        }

        // Renderizar la vista de edición con los datos del vehículo
        res.render('edicion', { vehiculo: results[0] }); // Pasar los datos del vehículo a la vista
    });
});

app.post('/guardar-edicion', upload.single('foto_vehiculo'), (req, res) => {
    let fotoData = null; // Inicializar la variable para los datos de la foto

    // Verificar si se subió una nueva foto
    if (req.file) {
        fotoData = req.file.buffer; // Establecer los datos binarios de la nueva foto
    }

    // Obtener otros datos del vehículo desde el cuerpo de la solicitud
    const { placa, Base, Conductor, No_movil, Matricula, Marca, Linea, Clase_vehiculo, Modelo, Capacidad, Propietario_contrato, Propietario_licencia, Afiliado_a, Num_puestos, Puertas, Peso_bruto, Num_ejes, Numero_chasis, Numero_motor, Color, Cilindraje, Combustible, Carroceria, Fecha_matricula, Num_soat, Entidad, Fecha_vigencia_soat, Num_tecnomecanica, Cda, Fecha_inicio_tecnomecanica, Fecha_vigencia, Num_polizas_rcc_rce, Compania_aseguradora, Vigencia_polizas, Num_tarjeta_operacion, Empresa_afiliacion, Fecha_final_operacion, Num_preventiva_1, Cda_preventiva, Fecha_inicial_preventiva_1, Fecha_final_preventiva_1 ,n_convenio,fecha_vigencia_convenio} = req.body;

    // Construir la consulta SQL para la actualización
    let sqlQuery;
    let queryParams;

    if (fotoData) {
        // Si se ha cargado una nueva foto, incluir el campo de foto en la actualización
        sqlQuery = 'UPDATE vehiculos SET Base=?, Conductor=?, No_movil=?, Matricula=?, Marca=?, Linea=?, Clase_vehiculo=?, Modelo=?, Capacidad=?, Propietario_contrato=?, Propietario_licencia=?, Afiliado_a=?, Num_puestos=?, Puertas=?, Peso_bruto=?, Num_ejes=?, Numero_chasis=?, Numero_motor=?, Color=?, Cilindraje=?, Combustible=?, Carroceria=?, Fecha_matricula=?, Num_soat=?, Entidad=?, Fecha_vigencia_soat=?, Num_tecnomecanica=?, Cda=?, Fecha_inicio_tecnomecanica=?, Fecha_vigencia=?, Num_polizas_rcc_rce=?, Compania_aseguradora=?, Vigencia_polizas=?, Num_tarjeta_operacion=?, Empresa_afiliacion=?, Fecha_final_operacion=?, Num_preventiva_1=?, Cda_preventiva=?, Fecha_inicial_preventiva_1=?, Fecha_final_preventiva_1=?, foto_vehiculo=?, n_convenio=?, fecha_vigencia_convenio=? WHERE Placa=?';
        queryParams = [Base, Conductor, No_movil, Matricula, Marca, Linea, Clase_vehiculo, Modelo, Capacidad, Propietario_contrato, Propietario_licencia, Afiliado_a, Num_puestos, Puertas, Peso_bruto, Num_ejes, Numero_chasis, Numero_motor, Color, Cilindraje, Combustible, Carroceria, Fecha_matricula, Num_soat, Entidad, Fecha_vigencia_soat, Num_tecnomecanica, Cda, Fecha_inicio_tecnomecanica, Fecha_vigencia, Num_polizas_rcc_rce, Compania_aseguradora, Vigencia_polizas, Num_tarjeta_operacion, Empresa_afiliacion, Fecha_final_operacion, Num_preventiva_1, Cda_preventiva, Fecha_inicial_preventiva_1, Fecha_final_preventiva_1, fotoData,n_convenio,fecha_vigencia_convenio, placa];
    } else {
        // Si no se ha cargado una nueva foto, omitir el campo de foto en la actualización
        sqlQuery = 'UPDATE vehiculos SET Base=?, Conductor=?, No_movil=?, Matricula=?, Marca=?, Linea=?, Clase_vehiculo=?, Modelo=?, Capacidad=?, Propietario_contrato=?, Propietario_licencia=?, Afiliado_a=?, Num_puestos=?, Puertas=?, Peso_bruto=?, Num_ejes=?, Numero_chasis=?, Numero_motor=?, Color=?, Cilindraje=?, Combustible=?, Carroceria=?, Fecha_matricula=?, Num_soat=?, Entidad=?, Fecha_vigencia_soat=?, Num_tecnomecanica=?, Cda=?, Fecha_inicio_tecnomecanica=?, Fecha_vigencia=?, Num_polizas_rcc_rce=?, Compania_aseguradora=?, Vigencia_polizas=?, Num_tarjeta_operacion=?, Empresa_afiliacion=?, Fecha_final_operacion=?, Num_preventiva_1=?, Cda_preventiva=?, Fecha_inicial_preventiva_1=?, Fecha_final_preventiva_1=?,n_convenio=?,fecha_vigencia_convenio=? WHERE Placa=?';
        queryParams = [Base, Conductor, No_movil, Matricula, Marca, Linea, Clase_vehiculo, Modelo, Capacidad, Propietario_contrato, Propietario_licencia, Afiliado_a, Num_puestos, Puertas, Peso_bruto, Num_ejes, Numero_chasis, Numero_motor, Color, Cilindraje, Combustible, Carroceria, Fecha_matricula, Num_soat, Entidad, Fecha_vigencia_soat, Num_tecnomecanica, Cda, Fecha_inicio_tecnomecanica, Fecha_vigencia, Num_polizas_rcc_rce, Compania_aseguradora, Vigencia_polizas, Num_tarjeta_operacion, Empresa_afiliacion, Fecha_final_operacion, Num_preventiva_1, Cda_preventiva, Fecha_inicial_preventiva_1, Fecha_final_preventiva_1, n_convenio,fecha_vigencia_convenio, placa];
    }

    // Realizar la actualización en la base de datos con los datos recibidos
    connection.query(sqlQuery, queryParams, (error, results) => {
        if (error) {
            console.error('Error al guardar los cambios:', error);
            res.status(500).send('Error al guardar los cambios');
            return;
        }
        if (results.affectedRows === 0) {
            console.error('No se encontró ningún vehículo con la placa proporcionada:', placa);
            res.status(404).send('No se encontró ningún vehículo con la placa proporcionada');
            return;
        }
        console.log('Cambios guardados correctamente en la base de datos');
        // Redirigir al usuario de vuelta a la página de consulta de vehículos
        res.redirect(`/consulta-vehiculos?placa=${placa}`);
    });
});



// Ruta para mostrar el formulario de agregar vehículo
app.get("/agregar-vehiculo", (req, res) => {
    res.render('formulario_agregar'); // Renderizar la vista del formulario de agregar
});

// Ruta para manejar los datos enviados desde el formulario y agregar un nuevo vehículo a la base de datos
app.post("/agregar-vehiculo", (req, res) => {
    // Obtener todos los campos del formulario
    const formData = req.body;

    // Construir las cláusulas SET y los valores para la consulta SQL
    let setClause = '';
    let values = [];

    // Iterar sobre los campos del formulario
    Object.keys(formData).forEach((key, index) => {
        // Si el valor del campo no está vacío
        if (formData[key]) {
            // Agregar el nombre del campo y el signo de interrogación al conjunto
            setClause += `${key} = ?, `;
            // Agregar el valor del campo al array de valores
            values.push(formData[key]);
        }
    });

    // Quitar la coma final de la cláusula SET
    setClause = setClause.slice(0, -2);

    // Insertar los datos en la base de datos
    connection.query(
        `INSERT INTO vehiculos SET ${setClause}`,
        values,
        (error, results) => {
            if (error) {
                console.error("Error al agregar el vehículo:", error);
                res.status(500).send("Error al agregar el vehículo");
                return;
            }
            console.log("Vehículo agregado correctamente a la base de datos");
            // Redirigir al usuario de vuelta a la página de consulta de vehículos
            res.redirect(`/consulta-vehiculos`);
        }
    );
});


// Vista del formulario de agregación de vehículos (formulario_agregar.ejs)
// Asegúrate de tener campos para todos los datos que deseas recopilar para un nuevo vehículo
// y un botón de envío para enviar el formulario al servidor.






app.use(express.static('public'));
// Ruta para la página de consulta de conductores
app.get('/consulta-conductores', (req, res) => {
    // Consulta SQL para obtener las placas disponibles
    connection.query('SELECT placa FROM conductores', (error, results) => {
      if (error) {
        console.error('Error al obtener las placas:', error);
        res.status(500).send('Error al obtener las placas');
        return;
      }
      // Renderizar la vista de consulta de conductores con los datos de las placas
      res.render('conductores', { placas: results.map((result) => result.placa) }); // Utiliza la plantilla "conductores"
    });
});

app.post("/consulta-conductores", (req, res) => {
    const placaSeleccionada = req.body.placa; // Obtener la placa seleccionada del cuerpo de la solicitud
    // Consulta SQL para obtener la información del conductor correspondiente a la placa seleccionada
    connection.query("SELECT * FROM conductores WHERE placa = ?", [placaSeleccionada], (error, results) => {
        if (error) {
            console.error("Error al obtener la información del conductor:", error);
            res.status(500).send("Error al obtener la información del conductor");
            return;
        }
        if (results.length === 0) {
            // Si no se encuentra ningún conductor con la placa seleccionada, enviar un mensaje de error
            res.status(404).send("Conductor no encontrado");
            return;
        }
        const conductor = results[0]; // Obtener el primer conductor encontrado (debería haber solo uno)
        // Enviar la información del conductor al cliente en formato JSON
      
        const fotoURL = conductor.foto ? `data:image/jpeg;base64,${conductor.foto.toString('base64')}` : null;
        res.json({ ...conductor, fotoURL });
    });
});



// Manejador de ruta para procesar el formulario y agregar un nuevo conductor a la base de datos
app.post('/agregar-conductor', upload.single('foto'), (req, res) => {
  // Verificar si se subió una foto
  if (!req.file) {
    // Si no se subió ninguna foto, manejar el error aquí
    return res.status(400).send('No se seleccionó ninguna foto.');
  }

  // Aquí puedes acceder al archivo subido a través de req.file
  const fotoPath = req.file.path;

  // Obtener todos los campos del formulario incluida la información de la foto
  const formData = { ...req.body, foto: fotoPath };

  // Insertar los datos en la base de datos
  connection.query(
    `INSERT INTO conductores (placa, conductor, tipo_documento, cedula, fecha_nacimiento, fecha_expedicion, tipo_sangre, direccion, celular, email, categoria, fecha_vigencia, arl, eps, seguridad_social, fecha_vencimiento_examen,certificado_1,fecha_certificado_1, contacto_emergencia, celular_emergencia, foto) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      formData.placa,
      formData.conductor,
      formData.tipo_documento,
      formData.cedula,
      formData.fecha_nacimiento,
      formData.fecha_expedicion,
      formData.tipo_sangre,
      formData.direccion,
      formData.celular,
      formData.email,
      formData.categoria,
      formData.fecha_vigencia,
      formData.arl,
      formData.eps,
      formData.seguridad_social,
      formData.fecha_vencimiento_examen,
      formData.certificado_1,
      formData.fecha_certificado_1,

      formData.contacto_emergencia,
      formData.celular_emergencia,
      formData.foto
    ],
    (error, results) => {
      if (error) {
        console.error('Error al agregar el conductor:', error);
        res.status(500).send('Error al agregar el conductor');
        return;
      }
      console.log('Conductor agregado correctamente a la base de datos');
      // Redirigir al usuario de vuelta a la página de consulta de conductores
      res.redirect(`/consulta-conductores`);
    }
  );
});



// Ruta para mostrar la página de edición de conductor
app.get('/edicionC/:placa', (req, res) => {
  const placa = req.params.placa;
  // Realizar una consulta a la base de datos para obtener los datos del conductor
  connection.query('SELECT * FROM conductores WHERE placa = ?', placa, (error, results) => {
    if (error) {
      console.error('Error al obtener los datos del conductor:', error);
      res.status(500).send('Error al obtener los datos del conductor');
      return;
    }
    if (results.length === 0) {
      console.error('No se encontró ningún conductor con la placa proporcionada:', placa);
      res.status(404).send('No se encontró ningún conductor con la placa proporcionada');
      return;
    }
    // Renderizar la vista de edición con los datos del conductor
    res.render('edicionC', { conductor: results[0] }); // Pasar los datos del conductor a la vista
  });
});



// Manejador de la solicitud POST para guardar la edición del conductor en el servidor
app.post('/guardar-edicionC', upload.single('foto'), (req, res) => {
    let fotoData = null; // Inicializar la variable para los datos de la foto

    // Verificar si se subió una nueva foto
    if (req.file) {
        fotoData = req.file.buffer; // Establecer los datos binarios de la nueva foto
    }

    // Obtener otros datos del conductor desde el cuerpo de la solicitud
    const { placa, conductor, tipo_documento, cedula, fecha_expedicion, fecha_nacimiento, celular, email, direccion, arl, eps, seguridad_social, fecha_vencimiento_examen, categoria, fecha_vigencia, tipo_sangre,certificado_1,fecha_certificado_1, contacto_emergencia, celular_emergencia } = req.body;

    // Construir la consulta SQL para la actualización
    let sqlQuery;
    let queryParams;

    if (fotoData) {
        // Si se ha cargado una nueva foto, actualizar también el campo de foto
        sqlQuery = 'UPDATE conductores SET conductor = ?, tipo_documento = ?, cedula = ?, fecha_expedicion = ?, fecha_nacimiento = ?, celular = ?, email = ?, direccion = ?, arl = ?, eps = ?, seguridad_social = ?, fecha_vencimiento_examen = ?, categoria = ?, fecha_vigencia = ?, tipo_sangre = ?, certificado_1 = ?,fecha_certificado_1 = ?, contacto_emergencia = ?, celular_emergencia = ?, foto = ? WHERE placa = ?';
        queryParams = [conductor, tipo_documento, cedula, fecha_expedicion, fecha_nacimiento, celular, email, direccion, arl, eps, seguridad_social, fecha_vencimiento_examen, categoria, fecha_vigencia, tipo_sangre,certificado_1,fecha_certificado_1, contacto_emergencia, celular_emergencia, fotoData, placa];
    } else {
        // Si no se ha cargado una nueva foto, mantener la foto existente
        sqlQuery = 'UPDATE conductores SET conductor = ?, tipo_documento = ?, cedula = ?, fecha_expedicion = ?, fecha_nacimiento = ?, celular = ?, email = ?, direccion = ?, arl = ?, eps = ?, seguridad_social = ?, fecha_vencimiento_examen = ?, categoria = ?, fecha_vigencia = ?, tipo_sangre = ?,certificado_1 = ?,fecha_certificado_1 = ?, contacto_emergencia = ?, celular_emergencia = ? WHERE placa = ?';
        queryParams = [conductor, tipo_documento, cedula, fecha_expedicion, fecha_nacimiento, celular, email, direccion, arl, eps, seguridad_social, fecha_vencimiento_examen, categoria, fecha_vigencia, tipo_sangre,certificado_1,fecha_certificado_1, contacto_emergencia, celular_emergencia, placa];
    }

    // Realizar la actualización en la base de datos con los datos recibidos
    connection.query(sqlQuery, queryParams, (error, results) => {
        if (error) {
            console.error('Error al guardar los cambios:', error);
            res.status(500).send('Error al guardar los cambios');
            return;
        }
        if (results.affectedRows === 0) {
            console.error('No se encontró ningún conductor con la placa proporcionada:', placa);
            res.status(404).send('No se encontró ningún conductor con la placa proporcionada');
            return;
        }
        console.log('Cambios guardados correctamente en la base de datos');
        // Redirigir al usuario de vuelta a la página de consulta del conductor
        res.redirect(`/consulta-conductores?placa=${placa}`);
    });
});


// Ruta para renderizar la página del formulario de agregar conductor
app.get('/agregar-conductor', (req, res) => {
  // Renderiza el formulario para agregar un nuevo conductor
  res.render('formulario_agregar_conductor');
});

//consulta contabilidad 
app.get("/consulta-contabilidad", (req, res) => {
    // Consulta SQL para obtener todas las placas disponibles
    connection.query("SELECT placa FROM contabilidad", (error, results) => {
        if (error) {
            console.error("Error al obtener las placas de contabilidad:", error);
            res.status(500).send("Error al obtener las placas de contabilidad");
            return;
        }
        const placas = results.map(result => result.placa); // Extraer solo las placas de los resultados
        res.render("consulta_contabilidad", { placas: placas }); // Renderizar la plantilla y pasar las placas como datos
    });
});











//consulta contabilidad 
app.post("/consulta-contabilidad", (req, res) => {
    const placaSeleccionada = req.body.placa; // Obtener la placa seleccionada del cuerpo de la solicitud
    // Consulta SQL para obtener la información de contabilidad correspondiente a la placa seleccionada
    connection.query("SELECT * FROM contabilidad WHERE placa = ?", [placaSeleccionada], (error, results) => {
        if (error) {
            console.error("Error al obtener la información de contabilidad:", error);
            res.status(500).send("Error al obtener la información de contabilidad");
            return;
        }
        if (results.length === 0) {
            // Si no se encuentra ninguna entrada de contabilidad con la placa seleccionada, enviar un mensaje de error
            res.status(404).send("No se encontró ninguna entrada de contabilidad con la placa seleccionada");
            return;
        }
        const entradaContabilidad = results[0]; // Obtener la primera entrada de contabilidad encontrada (debería haber solo una)
        // Renderizar la plantilla y pasar las placas y la entrada de contabilidad como datos
        res.json(entradaContabilidad);
    });
});





// Ruta para cargar la página de edición de contabilidad
app.get("/edicion-contabilidad/:placa", (req, res) => {
    const placa = req.params.placa; // Obtener la placa del parámetro de la URL
    // Consulta SQL para obtener la información de contabilidad correspondiente a la placa
    connection.query("SELECT * FROM contabilidad WHERE placa = ?", [placa], (error, results) => {
        if (error) {
            console.error("Error al obtener la información de contabilidad:", error);
            res.status(500).send("Error al obtener la información de contabilidad");
            return;
        }
        if (results.length === 0) {
            // Si no se encuentra ninguna entrada de contabilidad con la placa seleccionada, enviar un mensaje de error
            res.status(404).send("No se encontró ninguna entrada de contabilidad con la placa seleccionada");
            return;
        }
        const contabilidad = results[0]; // Obtener la primera entrada de contabilidad encontrada
        // Renderizar la plantilla de edición de contabilidad y pasar la información de contabilidad como datos
        res.render("edicion_contabilidad", { contabilidad: contabilidad });
    });
});

// Ruta para manejar el formulario de edición de contabilidad
app.post('/guardar-edicion-contabilidad', (req, res) => {
    const placa = req.body.placa;
    // Obtener los datos del cuerpo de la solicitud
    const { NOMBRES_LICENCIA, TIPO_DE_DOCUMENTO_LICENCIA, NUMERO_DE_DOCUMENTO_LICENCIA, FECHA_DE_INICIO_CONTRATO, FECHA_FINAL, MOTIVO_RETIRO, NOMBRES_CONTRATO,TIPO_DE_DOCUMENTO_CONTRATO, NUMERO_DE_DOCUMENTO_CONTRATO, DIRECCION_CONTRATO,CELULAR_CONTRATO, EMAIL_CONTRATO, ACTIVIDAD_ECONOMICA_CONTRATO, VALOR_ADMINISTRACION, Nombre, tipo_documento, Cedula, Nombre_del_banco, Tipo_de_cuenta_bancaria, Numero_de_cuenta, direccion, celular, email } = req.body;

    // Realizar la actualización en la base de datos con los datos recibidos
    connection.query(
        'UPDATE contabilidad SET NOMBRES_LICENCIA = ?, TIPO_DE_DOCUMENTO_LICENCIA = ?, NUMERO_DE_DOCUMENTO_LICENCIA = ?, FECHA_DE_INICIO_CONTRATO = ?, FECHA_FINAL = ?, MOTIVO_RETIRO = ?, NOMBRES_CONTRATO = ?, TIPO_DE_DOCUMENTO_CONTRATO = ?,NUMERO_DE_DOCUMENTO_CONTRATO = ?, DIRECCION_CONTRATO = ?,CELULAR_CONTRATO = ?, EMAIL_CONTRATO = ?, ACTIVIDAD_ECONOMICA_CONTRATO = ?, VALOR_ADMINISTRACION = ?, Nombre = ?, tipo_documento = ?, Cedula = ?, Nombre_del_banco = ?, Tipo_de_cuenta_bancaria = ?, Numero_de_cuenta = ?, Direccion = ?, Celular = ?, Email = ? WHERE placa = ?',
        [NOMBRES_LICENCIA, TIPO_DE_DOCUMENTO_LICENCIA, NUMERO_DE_DOCUMENTO_LICENCIA, FECHA_DE_INICIO_CONTRATO, FECHA_FINAL, MOTIVO_RETIRO, NOMBRES_CONTRATO, TIPO_DE_DOCUMENTO_CONTRATO,NUMERO_DE_DOCUMENTO_CONTRATO,DIRECCION_CONTRATO,CELULAR_CONTRATO, EMAIL_CONTRATO, ACTIVIDAD_ECONOMICA_CONTRATO, VALOR_ADMINISTRACION, Nombre, tipo_documento, Cedula, Nombre_del_banco, Tipo_de_cuenta_bancaria, Numero_de_cuenta, direccion, celular, email, placa],
        (error, results) => {
            if (error) {
                console.error("Error al guardar los cambios:", error);
                res.status(500).send("Error al guardar los cambios");
                return;
            }
            if (results.affectedRows === 0) {
                console.error("No se encontró ninguna entrada de contabilidad con la placa proporcionada:", placa);
                res.status(404).send("No se encontró ninguna entrada de contabilidad con la placa proporcionada");
                return;
            }
            console.log("Cambios guardados correctamente en la base de datos");
            // Redirigir al usuario de vuelta a la página de consulta de contabilidad
            res.redirect(`/consulta-contabilidad?placa=${placa}`);
        }
    );
});

























// agregar contabilidad 
// Ruta para renderizar la página del formulario de agregar contabilidad
// Ruta para renderizar la página del formulario de agregar contabilidad
app.get("/agregar-contabilidad", (req, res) => {
    // Renderiza el formulario para agregar una nueva entrada de contabilidad
    res.render("formulario_agregar_contabilidad");
});

// Ruta para manejar los datos enviados desde el formulario y agregar una nueva entrada de contabilidad a la base de datos
app.post("/agregar-contabilidad", (req, res) => {
    // Obtener todos los campos del formulario
    const formData = req.body;

    // Asegurarse de enviar una cadena vacía si no se proporciona ningún valor para 'Numero_de_cuenta'
    const numeroCuenta = formData.Numero_de_cuenta || '';

    // Insertar los datos en la base de datos
    connection.query(
        `INSERT INTO contabilidad 
        (placa, NOMBRES_LICENCIA, TIPO_DE_DOCUMENTO_LICENCIA, NUMERO_DE_DOCUMENTO_LICENCIA, FECHA_DE_INICIO_CONTRATO, FECHA_FINAL, MOTIVO_RETIRO, NOMBRES_CONTRATO, TIPO_DE_DOCUMENTO_CONTRATO, NUMERO_DE_DOCUMENTO_CONTRATO, DIRECCION_CONTRATO, CELULAR_CONTRATO, EMAIL_CONTRATO, ACTIVIDAD_ECONOMICA_CONTRATO, VALOR_ADMINISTRACION, Nombre, tipo_documento, Cedula, Nombre_del_banco, Tipo_de_cuenta_bancaria, Numero_de_cuenta, Direccion, Celular, Email) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            formData.placa,
            formData.NOMBRES_LICENCIA,
            formData.TIPO_DE_DOCUMENTO_LICENCIA,
            formData.NUMERO_DE_DOCUMENTO_LICENCIA,
            formData.FECHA_DE_INICIO_CONTRATO,
            formData.FECHA_FINAL,
            formData.MOTIVO_RETIRO,
            formData.NOMBRES_CONTRATO,
            formData.TIPO_DE_DOCUMENTO_CONTRATO,
            formData.NUMERO_DE_DOCUMENTO_CONTRATO,
            formData.DIRECCION_CONTRATO,
            formData.CELULAR_CONTRATO,
            formData.EMAIL_CONTRATO,
            formData.ACTIVIDAD_ECONOMICA_CONTRATO,
            formData.VALOR_ADMINISTRACION,
            formData.Nombre,
            formData.tipo_documento,
            formData.Cedula,
            formData.Nombre_del_banco,
            formData.Tipo_de_cuenta_bancaria,
            formData.Numero_de_cuenta,
            formData.Direccion,
            formData.Celular,
            formData.Email
        ],
        (error, results) => {
            if (error) {
                console.error("Error al agregar la contabilidad:", error);
                res.status(500).send("Error al agregar la contabilidad");
                return;
            }
            console.log("Información agregada correctamente a la base de datos");
            // Redirigir al usuario de vuelta a la página de consulta de contabilidad
            res.redirect(`/consulta-contabilidad`);
        }
    );
});














// Ruta para el formulario
// Ruta para el formulario
app.get('/formulario', async (req, res) => {
    try {
        if (req.session.loggedin === true) {
            const rolesString = req.session.roles;
            const roles = Array.isArray(rolesString) ? rolesString : [];
        
        const ejecutivo1 = roles.includes('ejecutivo1');
        const ejecutivo2 = roles.includes('ejecutivo2');
        const ejecutivo3 = roles.includes('ejecutivo3');
        const ejecutivo4 = roles.includes('ejecutivo4');
        const ejecutivo5 = roles.includes('ejecutivo5');
        const ejecutivo6 = roles.includes('ejecutivo6');
        const ejecutivo7 = roles.includes('ejecutivo7');
        const ejecutivo8 = roles.includes('ejecutivo8');
        
        const isExecutive = roles.includes('ejecutivo');
        
            // Consulta para obtener todos los clientes de la tabla "clientes"
            connection.query('SELECT * FROM clientes', (errorClientes, resultadosClientes) => {
                if (errorClientes) {
                    console.error('Error al obtener los clientes:', errorClientes);
                    res.status(500).send('Error al obtener los clientes');
                    return;
                }

                // Consulta para obtener todas las placas de la tabla "conductores"
                connection.query('SELECT DISTINCT placa FROM conductores', (errorPlacas, resultadosPlacas) => {
                    if (errorPlacas) {
                        console.error('Error al obtener las placas de los conductores:', errorPlacas);
                        res.status(500).send('Error al obtener las placas de los conductores');
                        return;
                    }

                    // Los resultados de ambas consultas se pasan al renderizar la página
                    res.render('recepciones', { 
                        clientes: resultadosClientes, 
                        placas: resultadosPlacas,
                        isExecutive, 
                        ejecutivo1, 
                        ejecutivo2, 
                        ejecutivo3,
                        ejecutivo4,
                        ejecutivo5,
                        ejecutivo6,
                        ejecutivo7,
                        ejecutivo8,
                    });
                });
            });
        } else {
            res.redirect("/login/index");
        }
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).send('Error al procesar la solicitud');
    }
});

app.post('/obtener_conductor', (req, res) => {
    const placaSeleccionada = req.body.placa;

    // Realiza una consulta a la base de datos para obtener el conductor correspondiente a la placa
    connection.query('SELECT conductor, celular, foto FROM conductores WHERE placa = ?', [placaSeleccionada], (error, results) => {
        if (error) {
            console.error('Error al obtener el conductor:', error);
            res.status(500).json({ error: 'Error al obtener el conductor' });
        } else {
            if (results && results.length > 0) {
                const conductor = results[0].conductor;
                const celular = results[0].celular;
                let fotoURL = null; // Inicializa la URL de la foto como nula por defecto
                if (results[0].foto) {
                    // Si hay una foto en la base de datos, conviértela a Base64 y forma la URL
                    const fotoBase64 = results[0].foto.toString('base64');
                    fotoURL = `data:image/jpeg;base64,${fotoBase64}`;
                }
                res.json({ conductor, celular, fotoURL });
            } else {
                res.status(404).json({ error: 'Conductor no encontrado para la placa seleccionada' });
            }
        }
    });
});




app.use(bodyParser.urlencoded({ extended: false }));


/// Modifica la función post para enviar los datos al Google Sheet

// Ruta para procesar el formulario
app.post('/procesar_formulario', async (req, res) => {
    const { cliente, fecha, hora, nombre_pasajero, valor, cantidad_pasajeros, tipo_vehiculo, vuelo, placa, conductor, celular_conductor } = req.body;
  
    try {
        // Insertar los datos en la base de datos
        const query = 'INSERT INTO aeropuerto (cliente, fecha, hora, nombre_pasajero, valor, cantidad_pasajeros, tipo_vehiculo, vuelo, placa, conductor, celular_conductor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        connection.query(query, [cliente, fecha, hora, nombre_pasajero, valor, cantidad_pasajeros, tipo_vehiculo, vuelo, placa, conductor, celular_conductor]);
        console.log('Datos insertados correctamente en la base de datos');

        // Enviar los datos al Google Sheet
        const responseSheet = await fetch('https://script.google.com/macros/s/AKfycbwJsR7Thyn0Kq1dKOF87W080FGrUmvwsquVd1NluDpxo_oU0kqGs9XalUD4VAepSx2G/exec', {
            method: 'POST',
            body: new URLSearchParams(req.body),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!responseSheet.ok) {
            console.error('Error al enviar los datos al Google Sheet:', responseSheet.statusText);
            throw new Error('Error al enviar los datos al Google Sheet');
        }

        console.log('Datos enviados correctamente al Google Sheet');

        // Redireccionar a la ruta para mostrar los detalles del formulario
        res.redirect(`/mostrar_formulario?${new URLSearchParams(req.body).toString()}`);
    } catch (error) {
        console.error('Error en el procesamiento del formulario:', error);
        res.status(500).send('Error en el procesamiento del formulario');
    }
});


// Ruta para mostrar los detalles del formulario y generar el PDF
app.get('/mostrar_formulario', (req, res) => {
    // Obtener los datos del formulario de la consulta
    const datosFormulario = req.query;

    // Crear un nuevo documento PDF
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream('formulario.pdf'));
    doc.fontSize(12);
    doc.fillColor('black');
    doc.font('Helvetica-Bold').fillColor('black').text(`FECHA DEL SERVICIO: ${datosFormulario.fecha}`).moveDown();
    doc.font('Helvetica-Bold').fillColor('black').text(`HORA: ${datosFormulario.hora}`).moveDown();
    doc.font('Helvetica-Bold').fillColor('black').text(`HUESPED: ${datosFormulario.nombre_pasajero}`).moveDown();
    doc.font('Helvetica-Bold').fillColor('black').text(`N° DE VUELO: ${datosFormulario.vuelo}`).moveDown();
    doc.font('Helvetica-Bold').fillColor('black').text(`PLACA: ${datosFormulario.placa}`).moveDown();
    doc.font('Helvetica-Bold').fillColor('black').text(`CONDUCTOR ASIGNADO: ${datosFormulario.conductor}`).moveDown();
    doc.font('Helvetica-Bold').fillColor('black').text(`CELULAR: ${datosFormulario.celular_conductor}`).moveDown();
    doc.moveDown().strokeColor('black').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.end();
    // Renderizar el formulario.hbs y pasar los datos del formulario
    res.render('formulario', { datosFormulario });
});
// Ruta para descargar el PDF
app.get('/descargar_pdf', (req, res) => {
    // Renderizar la plantilla HTML con los datos del formulario
    const datosFormulario = req.query;
    res.render('formulario', { datosFormulario }, (err, html) => {
        if (err) {
            console.error('Error al renderizar el HTML:', err);
            res.status(500).send('Error al renderizar el HTML');
        } else {
            const options = { format: 'Letter' }; // Opciones de formato para el PDF

            // Convertir el HTML a PDF
            htmlToPdf(html, options, (pdfErr, buffer) => {
                if (pdfErr) {
                    console.error('Error al convertir HTML a PDF:', pdfErr);
                    res.status(500).send('Error al convertir HTML a PDF');
                } else {
                    // Enviar el PDF generado como respuesta HTTP para descargar
                    res.set({
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': 'attachment; filename=formulario.pdf'
                    });
                    res.send(buffer);
                }
            });
        }
    });
});







const puppeteer = require('puppeteer');
const path = require('path'); // Agregar esta línea para importar el módulo 'path'

// Directorio donde se guardarán las imágenes
const directorioImagenes = path.join(__dirname, 'imagenes');

// Función para convertir HTML a imagen utilizando Puppeteer
async function convertirHtmlAImagen(html, nombreArchivo) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);

    // Ajusta el tamaño de la ventana del navegador para que coincida con el tamaño del contenedor
    const { width, height } = await page.$eval('#container', container => ({
        width: container.offsetWidth,
        height: container.offsetHeight
    }));
    await page.setViewport({ width, height });

    // Verifica si el directorio de imágenes existe, si no existe, créalo
    if (!fs.existsSync(directorioImagenes)) {
        fs.mkdirSync(directorioImagenes, { recursive: true });
    }

    await page.screenshot({ path: path.join(directorioImagenes, nombreArchivo) });
    await browser.close();
    console.log('La imagen se ha guardado correctamente en', nombreArchivo);
}

// Endpoint para convertir HTML a imagen
app.post('/convertirHtmlAImagen', async (req, res) => {
    try {
        // Lee el contenido HTML del cuerpo de la solicitud
        const html = req.body.html;

        // Verifica que el HTML recibido no esté vacío
        if (!html) {
            throw new Error('El HTML recibido está vacío');
        }

        // Nombre del archivo de imagen de salida
        const nombreArchivo = 'miImagen.png';

        // Llama a la función para convertir HTML a imagen utilizando Puppeteer
        await convertirHtmlAImagen(html, nombreArchivo);

        // Envía la imagen como respuesta al cliente
        res.sendFile(path.join(directorioImagenes, nombreArchivo));
    } catch (error) {
        console.error('Error al convertir HTML a imagen:', error);
        res.status(500).send('Error al convertir HTML a imagen');
    }
});

app.use(express.static(path.join(__dirname, 'public')));







app.get('/clientes', (req, res) => {
    // Realiza una consulta a la base de datos para obtener los nombres y fotos de los clientes
    connection.query('SELECT nombre,  foto FROM clientes', (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            res.status(500).send('Error interno del servidor');
            return;
        }

        // Envia los resultados de la consulta como respuesta en formato JSON
        res.json(results);
    });
});




app.get('/clientePorNombre', (req, res) => {
    const nombreCliente = req.query.nombre;

    // Realiza una consulta a la base de datos para obtener los datos del cliente por su nombre
    connection.query('SELECT * FROM clientes WHERE nombre = ?', [nombreCliente], (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            res.status(500).send('Error interno del servidor');
            return;
        }

        // Verifica si se encontró un cliente con el nombre dado
        if (results.length > 0) {
            const cliente = results[0];
            res.json(cliente);
        } else {
            res.status(404).send('Cliente no encontrado');
        }
    });
});



app.get('/obtenerFotoConductor', (req, res) => {
    const placa = req.query.placa;
    console.log('Placa recibida:', placa); // Imprime el valor de la placa en la consola del servidor

    // Realizar una consulta a la base de datos para obtener los datos binarios de la foto del conductor basada en la placa
    connection.query('SELECT foto FROM conductores WHERE placa = ?', [placa], (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            res.status(500).send('Error interno del servidor');
            return;
        }

        // Verificar si se encontró la foto del conductor con la placa dada
        if (results.length > 0) {
            const fotoConductor = results[0].foto;

            // Devolver los datos binarios de la foto del conductor
            res.send(fotoConductor);
        } else {
            res.status(404).send('Foto del conductor no encontrada');
        }
    });
});


app.get('/obtenerFotovehiculo', (req, res) => {
    const placa = req.query.placa;
    console.log('Placa recibida:', placa); // Imprime el valor de la placa en la consola del servidor

// Corrige el nombre de la columna en la consulta SQL y en la asignación de resultados
connection.query('SELECT foto_vehiculo FROM vehiculos WHERE placa = ?', [placa], (error, results, fields) => {
    if (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).send('Error interno del servidor');
        return;
    }

    // Verificar si se encontró la foto del vehículo con la placa dada
    if (results.length > 0) {
        const fotoVehiculo = results[0].foto_vehiculo; // Corrige el nombre de la variable a fotoVehiculo

        // Devolver los datos binarios de la foto del vehículo
        res.send(fotoVehiculo);
    } else {
        res.status(404).send('Foto del vehículo no encontrada');
    }
});

});













// Configurar body-parser para permitir cuerpos de solicitud más grandes (50 MB en este caso)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


app.post('/enviar-email', upload.single('imagen'), (req, res) => {
    // Extraer los datos del cuerpo de la solicitud
    const { destinatario, asunto, cuerpoHtml } = req.body;
    const imagenFile = req.file;

    // Verificar si todos los campos requeridos están presentes
    if (!destinatario || !asunto || !cuerpoHtml || !imagenFile) {
        res.status(400).send('Faltan campos requeridos.');
        return;
    }

    // Configurar el transporte del correo electrónico
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'recepciones.vianco@gmail.com',
            pass: 'xaezkqbzfsuegqhm'
        }
    });

// Agrega tu texto adicional al cuerpo del correo electrónico
const textoAdicional = '<p>Texto adicional que quieres agregar junto con la imagen:</p>';
const cuerpoHtmlConTexto = cuerpoHtml + textoAdicional;

// Configurar los detalles del correo electrónico
const mailOptions = {
    from: 'recepciones.vianco@gmail.com',
    to: destinatario,
    subject: 'Recogida de transporte en el Aeropuerto Internacional El Dorado, Bogotá Colombia. Recibidos',
    html: `
        <p>Cordial Saludo,</p>
        <p>Gracias por visitar la increíble ciudad de Bogotá, anexo al correo encontrará una imagen la confirmación del transporte solicitado con los datos del conductor(es), vehículo(s) asignado(s), el itinerario, los términos y condiciones.</p>
        <p>Dentro del Aeropuerto frente a la puerta internacional o nacional, lo esperará un integrante del equipo Vianco Te Transporta para trasladarlo al Hotel.</p>
        <p>Gracias por preferirnos, !Vianco te transporta a un mundo lleno de experiencias¡</p>
    `,
    attachments: [
        {
            filename: imagenFile.originalname, // Nombre de la imagen original
            content: imagenFile.buffer, // Contenido de la imagen en formato buffer
            encoding: 'base64' // Codificación de la imagenT
        }
    ]
};




    // Enviar el correo electrónico
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error al enviar el correo electrónico:', error);
            res.status(500).send('Error al enviar el correo electrónico');
        } else {
            console.log('Correo electrónico enviado:', info.response);
            res.status(200).send('Correo electrónico enviado correctamente');
        }
    });
});




// Ruta pa

app.get('/seleccionar_hotel', (req, res) => {
    res.render('seleccionar_hotel'); // Renderiza la vista seleccionar_hotel.hbs
});



app.get('/tarifas', (req, res) => {
    const hotelSeleccionado = req.query.hotel; // Obtén el nombre del hotel seleccionado desde la consulta

    // Construye la ruta de la imagen basada en el nombre del hotel
    const rutaImagen = path.join(__dirname, 'public', 'imagenes', `${hotelSeleccionado}.png`);

    // Envía la imagen al cliente
    res.sendFile(rutaImagen, (err) => {
        if (err) {
            console.error(err);
            res.status(404).send('Imagen no encontrada para el hotel seleccionado');
        }
    });
});
// 








app.get('/novedades', (req, res) => {
    res.render('novedades_Callcenter/novedades_Callcenter.hbs');
});

app.post('/novedades', (req, res) => {
    const fecha = req.body.fecha;
    const turno = req.body.turno;
    const realiza = req.body.realiza;
    const entrega = req.body.entrega;
    const novedad_tripulacion = req.body.novedad_tripulacion || '';
    const novedad_hoteleria = req.body.novedad_hoteleria || '';
    const novedad_ejecutivos = req.body.novedad_ejecutivos || '';
    const novedad_empresas_privadas = req.body.novedad_empresasPrivadas || '';
    const NOVEDADES_TASKGO = req.body.novedad_NOVEDADES_TASKGO || '';
    const novedad_ACTAS = req.body.novedad_ACTAS || '';
    const otrasNovedades = req.body.novedad_OTRAS || '';
    const firmaBase64 = req.body.firmaBase64 || ''; // Corregido aquí
    console.log("Firma en formato base64 recibida:", firmaBase64);

    const sql = 'INSERT INTO novedades (fecha_registro, fecha, turno, realiza, entrega, novedad_tripulacion, novedad_hoteleria, novedad_ejecutivos, novedad_empresas_privadas, NOVEDADES_TASKGO, novedad_ACTAS, otras_novedades, firma) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    connection.query(sql, [fecha, turno, realiza, entrega, novedad_tripulacion, novedad_hoteleria, novedad_ejecutivos, novedad_empresas_privadas, NOVEDADES_TASKGO, novedad_ACTAS, otrasNovedades, firmaBase64], (error, results, fields) => {
        if (error) {
            console.error('Error al insertar la novedad en la base de datos:', error);
            res.status(500).send('Error interno del servidor.');
        } else {
            console.log('Novedad guardada exitosamente en la base de datos.');

            // Configurar transporte de correo electrónico
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'callcenter.vianco@gmail.com',
                    pass: 'mdfaqssdhgoedbmw'
                }
            });

// Generar un ID de mensaje único
function generateMessageId() {
    return `vianco_${Date.now()}@dominio.com`;
}

// Enviar correo electrónico
transporter.sendMail({
    from: 'callcenter.vianco@gmail.com', // Tu dirección de correo electrónico de Gmail
    to: 'nidia.vianco@gmail.com,calidad.vianco@gmail.com', // El destinatario del correo electrónico
    subject: 'alerta no denovedad centro operaciones', // El asunto del correo electrónico
    html: '<p><strong>Estimados,</strong></p><br>' +
          '<p>Me complace informarle que se ha agregado una nueva novedad al sistema de nuestro equipo centro operaciones. Esta actualización refleja nuestro continuo compromiso con la eficiencia y la excelencia en nuestro trabajo diario.</p><br>' +
          '<p>Recuerde realizar el seguimiento en la app en el módulo novedades pendientes.</p>', // El contenido del correo electrónico en HTML
    messageId: generateMessageId() // Generar un ID de mensaje único
}, (error, info) => {
    if (error) {
        console.error('Error al enviar el correo electrónico:', error);
    } else {
        console.log('Correo electrónico enviado:', info.response);
    }
});


                    const alertScript = '<script>alert("Novedad enviada con éxito"); window.location.href = "/novedades";</script>';
                    res.send(alertScript);
                }
            });
        });




// Ruta para ver las novedades (visualización de página)
app.get('/ver_novedades', (req, res) => {
    res.render('novedades_Callcenter/ver_Novedades.hbs');
});

// Backend (Endpoint /api/obtener_fechas_disponibles)
app.get('/api/obtener_fechas_disponibles', (req, res) => {
    connection.query('SELECT DISTINCT fecha FROM novedades', (error, results) => {
        if (error) {
            console.error('Error al obtener las fechas disponibles:', error);
            res.status(500).json({ error: 'Error interno del servidor' }); // Devuelve un JSON con el error
        } else {
            const fechasDisponibles = results.map(result => result.fecha);
            res.json(fechasDisponibles); // Devuelve un JSON con las fechas disponibles
        }
    });
});





// Backend (Endpoint /api/obtener_novedades)
app.get('/api/obtener_novedades', (req, res) => {
    const fechaSeleccionada = req.query.fecha;
    const query = 'SELECT fecha, turno, realiza, entrega, novedad_tripulacion, novedad_hoteleria, novedad_ejecutivos, novedad_empresas_privadas, NOVEDADES_TASKGO, novedad_ACTAS, otras_novedades, firma, fecha_registro FROM novedades WHERE DATE(fecha) = ?'; // Añadir el campo de la firma en la consulta SQL
    connection.query(query, [fechaSeleccionada], (error, results) => {
        if (error) {
            console.error('Error al obtener las novedades:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        } else {
            // Aquí tienes los resultados de la consulta SQL
            // Itera sobre los resultados para procesar cada fila
            results.forEach(row => {
                // Suponiendo que 'row' es el resultado de tu consulta SQL que contiene la firma codificada en base64
                const firmaBase64 = row.firma;
                const firmaBinaria = Buffer.from(firmaBase64, 'base64');
                // Modifica la fila actual para incluir la firma binaria decodificada
                row.firmaBinaria = firmaBinaria;
            });
            // Devuelve los resultados con las firmas binarias decodificadas
            res.json(results);
        }
    });
});







// Ruta para guardar el seguimiento en la base de datos
app.post('/api/guardar_seguimiento', (req, res) => {
    
    // Obtener los datos del cuerpo de la solicitud
    const {  nombreSeguimiento, detalleSeguimiento ,novedadestripulacion,fechaseguimiento,turno,realiza,entrega,fecha,novedad_hoteleria,fecha_registro,novedad_ejecutivos,novedad_empresas_privadas,NOVEDADES_TASKGO,novedad_ACTAS,otras_novedades,firma,ACCIONES} = req.body;

    // Query para insertar el seguimiento en la base de datos
    const query = 'INSERT INTO novedades_completadas ( nombre_seguimiento, detalle_seguimiento, novedad_tripulacion, fecha_seguimiento, turno, realiza,entrega,fecha_novedad,novedad_hoteleria,fecha_registro,novedad_ejecutivos,novedad_empresas_privadas,NOVEDADES_TASKGO,novedad_ACTAS,otras_novedades,firma,ACCIONES) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [ nombreSeguimiento, detalleSeguimiento, novedadestripulacion, fechaseguimiento, turno, realiza,entrega,fecha,novedad_hoteleria,fecha_registro,novedad_ejecutivos,novedad_empresas_privadas,NOVEDADES_TASKGO,novedad_ACTAS,otras_novedades,firma,ACCIONES];
    
    // Ejecutar la consulta SQL
    connection.query(query, values, (error, results, fields) => {
        if (error) {
            console.error('Error al guardar el seguimiento en la base de datos:', error);
            res.status(500).json({ error: 'Error al guardar el seguimiento en la base de datos' });
        } else {
            console.log('Seguimiento guardado correctamente en la base de datos');
            res.status(200).json({ message: 'Seguimiento guardado correctamente' });
        }
    });
});





// Backend (Endpoint /api/eliminar_fecha)
app.delete('/api/eliminar_fecha/:fecha', (req, res) => {
    const fecha = req.params.fecha;
    connection.query('DELETE FROM novedades WHERE fecha = ?', fecha, (error, results) => {
        if (error) {
            console.error('Error al eliminar la fecha:', error);
            res.status(500).json({ error: 'Error interno del servidor' }); // Devuelve un JSON con el error
        } else {
            res.json({ message: 'Fecha eliminada correctamente' });
        }
    });
});




app.get('/ver_novedades_C', (req, res) => {
    res.render('novedades_Callcenter/ver_novedades_C.hbs');
});

app.get('/novedadess', (req, res) => {
    const fecha = req.query.fecha;

    // Preparar la consulta SQL para obtener las novedades de la fecha seleccionada
    const sql = "SELECT * FROM novedades_completadas WHERE fecha_novedad = ?";

    // Ejecutar la consulta
    connection.query(sql, [fecha], (err, result) => {
        if (err) {
            console.error("Error al obtener las novedades:", err);
            res.status(500).json({ error: "Error al obtener las novedades de la base de datos" });
        } else {
            res.status(200).json(result); // Devuelve los datos como JSON
        }
    });
});


// Ruta para la página principal
app.get('/inicio', (req, res) => {
    res.render('centro_operaciones/inicio_turno.hbs', { title: 'Iniciar Turno' });
});

// Manejar la solicitud POST para iniciar el turno
app.post('/inicio-turno', (req, res) => {
    const nombre = req.body.nombre;
    const turno = req.body.turno;

    const fechaHoraActual = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const consulta = 'INSERT INTO centro_operaciones_inicio (nombre_trabajador, turno, hora_inicio) VALUES (?, ?, ?)';
    connection.query(consulta, [nombre, turno, fechaHoraActual], (error, results) => {
        if (error) {
            console.error('Error al guardar la hora de inicio en la base de datos:', error);
            res.status(500).send('Error al iniciar el turno. Por favor, inténtalo de nuevo.');
            return;
        }
        console.log(`Empleado ${nombre} ha iniciado el turno (${turno}).`);
        res.render('centro_operaciones/tareas_diarias', { nombre: nombre, turno: turno });
    });
});

// Ruta para la página de tareas diarias
app.get('/centro_operaciones/tareas_diarias', (req, res) => {
    res.render('centro_operaciones/tareas_diarias', { title: 'Tareas Diarias' });
});

// Manejar la solicitud POST para marcar una tarea
// Manejar la solicitud POST para marcar una tarea
app.post('/marcar-tarea', (req, res, next) => { // Agregar next como parámetro
    const tarea = {
        fecha: req.body.fecha,
        nombre: req.body.nombre,
        turno: req.body.turno,
        recepciones: req.body.recepciones_realizado || req.body.recepciones_no_aplica || req.body.recepciones_no_realizado,
        reporteNovedades: req.body.reporte_novedades_realizado || req.body.llegadas_ejecutivos_no_aplica || req.body.llegadas_ejecutivos_no_realizado,
        infoPagos: req.body.info_pagos_realizado || req.body.info_pagos_no_aplica || req.body.info_pagos_no_realizado,
        revisionServicios: req.body.revision_servicios_realizado || req.body.revision_servicios_no_aplica || req.body.revision_servicios_no_realizado,
        coordinacionTareas: req.body.coordinacion_tareas_realizado || req.body.coordinacion_tareas_no_aplica || req.body.coordinacion_tareas_no_realizado,
        entregaDocumentos: req.body.entrega_documentos_realizado || req.body.entrega_documentos_no_aplica || req.body.entrega_documentos_no_realizado,
        limpiezaArea: req.body.limpieza_area_realizado || req.body.limpieza_area_no_aplica || req.body.limpieza_area_no_realizado,
        cierreOperaciones: req.body.cierre_operaciones_realizado || req.body.cierre_operaciones_no_aplica || req.body.cierre_operaciones_no_realizado,
        reporteActividades: req.body.reporte_actividades_realizado || req.body.reporte_actividades_no_aplica || req.body.reporte_actividades_no_realizado,
        atencionCliente: req.body.atencion_cliente_realizado || req.body.atencion_cliente_no_aplica || req.body.atencion_cliente_no_realizado,
        coordinacionServicios: req.body.coordinacion_servicios_realizado || req.body.coordinacion_servicios_no_aplica || req.body.coordinacion_servicios_no_realizado,
        salidaEjecutivos: req.body.salida_ejecutivos_realizado || req.body.salida_ejecutivos_no_aplica || req.body.salida_ejecutivos_no_realizado,
        reciclaje: req.body.reciclaje_realizado || req.body.reciclaje_no_aplica || req.body.reciclaje_no_realizado,
        otrasActividades: req.body.otras_actividades_realizado || req.body.otras_actividades_no_aplica || req.body.otras_actividades_no_realizado,
        firmaBase64: req.body.firmaBase64 || '', // Corregido aquí
        hora_realizada: new Date() // Obtener la hora actual
    };

    const sql = 'INSERT INTO tareas SET ?';
    connection.query(sql, tarea, (err, result) => {
        if (err) {
            console.error('Error al insertar tarea en la base de datos:', err.message);
            return res.status(500).send('Error al guardar la tarea');
        }
        console.log('Tarea insertada correctamente en la base de datos');

        // Actualizar la hora de finalización del turno
        const nombre = req.body.nombre;
        const turno = req.body.turno;
        const horaFin = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const updateQuery = 'UPDATE centro_operaciones_inicio SET hora_fin = ? WHERE nombre_trabajador = ? AND turno = ?';
        connection.query(updateQuery, [horaFin, nombre, turno], (updateErr, updateResult) => {
            if (updateErr) {
                console.error('Error al actualizar la hora de finalización del turno:', updateErr.message);
                return res.status(500).send('Error al actualizar la hora de finalización del turno');
            }
            console.log('Hora de finalización del turno actualizada en la base de datos');

            // Envía el mensaje de finalización de turno exitosa
            res.locals.successMessage = 'Finalización de turno exitosa.';
            setTimeout(() => {
                next(); // Llamamos a next después de un breve período de tiempo
            }, 1000); // Espera 1 segundo antes de llamar a next()
        });
    });
}, (req, res) => {
    // Middleware para mostrar el mensaje de éxito y redireccionar
    if (res.locals.successMessage) {
        res.send(res.locals.successMessage + ' Redireccionando...');
    } else {
        res.redirect('/inicio'); // Redirige al usuario a la página de inicio si no hay mensaje de éxito
    }
});




// Ruta para la página de búsqueda y visualización de datos
app.get('/buscar_por_fecha', (req, res) => {
    res.render('aeropuerto/recepciones_aeropuerto.hbs'); // Renderiza el formulario de búsqueda
});

// Ruta para procesar la búsqueda por fecha
app.post('/buscar_por_fecha', async (req, res) => {
    const { fecha } = req.body;
  
    try {
        // Consultar la base de datos por la fecha especificada
        const query = 'SELECT * FROM aeropuerto WHERE fecha = ?';
        const [rows, fields] = await connection.promise().query(query, [fecha]);
        console.log('Datos encontrados:', rows);

        // Enviar los resultados como respuesta JSON
        res.json(rows);
    } catch (error) {
        console.error('Error en la búsqueda por fecha:', error);
        res.status(500).send('Error en la búsqueda por fecha');
    }
});


const Handlebars = require('handlebars');


// Define la función formatDate
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${month}/${day}/${year}`;
}

// Registra la función formatDate como un helper de Handlebars
Handlebars.registerHelper('formatDate', formatDate);



// Ruta para la página de búsqueda y visualización de datos
app.get('/formulario_cotizaciones', (req, res) => {
    res.render('cotizaciones/formulario_cotizacion.hbs'); // Renderiza el formulario de búsqueda
});
app.post('/cotizacion', (req, res) => {
    const cotizacionData = req.body;
    const numServicios = parseInt(cotizacionData.numServicios);

    // Eliminar el campo numServicios del objeto principal de cotización
    delete cotizacionData.numServicios;

    // Agregar numServicios a cotizacionData antes de la inserción
    cotizacionData.num_servicios = numServicios;

    // Insertar los datos de la cotización en la base de datos
    connection.beginTransaction(err => {
        if (err) {
            console.error('Error al iniciar la transacción:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }

        // Insertar los datos de la cotización en la tabla cotizaciones
        connection.query('INSERT INTO cotizaciones SET ?', cotizacionData, (err, result) => {
            if (err) {
                console.error('Error al insertar la cotización en la base de datos:', err);
                connection.rollback(() => {
                    res.status(500).send('Error interno del servidor');
                });
                return;
            }

            // Commit si la inserción es exitosa
            connection.commit(err => {
                if (err) {
                    console.error('Error al realizar commit:', err);
                    connection.rollback(() => {
                        res.status(500).send('Error interno del servidor');
                    });
                    return;
                }
                console.log('Cotización insertada correctamente');
                res.send('Cotización enviada exitosamente');
            });
        });
    });
});
// Ruta para la página de búsqueda y visualización de datos
app.get('/cotizaciones_pendientes', (req, res) => {
    // Realizar la consulta a la base de datos para obtener las cotizaciones pendientes
    connection.query('SELECT id, cliente FROM cotizaciones WHERE realizada = 0', (err, rows) => {
        if (err) {
            console.error('Error al obtener cotizaciones pendientes:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }
        // Renderizar la plantilla cotizaciones_pendientes.hbs con los datos obtenidos de la base de datos
        res.render('cotizaciones/cotizaciones_pendientes', { cotizaciones: rows });
    });
});

app.get('/cotizaciones_pendientes/:id', (req, res) => {
    const cotizacionId = req.params.id;
    connection.query('SELECT * FROM cotizaciones WHERE id = ?', cotizacionId, (err, cotizacionRows) => {
        if (err) {
            console.error('Error al obtener detalles de la cotización:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }
        if (cotizacionRows.length === 0) {
            res.status(404).send('Cotización no encontrada');
            return;
        }
        
        // Una vez que tengas los detalles de la cotización, extrae los servicios asociados a esa cotización
        const cotizacion = cotizacionRows[0];
        const servicios = [];

        // Iterar sobre las columnas de la cotización para encontrar los servicios
        for (let i = 1; i <= cotizacion.num_servicios; i++) {
            const servicio = {
                fecha: cotizacion[`fecha${i}`],
                hora: cotizacion[`hora${i}`],
                origen: cotizacion[`origen${i}`],
                destino: cotizacion[`destino${i}`],
                itinerario: cotizacion[`itinerario${i}`],
                tipoCarro: cotizacion[`tipoCarro${i}`]
            };
            servicios.push(servicio);
        }

        // Renderizar la plantilla detalles_cotizacion.hbs con los detalles de la cotización, los servicios y los detalles del cliente
        res.render('cotizaciones/detalles_cotizacion', { cotizacion: cotizacion, servicios: servicios, cliente: cotizacion });
    });
});
// Ruta para generar la plantilla personalizadaapp.post('/generar_plantilla', (req, res) => {
    // Extraer todos los datos de la cotización del cuerpo de la solicitud
    app.post('/generar_plantilla', (req, res) => {
        // Extraer todos los datos de la cotización del cuerpo de la solicitud
        const cotizacionId = req.body.cotizacionId;
        const valorTotal = req.body.valorTotal;
        const fecha = req.body.fecha;
        const hora = req.body.hora;
        const origen = req.body.origen;
        const destino = req.body.destino;
        const itinerario = req.body.itinerario;

        const tipoCarro = req.body.tipoCarro;
    
    
        // Extraer los datos del cliente del cuerpo de la solicitud
        const cliente = {
            nombre: req.body.nombre,
            cliente: req.body.cliente,
            correo: req.body.correo,
            contacto: req.body.contacto,
            ciudad: req.body.ciudad,
            num_servicios: req.body.num_servicios,
            fecha_creacion: req.body.fecha_creacion
        };
    
        // Extraer todos los detalles de los servicios de la cotización
        const servicios = req.body.servicios;
    
        // Renderizar la plantilla personalizada con todos los datos de la cotización
        res.render('cotizaciones/plantilla_personalizada', { 
            cotizacionId: cotizacionId, 
            valorTotal: valorTotal,
            cliente: cliente, 
            servicios: servicios
        }, (err, html) => {
            if (err) {
                console.error('Error al renderizar la plantilla:', err);
                res.status(500).send('Error al generar la plantilla');
                return;
            }
    
            // Enviar el HTML generado como respuesta HTTP
            res.send(html);
        });
    });
    






// Define la ruta para el endpoint '/consulta-contabilidad-todos'
app.get('/consulta-contabilidad-todos', (req, res) => {
    // Realizar la consulta a la base de datos seleccionando solo las columnas necesarias
    connection.query('SELECT placa, Nombre, tipo_documento,Cedula,Nombre_del_banco,Tipo_de_cuenta_bancaria,Numero_de_cuenta FROM contabilidad', (error, results, fields) => {
        if (error) {
            console.error('Error al consultar la contabilidad:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
        }

        // Enviar los resultados de la consulta como respuesta en formato JSON
        res.json(results);
    });
});














// Ruta para la página de búsqueda y visualización de datos
// Ruta para la página de búsqueda y visualización de datos
app.get('/mapa', (req, res) => {
    // Realizar autenticación de usuario u otras tareas aquí
    if (req.session.loggedin) {
        // El usuario está autenticado, realizar tareas adicionales si es necesario
        const nombreUsuario = req.session.name;
        console.log(`El usuario ${nombreUsuario} está autenticado.`);
        res.render('mapa.hbs', { nombreUsuario: nombreUsuario }); // Pasar el nombre de usuario como una variable de contexto
    } else {
        // El usuario no está autenticado, redirigir o mostrar un mensaje de error
        console.log('El usuario no está autenticado.');
        // Puedes redirigir al usuario a una página de inicio de sesión, por ejemplo
        res.redirect('/login');
    }
});



const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer(app);
const io = socketIo(server);

// Objeto para mantener un registro de los usuarios conectados
let connectedUsers = {};

// Objeto para mantener las últimas ubicaciones conocidas de los usuarios
let lastKnownLocations = {};

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    // Agregar el ID de socket del usuario conectado al objeto connectedUsers
    connectedUsers[socket.id] = true;

    // Emitir las últimas ubicaciones conocidas al cliente recién conectado
    socket.emit('userLocations', lastKnownLocations);

    // Manejar la recepción de ubicaciones de los usuarios
    socket.on('location', (data) => {
        // Actualizar la última ubicación conocida del usuario
        lastKnownLocations[data.username] = { lat: data.lat, lng: data.lng };

        // Insertar la ubicación y el nombre de usuario en la tabla de ubicaciones (opcional)
        const query = 'INSERT INTO ubicaciones (latitud, longitud, nombre_usuario) VALUES (?, ?, ?)';
        connection.query(query, [data.lat, data.lng, data.username], (error, results) => {
            if (error) {
                console.error('Error al insertar la ubicación en MySQL:', error);
                return;
            }
            // Emitir la ubicación a todos los clientes conectados
            io.emit('userLocation', data);
        });
    });

    // Manejar la desconexión de los clientes
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
        // Eliminar al usuario de los usuarios conectados
        delete connectedUsers[socket.id];
        // No necesitamos eliminar la última ubicación conocida del usuario
        // Mantendremos la última ubicación conocida hasta que se actualice con una nueva ubicación
    });
});









// Ruta para clientes
app.get('/clientess', (req, res) => {
    // Consulta a la base de datos para obtener la información de los clientes
    connection.query('SELECT * FROM clientes', (error, results) => {
        if (error) {
            console.error('Error al obtener los clientes:', error);
            res.status(500).send('Error interno del servidor');
        } else {
          
            // Renderiza la plantilla 'clientes.hbs' pasando los resultados de la consulta
            res.render('clientes/clientes.hbs', { clientes: results });
        }
    });
});




// Ruta para actualizar un cliente específico
app.post('/actualizar_cliente', (req, res) => {
    const { nombre, contratante, N_contrato, nit, rut, camara_comercio, cumpleaños, direccion ,responsable,celular,cedula,objeto,fecha_inicio,fecha_final,destino} = req.body;

    console.log('Datos recibidos para actualizar:', req.body); // Agregado para depuración

    connection.query(
        'SELECT * FROM clientes WHERE nombre = ?', 
        [nombre], 
        (error, results) => {
            if (error) {
                console.error('Error al buscar el cliente:', error);
                return res.status(500).send('Error interno del servidor');
            }
            if (results.length === 0) {
                return res.status(404).send('Cliente no encontrado');
            }

            const clienteActual = results[0];

            if (
                clienteActual.contratante !== contratante ||
                clienteActual.N_contrato !== N_contrato ||
                clienteActual.nit !== nit ||
                clienteActual.rut !== rut ||
                clienteActual.camara_comercio !== camara_comercio ||
                clienteActual.cumpleaños !== cumpleaños ||
                clienteActual.responsable !== responsable ||
                clienteActual.celular !== celular ||
                clienteActual.cedula !== cedula ||
                clienteActual.objeto !== objeto ||
                clienteActual.destino !== destino ||
                clienteActual.fecha_inicio !== fecha_inicio ||
                clienteActual.fecha_final !== fecha_final ||
                
                clienteActual.direccion !== direccion

                

                
                
            ) {
                connection.query(
                    'UPDATE clientes SET contratante = ?, N_contrato = ?, nit = ?, rut = ?, camara_comercio = ?, cumpleaños = ?, direccion = ? ,responsable = ? , celular = ?,cedula = ?,objeto = ?,fecha_inicio = ?,fecha_final = ?,destino = ? WHERE nombre = ?', 
                    [contratante, N_contrato, nit, rut, camara_comercio, cumpleaños, direccion,responsable,celular,cedula, objeto,fecha_inicio,fecha_final,destino,nombre], 
                    (error, results) => {
                        if (error) {
                            console.error('Error al actualizar el cliente:', error);
                            return res.status(500).send('Error interno del servidor');
                        }
                        console.log('Cliente actualizado correctamente:', results);
                        return res.json({ message: 'Cliente actualizado correctamente' });
                    }
                );
            } else {
                console.log('Los valores son los mismos, no es necesario actualizar');
                return res.json({ message: 'Los valores son los mismos, no es necesario actualizar' });
            }
        }
    );
});








const hbs = require('handlebars'); // Importa Handlebars




const { JSDOM } = require('jsdom');
const qrcode = require('qrcode');




// Ruta para renderizar la página de selección de cliente y placa
app.get('/seleccionar', (req, res) => {
    res.render('clientes/fuec.hbs');
});


// Ruta para obtener todas las placas de vehículos disponibles
app.get('/vehiculos', (req, res) => {
    const consultaVehiculos = 'SELECT placa FROM vehiculos';
    connection.query(consultaVehiculos, (error, resultados) => {
        if (error) {
            console.error('Error al obtener vehículos:', error);
            res.status(500).json({ error: 'Error al obtener vehículos' });
            return;
        }
        res.json(resultados);
    });
});


  // Obtener el último consecutivo al iniciar la aplicación
  connection.query('SELECT valor FROM consecutivos ORDER BY id DESC LIMIT 1', (err, rows) => {
    if (err) {
      console.error('Error al obtener el último consecutivo:', err);
      return;
    }
    if (rows.length > 0) {
      ultimoConsecutivo = rows[0].valor;
      console.log('Último consecutivo obtenido de la base de datos:', ultimoConsecutivo);
    }
  });


// Ruta para obtener conductores
app.get('/conductoress', (req, res) => {
    const consultaConductores = 'SELECT id, conductor, cedula, fecha_vigencia FROM conductores';
    connection.query(consultaConductores, (error, resultados) => {
        if (error) {
            console.error('Error al obtener conductores:', error);
            res.status(500).json({ error: 'Error al obtener conductores' });
            return;
        }
        res.json(resultados);
    });
});

app.get('/clientes2', (req, res) => { // Cambiar el nombre de la ruta a /clientes2
    const consultaClientes = 'SELECT nombre,contratante,fecha_inicio, N_contrato ,fecha_final  FROM clientes';
    connection.query(consultaClientes, (error, resultados) => {
      if (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ error: 'Error al obtener clientes' });
        return;
      }
  
      const clientesData = resultados.map(cliente => ({
        nombre: cliente.nombre,
        N_contrato: cliente.N_contrato,
        contratante: cliente.contratante,
        fecha_inicio: cliente.fecha_inicio,
        fecha_final: cliente.fecha_final
      }));
  
      res.json(clientesData);
    });
  });

// Ruta para obtener los datos del cliente, vehículo y conductores seleccionados
app.get('/fuec/:nombreCliente/:placa/:idConductor1/:idConductor2/:idConductor3/:N_contrato/:contratante/:fecha_inicio/:fecha_final', (req, res) => {
    const nombreCliente = req.params.nombreCliente;
    const placa = req.params.placa;
    const idConductor1 = req.params.idConductor1;
    const idConductor2 = req.params.idConductor2;
    const idConductor3 = req.params.idConductor3;
    const N_contrato = req.params.N_contrato;
    const contratante = req.params.contratante;
    const fecha_inicio = req.params.fecha_inicio;
    const fecha_final = req.params.fecha_final;

    

    let conductoresIds = [idConductor1, idConductor2, idConductor3].filter(id => id !== 'NA');

// Valida y asigna valores predeterminados a los parámetros si son undefined
// Función para codificar un parámetro y manejar casos indefinidos
// Función para formatear un parámetro y su valor
function formatParam(key, value) {
    return `${key.toUpperCase()} :${value}`;
}

// Función para codificar un parámetro y manejar casos indefinidos
function encodeParam(param, defaultValue = '') {
    return param !== undefined ? encodeURIComponent(param) : defaultValue;
  }

// Valida y codifica cada parámetro de la URL
const placaFormatted = formatParam("Placa", placa || "INDEFINIDA");
const contratoFormatted = N_contrato !== undefined ? formatParam("Contrato No ", N_contrato) : '';
const contratanteFormatted = contratante !== undefined ? formatParam("Cliente ", contratante) : '';
const fecha_inicioFormatted = fecha_inicio !== undefined ? formatParam("Fecha inicio", fecha_inicio) : '';
const fecha_finalFormatted = fecha_final !== undefined ? formatParam("Fecha final", fecha_final) : '';
const fuecURL = `${contratoFormatted}\n${contratanteFormatted}\n${fecha_inicioFormatted} \n${fecha_finalFormatted}\n${placaFormatted}\n`;
    // Genera el código QR con la URL del FUEC en el servidor
    qrcode.toDataURL(fuecURL, (err, qrDataURL) => {
        if (err) {
            console.error('Error al generar el código QR:', err);
            res.status(500).json({ error: 'Error al generar el código QR' });
            return;
        }

        // Obtener el último consecutivo de la base de datos
        connection.query('SELECT valor FROM consecutivos ORDER BY id DESC LIMIT 1', (err, rows) => {
            if (err) {
                console.error('Error al obtener el último consecutivo:', err);
                res.status(500).json({ error: 'Error al obtener el último consecutivo' });
                return;
            }

            if (rows.length > 0) {
                ultimoConsecutivo = rows[0].valor + 1; // Incrementa el último consecutivo obtenido
            }

            // Actualizar el último consecutivo en la base de datos
            connection.query(`INSERT INTO consecutivos (valor) VALUES (${ultimoConsecutivo})`, (err, result) => {
                if (err) {
                    console.error('Error al actualizar el último consecutivo en la base de datos:', err);
                    res.status(500).json({ error: 'Error al actualizar el último consecutivo en la base de datos' });
                    return;
                }

                console.log('Último consecutivo actualizado en la base de datos:', ultimoConsecutivo);

                // Continuar con la lógica para obtener los datos del cliente, vehículo y conductores seleccionados
                const consultaCliente = `
                    SELECT contratante, nit, N_contrato, objeto, direccion, responsable, cedula, celular, fecha_inicio, fecha_final,destino 
                    FROM clientes 
                    WHERE nombre = '${nombreCliente}'`;

                connection.query(consultaCliente, (errorCliente, resultadosCliente) => {
                    if (errorCliente) {
                        console.error('Error al obtener datos del cliente:', errorCliente);
                        res.status(500).json({ error: 'Error al obtener datos del cliente' });
                        return;
                    }

                    if (resultadosCliente.length === 0) {
                        res.status(404).json({ error: 'Cliente no encontrado' });
                        return;
                    }

                    const consultaVehiculo = `
                        SELECT placa, Modelo, Marca, Clase_vehiculo, No_movil, Afiliado_a
                        FROM vehiculos 
                        WHERE placa = '${placa}'`;

                    connection.query(consultaVehiculo, (errorVehiculo, resultadosVehiculo) => {
                        if (errorVehiculo) {
                            console.error('Error al obtener datos del vehículo:', errorVehiculo);
                            res.status(500).json({ error: 'Error al obtener datos del vehículo' });
                            return;
                        }

                        if (resultadosVehiculo.length === 0) {
                            res.status(404).json({ error: 'Vehículo no encontrado' });
                            return;
                        }

                        if (conductoresIds.length === 1) {
                            // Si solo se selecciona un conductor, cambiar la consulta para obtener solo ese conductor
                            const consultaConductorUnico = `
                                SELECT conductor, cedula, fecha_vigencia
                                FROM conductores
                                WHERE id = ${conductoresIds[0]}`;
                            
                            connection.query(consultaConductorUnico, (errorConductor, resultadoConductor) => {
                                if (errorConductor) {
                                    console.error('Error al obtener datos del conductor:', errorConductor);
                                    res.status(500).json({ error: 'Error al obtener datos del conductor' });
                                    return;
                                }

                                if (resultadoConductor.length === 0) {
                                    res.status(404).json({ error: 'Conductor no encontrado' });
                                    return;
                                }

                                const cliente = resultadosCliente[0];
                                const vehiculo = resultadosVehiculo[0];
                                const conductor = resultadoConductor[0];

                                // Construir la plantilla HTML con un solo conductor
                                fs.readFile('src/views/clientes/fuec_template.hbs', 'utf8', (err, data) => {
                                    if (err) {
                                        console.error('Error al leer el archivo de la plantilla HBS:', err);
                                        res.status(500).json({ error: 'Error al cargar la plantilla HBS' });
                                        return;
                                    }

                                    const template = hbs.compile(data);

                                    const html = template({
                                        contratante: cliente.contratante,
                                        nit: cliente.nit,
                                        N_contrato: cliente.N_contrato,
                                        objeto: cliente.objeto,
                                        destino: cliente.destino,

                                        celular: cliente.celular,
                                        cedula: cliente.cedula,
                                        direccion: cliente.direccion,
                                        responsable: cliente.responsable,
                                        fecha_inicio: cliente.fecha_inicio,
                                        fecha_final: cliente.fecha_final,
                                        conductores: [{
                                            conductor: conductor.conductor,
                                            cedula: conductor.cedula,
                                            fecha_vigencia: conductor.fecha_vigencia
                                        }],
                                        vehiculo: {
                                            placa: vehiculo.placa,
                                            Modelo: vehiculo.Modelo,
                                            Marca: vehiculo.Marca,
                                            Clase_vehiculo: vehiculo.Clase_vehiculo,
                                            No_movil: vehiculo.No_movil,
                                            Afiliado_a: vehiculo.Afiliado_a
                                        },
                                        ultimoConsecutivo: ultimoConsecutivo, // Agregar esta línea
                                        qrDataURL: qrDataURL // Agregar la URL del código QR al template
                                    });

                                    res.send(html);
                                });

                            });

                        } else if (conductoresIds.length === 2 || conductoresIds.length === 3) {
                            // Si se seleccionan dos o tres conductores
                            const consultaConductores = `
                                SELECT conductor, cedula, fecha_vigencia
                                FROM conductores
                                WHERE id IN (${conductoresIds.join(', ')})`;

                            connection.query(consultaConductores, (errorConductores, resultadosConductores) => {
                                if (errorConductores) {
                                    console.error('Error al obtener datos de los conductores:', errorConductores);
                                    res.status(500).json({ error: 'Error al obtener datos de los conductores' });
                                    return;
                                }

                                if (resultadosConductores.length !== conductoresIds.length) {
                                    res.status(404).json({ error: `No se encontraron ${conductoresIds.length} conductores` });
                                    return;
                                }

                                const cliente = resultadosCliente[0];
                                const vehiculo = resultadosVehiculo[0];

                                // Construir la plantilla HTML con los conductores seleccionados
                                fs.readFile('src/views/clientes/fuec_template.hbs', 'utf8', (err, data) => {
                                    if (err) {
                                        console.error('Error al leer el archivo de la plantilla HBS:', err);
                                        res.status(500).json({ error: 'Error al cargar la plantilla HBS' });
                                        return;
                                    }

                                    const template = hbs.compile(data);

                                    const html = template({
                                        contratante: cliente.contratante,
                                        nit: cliente.nit,
                                        N_contrato: cliente.N_contrato,
                                        objeto: cliente.objeto,
                                        destino: cliente.destino,

                                        celular: cliente.celular,
                                        cedula: cliente.cedula,
                                        direccion: cliente.direccion,
                                        responsable: cliente.responsable,
                                        fecha_inicio: cliente.fecha_inicio,
                                        fecha_final: cliente.fecha_final,
                                        conductores: resultadosConductores.map(conductor => {
                                            return {
                                                conductor: conductor.conductor,
                                                cedula: conductor.cedula,
                                                fecha_vigencia: conductor.fecha_vigencia
                                            };
                                        }),
                                        vehiculo: {
                                            placa: vehiculo.placa,
                                            Modelo: vehiculo.Modelo,
                                            Marca: vehiculo.Marca,
                                            Clase_vehiculo: vehiculo.Clase_vehiculo,
                                            No_movil: vehiculo.No_movil,
                                            Afiliado_a: vehiculo.Afiliado_a
                                        },
                                        ultimoConsecutivo: ultimoConsecutivo, // Agregar esta línea
                                        qrDataURL: qrDataURL // Agregar la URL del código QR al template
                                    });

                                    res.send(html);
                                });

                            });
                        } else {
                            // Si no se seleccionan conductores válidos
                            res.status(404).json({ error: 'No se seleccionaron conductores válidos' });
                        }
                    });
                });
            });
        });
    });
});

// Ruta para descargar el template en formato PNG
app.get('/descargar/png', (req, res) => {
    // Renderiza el template
    res.render('src/views/clientes/fuec_template.hbs', (err, html) => {
        if (err) {
            console.error('Error al renderizar el template:', err);
            res.status(500).json({ error: 'Error al renderizar el template' });
            return;
        }
        // Convierte el HTML en una imagen PNG
        html2canvas(html)
            .then(canvas => {
                // Convierte el canvas a base64
                const base64Data = canvas.toDataURL('image/png');
                // Envía la imagen al cliente para descargar
                res.set('Content-Type', 'image/png');
                res.send(Buffer.from(base64Data.split(',')[1], 'base64'));
            })
            .catch(error => {
                console.error('Error al generar la imagen PNG:', error);
                res.status(500).json({ error: 'Error al generar la imagen PNG' });
            });
    });
});



// Inicia el servidor de Socket.IO en el puerto especificado
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor Socket.IO escuchando en el puerto ${PORT}`);
});

const EXPRESS_PORT = 3001; // Elige el puerto que desees para la aplicación Express
app.listen(EXPRESS_PORT, () => {
    console.log(`Aplicación Express escuchando en el puerto ${EXPRESS_PORT}`);
});
