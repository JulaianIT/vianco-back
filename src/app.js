// Importar los módulos necesarios
const express = require("express");
const session = require("express-session");
const mysql = require("mysql2");
const { engine } = require("express-handlebars");
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Límite de tamaño: 10 MB por archivo
});

const pool = require('./db'); // Ajusta la ruta según la estructura de tu proyecto


const bodyParser = require('body-parser');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const html2canvas = require('html2canvas');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid'); // Utiliza UUID para generar IDs únicos

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

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'soporte.it.vianco@gmail.com',
        pass: 'caerdeblynmsfzvc'
    },
    messageId: uuidv4(), // Genera un Message-ID único para cada correo enviado

});

const crypto = require('crypto'); // Importa el módulo crypto

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






app.use((req, res, next) => {
    req.db = pool;
    next();
});

app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
}));

// Configurar la ruta para el webhook y usar el manejador de webhook
app.post("/webhook", webhookHandler.handleWebhook);
















// Render login form
app.get("/login", (req, res) => {
    if (req.session.loggedin) {
        res.redirect("/");  // Redirigir a la página principal si ya está autenticado
    } else {
        res.render("login/index.hbs", { error: null });  // Renderizar el formulario de inicio de sesión con un mensaje de error nulo
    }
});



// Handle login authentication for empresa
app.post("/auth", (req, res) => {
    const data = req.body;
    

    pool.query("SELECT * FROM user WHERE email = ? AND password = ?", [data.email, data.password], (err, userData) => {
        if (err) {
            console.error("Error fetching user from database:", err);
            res.status(500).send("Internal Server Error");
            return;
        }

        if (userData.length > 0) {
            const user = userData[0];
            req.session.loggedin = true;
            req.session.name = user.name;
            req.session.roles = typeof user.roles === 'string' ? user.roles.split(',') : [];
            res.redirect("/menu");
        } else {
            res.render("login/index.hbs", { error: "Usuario no encontrado o contraseña incorrecta" });
        }
    });
});













// Render login form
app.get("/menucliente", (req, res) => {
    if (req.session.loggedin) {
        res.render("MODULOCLIENTES/homeclientes.hbs", { error: null });  // Renderizar el formulario de inicio de sesión con un mensaje de error nulo
    } else {
        res.render("login/index.hbs", { error: null });  // Renderizar el formulario de inicio de sesión con un mensaje de error nulo
    }
});



//menu para cleintes


// Handle login authentication for cliente
app.post("/auth-cliente", (req, res) => {
    const data = req.body;
    

    pool.query("SELECT * FROM clienteuser WHERE email = ? AND password = ?", [data.email, data.password], (err, clienteData) => {
        if (err) {
            console.error("Error fetching cliente from database:", err);
            res.status(500).send("Internal Server Error");
            return;
        }

        if (clienteData.length > 0) {
            const cliente = clienteData[0];
            req.session.loggedin = true;
            req.session.name = cliente.name;
            req.session.roles = typeof cliente.roles === 'string' ? cliente.roles.split(',') : [];
            res.redirect("/menucliente");
        } else {
            res.render("login/index.hbs", { error: "Cliente no encontrado o contraseña incorrecta" });
        }
    });
});









// Render register form
app.get("/register", (req, res) => {
    if (req.session.loggedin) {
        res.redirect("/");  // Redirigir a la página principal si ya está autenticado
    } else {
        res.render("login/register.hbs", { error: null });  // Renderizar el formulario de registro con mensaje de error nulo
    }
});

// Handle user registration
app.post("/storeUser", (req, res) => {
    const data = req.body;
    const pool = pool;

    pool.query("SELECT * FROM user WHERE email = ?", [data.email], (err, userData) => {
        if (err) {
            console.error("Error fetching user from database:", err);  // Manejar errores al recuperar datos del usuario desde la base de datos
            res.status(500).send("Internal Server Error");  // Enviar respuesta de error interno del servidor
            return;
        }

        if (userData.length > 0) {
            res.render("login/register.hbs", { error: "User with this email already exists" });  // Renderizar página de registro con mensaje de usuario ya existente
            return;
        }

        pool.query("INSERT INTO user SET ?", data, (err, rows) => {
            if (err) {
                console.error("Error inserting user into database:", err);  // Manejar errores al insertar usuario en la base de datos
                res.status(500).send("Internal Server Error");  // Enviar respuesta de error interno del servidor
            } else {
                console.log("User registered successfully");  // Registrar registro exitoso del usuario
                res.redirect("/");  // Redirigir a la página principal después del registro exitoso
            }
        });
    });
});

// Handle logout
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);  // Manejar errores al destruir la sesión
            res.status(500).send("Internal Server Error");  // Enviar respuesta de error interno del servidor
        } else {
            res.redirect("/login");  // Redirigir a la página de inicio de sesión después de cerrar sesión
        }
    });
});

// Middleware to protect routes that require authentication
function requireLogin(req, res, next) {
    if (req.session.loggedin) {
        next();  // Pasar al siguiente middleware si está autenticado
    } else {
        res.redirect("/login");  // Redirigir a la página de inicio de sesión si no está autenticado
    }
}



















// Handle forgot password
app.post("/forgot-password", (req, res) => {
    const { email } = req.body;
   

    // Generar un token único y establecer la fecha de expiración
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiration = new Date();
    resetTokenExpiration.setHours(resetTokenExpiration.getHours() + 1); // Token válido por 1 hora

    pool.query("UPDATE user SET resetToken = ?, resetTokenExpiration = ? WHERE email = ?", [resetToken, resetTokenExpiration, email], (err, result) => {
        if (err) {
            console.error("Error updating reset token in database:", err);
            res.status(500).send("Internal Server Error");
            return;
        }

        // Check if user with provided email exists
        if (result.affectedRows === 0) {
            res.render("login/index.hbs", { error: "Correo electrónico no encontrado" });
        } else {
            const mailOptions = {
                from: 'nexus.innovationss@gmail.com',
                to: email,
                subject: 'Recuperación de Contraseña',
                html: `
                    <p>Hola,</p>
                    <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                    <a href="https://vianco-back-svdl.onrender.com/reset-password?token=${resetToken}">Restablecer Contraseña</a>
                    <p>Este enlace expirará en 1 hora.</p>
                    <p>Si no solicitaste esto, por favor ignora este correo y tu contraseña permanecerá sin cambios.</p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error sending email:", error);
                    res.status(500).send("Error al enviar el correo electrónico");
                } else {
                    console.log("Email sent:", info.response);
                    res.render("login/index.hbs", { successMessage: "Se ha enviado un correo electrónico con instrucciones para restablecer la contraseña" });
                }
            });
        }
    });
});

// Página para restablecer la contraseña (GET)
app.get("/reset-password", (req, res) => {
    const token = req.query.token; // Obtiene el token de la consulta
    console.log("Token recibido en GET:", token);
  
    // Verificar si el token es válido y está dentro del tiempo de expiración adecuado
    pool.query(
      "SELECT * FROM user WHERE resetToken = ? AND resetTokenExpiration > NOW()",
      [token],
      (err, results) => {
        if (err) {
          console.error("Error al verificar el token:", err);
          res.status(500).send("Error interno al verificar el token");
        } else {
          if (results.length === 0) {
            res.status(400).send("El token para restablecer la contraseña es inválido o ha expirado");
          } else {
            // Mostrar el formulario para restablecer la contraseña
            res.render("login/reset-password.hbs", { token });
          }
        }
      }
    );
});

// Procesar restablecimiento de contraseña (POST)
app.post("/reset-password", (req, res) => {
    const { token, password } = req.body;

    // Verificar si el token es válido y está dentro del tiempo de expiración adecuado
    pool.query(
      "SELECT * FROM user WHERE resetToken = ? AND resetTokenExpiration > NOW()",
      [token],
      (err, results) => {
        if (err) {
          console.error("Error al verificar el token:", err);
          res.status(500).send("Error interno al verificar el token");
        } else {
          if (results.length === 0) {
            res.status(400).send("El token para restablecer la contraseña es inválido o ha expirado");
          } else {
            const user = results[0];

            // Actualizar la contraseña en la base de datos y limpiar el token
            pool.query(
              "UPDATE user SET password = ?, resetToken = NULL, resetTokenExpiration = NULL WHERE id = ?",
              [password, user.id],
              (updateErr, updateResult) => {
                if (updateErr) {
                  console.error("Error al actualizar la contraseña:", updateErr);
                  res.status(500).send("Error interno al actualizar la contraseña");
                } else {
                  console.log("Contraseña actualizada exitosamente para el usuario:", user.email);

                  // Redirigir al usuario a la página de inicio de sesión con un mensaje de éxito
                  res.render("login/index.hbs", { successMessage: "Contraseña restablecida exitosamente" });
                }
              }
            );
          }
        }
      }
    );
});














































// Crear un nuevo router
const router = express.Router();



// Usar el router en la aplicación
app.use(router);






// Ruta para la página principal vianco
app.get("/menu", (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        console.log(`El usuario ${nombreUsuario} está autenticado.`);
        req.session.nombreGuardado = nombreUsuario; // Guarda el nombre en la sesión

        const rolesString = req.session.roles;
        const roles = Array.isArray(rolesString) ? rolesString : [];
        otraFuncion(req, res); // Llama a otraFuncion para obtener el nombre de usuario



        const auxiliar = roles.includes('auxiliar');
        const ejecutivo = roles.includes('ejecutivo');
        const cordinacion = roles.includes('cordinacion');
        const callcenter = roles.includes('callcenter');
        const director = roles.includes('director');
        const gerencia = roles.includes('gerencia');
        const contabilidad = roles.includes('contabilidad');
        const soporte = roles.includes('soporte');

        res.render("home",{ name: req.session.name, auxiliar, ejecutivo, cordinacion, callcenter, director, gerencia, contabilidad ,soporte}); // Pasar los roles a la plantilla
    } else {
        res.redirect("/login");
    }
});


// Ruta para la página principal vianco
app.get("/", (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        console.log(`El usuario ${nombreUsuario} está autenticado.`);
        req.session.nombreGuardado = nombreUsuario; // Guarda el nombre en la sesión

        const rolesString = req.session.roles;
        const roles = Array.isArray(rolesString) ? rolesString : [];
        otraFuncion(req, res); // Llama a otraFuncion para obtener el nombre de usuario



        const auxiliar = roles.includes('auxiliar');
        const ejecutivo = roles.includes('ejecutivo');
        const cordinacion = roles.includes('cordinacion');
        const callcenter = roles.includes('callcenter');
        const director = roles.includes('director');
        const gerencia = roles.includes('gerencia');
        const aeropuerto = roles.includes('aeropuerto');
        const soporte = roles.includes('soporte');

        res.render("operaciones/menu.operaciones.hbs",{ name: req.session.name, auxiliar, ejecutivo, cordinacion, callcenter, director, gerencia, aeropuerto,soporte }); // Pasar los roles a la plantilla
    } else {
        res.redirect("/login");
    }
});






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
        pool.query("SELECT base, placa FROM vehiculos", (error, results) => {
            if (error) {
                console.error("Error al obtener las bases y placas:", error);
                res.status(500).send("Error al obtener las bases y placas");
                return;
            }
            // Renderizar la vista de programación de vehículos con los datos de las bases y placas
            res.render("operaciones/programacion/programacion.hbs", { 
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
        res.redirect("/login");
    }
});


// Ruta para guardar la programación de vehículos
app.post('/guardar-programacion', (req, res) => {
    // Obtener los datos del formulario del cuerpo de la solicitud
    const { base, placa, fecha, horario, observaciones } = req.body;

    // Insertar los datos en la tabla programacion_vehiculos
    const sql = `INSERT INTO programacion_vehiculos (base, placa, fecha, horario, observaciones) VALUES (?, ?, ?, ?, ?)`;
    pool.query(sql, [base, placa, fecha, horario, observaciones], (err, result) => {
        if (err) {
            console.error('Error al guardar la programación del vehículo:', err);
            res.status(500).send('Error al guardar la programación del vehículo');
            return;
        }
        console.log('Programación del vehículo guardada exitosamente');
        res.status(200).send('Programación del vehículo guardada exitosamente');
    });
});



 // Ruta para mostrar la página de ver_programacion.hbs
app.get('/ver-programacion', (req, res) => {
    // Consulta a la base de datos para obtener todas las bases y horarios disponibles
    pool.query('SELECT DISTINCT base FROM programacion_vehiculos', (err, basesResults) => {
        if (err) {
            console.error('Error al obtener las bases:', err);
            // Manejar el error adecuadamente
            return;
        }

        pool.query('SELECT DISTINCT horario FROM programacion_vehiculos', (err, horariosResults) => {
            if (err) {
                console.error('Error al obtener los horarios:', err);
                // Manejar el error adecuadamente
                return;
            }

            const bases = basesResults.map(result => result.base); // Extraer las bases de los resultados
            const horarios = horariosResults.map(result => result.horario); // Extraer los horarios de los resultados
            res.render('operaciones/programacion/ver_programacion.hbs', { bases, horarios }); // Renderizar la página ver_programacion.hbs con las bases y horarios disponibles
        });
    });
});








const handlebars = require('handlebars');
const expressHandlebars = require('express-handlebars');

// Registra el helper formatDatee en Handlebars
handlebars.registerHelper('formatDatee', function(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
});


app.get('/buscar-programacion', (req, res) => {
    const { base, fecha, horario } = req.query;

    // Construir la consulta SQL para la programación de vehículos
    let programacionSql = 'SELECT * FROM programacion_vehiculos WHERE 1';
    const programacionParams = [];

    if (base && base !== 'todos') {
        programacionSql += ' AND base = ?';
        programacionParams.push(base);
    }

    if (fecha) {
        programacionSql += ' AND fecha = ?';
        programacionParams.push(fecha);
    }

    if (horario && horario !== 'todos') {
        programacionSql += ' AND horario = ?';
        programacionParams.push(horario);
    }

    // Ejecutar la consulta para la programación de vehículos
    pool.query(programacionSql, programacionParams, (err, programacionResults) => {
        if (err) {
            console.error('Error al buscar programación de vehículos:', err);
            // Maneja el error apropiadamente
            return;
        }

        // Construir la consulta SQL para las llegadas y salidas
        let llegadasSalidasSql = 'SELECT * FROM llegadas_salidas WHERE 1';
        const llegadasSalidasParams = [];

        if (fecha) {
            llegadasSalidasSql += ' AND fecha = ?';
            llegadasSalidasParams.push(fecha);
        }

        // Ejecutar la consulta para las llegadas y salidas
        pool.query(llegadasSalidasSql, llegadasSalidasParams, (err, llegadasSalidasResults) => {
            if (err) {
                console.error('Error al buscar llegadas y salidas:', err);
                // Maneja el error apropiadamente
                return;
            }

            // Renderizar la página de resultados con los datos obtenidos
            res.render('operaciones/programacion/resultados_programacion.hbs', { 
                programacion: programacionResults,
                llegadasSalidas: llegadasSalidasResults
            });
        });
    });
});


// Función para formatear la fecha en el formato DD/MM/AAAA
function formatDate(date) {
    const fecha = new Date(date);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
}










const ExcelJS = require('exceljs');


// Ruta para descargar la programación de vehículos en formato Excel
app.get('/descargar-programacion', (req, res) => {
    const { fechaInicio, fechaFin } = req.query;

    // Construir la consulta SQL con el rango de fechas proporcionado
    const sql = 'SELECT * FROM programacion_vehiculos WHERE fecha BETWEEN ? AND ?';
    const params = [fechaInicio, fechaFin];

    // Ejecutar la consulta
    pool.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error al buscar programación de vehículos:', err);
            // Manejar el error apropiadamente
            return;
        }

        // Crear un nuevo libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Programación de Vehículos');

        // Definir las cabeceras de las columnas
        worksheet.addRow(['Base', 'Placa', 'Fecha', 'Horario', 'Observaciones']);

        // Agregar los datos de la consulta a las filas del archivo Excel
        results.forEach(result => {
            worksheet.addRow([result.base, result.placa, result.fecha, result.horario, result.observaciones]);
        });

        // Escribir el archivo Excel en un buffer
        workbook.xlsx.writeBuffer()
            .then(buffer => {
                // Configurar los encabezados de la respuesta para descargar el archivo
                res.setHeader('Content-Disposition', 'attachment; filename=programacion_vehiculos.xlsx');
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                // Enviar el archivo Excel como respuesta
                res.send(buffer);
            })
            .catch(err => {
                console.error('Error al generar el archivo Excel:', err);
                // Manejar el error apropiadamente
                res.status(500).send('Error al generar el archivo Excel');
            });
    });
});

function otraFuncion(req, res, next) {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
    } else {
        console.log('El usuario no está autenticado.');
    }
}



// Ruta para logout
app.get("/logout", (req, res) => {
    if (req.session.loggedin === true) {
        req.session.destroy();
    }
    res.redirect("/login");
});

// Ruta para administrar roles
app.get("/admin/roless", (req, res) => {
    // Verificar si el usuario tiene permisos de administrador
    if (req.session.loggedin && req.session.roles.includes('gerencia')) {
        // Obtener los usuarios y sus roles desde la base de datos
        pool.query("SELECT id, email, name, roles FROM user", (error, results) => {
            if (error) {
                console.error("Error al obtener usuarios y roles:", error);
                res.status(500).send("Error al obtener usuarios y roles");
                return;
            }
            // Renderizar la vista de administración de roles con los datos de los usuarios
            res.render("admin/roles.hbs", { users: results });
        });
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
        pool.query("SELECT id, email, name, roles FROM user WHERE id = ?", [userId], (error, results) => {
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
        pool.query("UPDATE user SET roles = ? WHERE id = ?", [newRole, userId], (error, results) => {
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
    pool.query('SELECT DISTINCT base FROM vehiculos', (error, results) => {
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
    pool.query('SELECT placa FROM vehiculos WHERE base = ?', [baseSeleccionada], (error, results) => {
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
    pool.query("SELECT placa FROM vehiculos", (error, results) => {
        if (error) {
            console.error("Error al obtener las placas:", error);
            res.status(500).send("Error al obtener las placas");
            return;
        }
        // Renderizar la vista de consulta de vehículos con los datos de las placas
        res.render("operaciones/vehiculos/consulta.hbs", { placas: results.map(result => result.placa) });
    });
});


app.post("/consulta-vehiculos", (req, res) => {
    const placaSeleccionada = req.body.placa; // Obtener la placa seleccionada del cuerpo de la solicitud
    // Consulta SQL para obtener la información del vehículo correspondiente a la placa seleccionada
    pool.query("SELECT * FROM vehiculos WHERE placa = ?", [placaSeleccionada], (error, results) => {
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



handlebars.registerHelper('eq', function(arg1, arg2) {
    return arg1 === arg2;
});

app.get('/edicion/:placa', async (req, res) => {
    try {
        if (req.session.loggedin === true) {
            const nombreUsuario = req.session.name;
            const clientesQuery = 'SELECT DISTINCT nombre FROM clientes';
            const [clienteRows] = await pool.promise().query(clientesQuery);
            if (!clienteRows || clienteRows.length === 0) {
                throw new Error("No se encontraron clientes en la base de datos.");
            }

            // Obtener la placa del vehículo de los parámetros de la solicitud
            const placa = req.params.placa;

            // Realizar una consulta a la base de datos para obtener los datos del vehículo
            pool.query('SELECT * FROM vehiculos WHERE placa = ?', placa, (error, results) => {
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

                const vehiculo = results[0]; // Obtener el primer vehículo encontrado

                console.log('Clientes encontrados:');
                const nombresClientes = clienteRows.map(row => row.nombre);
                // Obtenemos la fecha actual y la pasamos al renderizar la plantilla
                const fechaActual = obtenerFechaActual(); // Función para obtener la fecha actual
                res.render('operaciones/vehiculos/edicion.hbs', { vehiculo, nombreUsuario, clientes: nombresClientes, fechaActual });
            });
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error interno del servidor");
    }
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
    pool.query(sqlQuery, queryParams, (error, results) => {
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
app.get("", (req, res) => {
    res.render('formulario_agregar'); // Renderizar la vista del formulario de agregar
});




app.get('/agregar-vehiculo', async (req, res) => {
    try {
        if (req.session.loggedin === true) {
            const nombreUsuario = req.session.name;
            const clientesQuery = 'SELECT DISTINCT nombre FROM clientes';
            const [clienteRows] = await pool.promise().query(clientesQuery);
            if (!clienteRows || clienteRows.length === 0) {
                throw new Error("No se encontraron clientes en la base de datos.");
            }
            console.log('Clientes encontrados:');
            const nombresClientes = clienteRows.map(row => row.nombre);
            // Obtenemos la fecha actual y la pasamos al renderizar la plantilla
            const fechaActual = obtenerFechaActual(); // Función para obtener la fecha actual
            res.render('operaciones/vehiculos/formulario_agregar.hbs', { nombreUsuario, clientes: nombresClientes, fechaActual });
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error interno del servidor");
    }
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
    pool.query(
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
    pool.query('SELECT placa FROM conductores', (error, results) => {
      if (error) {
        console.error('Error al obtener las placas:', error);
        res.status(500).send('Error al obtener las placas');
        return;
      }
      // Renderizar la vista de consulta de conductores con los datos de las placas
      res.render('operaciones/conductores/conductores.hbs', { placas: results.map((result) => result.placa) }); // Utiliza la plantilla "conductores"
    });
});









app.post("/consulta-conductores", (req, res) => {
    const placaSeleccionada = req.body.placa; // Obtener la placa seleccionada del cuerpo de la solicitud
    // Consulta SQL para obtener la información del conductor correspondiente a la placa seleccionada
    pool.query("SELECT * FROM conductores WHERE placa = ?", [placaSeleccionada], (error, results) => {
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









// Ruta para la página de consulta de conductores
app.get('/consulta-conductores2', (req, res) => {
    // Consulta SQL para obtener las placas disponibles
    pool.query('SELECT placa FROM conductores', (error, results) => {
      if (error) {
        console.error('Error al obtener las placas:', error);
        res.status(500).send('Error al obtener las placas');
        return;
      }
      // Renderizar la vista de consulta de conductores con los datos de las placas
      res.render('operaciones/conductores/conductores2.hbs', { placas: results.map((result) => result.placa) }); // Utiliza la plantilla "conductores"
    });
});









app.post("/consulta-conductores2", (req, res) => {
    const placaSeleccionada = req.body.placa; // Obtener la placa seleccionada del cuerpo de la solicitud
    // Consulta SQL para obtener la información del conductor correspondiente a la placa seleccionada
    pool.query("SELECT * FROM conductores WHERE placa = ?", [placaSeleccionada], (error, results) => {
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
  pool.query(
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
  pool.query('SELECT * FROM conductores WHERE placa = ?', placa, (error, results) => {
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
    res.render('operaciones/conductores/edicionC.hbs', { conductor: results[0] }); // Pasar los datos del conductor a la vista
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
    pool.query(sqlQuery, queryParams, (error, results) => {
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
  res.render('operaciones/conductores/formulario_agregar_conductor.hbs');
});

//consulta contabilidad 
app.get("/consulta-contabilidad", (req, res) => {
    // Consulta SQL para obtener todas las placas disponibles
    pool.query("SELECT placa FROM contabilidad", (error, results) => {
        if (error) {
            console.error("Error al obtener las placas de contabilidad:", error);
            res.status(500).send("Error al obtener las placas de contabilidad");
            return;
        }
        const placas = results.map(result => result.placa); // Extraer solo las placas de los resultados
        res.render("operaciones/administracion/consulta_contabilidad.hbs", { placas: placas }); // Renderizar la plantilla y pasar las placas como datos
    });
});











//consulta contabilidad 
app.post("/consulta-contabilidad", (req, res) => {
    const placaSeleccionada = req.body.placa; // Obtener la placa seleccionada del cuerpo de la solicitud
    // Consulta SQL para obtener la información de contabilidad correspondiente a la placa seleccionada
    pool.query("SELECT * FROM contabilidad WHERE placa = ?", [placaSeleccionada], (error, results) => {
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
    pool.query("SELECT * FROM contabilidad WHERE placa = ?", [placa], (error, results) => {
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
        res.render("operaciones/administracion/edicion_contabilidad.hbs", { contabilidad: contabilidad });
    });
});

// Ruta para manejar el formulario de edición de contabilidad
app.post('/guardar-edicion-contabilidad', (req, res) => {
    const placa = req.body.placa;
    // Obtener los datos del cuerpo de la solicitud
    const { NOMBRES_LICENCIA, TIPO_DE_DOCUMENTO_LICENCIA, NUMERO_DE_DOCUMENTO_LICENCIA, FECHA_DE_INICIO_CONTRATO, FECHA_FINAL, MOTIVO_RETIRO, NOMBRES_CONTRATO,TIPO_DE_DOCUMENTO_CONTRATO, NUMERO_DE_DOCUMENTO_CONTRATO, DIRECCION_CONTRATO,CELULAR_CONTRATO, EMAIL_CONTRATO, ACTIVIDAD_ECONOMICA_CONTRATO, VALOR_ADMINISTRACION, Nombre, tipo_documento, Cedula, Nombre_del_banco, Tipo_de_cuenta_bancaria, Numero_de_cuenta, direccion, celular, email } = req.body;

    // Realizar la actualización en la base de datos con los datos recibidos
    pool.query(
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
    res.render("operaciones/administracion/formulario_agregar_contabilidad.hbs");
});

// Ruta para manejar los datos enviados desde el formulario y agregar una nueva entrada de contabilidad a la base de datos
app.post("/agregar-contabilidad", (req, res) => {
    // Obtener todos los campos del formulario
    const formData = req.body;

    // Asegurarse de enviar una cadena vacía si no se proporciona ningún valor para 'Numero_de_cuenta'
    const numeroCuenta = formData.Numero_de_cuenta || '';

    // Insertar los datos en la base de datos
    pool.query(
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
            pool.query('SELECT * FROM clientes', (errorClientes, resultadosClientes) => {
                if (errorClientes) {
                    console.error('Error al obtener los clientes:', errorClientes);
                    res.status(500).send('Error al obtener los clientes');
                    return;
                }

                // Consulta para obtener todas las placas de la tabla "conductores"
                pool.query('SELECT DISTINCT placa FROM conductores', (errorPlacas, resultadosPlacas) => {
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
            res.redirect("/login");
        }
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).send('Error al procesar la solicitud');
    }
});

app.post('/obtener_conductor', (req, res) => {
    const placaSeleccionada = req.body.placa;

    // Realiza una consulta a la base de datos para obtener el conductor correspondiente a la placa
    pool.query('SELECT conductor, celular, foto FROM conductores WHERE placa = ?', [placaSeleccionada], (error, results) => {
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
        pool.query(query, [cliente, fecha, hora, nombre_pasajero, valor, cantidad_pasajeros, tipo_vehiculo, vuelo, placa, conductor, celular_conductor]);
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
    pool.query('SELECT nombre,  foto FROM clientes', (error, results, fields) => {
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
    pool.query('SELECT * FROM clientes WHERE nombre = ?', [nombreCliente], (error, results, fields) => {
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
    pool.query('SELECT foto FROM conductores WHERE placa = ?', [placa], (error, results, fields) => {
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
pool.query('SELECT foto_vehiculo FROM vehiculos WHERE placa = ?', [placa], (error, results, fields) => {
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









const uploadDir = path.join(__dirname, 'uploads');

// Crear la carpeta `uploads` si no existe
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('Carpeta "uploads" creada.');
} else {
    console.log('Carpeta "uploads" ya existe.');
}







// Configurar body-parser para permitir cuerpos de solicitud más grandes (50 MB en este caso)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));








app.post('/enviar-email-pdf', upload.single('pdf'), (req, res) => {
    const { destinatario } = req.body;
    const pdfFile = req.file;

    if (!destinatario || !pdfFile) {
        res.status(400).send('Faltan campos requeridos.');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'recepciones.vianco@gmail.com',
            pass: 'xaezkqbzfsuegqhm'
        }
    });

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
                filename: pdfFile.originalname,
                content: pdfFile.buffer
            }
        ]
    };

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
    res.render('operaciones/tarifas/seleccionar_hotel.hbs'); // Renderiza la vista seleccionar_hotel.hbs
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











app.get('/novedades', async (req, res) => {
    try {
        if (req.session.loggedin === true) {
            const nombreUsuario = req.session.name;
            const userQuery = 'SELECT DISTINCT name FROM user';
            const [userRows] = await pool.promise().query(userQuery);
            if (!userRows || userRows.length === 0) {
                throw new Error("No se encontraron clientes en la base de datos.");
            }
            const clientes = userRows.map(row => row.name); // Verifica que 'row.name' es el campo correcto
            const fechaActual = obtenerFechaActual(); // Función para obtener la fecha actual
            console.log('Renderizando plantilla con:', { nombreUsuario, clientes, fechaActual });
            res.render('novedades_Callcenter/novedades_Callcenter.hbs', { nombreUsuario, clientes, fechaActual });
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error interno del servidor");
    }
});









app.post('/novedades', (req, res) => {
    const fecha = req.body.fecha;
    const turno = req.body.turno;
    const realiza = req.body.realiza;
    const entrega = req.body.entrega;
    const sinNovedad = req.body.sinNovedad ? 'Sin novedad' : '';

    const novedad_tripulacion = req.body.novedad_tripulacion || '';
    const novedad_hoteleria = req.body.novedad_hoteleria || '';
    const novedad_ejecutivos = req.body.novedad_ejecutivos || '';
    const novedad_empresas_privadas = req.body.novedad_empresasPrivadas || '';
    const NOVEDADES_TASKGO = req.body.novedad_NOVEDADES_TASKGO || '';
    const novedad_ACTAS = req.body.novedad_ACTAS || '';
    const novedad_OTRAS = req.body.novedad_OTRAS || '';
    const firmaBase64 = req.body.firmaBase64 || ''; // Corregido aquí
    console.log("Firma en formato base64 recibida:", firmaBase64);


    const fecha_registro = new Date(); // Obtener la fecha actual




    const sql = "INSERT INTO novedades (fecha_registro, fecha, turno, realiza, entrega, novedad_tripulacion, novedad_hoteleria, novedad_ejecutivos, novedad_empresas_privadas, NOVEDADES_TASKGO, novedad_ACTAS, novedad_OTRAS, firma, sinNovedad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [fecha_registro, fecha, turno, realiza, entrega, novedad_tripulacion, novedad_hoteleria, novedad_ejecutivos, novedad_empresas_privadas, NOVEDADES_TASKGO, novedad_ACTAS, novedad_OTRAS, firmaBase64, sinNovedad]; // Corregido aquí
    
    pool.query(sql, values, (error, results) => {
  if (error) {
    console.error("Error al insertar la novedad en la base de datos:", error);
  } else {
    console.log("Novedad insertada correctamente:", results);

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
    to: 'soporte.it.vianco@gmail.com', // El destinatario del correo electrónico
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
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        res.render('novedades_Callcenter/ver_Novedades.hbs', { nombreUsuario });
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});















// Backend (Endpoint /api/obtener_fechas_disponibles)
app.get('/api/obtener_fechas_disponibles', (req, res) => {
    pool.query('SELECT DISTINCT DATE_FORMAT(fecha_registro, "%Y-%m-%d") AS fecha_formateada FROM novedades', (error, results) => {
        if (error) {
            console.error('Error al obtener las fechas disponibles:', error);
            res.status(500).json({ error: 'Error interno del servidor' }); // Devuelve un JSON con el error
        } else {
            const fechasDisponibles = results.map(result => result.fecha_formateada);
            res.json(fechasDisponibles); // Devuelve un JSON con las fechas disponibles
        }
    });
});


// Backend (Endpoint /api/obtener_novedades)
app.get('/api/obtener_novedades', (req, res) => {
    const fechaSeleccionada = req.query.fecha;
    const query = 'SELECT fecha, turno, realiza, entrega, sinNovedad, novedad_tripulacion, novedad_hoteleria, novedad_ejecutivos, novedad_empresas_privadas, NOVEDADES_TASKGO, novedad_ACTAS, novedad_OTRAS, firma, fecha_registro FROM novedades WHERE DATE(fecha_registro) = ?'; // Añadir el campo de la firma en la consulta SQL
    pool.query(query, [fechaSeleccionada], (error, results) => {
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
    const {  nombreSeguimiento, detalleSeguimiento ,novedadestripulacion,fechaseguimiento,turno,realiza,entrega,sinNovedad,fecha,novedad_hoteleria,fecha_registro,novedad_ejecutivos,novedad_empresas_privadas,NOVEDADES_TASKGO,novedad_ACTAS,otras_novedades,firma,ACCIONES} = req.body;

    // Query para insertar el seguimiento en la base de datos
    const query = 'INSERT INTO novedades_completadas ( nombre_seguimiento, detalle_seguimiento, novedad_tripulacion, fecha_seguimiento, turno, realiza,entrega,sinNovedad,fecha_novedad,novedad_hoteleria,fecha_registro,novedad_ejecutivos,novedad_empresas_privadas,NOVEDADES_TASKGO,novedad_ACTAS,otras_novedades,firma,ACCIONES) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [ nombreSeguimiento, detalleSeguimiento, novedadestripulacion, fechaseguimiento, turno, realiza,entrega,sinNovedad,fecha,novedad_hoteleria,fecha_registro,novedad_ejecutivos,novedad_empresas_privadas,NOVEDADES_TASKGO,novedad_ACTAS,otras_novedades,firma,ACCIONES];
    
    // Ejecutar la consulta SQL
    pool.query(query, values, (error, results, fields) => {
        if (error) {
            console.error('Error al guardar el seguimiento en la base de datos:', error);
            res.status(500).json({ error: 'Error al guardar el seguimiento en la base de datos' });
        } else {
            console.log('Seguimiento guardado correctamente en la base de datos');
            res.status(200).json({ message: 'Seguimiento guardado correctamente' });
        }
    });
});








app.delete('/api/eliminar_fecha/:fecha', (req, res) => {
    const fecha_formateada = req.params.fecha;
    pool.query('DELETE FROM novedades WHERE DATE_FORMAT(fecha_registro, "%Y-%m-%d") = ?', fecha_formateada, (error, results) => {
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

    // Convertir la fecha al formato de tu base de datos (DD/MM/YYYY)
    const fechaDB = fecha.split('-').reverse().join('/');

    // Preparar la consulta SQL para obtener las novedades de la fecha seleccionada
    const sql = "SELECT * FROM novedades_completadas WHERE fecha_registro LIKE ?";

    // Ejecutar la consulta
    pool.query(sql, [`%${fechaDB}%`], (err, result) => {
        if (err) {
            console.error("Error al obtener las novedades:", err);
            res.status(500).json({ error: "Error al obtener las novedades de la base de datos" });
        } else {
            res.status(200).json(result); // Devuelve los datos como JSON
        }
    });
});






const moment = require('moment-timezone');

function obtenerFechaActual() {
    return moment().tz('America/Bogota').format('DD/MM/YYYY HH:mm');
}


app.get('/inicio', async (req, res) => {
    try {
        if (req.session.loggedin === true) {
            const nombreUsuario = req.session.name;
            const userQuery = 'SELECT DISTINCT name FROM user';
            const [userRows] = await pool.promise().query(userQuery);
            if (!userRows || userRows.length === 0) {
                throw new Error("No se encontraron clientes en la base de datos.");
            }
            const clientes = userRows.map(row => row.name); // Verifica que 'row.name' es el campo correcto
            const fechaActual = obtenerFechaActual(); // Función para obtener la fecha actual
            console.log('Renderizando plantilla con:', { nombreUsuario, clientes, fechaActual, title: 'Iniciar Turno' });
            res.render('centro_operaciones/inicio_turno.hbs', { nombreUsuario, clientes, fechaActual, title: 'Iniciar Turno' });
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error interno del servidor");
    }
});



// Manejar la solicitud POST para iniciar el turno
app.post('/inicio-turno', (req, res) => {
    const nombre = req.body.nombre;
    const turno = req.body.turno;

    const fechaHoraActual = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
    const consulta = 'INSERT INTO centro_operaciones_inicio (nombre_trabajador, turno, hora_inicio) VALUES (?, ?, ?)';
    pool.query(consulta, [nombre, turno, fechaHoraActual], (error, results) => {
        if (error) {
            console.error('Error al guardar la hora de inicio en la base de datos:', error);
            res.status(500).send('Error al iniciar el turno. Por favor, inténtalo de nuevo.');
            return;
        }
        console.log(`Empleado ${nombre} ha iniciado el turno (${turno}) a las ${fechaHoraActual}.`);
        res.render('centro_operaciones/tareas_diarias', { fechaActual: fechaHoraActual, nombre: nombre, turno: turno });
    });
});

app.get('/centro_operaciones/tareas_diarias', (req, res) => {
    const fechaActual = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
    res.render('centro_operaciones/tareas_diarias', { fechaActual, title: 'Tareas Diarias' });
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
    pool.query(sql, tarea, (err, result) => {
        if (err) {
            console.error('Error al insertar tarea en la base de datos:', err.message);
            return res.status(500).send('Error al guardar la tarea');
        }
        console.log('Tarea insertada correctamente en la base de datos');
    
        // Actualizar la hora de finalización del turno
        const nombre = req.body.nombre;
        const turno = req.body.turno;
        const horaFin = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
        const updateQuery = 'UPDATE centro_operaciones_inicio SET hora_fin = ? WHERE nombre_trabajador = ? AND turno = ?';
        pool.query(updateQuery, [horaFin, nombre, turno], (updateErr, updateResult) => {
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












// Ruta para la página principal vianco
app.get("/buscar_por_fecha", (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        console.log(`El usuario ${nombreUsuario} está autenticado.`);
        req.session.nombreGuardado = nombreUsuario; // Guarda el nombre en la sesión

        const rolesString = req.session.roles;
        const roles = Array.isArray(rolesString) ? rolesString : [];
        otraFuncion(req, res); // Llama a otraFuncion para obtener el nombre de usuario



        const auxiliar = roles.includes('auxiliar');
        const ejecutivo = roles.includes('ejecutivo');
        const cordinacion = roles.includes('cordinacion');
        const callcenter = roles.includes('callcenter');
        const director = roles.includes('director');
        const gerencia = roles.includes('gerencia');
        const contabilidad = roles.includes('contabilidad');
        const soporte = roles.includes('soporte');

        res.render("operaciones/aeropuerto/recepciones_aeropuerto.hbs",{ name: req.session.name, auxiliar, ejecutivo, cordinacion, callcenter, director, gerencia, contabilidad ,soporte}); // Pasar los roles a la plantilla
    } else {
        res.redirect("/login");
    }
});
























// Ruta para procesar la búsqueda por fecha
app.post('/buscar_por_fecha', async (req, res) => {
    const { fecha } = req.body;
  
    try {
        // Consultar la base de datos por la fecha especificada
        const query = 'SELECT * FROM aeropuerto WHERE fecha = ?';
        const [rows, fields] = await pool.promise().query(query, [fecha]);
        console.log('Datos encontrados');

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












// Ruta para clientes
app.get('/formulario_cotizaciones', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;

        // Consulta a la base de datos para obtener la información de los clientes
        pool.query('SELECT * FROM clientes', (error, results) => {
            if (error) {
                console.error('Error al obtener los clientes:', error);
                res.status(500).send('Error interno del servidor');
            } else {
                // Renderiza la plantilla 'clientes.hbs' pasando los resultados de la consulta
                res.render('cotizaciones/formulario_cotizacion.hbs', { nombreUsuario,clientes: results });
            }
        });
    } else {
        res.redirect("/login");
    }
});



app.post('/cotizacion', (req, res) => {
    const cotizacionData = req.body;
    const numServicios = parseInt(cotizacionData.numServicios);

    // Si 'otro_cliente' tiene valor, asignarlo a 'cliente'
    if (cotizacionData.otro_cliente) {
        cotizacionData.cliente = cotizacionData.otro_cliente;
    }

    // Eliminar el campo numServicios y otro_cliente del objeto principal de cotización
    delete cotizacionData.numServicios;
    delete cotizacionData.otro_cliente;

    // Agregar num_servicios a cotizacionData antes de la inserción
    cotizacionData.num_servicios = numServicios;

    // Verificar si 'adicionales' está presente y agregarlo a cotizacionData
    if (cotizacionData['adicionales']) {
        cotizacionData.adicionales = cotizacionData['adicionales'];
    }

    // Insertar los datos de la cotización en la base de datos
    pool.beginTransaction(err => {
        if (err) {
            console.error('Error al iniciar la transacción:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }

        // Guardar la cotización en la tabla de cotizaciones
        pool.query('INSERT INTO cotizaciones SET ?', cotizacionData, (err, result) => {
            if (err) {
                console.error('Error al insertar la cotización en la base de datos:', err);
                res.status(500).send('Error interno del servidor');
                return;
            }

            const cotizacionId = result.insertId;

            // Crear una nueva entrada en la tabla de notificaciones
            const notificacionData = {
                cotizacion_id: cotizacionId,
                estado_lectura: 'no leído',
                fecha_creacion: new Date()
            };

            pool.query('INSERT INTO notificaciones SET ?', notificacionData, (err) => {
                if (err) {
                    console.error('Error al crear la notificación:', err);
                    res.status(500).send('Error interno del servidor');
                    return;
                }

                // Enviar una respuesta al cliente
                res.send('Cotización enviada exitosamente');
            });
        });
    });
});










// Ruta para obtener el número de notificaciones sin leer
app.get('/notificacionesSinLeer', (req, res) => {
    // Consulta SQL para contar el número de notificaciones sin leer del usuario actual
    pool.query('SELECT COUNT(*) AS count FROM notificaciones WHERE estado_lectura = ?', ['no leído'], (err, resultados) => {
        if (err) {
            console.error('Error al obtener el número de notificaciones sin leer:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }

        // Enviar el número de notificaciones sin leer al cliente
        res.json({ count: resultados[0].count });
    });
});

// Ruta para marcar todas las notificaciones como leídas
app.post('/marcarNotificacionesLeidas', (req, res) => {
    // Actualiza el estado de las notificaciones a "leído"
    pool.query('UPDATE notificaciones SET estado_lectura = ?', ['leído'], (err, result) => {
        if (err) {
            console.error('Error al marcar las notificaciones como leídas:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }

        // Envía una respuesta de éxito al cliente
        res.send('Notificaciones marcadas como leídas exitosamente');
    });
});

// Ruta para la página de búsqueda y visualización de datos
app.get('/cotizaciones_pendientes', (req, res) => {
    // Realizar la consulta a la base de datos para obtener las cotizaciones pendientes
    pool.query('SELECT id, cliente FROM cotizaciones WHERE realizada = 0', (err, rows) => {
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
    pool.query('SELECT * FROM cotizaciones WHERE id = ?', cotizacionId, (err, cotizacionRows) => {
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
app.post('/generar_plantilla', (req, res) => {
    // Extraer todos los datos de la cotización del cuerpo de la solicitud
    const cotizacionId = req.body.cotizacionId;
    const valorTotal = req.body.valorTotal;
    const subtotal = req.body.subtotal;
    const descuento = req.body.descuento;
    const adicionales = req.body.adicionales; // Aquí se obtiene el valor de adicionales
    
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
        subtotal: subtotal,
        descuento: descuento,
        adicionales: adicionales, // Aquí se incluye adicionales en el contexto
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




app.post('/marcar_realizado', (req, res) => {
    const cotizacionId = req.body.cotizacionId;
    console.log(req.body); 
    // Aquí debes implementar la lógica para marcar la cotización como realizada en tu base de datos
    // Por ejemplo, si estás utilizando MySQL puedes hacer algo como esto:
    pool.query('UPDATE cotizaciones SET realizada = 1 WHERE id = ?', cotizacionId, (err, result) => {
        if (err) {
            console.error('Error al marcar como realizado:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }
        // Redirigir a la página de cotizaciones pendientes después de marcar como realizado
        res.redirect('/cotizaciones_pendientes');
    });
});




// Ruta para manejar la solicitud POST del formulario
app.post('/cotizacion', (req, res) => {
    const formData = req.body;
    // Aquí puedes procesar los datos como desees
    console.log(formData);
    // Por ejemplo, puedes guardarlos en una base de datos, enviar un correo electrónico, etc.
    res.send('¡Datos recibidos con éxito!');
});













// Ruta para mostrar el formulario de búsqueda
app.get('/VE', (req, res) => {
    res.render('cotizaciones/ver_cotizaciones.hbs');
});

app.get('/ver_cotizaciones', (req, res) => {
    const idCotizacion = req.query.id_cotizacion;

    if (idCotizacion) {
        const sql = 'SELECT * FROM cotizaciones WHERE id = ?';
        pool.query(sql, [idCotizacion], (error, results) => {
            if (error) {
                console.error('Error al ejecutar la consulta:', error);
                res.render('error');
                return;
            }
            if (results.length > 0) {
                res.render('cotizaciones/ver_cotizaciones.hbs', { cotizacion: results[0] });
            } else {
                res.render('cotizaciones/ver_cotizaciones.hbs', { cotizacion: null });
            }
        });
    } else {
        res.redirect('/VE'); // Si no se proporciona un ID válido, redirige al formulario de búsqueda
    }
});










// Define la ruta para el endpoint '/consulta-contabilidad-todos'
app.get('/consulta-contabilidad-todos', (req, res) => {
    // Realizar la consulta a la base de datos seleccionando solo las columnas necesarias
    pool.query('SELECT placa, Nombre, tipo_documento,Cedula,Nombre_del_banco,Tipo_de_cuenta_bancaria,Numero_de_cuenta FROM contabilidad', (error, results, fields) => {
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

// Objeto para mantener las últimas ubicaciones conocidas de los usuarios
let lastKnownLocations = {};

/// Cuando se conecta el socket, solicitar las últimas ubicaciones conocidas
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    // Consultar la base de datos para obtener todas las ubicaciones almacenadas
    const query = 'SELECT * FROM ubicaciones';
    pool.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener las ubicaciones de MySQL:', error);
            return;
        }
        // Crear un objeto para almacenar las ubicaciones
        let locations = {};
        // Iterar sobre los resultados y almacenar las ubicaciones en el objeto
        results.forEach(row => {
            locations[row.nombre_usuario] = { lat: row.latitud, lng: row.longitud, time: row.hora };
        });
        // Emitir las ubicaciones al cliente recién conectado
        socket.emit('userLocations', locations);
    });

// Manejar la solicitud de selección de usuario
socket.on('selectUser', ({ username }) => {
    // Consultar la base de datos para obtener los movimientos del usuario seleccionado
    const query = `SELECT * FROM ubicaciones WHERE nombre_usuario = '${username}'`;
    pool.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener los movimientos de MySQL:', error);
            return;
        }
        // Emitir los movimientos al cliente que solicitó
        socket.emit('userMovements', results);
    });
});


   // Emitir las últimas ubicaciones conocidas al cliente recién conectado
   socket.emit('userLocations', lastKnownLocations);
   
   socket.on('location', (data) => {
    // Actualizar la última ubicación conocida del usuario
    lastKnownLocations[data.username] = { lat: data.lat, lng: data.lng, time: data.time, date: data.date };

    // Insertar la ubicación, la fecha y el nombre de usuario en la tabla de ubicaciones
    const query = 'INSERT INTO ubicaciones (latitud, longitud, nombre_usuario, hora, fecha) VALUES (?, ?, ?, ?, ?)';
    pool.query(query, [data.lat, data.lng, data.username, data.time, data.date], (error, results) => {
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
        // No necesitamos eliminar la última ubicación conocida del usuario
    });
});






// Ruta para clientes
app.get('/clientess', (req, res) => {
    // Consulta a la base de datos para obtener la información de los clientes
    pool.query('SELECT * FROM clientes', (error, results) => {
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
    const { nombre, contratante, N_contrato, nit, rut, camara_comercio, cumpleaños, direccion ,responsable,celular,cedula,objeto,fecha_inicio,fecha_final,destino,correoacta} = req.body;

    console.log('Datos recibidos para actualizar:', req.body); // Agregado para depuración

    pool.query(
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
                clienteActual.correoacta !== correoacta ||


                
                clienteActual.direccion !== direccion

                

                
                
            ) {
                pool.query(
                    'UPDATE clientes SET contratante = ?, N_contrato = ?, nit = ?, rut = ?, camara_comercio = ?, cumpleaños = ?, direccion = ? , correoacta = ?  ,responsable = ? , celular = ?,cedula = ?,objeto = ?,fecha_inicio = ?,fecha_final = ?,destino = ? WHERE nombre = ?', 
                    [contratante, N_contrato, nit, rut, camara_comercio, cumpleaños, direccion,correoacta,responsable,celular,cedula, objeto,fecha_inicio,fecha_final,destino,nombre], 
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




// Ruta para mostrar el formulario de búsqueda
app.get('/nuevo_cliente', (req, res) => {
    res.render('clientes/agregar_clientes.hbs');
});


// Manejador de ruta para procesar el formulario y agregar un nuevo cliente a la base de datos
app.post('/agregar-cliente',(req, res) => {
    const formData = req.body; // Capturar los datos del formulario

    pool.query(
      `INSERT INTO clientes (nombre, rut, camara_comercio, cumpleaños, N_contrato, contratante, nit, direccion,correoacta, responsable, celular, cedula, objeto, fecha_inicio, fecha_final, destino) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        formData.nombre,
        formData.rut,
        formData.camara_comercio,
        formData.cumpleaños,
        formData.N_contrato,
        formData.contratante,
        formData.nit,
        formData.direccion,
        formData.correoacta,


        
        formData.responsable,
        formData.celular,
        formData.cedula,
        formData.objeto,
        formData.fecha_inicio,
        formData.fecha_final,
        formData.destino,

      ],
      (error, results) => {
        if (error) {
          console.error('Error al agregar el cliente:', error);
          res.status(500).send('Error al agregar el cliente');
          return;
        }
        console.log('Cliente agregado correctamente a la base de datos');
        // Redirigir al usuario de vuelta a la página de consulta de clientes
        res.redirect(`/clientess`);
      }
    );
  });






























//app.get('/vehiculos_Novencidos', (req, res) => {
  //  const fechaActual = new Date().toLocaleDateString('en-GB'); // Obtener la fecha actual en formato DD/MM/YYYY
  //  const consultaVehiculos = `
    //    SELECT placa 
    //    FROM vehiculos 
    //    WHERE STR_TO_DATE(Fecha_vigencia_soat, '%d/%m/%Y') >= STR_TO_DATE(?, '%d/%m/%Y')
      //      AND STR_TO_DATE(Fecha_vigencia, '%d/%m/%Y') >= STR_TO_DATE(?, '%d/%m/%Y')
     //       AND STR_TO_DATE(Vigencia_polizas, '%d/%m/%Y') >= STR_TO_DATE(?, '%d/%m/%Y')
      //      AND STR_TO_DATE(Fecha_final_operacion, '%d/%m/%Y') >= STR_TO_DATE(?, '%d/%m/%Y')
        //    AND STR_TO_DATE(Fecha_final_preventiva_1, '%d/%m/%Y') >= STR_TO_DATE(?, '%d/%m/%Y')
        //    AND STR_TO_DATE(fecha_vigencia_convenio, '%d/%m/%Y') >= STR_TO_DATE(?, '%d/%m/%Y');
 //   `;
  //  const params = [fechaActual, fechaActual, fechaActual, fechaActual, fechaActual, fechaActual];
    
 //   pool.query(consultaVehiculos, params, (error, resultados) => {
   //     if (error) {
  //          console.error('Error al obtener vehículos:', error);
   ////         res.status(500).json({ error: 'Error al obtener vehículos' });
    //        return;
   //     }
   //     res.json(resultados);
  //  });
//})





const hbs = require('handlebars'); // Importa Handlebars

const { JSDOM } = require('jsdom');
const qrcode = require('qrcode');


// Ruta para renderizar la página de selección de cliente y placa
app.get('/seleccionar', (req, res) => {
    res.render('clientes/fuec.hbs');
});


app.get('/vehiculos_vencidos', (req, res) => {
    const consultaVehiculos = `
      SELECT placa 
      FROM vehiculos;
    `;
      
    pool.query(consultaVehiculos, (error, resultados) => {
      if (error) {
        console.error('Error al obtener vehículos:', error);
        res.status(500).json({ error: 'Error al obtener vehículos' });
        return;
      }
      res.json(resultados);
    });
});










// Ruta para obtener todas las placas de vehículos disponibles
app.get('/vehiculoos', (req, res) => {
    const consultaVehiculos = 'SELECT placa FROM vehiculos';
    pool.query(consultaVehiculos, (error, resultados) => {
        if (error) {
            console.error('Error al obtener vehículos:', error);
            res.status(500).json({ error: 'Error al obtener vehículos' });
            return;
        }
        res.json(resultados);
    });
});


  // Obtener el último consecutivo al iniciar la aplicación
  pool.query('SELECT valor FROM consecutivos ORDER BY id DESC LIMIT 1', (err, rows) => {
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
    pool.query(consultaConductores, (error, resultados) => {
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
    pool.query(consultaClientes, (error, resultados) => {
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



// Ruta para obtener el primer conductor asociado a una placa
app.get('/primer-conductor/:placa', (req, res) => {
    const placa = req.params.placa;
    const consultaPrimerConductor = 'SELECT id, conductor FROM conductores WHERE placa = ? LIMIT 1';
    pool.query(consultaPrimerConductor, [placa], (error, resultado) => {
        if (error) {
            console.error('Error al obtener el primer conductor:', error);
            res.status(500).json({ error: 'Error al obtener el primer conductor' });
            return;
        }
        if (resultado.length > 0) {
            res.json(resultado[0]);
        } else {
            res.status(404).json({ error: 'No se encontró conductor para la placa proporcionada' });
        }
    });
});




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
        pool.query('SELECT valor FROM consecutivos ORDER BY id DESC LIMIT 1', (err, rows) => {
            if (err) {
                console.error('Error al obtener el último consecutivo:', err);
                res.status(500).json({ error: 'Error al obtener el último consecutivo' });
                return;
            }

            let ultimoConsecutivo = 1; // Valor predeterminado si no se encuentra en la base de datos
            if (rows.length > 0) {
                ultimoConsecutivo = rows[0].valor + 1; // Incrementa el último consecutivo obtenido
            }



            
            // Actualizar el último consecutivo en la base de datos
            pool.query(`INSERT INTO consecutivos (valor) VALUES (${ultimoConsecutivo})`, (err, result) => {
                if (err) {
                    console.error('Error al actualizar el último consecutivo en la base de datos:', err);
                    res.status(500).json({ error: 'Error al actualizar el último consecutivo en la base de datos' });
                    return;
                }

                // Generar el número FUEC con el formato específico
                const numeroFUEC = `4250427192024${N_contrato}${ultimoConsecutivo}`;

                pool.query('SELECT responsable, objeto FROM clientes WHERE nombre = ?', [nombreCliente], (err, result) => {
                    if (err) {
                        console.error('Error al obtener el responsable y objeto del cliente:', err);
                        res.status(500).json({ error: 'Error al obtener el responsable y objeto del cliente' });
                        return;
                    }
                
                    if (result.length === 0) {
                        res.status(404).json({ error: 'Cliente no encontrado' });
                        return;
                    }
                
                    const { responsable, objeto } = result[0];







                    pool.query('SELECT id, conductor FROM conductores WHERE id IN (?)', [conductoresIds], (err, rows) => {
    if (err) {
        console.error('Error al obtener los nombres de los conductores:', err);
        res.status(500).json({ error: 'Error al obtener los nombres de los conductores' });
        return;
    }

    // Mapea los resultados para obtener un objeto de ID->Nombre de conductor
    const conductorNamesMap = {};
    rows.forEach(row => {
        conductorNamesMap[row.id] = row.conductor;
    });

    // Utiliza el mapa de nombres de conductores para reemplazar los IDs con los nombres en fuec_data
    const nombreConductor1 = conductorNamesMap[idConductor1];
    const nombreConductor2 = idConductor2 ? conductorNamesMap[idConductor2] : null;
    const nombreConductor3 = idConductor3 ? conductorNamesMap[idConductor3] : null;

    // Ahora, puedes usar los nombres de los conductores para guardar en fuec_data en lugar de los IDs
    pool.query(`INSERT INTO fuec_data (nombre_cliente, placa, id_conductor1, id_conductor2, id_conductor3, N_contrato, contratante, fecha_inicio, fecha_final, qr_code_url, numero_fuec, responsable, objeto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [nombreCliente, placa, nombreConductor1, nombreConductor2, nombreConductor3, N_contrato, contratante, fecha_inicio, fecha_final, qrDataURL, numeroFUEC, responsable, objeto], (err, result) => {
        if (err) {
            console.error('Error al guardar los datos en la base de datos:', err);
            res.status(500).json({ error: 'Error al guardar los datos en la base de datos' });
            return;
        }
    });
});


                // Continuar con la lógica para obtener los datos del cliente, vehículo y conductores seleccionados
                const consultaCliente = `
                    SELECT contratante, nit, N_contrato, objeto, direccion, responsable, cedula, celular, fecha_inicio, fecha_final,destino 
                    FROM clientes 
                    WHERE nombre = '${nombreCliente}'`;

                    pool.query(consultaCliente, (errorCliente, resultadosCliente) => {
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
                        SELECT placa, Modelo, Marca, Clase_vehiculo, No_movil, Afiliado_a,Num_tarjeta_operacion
                        FROM vehiculos 
                        WHERE placa = '${placa}'`;

                        pool.query(consultaVehiculo, (errorVehiculo, resultadosVehiculo) => {
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
                            
                                pool.query(consultaConductorUnico, (errorConductor, resultadoConductor) => {
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
                                            Afiliado_a: vehiculo.Afiliado_a,
                                            Num_tarjeta_operacion: vehiculo.Num_tarjeta_operacion
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

                                pool.query(consultaConductores, (errorConductores, resultadosConductores) => {
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
                                            Afiliado_a: vehiculo.Afiliado_a,
                                            Num_tarjeta_operacion: vehiculo.Num_tarjeta_operacion
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







// Ruta para mostrar el formulario de búsqueda
app.get('/dat', (req, res) => {
    res.render('operaciones/fuec/ver_fuec.hbs');
});

// Ruta para manejar la búsqueda
app.get('/buscar', (req, res) => {
    const numeroFuec = req.query.numero_fuec;
    if (!numeroFuec) {
        res.redirect('/dat'); // Redirige de vuelta al formulario si no se proporciona un número_fuec
        return;
    }

    const sql = `SELECT * FROM fuec_data WHERE numero_fuec = ?`;
    pool.query(sql, [numeroFuec], (err, resultados) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            res.render('error');
            return;
        }
        res.render('operaciones/fuec/ver_fuec.hbs', { resultados }); // Renderiza la misma plantilla con los resultados de la búsqueda
    });
});







app.get('/userMovements/:username', (req, res) => {
    const username = req.params.username;
    const query = `SELECT latitud, longitud FROM ubicaciones WHERE nombre_usuario = ?`;
    pool.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            res.status(500).json({ error: 'Error al consultar la base de datos' });
            return;
        }
        res.json(results);
    });
});











// Define una ruta para obtener la lista de usuarios
app.get('/usuarios', function(req, res) {
    pool.query('SELECT DISTINCT nombre_usuario FROM ubicaciones', function(error, results, fields) {
        if (error) throw error;
        res.json(results);
    });
});

// Define una ruta para obtener las ubicaciones de un usuario específico para una fecha específica
app.get('/ubicaciones/:nombreUsuario', function(req, res) {
    const nombreUsuario = req.params.nombreUsuario;
    const fechaSeleccionada = req.query.date; // Obtener la fecha seleccionada desde la consulta

    // Construir la consulta SQL para filtrar por usuario y fecha si se proporciona
    let query = 'SELECT * FROM ubicaciones WHERE nombre_usuario = ?';
    let params = [nombreUsuario];
    if (fechaSeleccionada) {
        query += ' AND DATE(created_at) = ?'; // Filtrar por la fecha seleccionada
        params.push(fechaSeleccionada);
    }

    pool.query(query, params, function(error, results, fields) {
        if (error) throw error;
        res.json(results);
    });
});










// Ruta para mostrar ubicaciones
app.get('/ver_ubicaiones', (req, res) => {
    res.render('operaciones/geolocalizacion/ver_ubicaciones.hbs');
});
app.post('/guardar_datos', (req, res) => {
    const cotizacionId = req.body.cotizacionId;
    const valorTotal = req.body.valorTotal;
    const subtotal = req.body.subtotal;
    const descuento = req.body.descuento;
    const servicios = req.body.servicios;

    // Actualizar la tabla de cotizaciones con el nuevo subtotal, descuento y valor total
    pool.query('UPDATE cotizaciones SET subtotal = ?, descuento = ?, valor_total = ? WHERE id = ?', [subtotal, descuento, valorTotal, cotizacionId], function(err, result) {
        if (err) {
            console.error('Error al actualizar valores:', err);
            return res.status(500).json({ error: 'Error al actualizar valores' });
        }

        // Recorrer los servicios y actualizar la tabla de cotizaciones
        servicios.slice(0, 5).forEach((servicio, index) => { // Solo procesar los primeros 5 servicios
            if (!servicio) return; // Omitir servicios nulos
            const valorColumn = `valor_${index + 1}`;
            const observacionesColumn = `observaciones_${index + 1}`;

            pool.query(`UPDATE cotizaciones SET ${valorColumn} = ?, ${observacionesColumn} = ? WHERE id = ?`, [servicio.valor, servicio.observaciones, cotizacionId], function(err, result) {
                if (err) {
                    console.error(`Error al actualizar servicio ${index + 1}:`, err);
                    return res.status(500).json({ error: `Error al actualizar servicio ${index + 1}` });
                }
            });
        });

        // Enviar una respuesta al cliente cuando todas las actualizaciones se completen con éxito
        return res.status(200).json({ success: true });
    });
});


// Ruta para mostrar ubicaciones
app.get('/ver_notificaciones', (req, res) => {
    res.render('operaciones/notificaciones/ver_ubicaciones.hbs');
});














//producto no conforme  novedades que cualquiera puede hacer 




app.get('/novedades_viancoo', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        res.render('novedades_vianco/novedades_vianco.hbs', { nombreUsuario });
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});







app.post('/novedades_vianco', (req, res) => {
    const fecha = req.body.fecha;
    const realiza = req.body.realiza;
    const novedad_tripulacion = req.body.novedad_tripulacion || '';
    const novedad_hoteleria = req.body.novedad_hoteleria || '';
    const novedad_ejecutivos = req.body.novedad_ejecutivos || '';
    const novedad_empresas_privadas = req.body.novedad_empresasPrivadas || '';
    const NOVEDADES_TASKGO = req.body.novedad_NOVEDADES_TASKGO || '';
    const otrasNovedades = req.body.novedad_OTRAS || '';
    const firmaBase64 = req.body.firmaBase64 || ''; // Corregido aquí
    console.log("Firma en formato base64 recibida:", firmaBase64);

    const sql = 'INSERT INTO novedades_vianco (fecha_registro, fecha, realiza, novedad_tripulacion, novedad_hoteleria, novedad_ejecutivos, novedad_empresas_privadas, NOVEDADES_TASKGO, otras_novedades, firma) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)'; // Corregido aquí

    pool.query(sql, [fecha, realiza, novedad_tripulacion, novedad_hoteleria, novedad_ejecutivos, novedad_empresas_privadas, NOVEDADES_TASKGO,  otrasNovedades, firmaBase64], (error, results, fields) => {
        if (error) {
            console.error('Error al insertar la novedad en la base de datos:', error);
            res.status(500).send('Error interno del servidor.');
        } else {
            console.log('Novedad guardada exitosamente en la base de datos.');

            // Enviar correo electrónico utilizando la nueva función
            enviarCorreoNOVEDADD('calidadvianco@gmail.com', 'Alerta de nueva servicio no confirme Vianco', `
                <p><strong>Estimados,</strong></p>
                <br>
                <p>Me complace informarles que se ha agregado una nueva novedad al sistema de nuestro equipo de centro de operaciones. Esta actualización refleja nuestro continuo compromiso con la eficiencia y la excelencia en nuestro trabajo diario.</p>
                <br>
                <p>Recuerden realizar el seguimiento en la aplicación en el módulo de novedades pendientes.</p>
            `);

            const alertScript = '<script>alert("Novedad enviada con éxito"); window.location.href = "/novedades_viancoo";</script>';
            res.send(alertScript);
        }
    });
});

function enviarCorreoNOVEDADD(destinatario, asunto, contenido) {
    // Configurar el transporte del correo electrónico
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'soporte.it.vianco@gmail.com', // Tu correo electrónico
            pass: 'iifjwgvmeujfiqhx' // Tu contraseña
        }
    });

    // Texto más formal del correo electrónico
    const contenidoFormal = `Estimado/a [Nombre del Usuario],

    Me complace informarles que se ha agregado una nuebo servicio no conforme  al sistema de nuestro equipo de centro de operaciones. Esta actualización refleja nuestro continuo compromiso con la eficiencia y la excelencia en nuestro trabajo diario.
Atentamente,

Equipo de Soporte de Vianco`;
// Configurar el correo electrónico
const mailOptions = {
    from: 'soporte.it.vianco@gmail.com', // Dirección de correo electrónico del remitente
    to: 'calidadvianco@gmail.com', // Dirección de correo electrónico del destinatario (siempre el mismo)
    subject: asunto, // Asunto del correo electrónico
    html: contenidoFormal // Contenido del correo electrónico (en formato HTML)
};

    
    // Enviar el correo electrónico
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Correo electrónico enviado: ' + info.response);
        }
    });
}















app.get('/ver_novedades_vianco', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        res.render('novedades_vianco/novedades_pendientes_vianco.hbs', { nombreUsuario });
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});







app.get('/api/obtener_fechas_disponibles_vianco', (req, res) => {
    const nombreUsuario = req.session.name; // Obtener el nombre de usuario de la sesión
    const query = 'SELECT DISTINCT id FROM novedades_vianco WHERE responsable_asignado = ?';

    pool.query(query, [nombreUsuario], (error, results) => {
        if (error) {
            console.error('Error al obtener las IDs disponibles:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        } else {
            const idsDisponibles = results.map(result => result.id);
            res.json(idsDisponibles);
        }
    });
});


app.get('/api/obtener_novedades_vianco/:id', (req, res) => {
    const id = req.params.id;
    const nombreUsuario = req.session.name; // Obtener el nombre de usuario de la sesión
    const query = 'SELECT id, fecha, realiza, novedad_tripulacion, novedad_hoteleria, novedad_ejecutivos, novedad_empresas_privadas, NOVEDADES_TASKGO, otras_novedades, firma, fecha_registro, responsable_asignado FROM novedades_vianco WHERE id = ? AND responsable_asignado = ?';

    pool.query(query, [id, nombreUsuario], (error, results) => {
        if (error) {
            console.error('Error al obtener las novedades:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        } else {
            results.forEach(row => {
                if (row.firma) {
                    const firmaBase64 = row.firma;
                    const firmaBinaria = Buffer.from(firmaBase64, 'base64');
                    row.firmaBinaria = firmaBinaria;
                }
            });
            res.json(results);
        }
    });
});


// Backend (Endpoint /api/eliminar_novedad)
app.delete('/api/eliminar_novedad_vianco/:id', (req, res) => {
    const id = req.params.id;
    pool.query('DELETE FROM novedades_vianco WHERE id = ?', id, (error, results) => {
        if (error) {
            console.error('Error al eliminar la novedad:', error);
            res.status(500).json({ error: 'Error interno del servidor' }); // Devuelve un JSON con el error
        } else {
            res.json({ message: 'Novedad eliminada correctamente' });
        }
    });
});


app.post('/api/guardar_seguimiento_vianco', (req, res) => {
    // Obtener los datos del cuerpo de la solicitud
    const { nombreSeguimiento, detalleSeguimiento, novedadestripulacion, fechaseguimiento, realiza, fecha, novedad_hoteleria, fecha_registro, novedad_ejecutivos, novedad_empresas_privadas, NOVEDADES_TASKGO, otras_novedades, firma, ACCIONES, numeroU, Plazo } = req.body;

    // Query para insertar el seguimiento en la base de datos
    const query = 'INSERT INTO novedades_completadas_vianco (nombre_seguimiento, detalle_seguimiento, novedad_tripulacion, fechaseguimiento, realiza, fecha_novedad, novedad_hoteleria, fecha_registro, novedad_ejecutivos, novedad_empresas_privadas, NOVEDADES_TASKGO, otras_novedades, firma, ACCIONES, numeroU, Plazo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    
    const values = [nombreSeguimiento, detalleSeguimiento, novedadestripulacion, fechaseguimiento, realiza, fecha, novedad_hoteleria, fecha_registro, novedad_ejecutivos, novedad_empresas_privadas, NOVEDADES_TASKGO, otras_novedades, firma, ACCIONES, numeroU, Plazo];

    // Ejecutar la consulta SQL
    pool.query(query, values, (error, results, fields) => {
        if (error) {
            console.error('Error al guardar el seguimiento en la base de datos:', error);
            res.status(500).json({ error: 'Error al guardar el seguimiento en la base de datos' });
        } else {
            console.log('Seguimiento guardado correctamente en la base de datos');
            res.status(200).json({ message: 'Seguimiento guardado correctamente' });
        }
    });
});








// Endpoint para eliminar una fecha por su ID
app.delete('/api/eliminar_fecha_vianco/:id', (req, res) => {
    const id = req.params.id;
    pool.query('DELETE FROM novedades_vianco WHERE id = ?', id, (error, results) => {
        if (error) {
            console.error('Error al eliminar la fecha:', error);
            res.status(500).json({ error: 'Error interno del servidor' }); // Devuelve un JSON con el error
        } else {
            res.json({ message: 'Fecha eliminada correctamente' });
        }
    });
});












app.get('/ver_vianco', (req, res) => {
    res.render('novedades_vianco/ver_novedades_vianco.hbs');

});


app.get('/novedad_vianco', (req, res) => {
    const { id, fechaInicio, fechaFin, keyword, pendiente, filtroNovedades } = req.query;

    let sql = '';
    let params = [];

    if (pendiente === "true") { 
        // SQL for pending novedades
        sql = `
            SELECT 
                id, 
                fecha, 
                realiza, 
                novedad_tripulacion, 
                novedad_hoteleria, 
                novedad_ejecutivos, 
                novedad_empresas_privadas, 
                NOVEDADES_TASKGO, 
                otras_novedades, 
                fecha_registro, 
                firma,
                NULL AS nombre_seguimiento, 
                NULL AS detalle_seguimiento, 
                NULL AS fecha_seguimiento, 
                NULL AS fecha_registro_seguimiento, 
                NULL AS ACCIONES,
                NULL AS estado,
                NULL AS numeroU
            FROM novedades_vianco
            WHERE 1=1
        `;
        if (id) {
            sql += " AND id LIKE ?";
            params.push(`%${id}%`);
        }
        if (fechaInicio) {
            sql += " AND fecha >= ?";
            params.push(fechaInicio);
        }
        if (fechaFin) {
            sql += " AND fecha <= ?";
            params.push(fechaFin);
        }
    } else if (pendiente === "nuevas") { 
        // SQL for new novedades
        sql = `
        SELECT 
            id, 
            fecha, 
            realiza, 
            novedad_tripulacion, 
            novedad_hoteleria, 
            novedad_ejecutivos, 
            novedad_empresas_privadas, 
            NOVEDADES_TASKGO, 
            otras_novedades, 
            fecha_registro, 
            firma
        FROM novedades_vianco
        WHERE responsable_asignado IS NULL
    `;
    
        if (id) {
            sql += " AND numeroU LIKE ?";
            params.push(`%${id}%`);
        }
        if (fechaInicio) {
            sql += " AND fecha_novedad >= ?";
            params.push(fechaInicio);
        }
        if (fechaFin) {
            sql += " AND fecha_novedad <= ?";
            params.push(fechaFin);
        }
    } else if (pendiente === "asignadas") {
        // SQL for assigned novedades
        sql = `
        SELECT 
            id, 
            fecha, 
            realiza, 
            novedad_tripulacion, 
            novedad_hoteleria, 
            novedad_ejecutivos, 
            novedad_empresas_privadas, 
            NOVEDADES_TASKGO, 
            otras_novedades, 
            fecha_registro, 
            firma,
            responsable_asignado
        FROM novedades_vianco
        WHERE responsable_asignado IS NOT NULL
    `;
        if (id) {
            sql += " AND numeroU LIKE ?";
            params.push(`%${id}%`);
        }
        if (fechaInicio) {
            sql += " AND fecha_novedad >= ?";
            params.push(fechaInicio);
        }
        if (fechaFin) {
            sql += " AND fecha_novedad <= ?";
            params.push(fechaFin);
        }
    } else if (pendiente === "proceso") {
        // SQL for novedades in process
        sql = `
        SELECT 
            id, 
            numeroU,
            fecha_novedad, 
            realiza, 
            novedad_tripulacion, 
            novedad_hoteleria, 
            novedad_ejecutivos, 
            novedad_empresas_privadas, 
            NOVEDADES_TASKGO, 
            otras_novedades, 
            fecha_registro, 
            firma,
            nombre_seguimiento,
            fecha_seguimiento,
            fecha_registro,
            detalle_seguimiento,
            ACCIONES,
            Plazo,
            aceptadas
        FROM novedades_completadas_vianco
        WHERE aceptadas IS NULL
    `;
        if (id) {
            sql += " AND numeroU LIKE ?";
            params.push(`%${id}%`);
        }
        if (fechaInicio) {
            sql += " AND fecha_novedad >= ?";
            params.push(fechaInicio);
        }
        if (fechaFin) {
            sql += " AND fecha_novedad <= ?";
            params.push(fechaFin);
        }
    } else if (pendiente === "aceptadas") {
        // SQL for accepted novedades
        sql = `
            SELECT       
            id, 
            numeroU,
            fecha_novedad, 
            realiza, 
            novedad_tripulacion, 
            novedad_hoteleria, 
            novedad_ejecutivos, 
            novedad_empresas_privadas, 
            NOVEDADES_TASKGO, 
            otras_novedades, 
            fecha_registro, 
            firma,
            nombre_seguimiento,
            fecha_seguimiento,
            fecha_registro,
            detalle_seguimiento,
            ACCIONES,
            Plazo,
            aceptadas
            FROM novedades_completadas_vianco 
            WHERE aceptadas = 1
        `;
    
    } else { 
        // SQL for all novedades
        sql = `
        SELECT 
        id, 
        numeroU,
        fecha_novedad, 
        realiza, 
        novedad_tripulacion, 
        novedad_hoteleria, 
        novedad_ejecutivos, 
        novedad_empresas_privadas, 
        NOVEDADES_TASKGO, 
        otras_novedades, 
        fecha_registro, 
        firma,
        nombre_seguimiento,
        fecha_seguimiento,
        fecha_registro,
        detalle_seguimiento,
        ACCIONES,
        Plazo,
        aceptadas
    FROM novedades_completadas_vianco
    WHERE 1=1
        `;
        if (id) {
            sql += " AND id LIKE ?";
            params.push(`%${id}%`);
        }
        if (fechaInicio) {
            sql += " AND fecha >= ?";
            params.push(fechaInicio);
        }
        if (fechaFin) {
            sql += " AND fecha <= ?";
            params.push(fechaFin);
        }
        sql += `
            UNION ALL 
            SELECT 
                id, 
                fecha_novedad AS fecha, 
                realiza, 
                novedad_tripulacion, 
                novedad_hoteleria, 
                novedad_ejecutivos, 
                novedad_empresas_privadas, 
                NOVEDADES_TASKGO, 
                otras_novedades, 
                fecha_registro, 
                firma, 
                nombre_seguimiento, 
                detalle_seguimiento, 
                fecha_seguimiento, 
                fecha_registro AS fecha_registro_seguimiento, 
                ACCIONES,
                NULL AS estado,
                numeroU
            FROM novedades_completadas_vianco
            WHERE 1=1
        `;
        if (id) {
            sql += " AND numeroU LIKE ?";
            params.push(`%${id}%`);
        }
        if (fechaInicio) {
            sql += " AND fecha_novedad >= ?";
            params.push(fechaInicio);
        }
        if (fechaFin) {
            sql += " AND fecha_novedad <= ?";
            params.push(fechaFin);
        }
    }
    
    if (keyword) {
        sql += " AND (novedad_tripulacion LIKE ? OR novedad_hoteleria LIKE ? OR novedad_ejecutivos LIKE ? OR novedad_empresas_privadas LIKE ? OR otras_novedades LIKE ?)";
        const keywordParam = `%${keyword}%`;
        params.push(keywordParam, keywordParam, keywordParam, keywordParam, keywordParam);
    }
    
    if (filtroNovedades && filtroNovedades.length > 0) {
        sql += " AND (";
        filtroNovedades.forEach((filtro, index) => {
            if (index > 0) sql += " OR ";
            sql += `${filtro} = 1`;
        });
        sql += ")";
    }
    
    pool.query(sql, params, (err, result) => {
        if (err) {
            console.error("Error al obtener las novedades:", err);
            res.status(500).json({ error: "Error al obtener las novedades de la base de datos" });
        } else {
            res.status(200).json(result);
        }
    });
});



app.post('/descargar_excell', (req, res) => {
    const { fechaInicio, fechaFin } = req.body;
    let sql = "SELECT * FROM novedades_completadas_vianco WHERE 1=1";
    let params = [];

    if (fechaInicio) {
        sql += " AND fecha_novedad >= ?";
        params.push(fechaInicio);
    }
    if (fechaFin) {
        sql += " AND fecha_novedad <= ?";
        params.push(fechaFin);
    }

    pool.query(sql, params, (err, result) => {
        if (err) {
            console.error("Error al obtener las novedades:", err);
            res.status(500).json({ error: "Error al obtener las novedades de la base de datos" });
        } else {
            // Aquí se debería generar el archivo Excel con los datos obtenidos
            const workbook = createExcelWorkbook(result); // Función hipotética para crear el archivo Excel
            res.setHeader('Content-Disposition', 'attachment; filename="informe.xlsx"');
            workbook.xlsx.write(res).then(() => {
                res.end();
            });
        }
    });
});

function createExcelWorkbook(data) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Novedades');

    sheet.columns = [
        { header: 'ID', key: 'id' },
        { header: 'Fecha Novedad', key: 'fecha_novedad' },
        { header: 'Realiza', key: 'realiza' },
        // Añadir más columnas según los datos que tengas
    ];

    data.forEach(item => {
        sheet.addRow(item);
    });

    return workbook;
}







const XLSX = require('xlsx');

const workbook = require('workbook');



// Ruta para descargar el informe en Excel
app.post('/descargar_excell', (req, res) => {
    // Obtener las fechas de inicio y fin del cuerpo de la solicitud
    const { fechaInicio, fechaFin } = req.body;

    // Consulta las novedades dentro del rango de fechas especificado
    const sql = `SELECT * FROM novedades_completadas_vianco WHERE fecha_novedad BETWEEN '${fechaInicio}' AND '${fechaFin}'`;

    pool.query(sql, (err, result) => {
        if (err) {
            console.error("Error al obtener las novedades:", err);
            res.status(500).json({ error: "Error al obtener las novedades de la base de datos" });
        } else {
            // Genera el archivo Excel con las novedades
            const workbook = generarInformeExcel(result);

            // Convierte el workbook a buffer y envíalo como descarga
            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Disposition', `attachment; filename="informe.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(excelBuffer);
        }
    });
});


function generarInformeExcel(novedades) {
    // Mapear los resultados de la consulta SQL y cambiar los títulos de las columnas
    const novedadesFormateadas = novedades.map(novedad => ({
        // Cambiar los nombres de las propiedades según sea necesario
        'Fecha del servicio no conforme': novedad.fecha_novedad,
        'Realizada por': novedad.realiza,
        'Novedad de Tripulación': novedad.novedad_tripulacion,
        'Novedad de Hotelería': novedad.novedad_hoteleria,
        'Novedad de Ejecutivos': novedad.novedad_ejecutivos,
        'Novedad de Empresas Privadas': novedad.novedad_empresas_privadas,
        'NOVEDADES_TASKGO': novedad.NOVEDADES_TASKGO,
        'Otras novedades': novedad.otras_novedades,
        'Fecha de seguimiento': novedad.fecha_seguimiento,
        'Nombre de seguimiento': novedad.nombre_seguimiento,
        'Detalle de seguimiento': novedad.detalle_seguimiento,
        'Fecha de registro': novedad.fecha_registro,
        'Acciones correctivas': novedad.ACCIONES
    }));

    // Crear el workbook y la hoja de cálculo
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(novedadesFormateadas);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Novedades');

    return workbook;
}











app.get('/inspeccion', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        res.render('Inspección/Inspección_form.hbs', { nombreUsuario });
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});

// Ruta para obtener la lista de bases
app.get('/obtenerBases', (req, res) => {
    pool.query('SELECT DISTINCT base FROM vehiculos', (error, results) => {
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
app.get('/inspeccion_vianco', (req, res) => {
    const baseSeleccionada = req.query.base;
    pool.query('SELECT placa FROM vehiculos WHERE base = ?', [baseSeleccionada], (error, results) => {
        if (error) {
            console.error('Error al obtener las placas:', error);
            res.status(500).json({ error: 'Error al obtener las placas' });
            return;
        }
        const placas = results.map(result => result.placa);
        res.json(placas);
    });
});


app.post('/guardar-inspeccion', (req, res) => {
    const formData = req.body;
    const nombreUsuario = req.session.name; // Obtener el nombre de usuario de la sesión

    // Agregar el nombre de usuario al objeto formData
    formData.responsable = nombreUsuario;

    // Insertar los datos en la base de datos
    pool.query('INSERT INTO inspeccion_2_0 SET ?', formData, (err, result) => {
        if (err) {
            console.error('Error al guardar los datos:', err);
            res.status(500).send('Error interno del servidor.');
            return;
        }
        console.log('Datos guardados correctamente.');
        // Enviar mensaje de éxito y redireccionar al mismo formulario
        res.render('Inspección/Inspección_form.hbs', { message: 'Enviado exitosamente.' });
    });
});














// Ruta para renderizar el formulario de consulta
app.get('/consulta_inspeccion', async (req, res) => {
    try {
        // Consultar la base de datos para obtener las placas y bases disponibles desde la tabla de vehículos
        const placasQuery = 'SELECT DISTINCT placa FROM vehiculos';
        const basesQuery = 'SELECT DISTINCT base FROM vehiculos';
        
        const [placasRows, placasFields] = await pool.promise().query(placasQuery);
        const [basesRows, basesFields] = await pool.promise().query(basesQuery);
        
        console.log('Placas encontradas:', placasRows);
        console.log('Bases encontradas:', basesRows);

        // Insertar "Todas" como opción adicional en las listas de placas y bases
        const placas = ['Todas', ...placasRows.map(row => row.placa)];
        const bases = ['Todas', ...basesRows.map(row => row.base)];

        // Renderizar el formulario con las placas y bases disponibles
        res.render('Inspección/consulta_inspeccion.hbs', { placas, bases });
    } catch (error) {
        console.error('Error al obtener las placas y bases:', error);
        res.status(500).send('Error al obtener las placas y bases');
    }
});



app.post('/consulta_inspeccion', async (req, res) => {
    const { placa, base, fecha_inicio, fecha_fin } = req.body;
    try {
        let query, params;
        if (placa === 'Todas' && base === 'Todas') {
            // Consultar todos los resultados sin filtrar por placa ni base
            query = 'SELECT * FROM inspeccion_2_0 WHERE fecha BETWEEN ? AND ?';
            params = [fecha_inicio, fecha_fin];
        } else if (placa === 'Todas') {
            // Consultar por base y rango de fechas sin filtrar por placa
            query = 'SELECT * FROM inspeccion_2_0 WHERE base = ? AND fecha BETWEEN ? AND ?';
            params = [base, fecha_inicio, fecha_fin];
        } else if (base === 'Todas') {
            // Consultar por placa y rango de fechas sin filtrar por base
            query = 'SELECT * FROM inspeccion_2_0 WHERE placa = ? AND fecha BETWEEN ? AND ?';
            params = [placa, fecha_inicio, fecha_fin];
        } else {
            // Consultar por placa, base y rango de fechas
            query = 'SELECT * FROM inspeccion_2_0 WHERE placa = ? AND base = ? AND fecha BETWEEN ? AND ?';
            params = [placa, base, fecha_inicio, fecha_fin];
        }

        // Ejecutar la consulta
        const [rows, fields] = await pool.promise().query(query, params);
        console.log('Datos encontrados:', rows);

        // Calcular la suma y el porcentaje de cumplimiento para cada fila
        for (let row of rows) {
            let total = 0;
            let totalCumplimiento = 0;
            const campos = ['corbata_vianco', 'traje', 'presentacion_externa', 'interior_vehiculo', 'protocolo_servicio', 'AGUA', 'PAÑOS', 'CARGADOR', 'MANOS', 'aire_acondicionado', 'logo_rnt', 'logos_reservado', 'logos_vianco', 'estado_baul'];

            for (let campo of campos) {
                let valor = parseFloat(row[campo]) || 0;
                total += valor;
                totalCumplimiento += valor;
            }

            // Calcular el porcentaje de cumplimiento y redondearlo
            const porcentajeCumplimiento = Math.round((totalCumplimiento / (campos.length * 1)) * 100); // Total de campos * 1

            // Guardar la suma total y el porcentaje de cumplimiento en la fila
            row.total = total;
            row.porcentajeCumplimiento = porcentajeCumplimiento;
        }

        // Renderizar la plantilla con los resultados, la suma total y el porcentaje de cumplimiento
        res.render('Inspección/resultados_inspeccion.hbs', { resultados: rows });
    } catch (error) {
        console.error('Error en la búsqueda por fecha:', error);
        res.status(500).send('Error en la búsqueda por fecha');
    }
});


const excel = require('exceljs');

// Ruta para descargar los resultados en formato Excel
app.post('/descargar_excel_INSPECION', async (req, res) => {
    const { placa, fecha_inicio, fecha_fin } = req.body;
    try {
        let query, params;

        if (placa === 'Todas') {
            // Consultar todos los resultados sin filtrar por placa
            query = 'SELECT * FROM inspeccion_2_0 WHERE fecha BETWEEN ? AND ?';
            params = [fecha_inicio, fecha_fin];
        } else {
            // Consultar por placa y rango de fechas
            query = 'SELECT * FROM inspeccion_2_0 WHERE placa = ? AND fecha BETWEEN ? AND ?';
            params = [placa, fecha_inicio, fecha_fin];
        }

        // Ejecutar la consulta
        const [rows, fields] = await pool.promise().query(query, params);

        // Verificar si rows tiene elementos antes de continuar
        if (rows.length === 0) {
            console.log('No se encontraron datos para exportar a Excel');
            res.status(404).send('No se encontraron datos para exportar a Excel');
            return;
        }

        console.log('Datos encontrados:', rows);

        // Crear un nuevo libro de Excel
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Resultados');

        // Agregar encabezados a la hoja de cálculo
        const headers = Object.keys(rows[0]);
        worksheet.addRow(headers);

        // Agregar filas con los datos
        rows.forEach(row => {
            const values = Object.values(row);
            worksheet.addRow(values);
        });

        // Configurar la respuesta para descargar el archivo Excel
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=resultados.xlsx');

        // Enviar el libro de Excel como una respuesta
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error en la búsqueda por fecha:', error);
        res.status(500).send('Error en la búsqueda por fecha');
    }
});





app.get('/pagina-indicadores', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        res.render('Inspección/indicadores.hbs', { nombreUsuario });
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});






app.get('/placas-bajo-60', (req, res) => {
    const fechaInicio = req.query.fechaInicio; // Obtener fecha de inicio desde la solicitud
    const fechaFin = req.query.fechaFin; // Obtener fecha de fin desde la solicitud

    if (!fechaInicio || !fechaFin) {
        // Si no se proporcionaron fechas, enviar una respuesta vacía
        res.send('');
        return;
    }

    // Llama a la función para obtener las placas bajo el 60% con las fechas proporcionadas
    obtenerPlacasBajo60(fechaInicio, fechaFin, (error, placas) => {
        if (error) {
            // Maneja el error
            console.error(error);
            res.status(500).send('Error al obtener las placas');
            return;
        }

        // Renderiza la lista de placas bajo el 60%
        let listaPlacas = '';
        placas.forEach(placa => {
            listaPlacas += '<li>' + placa + '</li>';
        });

        // Envía la lista de placas bajo el 60% como respuesta
        res.send(listaPlacas);
    });
});

// Función para obtener las placas bajo el 60%
function obtenerPlacasBajo60(fechaInicio, fechaFin, callback) {
    // Consulta SQL para obtener las placas bajo el 60%
    let query = `
      SELECT placa
      FROM inspeccion_2_0
      WHERE fecha BETWEEN ? AND ?
        AND (corbata_vianco + traje + presentacion_externa + interior_vehiculo + protocolo_servicio + AGUA + PAÑOS + CARGADOR + MANOS + aire_acondicionado + logo_rnt + logos_reservado + logos_vianco + estado_baul) / (14 * 3) * 100 < 60`;

    // Parámetros para la consulta SQL
    let queryParams = [fechaInicio, fechaFin];

    // Realiza la consulta a la base de datos
    pool.query(query, queryParams, (error, rows) => {
        if (error) {
            callback(error, null);
            return;
        }

        // Obtén las placas bajo el 60%
        const placas = rows.map(row => row.placa);

        // Llama al callback con las placas obtenidas
        callback(null, placas);
    });
}



app.get('/auditoria', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        res.render('auditoria/auditoria_cordinador.hbs', { nombreUsuario });
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});




// Ruta para obtener la lista de bases
app.get('/obtenerBases', (req, res) => {
    pool.query('SELECT DISTINCT base FROM vehiculos', (error, results) => {
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
app.get('/inspeccion_vianco', (req, res) => {
    const baseSeleccionada = req.query.base;
    pool.query('SELECT placa FROM vehiculos WHERE base = ?', [baseSeleccionada], (error, results) => {
        if (error) {
            console.error('Error al obtener las placas:', error);
            res.status(500).json({ error: 'Error al obtener las placas' });
            return;
        }
        const placas = results.map(result => result.placa);
        res.json(placas);
    });
});







app.post('/guardar_auditoria', (req, res) => {
    // Extraer los datos del cuerpo de la solicitud
    const { placa, base,fecha, inspeccion, supervision, programacion,turno_extra,nombreUsuario } = req.body;
  
    // Consulta SQL para insertar datos en la tabla
    const query = `INSERT INTO auditoria (placa,base, fecha, inspeccion, supervision, programacion,turno_extra, responsable) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [placa,base, fecha, inspeccion, supervision, programacion,turno_extra, nombreUsuario];
  
    // Ejecutar la consulta SQL
    pool.query(query, values, (error, results) => {
      if (error) {
        console.error('Error al guardar los datos:', error);
        res.status(500).send('Error interno del servidor');
      } else {
        console.log('Datos guardados correctamente');
        res.redirect('/auditoria');
      }
    });
});













// Ruta para renderizar el formulario de consulta
app.get('/consulta_auditoria', async (req, res) => {
    try {
        // Consultar la base de datos para obtener las placas y bases disponibles desde la tabla de vehículos
        const placasQuery = 'SELECT DISTINCT placa FROM vehiculos';
        const basesQuery = 'SELECT DISTINCT base FROM vehiculos';
        
        const [placasRows, placasFields] = await pool.promise().query(placasQuery);
        const [basesRows, basesFields] = await pool.promise().query(basesQuery);
        
        console.log('Placas encontradas:', placasRows);
        console.log('Bases encontradas:', basesRows);

        // Insertar "Todas" como opción adicional en las listas de placas y bases
        const placas = ['Todas', ...placasRows.map(row => row.placa)];
        const bases = ['Todas', ...basesRows.map(row => row.base)];

        // Renderizar el formulario con las placas y bases disponibles
        res.render('auditoria/consultar_auditoria.hbs', { placas, bases });
    } catch (error) {
        console.error('Error al obtener las placas y bases:', error);
        res.status(500).send('Error al obtener las placas y bases');
    }
});












app.post('/consulta_auditoria_resultado', async (req, res) => {
    const { placa, base, fecha_inicio, fecha_fin } = req.body;
    try {
        let query, params;
        if (placa === 'Todas' && base === 'Todas') {
            // Consultar todos los resultados sin filtrar por placa ni base
            query = 'SELECT * FROM auditoria WHERE fecha BETWEEN ? AND ?';
            params = [fecha_inicio, fecha_fin];
        } else if (placa === 'Todas') {
            // Consultar por base y rango de fechas sin filtrar por placa
            query = 'SELECT * FROM auditoria WHERE base = ? AND fecha BETWEEN ? AND ?';
            params = [base, fecha_inicio, fecha_fin];
        } else if (base === 'Todas') {
            // Consultar por placa y rango de fechas sin filtrar por base
            query = 'SELECT * FROM auditoria WHERE placa = ? AND fecha BETWEEN ? AND ?';
            params = [placa, fecha_inicio, fecha_fin];
        } else {
            // Consultar por placa, base y rango de fechas
            query = 'SELECT * FROM auditoria WHERE placa = ? AND base = ? AND fecha BETWEEN ? AND ?';
            params = [placa, base, fecha_inicio, fecha_fin];
        }

        // Ejecutar la consulta
        const [rows, fields] = await pool.promise().query(query, params);
        console.log('Datos encontrados:', rows);

        // Calcular la suma y el porcentaje de cumplimiento para cada fila
        for (let row of rows) {
            let total = 0;
            let totalCumplimiento = 0;
            const campos = ['inspeccion', 'supervision', 'programacion', 'turno_extra'];

            for (let campo of campos) {
                let valor = parseFloat(row[campo]) || 0;
                total += valor;
                totalCumplimiento += valor;
            }

            // Calcular el porcentaje de cumplimiento y redondearlo
            const porcentajeCumplimiento = Math.round((totalCumplimiento / (campos.length * 1)) * 100); // Total de campos * 1

            // Guardar la suma total y el porcentaje de cumplimiento en la fila
            row.total = total;
            row.porcentajeCumplimiento = porcentajeCumplimiento;
        }

        // Renderizar la plantilla con los resultados, la suma total y el porcentaje de cumplimiento
        res.render('auditoria/resultador_auditoria.hbs', { resultados: rows });
    } catch (error) {
        console.error('Error en la búsqueda por fecha:', error);
        res.status(500).send('Error en la búsqueda por fecha');
    }
});

// Definimos la función obtenerFechaActual para obtener la fecha actual en el formato requerido
function obtenerFechaActual() {
    const today = new Date();
    const year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();

    if (month < 10) {
        month = '0' + month;
    }
    if (day < 10) {
        day = '0' + day;
    }

    return year + '-' + month + '-' + day;
}












app.get('/llegadas_salidas', async (req, res) => {
    try {
        if (req.session.loggedin === true) {
            const nombreUsuario = req.session.name;
            const clientesQuery = 'SELECT DISTINCT nombre FROM clientes';
            const [clienteRows] = await pool.promise().query(clientesQuery);
            if (!clienteRows || clienteRows.length === 0) {
                throw new Error("No se encontraron clientes en la base de datos.");
            }
            console.log('Clientes encontrados:');
            const nombresClientes = clienteRows.map(row => row.nombre);
            // Obtenemos la fecha actual y la pasamos al renderizar la plantilla
            const fechaActual = obtenerFechaActual(); // Función para obtener la fecha actual
            res.render('llegadasYsalidas/form_llegas.hbs', { nombreUsuario, clientes: nombresClientes, fechaActual });
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error interno del servidor");
    }
});







app.post('/guardar_llegadas_salidas', (req, res) => {
    // Extraer los datos del cuerpo de la solicitud
    const { clienteCosto, Responsable, fecha, llegadas, salidas, ocupacion } = req.body;

    // Consulta SQL para insertar datos en la tabla
    const query = `INSERT INTO llegadas_salidas (clienteCosto, Responsable, fecha, llegadas, salidas, ocupacion) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [clienteCosto, Responsable, fecha, llegadas, salidas, ocupacion];

    // Ejecutar la consulta SQL
    pool.query(query, values, (error, results) => {
        if (error) {
            console.error('Error al guardar los datos:', error);
            return res.status(500).send('Error interno del servidor');
        } else {
            console.log('Datos guardados correctamente');
            // Enviar una respuesta con un script que active el alert
            const script = `
                <script>
                    alert('Los datos se han guardado correctamente');
                    window.location.href = '/llegadas_salidas'; // Redirigir después de cerrar el alert
                </script>
            `;
            return res.send(script);
        }
    });
});




app.get('/consulta_vencidos', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        res.render('operaciones/vehiculos/consulta_documentosVencidos.hbs', { nombreUsuario });
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});




app.get('/documentos-vencidos', (req, res) => {
    const hoy = new Date();
    const fechaOchoDiasDespues = new Date(hoy);
    fechaOchoDiasDespues.setDate(fechaOchoDiasDespues.getDate() + 8); // Suma 8 días a la fecha actual

    const query = `
    SELECT Placa, Conductor, Base, Fecha_vigencia_soat, Fecha_vigencia, Vigencia_polizas, 
    Fecha_final_operacion, Fecha_final_preventiva_1, fecha_vigencia_convenio
FROM vehiculos
WHERE 
 (Fecha_vigencia_soat IS NOT NULL AND STR_TO_DATE(Fecha_vigencia_soat, '%d/%m/%Y') <= ?) OR
 (Fecha_vigencia IS NOT NULL AND STR_TO_DATE(Fecha_vigencia, '%d/%m/%Y') <= ?) OR
 (Vigencia_polizas IS NOT NULL AND STR_TO_DATE(Vigencia_polizas, '%d/%m/%Y') <= ?) OR
 (Fecha_final_operacion IS NOT NULL AND STR_TO_DATE(Fecha_final_operacion, '%d/%m/%Y') <= ?) OR
 (Fecha_final_preventiva_1 IS NOT NULL AND STR_TO_DATE(Fecha_final_preventiva_1, '%d/%m/%Y') <= ?) OR
 (fecha_vigencia_convenio IS NOT NULL AND STR_TO_DATE(fecha_vigencia_convenio, '%d/%m/%Y') <= ?)
UNION
SELECT Placa, Conductor, Base, Fecha_vigencia_soat, Fecha_vigencia, Vigencia_polizas, 
    Fecha_final_operacion, Fecha_final_preventiva_1, fecha_vigencia_convenio
FROM vehiculos
WHERE 
 (Fecha_vigencia_soat IS NOT NULL AND STR_TO_DATE(Fecha_vigencia_soat, '%d/%m/%Y') >= ?) OR
 (Fecha_vigencia IS NOT NULL AND STR_TO_DATE(Fecha_vigencia, '%d/%m/%Y') >= ?) OR
 (Vigencia_polizas IS NOT NULL AND STR_TO_DATE(Vigencia_polizas, '%d/%m/%Y') >= ?) OR
 (Fecha_final_operacion IS NOT NULL AND STR_TO_DATE(Fecha_final_operacion, '%d/%m/%Y') >= ?) OR
 (Fecha_final_preventiva_1 IS NOT NULL AND STR_TO_DATE(Fecha_final_preventiva_1, '%d/%m/%Y') >= ?) OR
 (fecha_vigencia_convenio IS NOT NULL AND STR_TO_DATE(fecha_vigencia_convenio, '%d/%m/%Y') >= ?)

`;

pool.query(query, [
        hoy,
        hoy,
        hoy,
        hoy,
        hoy,
        hoy,
        fechaOchoDiasDespues,
        hoy,
        fechaOchoDiasDespues,
        hoy,
        fechaOchoDiasDespues,
        hoy,
        fechaOchoDiasDespues,
        hoy,
        fechaOchoDiasDespues,
        hoy,
        fechaOchoDiasDespues,
        hoy,
    ], (error, results, fields) => {
        if (error) {
            console.error('Error al obtener vehículos con documentos vencidos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
        }
        console.log('Fechas recuperadas de la base de datos:');
        res.json(results);
    });
});

















// Ruta para descargar el archivo Excel
app.post('/descargar-excel', (req, res) => {
    const hoy = new Date();
    const fechaOchoDiasDespues = new Date(hoy);
    fechaOchoDiasDespues.setDate(fechaOchoDiasDespues.getDate() + 8); // Suma 8 días a la fecha actual

    const query = `
        SELECT Placa, Conductor, Base, Fecha_vigencia_soat, Fecha_vigencia, Vigencia_polizas, 
            Fecha_final_operacion, Fecha_final_preventiva_1, fecha_vigencia_convenio
        FROM vehiculos
        WHERE 
        (Fecha_vigencia_soat IS NOT NULL AND STR_TO_DATE(Fecha_vigencia_soat, '%d/%m/%Y') <= ?) OR
        (Fecha_vigencia IS NOT NULL AND STR_TO_DATE(Fecha_vigencia, '%d/%m/%Y') <= ?) OR
        (Vigencia_polizas IS NOT NULL AND STR_TO_DATE(Vigencia_polizas, '%d/%m/%Y') <= ?) OR
        (Fecha_final_operacion IS NOT NULL AND STR_TO_DATE(Fecha_final_operacion, '%d/%m/%Y') <= ?) OR
        (Fecha_final_preventiva_1 IS NOT NULL AND STR_TO_DATE(Fecha_final_preventiva_1, '%d/%m/%Y') <= ?) OR
        (fecha_vigencia_convenio IS NOT NULL AND STR_TO_DATE(fecha_vigencia_convenio, '%d/%m/%Y') <= ?)
        UNION
        SELECT Placa, Conductor, Base, Fecha_vigencia_soat, Fecha_vigencia, Vigencia_polizas, 
            Fecha_final_operacion, Fecha_final_preventiva_1, fecha_vigencia_convenio
        FROM vehiculos
        WHERE 
        (Fecha_vigencia_soat IS NOT NULL AND STR_TO_DATE(Fecha_vigencia_soat, '%d/%m/%Y') >= ?) OR
        (Fecha_vigencia IS NOT NULL AND STR_TO_DATE(Fecha_vigencia, '%d/%m/%Y') >= ?) OR
        (Vigencia_polizas IS NOT NULL AND STR_TO_DATE(Vigencia_polizas, '%d/%m/%Y') >= ?) OR
        (Fecha_final_operacion IS NOT NULL AND STR_TO_DATE(Fecha_final_operacion, '%d/%m/%Y') >= ?) OR
        (Fecha_final_preventiva_1 IS NOT NULL AND STR_TO_DATE(Fecha_final_preventiva_1, '%d/%m/%Y') >= ?) OR
        (fecha_vigencia_convenio IS NOT NULL AND STR_TO_DATE(fecha_vigencia_convenio, '%d/%m/%Y') >= ?)
    `;

    pool.query(query, [
        hoy,
        hoy,
        hoy,
        hoy,
        hoy,
        hoy,
        fechaOchoDiasDespues,
        hoy,
        fechaOchoDiasDespues,
        hoy,
        fechaOchoDiasDespues,
        hoy,
        fechaOchoDiasDespues,
        hoy,
        fechaOchoDiasDespues,
        hoy,
        fechaOchoDiasDespues,
        hoy
    ], (error, results, fields) => {
        if (error) {
            console.error('Error al obtener vehículos con documentos vencidos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
        }

        console.log('Fechas recuperadas de la base de datos:');
        // Crear el archivo Excel y enviarlo como respuesta
        generarExcel(results, res);
    });
});

// Función para generar el archivo Excel y enviarlo como respuesta
function generarExcel(data, res) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Documentos');

    worksheet.columns = [
        { header: 'Placa', key: 'Placa', width: 15 },
        { header: 'Conductor', key: 'Conductor', width: 20 },
        { header: 'Base', key: 'Base', width: 15 },
        { header: 'Fecha Vigencia SOAT', key: 'Fecha_vigencia_soat', width: 20 },
        { header: 'Fecha Vigencia', key: 'Fecha_vigencia', width: 20 },
        { header: 'Vigencia Polizas', key: 'Vigencia_polizas', width: 20 },
        { header: 'Fecha Final Operacion', key: 'Fecha_final_operacion', width: 20 },
        { header: 'Fecha Final Preventiva 1', key: 'Fecha_final_preventiva_1', width: 20 },
        { header: 'Fecha Vigencia Convenio', key: 'fecha_vigencia_convenio', width: 20 }
    ];

    data.forEach(item => {
        worksheet.addRow({
            Placa: item.Placa,
            Conductor: item.Conductor,
            Base: item.Base,
            Fecha_vigencia_soat: item.Fecha_vigencia_soat,
            Fecha_vigencia: item.Fecha_vigencia,
            Vigencia_polizas: item.Vigencia_polizas,
            Fecha_final_operacion: item.Fecha_final_operacion,
            Fecha_final_preventiva_1: item.Fecha_final_preventiva_1,
            fecha_vigencia_convenio: item.fecha_vigencia_convenio
        });
    });

    workbook.xlsx.write(res)
        .then(() => {
            console.log('Archivo Excel generado y enviado exitosamente');
            res.end();
        })
        .catch(error => {
            console.error('Error al generar el archivo Excel:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        });
}















// Definir las rutas
app.get("/consulta-vehiculos2", (req, res) => {
    // Consulta SQL para obtener las placas disponibles
    pool.query("SELECT placa FROM vehiculos", (error, results) => {
        if (error) {
            console.error("Error al obtener las placas:", error);
            res.status(500).send("Error al obtener las placas");
            return;
        }
        // Renderizar la vista de consulta de vehículos con los datos de las placas
        res.render("operaciones/vehiculos/consulta_2.hbs", { placas: results.map(result => result.placa) });
    });
});

app.post("/consulta-vehiculos2", (req, res) => {
    const placaSeleccionada = req.body.placa; // Obtener la placa seleccionada del cuerpo de la solicitud
    // Consulta SQL para obtener la información del vehículo correspondiente a la placa seleccionada
    pool.query("SELECT * FROM vehiculos WHERE placa = ?", [placaSeleccionada], (error, results) => {
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




// Registrar ayudante para formatear la fecha
hbs.registerHelper('formatDate', function (dateString) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', options);
});


// Ruta para obtener el informe general
app.get('/informe_general_f', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        const { fecha_inicio, fecha_final } = req.query;

        if (fecha_inicio && fecha_final) {
            // Validar formato de fecha
            const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);

            if (isValidDate(fecha_inicio) && isValidDate(fecha_final)) {
                // Consulta para obtener los datos filtrados por fecha_creacion
                const query = 'SELECT * FROM fuec_data WHERE fecha_creacion >= ? AND fecha_creacion <= DATE_ADD(?, INTERVAL 1 DAY)';
                pool.query(query, [fecha_inicio, fecha_final], (error, results) => {
                    if (error) {
                        console.error('Error al ejecutar la consulta:', error.stack);
                        res.status(500).send('Error en el servidor');
                        return;
                    }
                    
                    // Renderiza la plantilla con los datos obtenidos
                    res.render('operaciones/fuec/informe_general_fuec.hbs', { nombreUsuario, datos: results });
                });
            } else {
                res.status(400).send('Formato de fecha inválido');
            }
        } else {
            // Renderiza la plantilla sin datos si no se han proporcionado fechas
            res.render('operaciones/fuec/informe_general_fuec.hbs', { nombreUsuario });
        }
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});




app.get('/seleccionar_hotelVAN', (req, res) => {
    res.render('operaciones/tarifas/tarifas_van.hbs'); // Renderiza la vista seleccionar_hotel.hbs
});



app.get('/tarifasvan', (req, res) => {
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







// Función para enviar correo electrónico
async function enviarCorreoElectronico(responsable, tarea) {
    // Configurar nodemailer
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'soporte.it.vianco@gmail.com', // Tu correo electrónico
            pass: 'iifjwgvmeujfiqhx' // Tu contraseña
        }
    });

    // Contenido del correo electrónico
    let mailOptions = {
        from: 'tucorreo@gmail.com',
        to: responsable.email,
        subject: 'Has sido asignado como responsable De un servicio no conforme',
        html: `<p>Hola ${responsable.name},</p>
               <p>Has sido designado como responsable de  un servicio no conforme  N° UNICO: ${tarea.id}.</p>
               <p>Por favor, accede a la plataforma en el modulo Servicios no conforme y con el  N° UNICO: ${tarea.id} Realize el respectivo seguimiento para más detalles ingrese a la app Vianco .</p>
               <p>Agradesco su Atencion y le deseamos un feliz dia de parte del equipo de Soporte vianco.</p>`

    };

    // Enviar correo electrónico
    await transporter.sendMail(mailOptions);
}



app.get('/asiganr_servicioN', async (req, res) => {
    try {
        if (req.session.loggedin === true) {
            // Obtener nombre de usuario de la sesión
            const nombreUsuario = req.session.name;

            // Consulta para obtener la lista de usuarios
            const userQuery = 'SELECT DISTINCT name FROM user';
            const [userRows] = await pool.promise().query(userQuery);
            if (!userRows || userRows.length === 0) {
                throw new Error("No se encontraron clientes en la base de datos.");
            }
            // Mapear los nombres de usuario
            const clientes = userRows.map(row => row.name);

            // Consulta para obtener las novedades
            const novedadesQuery = 'SELECT * FROM novedades_vianco WHERE responsable_asignado IS NULL';
            const [novedadesRows] = await pool.promise().query(novedadesQuery);

            // Filtrar novedades que tienen contenido
            const filteredNovedades = novedadesRows.filter(novedad => 
                novedad.novedad_tripulacion || 
                novedad.novedad_hoteleria || 
                novedad.novedad_ejecutivos || 
                novedad.novedad_empresas_privadas || 
                novedad.NOVEDADES_TASKGO || 
                novedad.otras_novedades
            );

            // Obtener la fecha actual
            const fechaActual = obtenerFechaActual(); // Función para obtener la fecha actual

            // Renderizar la plantilla con la información recopilada
            res.render('novedades_vianco/asignacion_servicioNoconforme.hbs', { 
                nombreUsuario, 
                clientes, 
                novedades: filteredNovedades, 
                fechaActual, 
                mensaje: filteredNovedades.length === 0 ? "No hay servicios para asignar." : null
            });
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error interno del servidor");
    }
});







// Modificar la ruta para asignar un responsable
app.post('/asignar-responsable', async (req, res) => {
    try {
        // Obtener datos del formulario
        const idTarea = req.body.id;
        const responsableName = req.body.responsable;

        // Consulta para obtener la información del usuario responsable
        const userQuery = 'SELECT name, email FROM user WHERE name = ?';
        const [userRows] = await pool.promise().query(userQuery, [responsableName]);

        // Verificar si se encontró al usuario responsable
        if (!userRows || userRows.length === 0) {
            throw new Error("No se encontró al usuario responsable en la base de datos.");
        }

        // Obtener el correo electrónico del responsable
        const responsableEmail = userRows[0].email;

        // Llamar a la función para enviar correo electrónico
        await enviarCorreoElectronico({ name: responsableName, email: responsableEmail }, { id: idTarea });

        // Actualizar la base de datos con el responsable asignado y la notificación pendiente
        const updateQuery = 'UPDATE novedades_vianco SET responsable_asignado = ?, notificacion_pendiente = 1 WHERE id = ?';
        await pool.promise().query(updateQuery, [responsableName, idTarea]);

      // Redirigir de vuelta a la página de asignación
      res.redirect('/asiganr_servicioN');
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error interno del servidor");
    }
});










// Endpoint to verify notifications
app.get('/verificar-notificaciones', async (req, res) => {
    try {
        // Get the username from the session
        const nombreUsuario = req.session.name;

        // Query to check for pending notifications for the current user
        const query = 'SELECT * FROM novedades_vianco WHERE responsable_asignado = ? AND notificacion_pendiente = 1';
        const [result] = await pool.promise().query(query, [nombreUsuario]);

        // Send response to the client
        res.json({ notificaciones: result });
    } catch (error) {
        console.error('Error al verificar notificaciones pendientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/marcar-notificacion/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // Mark the notification as read in the database
        const updateResult = await Notificacion.updateOne({ _id: id }, { leida: true });
        if (updateResult.nModified === 1) {
            res.status(200).send('Notificación marcada como leída correctamente');
        } else {
            res.status(404).send('Notificación no encontrada');
        }
    } catch (error) {
        console.error('Error al marcar la notificación como leída:', error);
        res.status(500).send('Error interno del servidor al marcar la notificación como leída');
    }
});

app.get('/notificaciones-pendientes/:usuario', async (req, res) => {
    try {
        const usuario = req.params.usuario;
        // Buscar todas las notificaciones pendientes para el usuario dado
        const notificaciones = await Notificacion.find({ responsable: usuario, leida: false });
        res.status(200).json(notificaciones);
    } catch (error) {
        console.error('Error al obtener las notificaciones pendientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});








// Ruta para eliminar una notificación
app.delete('/eliminar-notificacion/:id', async (req, res) => {
    try {
        const id = req.params.id; // Obtener el ID de la solicitud
        const notificacion = await Notificacion.findByIdAndDelete(id);
        if (notificacion) {
            res.status(200).json(notificacion);
        } else {
            res.status(404).send('Notificación no encontrada');
        }
    } catch (error) {
        console.error('Error al eliminar la notificación:', error);
        res.status(500).send('Error interno del servidor al eliminar la notificación');
    }
});




// Ruta para verificación de servicios
app.get('/verificacion_servicio', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        pool.query('SELECT * FROM novedades_completadas_vianco WHERE aceptadas IS NULL OR aceptadas = 0', (error, results) => {
            if (error) throw error;
            res.render('novedades_vianco/verificacion_servicio', { nombreUsuario, novedades: results });
        });
    } else {
        res.redirect("/login");
    }
});



// Ruta para marcar una novedad como aceptada
app.get('/marcar_aceptada/:id', (req, res) => {
    const idNovedad = req.params.id; // Obtener el ID de la novedad desde la URL

    // Actualizar el estado de la novedad en la base de datos como aceptada
    pool.query('UPDATE novedades_completadas_vianco SET aceptadas = true WHERE id = ?', idNovedad, (error, results, fields) => {
        if (error) throw error;

        // Consultar el email del usuario que realizó la acción
        pool.query('SELECT email FROM user WHERE id = ?', idNovedad, (error, results, fields) => {
            if (error) throw error;
            
            // Verificar si hay resultados en la consulta
            if (results && results.length > 0) {
                const userEmail = results[0].email; // Suponiendo que el email es único

                // Enviar correo electrónico de confirmación
                enviarCorreoVerificacionn(userEmail, 'Servicio Verificado', 'Su servicio ha sido verificado correctamente.');

                // Redirigir a la página de verificación de servicios
                res.redirect('/verificacion_servicio');
            } else {
                console.error('No se encontró ningún usuario con el ID proporcionado');
                res.status(404).send('Usuario no encontrado');
            }
        });
    });
});



// Función para enviar correo electrónico de verificación con un texto más formal
function enviarCorreoVerificacionn(destinatario, asunto, contenido) {
    // Configurar el transporte del correo electrónico
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'soporte.it.vianco@gmail.com', // Tu correo electrónico
            pass: 'iifjwgvmeujfiqhx' // Tu contraseña
        }
    });

    // Texto más formal del correo electrónico
    const contenidoFormal = `Estimado/a ,

Nos complace informarle que su servicio ha sido verificado correctamente. Este es un paso importante para garantizar la calidad y la eficiencia de nuestros servicios. Si tiene alguna pregunta o necesita más asistencia, no dude en ponerse en contacto con nosotros.

Atentamente,
Equipo de Soporte de Vianco`;

    // Configurar el correo electrónico
    const mailOptions = {
        from: 'soporte.it.vianco@gmail.com', // Dirección de correo electrónico del remitente
        to: destinatario, // Dirección de correo electrónico del destinatario
        subject: asunto, // Asunto del correo electrónico
        text: contenidoFormal // Contenido del correo electrónico (en formato de texto sin formato)
    };

    // Enviar el correo electrónico
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Correo electrónico enviado: ' + info.response);
        }
    });
}














// Ruta para manejar la consulta de servicios
app.get('/Consulta_mia', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        // Consulta a la base de datos para obtener los servicios del usuario actual
        const query = "SELECT * FROM novedades_completadas_vianco WHERE realiza = ?";
        pool.query(query, [nombreUsuario], (err, results) => {
            if (err) {
                console.error('Error al consultar la base de datos: ', err);
                res.status(500).send('Error interno del servidor');
                return;
            }
            // Renderiza la plantilla y pasa los resultados como contexto
            res.render('novedades_vianco/consulta_mia_SN.hbs', { nombreUsuario, servicios: results });
        });
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});


















// Ruta para verificación de servicios
app.get('/verificacion_cotizacion', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        // Consultar las cotizaciones realizadas pero no verificadas desde la base de datos
        pool.query('SELECT * FROM cotizaciones WHERE realizada = 1 AND verificadas IS NULL', (error, results, fields) => {
            if (error) throw error;
            // Agrupar cotizaciones por número de servicios
            const cotizacionesPorServicios = {};
            results.forEach(cotizacion => {
                const numServicios = cotizacion.num_servicios;
                if (!cotizacionesPorServicios[numServicios]) {
                    cotizacionesPorServicios[numServicios] = [];
                }
                cotizacionesPorServicios[numServicios].push(cotizacion);
            });
            // Renderizar la vista y pasar las cotizaciones agrupadas como datos
            res.render('cotizaciones/verificarCotizacion', { nombreUsuario, cotizacionesPorServicios });
        });
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});


















// Ruta para marcar una cotización como aceptada
app.post('/marcar_aceptada/:id', (req, res) => {
    const id = req.params.id;
    pool.query('UPDATE cotizaciones SET verificadas = 1 WHERE id = ?', [id], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error al marcar como aceptada');
        }
        res.send('Cotización aceptada correctamente');
    });
});

// Ruta para marcar una cotización como rechazada
app.post('/marcar_rechazada/:id', (req, res) => {
    const id = req.params.id;
    pool.query('UPDATE cotizaciones SET verificadas = 0 WHERE id = ?', [id], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error al marcar como rechazada');
        }
        res.send('Cotización rechazada correctamente');
    });
});










app.get('/nuevo_tikect_soporte', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        // Aquí obtienes el correo electrónico del usuario de la base de datos
        const query = 'SELECT email FROM user WHERE name = ?';
        pool.query(query, [nombreUsuario], (error, results) => {
            if (error) {
                console.error('Error al obtener el correo electrónico del usuario:', error);
                // Maneja el error apropiadamente
                res.redirect("/login");
                return;
            }
            // Si se encuentra el correo electrónico, pásalo a la página
            const emailUsuario = results[0].email;
            res.render('SoporteIT/crear_tikect.hbs', { nombreUsuario, emailUsuario });
        });
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});













app.post('/guardar_ticket', (req, res) => {
    const { usuario, email, asunto, otro_asunto, prioridad, descripcion } = req.body;

    const asuntoFinal = (asunto === 'Otro') ? otro_asunto : asunto;

    const sql = "INSERT INTO tickets_soporte (usuario, email, asunto, prioridad, descripcion) VALUES (?, ?, ?, ?, ?)";
    pool.query(sql, [usuario, email, asuntoFinal, prioridad, descripcion], (error, results) => {
        if (error) {
            console.error('Error al insertar el ticket:', error);
            res.status(500).send('Error interno al guardar el ticket');
            return;
        }
        console.log('Nuevo ticket creado con ID:', results.insertId);

        const mailOptions = {
            from: 'soporte.it.vianco@gmail.com',
            to: email,
            subject: 'Ticket de Soporte Creado Exitosamente',
            html: `
                <div style="font-family: 'Arial', sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                    <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">VIANCO Soporte</h1>
                        <h2 style="margin: 0; font-size: 24px;">Ticket Creado Exitosamente</h2>
                    </div>
                    <div style="padding: 20px; background-color: #f9f9f9;">
                        <p>Estimado/a <strong>${usuario}</strong>,</p>
                        <p>Su ticket ha sido creado exitosamente. Pronto nuestro equipo de soporte hará las validaciones necesarias para dar una pronta solución.</p>
                        <h3 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px;">Detalles del Ticket:</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; background-color: white;">
                            <tr>
                                <th style="text-align: left; padding: 10px; background-color: #f2f2f2; border: 1px solid #ddd;">Asunto:</th>
                                <td style="padding: 10px; border: 1px solid #ddd;">${asuntoFinal}</td>
                            </tr>
                            <tr>
                                <th style="text-align: left; padding: 10px; background-color: #f2f2f2; border: 1px solid #ddd;">Prioridad:</th>
                                <td style="padding: 10px; border: 1px solid #ddd;">${prioridad}</td>
                            </tr>
                            <tr>
                                <th style="text-align: left; padding: 10px; background-color: #f2f2f2; border: 1px solid #ddd;">Descripción:</th>
                                <td style="padding: 10px; border: 1px solid #ddd;">${descripcion}</td>
                            </tr>
                        </table>
                        <p style="margin-top: 20px;">Gracias por contactarnos.</p>
                        <p>Atentamente,</p>
                        <p><strong>Equipo de Soporte de VIANCO</strong></p>
                    </div>
                    <div style="background-color: #f1f1f1; color: #333; padding: 10px; text-align: center;">
                        <p style="margin: 0;">&copy; 2024 VIANCO. Todos los derechos reservados.</p>
                        <p style="margin: 0;"><a href="" style="color: #4CAF50; text-decoration: none;">Julian Soporte IT</a></p>
                    </div>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Error al enviar el correo electrónico:', err);
                res.status(500).send('Error al enviar el correo electrónico');
                return;
            }
            console.log('Correo electrónico enviado:', info.response);

            res.json({ message: '¡Ticket creado exitosamente y correo electrónico enviado!' });
        });
    });
});











app.get('/revisar_tickets', (req, res) => {
    if (req.session.loggedin === true) {
        // Consulta los tickets en estado pendiente desde la base de datos
        const query = 'SELECT * FROM tickets_soporte WHERE estado = ?';
        pool.query(query, ['pendiente'], (error, results) => {
            if (error) {
                console.error('Error al obtener los tickets en estado pendiente:', error);
                // Maneja el error apropiadamente
                res.status(500).send('Error interno del servidor');
                return;
            }
            // Renderiza la vista de tickets pendientes, pasando los resultados de la consulta
            res.render('SoporteIT/responder_tikect.hbs', { tickets: results });
        });
    } else {
        // Redirige al usuario al inicio de sesión si no está autenticado
        res.redirect("/login");
    }
});



app.post('/responder_ticket/:id', (req, res) => {
    if (req.session.loggedin === true) {
        const ticketId = req.params.id;
        const respuesta = req.body.respuesta;
        const fechaRespuesta = new Date(); // Obtén la fecha y hora actual

        // Actualiza el ticket en la base de datos
        const query = 'UPDATE tickets_soporte SET estado = ?, respuesta = ?, fechaRespuesta = ? WHERE id = ?';
        pool.query(query, ['completo', respuesta, fechaRespuesta, ticketId], (error, results) => {
            if (error) {
                console.error('Error al responder al ticket:', error);
                res.status(500).send('Error interno del servidor');
                return;
            }

            // Aquí asumimos que el correo electrónico del destinatario está almacenado en la base de datos
            // Supongamos que tienes un campo 'email' en la tabla 'tickets_soporte'
            const emailQuery = 'SELECT email FROM tickets_soporte WHERE id = ?';
            pool.query(emailQuery, [ticketId], (emailError, emailResults) => {
                if (emailError) {
                    console.error('Error al obtener el correo electrónico:', emailError);
                    res.status(500).send('Error interno del servidor');
                    return;
                }

                const destinatario = emailResults[0].email;
                const mailOptions = {
                    from: 'soporte.it.vianco@gmail.com',
                    to: destinatario,
                    subject: 'Respuesta a tu ticket de soporte',
                    html: `
                    <html>
                    <head>
                        <style>
                            /* Estilos para el cuerpo del correo */
                            body {
                                font-family: Arial, sans-serif;
                                line-height: 1.6;
                            }
                            /* Estilos para el encabezado */
                            .header {
                                background-color: #f4f4f4;
                                padding: 20px;
                            }
                            /* Estilos para el contenido */
                            .content {
                                padding: 20px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Respuesta a tu ticket de soporte</h1>
                        </div>
                        <div class="content">
                            <p>Buen dia mi estimado,</p>
                            <p>Tu ticket ha sido respondido. a continuacion veras la respuesta:</p>
                            <p>${respuesta}</p>
                            <p>Fecha de respuesta: ${fechaRespuesta}</p>
                            <p>Saludos,</p>
                            <p>El equipo de soporte</p>
                        </div>
                    </body>
                    </html>
                `
            };

                // Envía el correo electrónico
                transporter.sendMail(mailOptions, (mailError, info) => {
                    if (mailError) {
                        console.error('Error al enviar el correo:', mailError);
                        res.status(500).send('Error interno del servidor');
                        return;
                    }
                    console.log('Correo enviado:', info.response);
                    res.json({ message: 'Datos insertados correctamente' });
                });
            });
        });
    } else {
        res.redirect("/login");
    }
});










// Ruta para clientes
app.get('/SolictarServicioTerceros', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;

        // Consulta a la base de datos para obtener el correo electrónico del usuario
        const query = 'SELECT email FROM user WHERE name = ?';
        pool.query(query, [nombreUsuario], (error, userResult) => {
            if (error) {
                console.error('Error al obtener el correo electrónico del usuario:', error);
                res.status(500).send('Error interno del servidor');
                return; // Agregado para evitar que el código continúe después del error
            }

            // Consulta a la base de datos para obtener la información de los clientes
            pool.query('SELECT * FROM clientes', (error, clientesResult) => {
                if (error) {
                    console.error('Error al obtener los clientes:', error);
                    res.status(500).send('Error interno del servidor');
                    return; // Agregado para evitar que el código continúe después del error
                }

                // Si se obtienen los resultados correctamente
                // Renderiza la plantilla 'clientes.hbs' pasando los resultados de la consulta y el correo electrónico del usuario
                res.render('operaciones/ServiciosTerceros/solictarServicio.hbs', { nombreUsuario, emailUsuario: userResult[0].email, clientes: clientesResult });
            });
        });
    } else {
        res.redirect("/login");
    }
});


app.post('/guardar-servicio_tercero', (req, res) => {
    const {
        realizadopor,
        email,
        numero_tarea,
        fecha_servicio,
        hora_servicio,
        tipo_vehiculo,
        otro_vehiculo,
        cliente,
        otro_cliente,
        punto_origen,
        punto_destino,
        observaciones,
        nombrePersona,
        contacto,
        valor_dadoCliente,
    } = req.body;

    // Query to insert data into the 'servicios_terceros' table
    const sql = `INSERT INTO servicios_terceros (realizadopor, email, numero_tarea, fecha_servicio, hora_servicio, tipo_vehiculo, otro_vehiculo, cliente, otro_cliente, punto_origen, punto_destino, observaciones, nombrePersona, contacto, valor_dadoCliente) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    // Execute the query
    pool.query(sql, [realizadopor, email, numero_tarea, fecha_servicio, hora_servicio, tipo_vehiculo, otro_vehiculo, cliente, otro_cliente, punto_origen, punto_destino, observaciones, nombrePersona, contacto, valor_dadoCliente], (err, result) => {
        if (err) {
            console.error('Error al insertar datos:', err);
            res.status(500).send('Error al guardar los datos en la base de datos.');
        } else {
            console.log('Datos insertados correctamente');

            // Send email notification
            const mailOptions = {
                from: 'soporte.it.vianco@gmail.com',
                to: 'cdaza.vianco@gmail.com ',
                subject: 'Nueva Solicitud de Servicio Tercerizado',
                html: `
                    <p>Estimado/a CAMILO DAZA,</p>
                    <p>Me complace informarle que se ha registrado una nueva solicitud de servicio tercerizado. Por favor, tome un momento para revisar los detalles proporcionados y confirmar su validez.</p>
                    <p>Su confirmación es fundamental para proceder con el servicio de manera adecuada.</p>
                    <p>Quedamos a la espera de su respuesta.</p>
                    <p>Atentamente,<br/>SOPORTE IT VIANCO</p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error al enviar el correo:', error);
                    res.status(500).send('Error al enviar el correo.');
                } else {
                    console.log('Correo enviado:', info.response);
                    res.redirect('/SolictarServicioTerceros?enviado=exito');
                }
            });
        }
    });
});












app.get('/ServiciosTerceros_pendientes', (req, res) => {
    if (req.session.loggedin === true) {
        // Consulta los servicios tercerizados en estado pendiente desde la base de datos
        const query = 'SELECT * FROM servicios_terceros WHERE estado = ?';
        pool.query(query, ['pendiente'], (error, results) => {
            if (error) {
                console.error('Error al obtener los servicios tercerizados en estado pendiente:', error);
                // Maneja el error apropiadamente
                res.status(500).send('Error interno del servidor');
                return;
            }
            
            // Renderiza la vista de servicios tercerizados pendientes, pasando los resultados de la consulta
            res.render('operaciones/ServiciosTerceros/asignar_servicio_tercero.hbs', { servicios: results });
        });
    } else {
        // Redirige al usuario al inicio de sesión si no está autenticado
        res.redirect("/login");
    }
});


app.post('/guardar-datos_conductor_SERIVICIOTERCERIZADO/:id', (req, res) => {
    if (req.session.loggedin === true) {
        const ticketId = req.params.id;
        const { placa, conductor, celular,Provedor, valorque_noscobran } = req.body;

        const query = 'UPDATE servicios_terceros SET estado = ?, placa = ?, conductor = ?, celular = ?,Provedor = ?, valorque_noscobran = ? WHERE id = ?';
        pool.query(query, ['asignado', placa, conductor, celular, Provedor,valorque_noscobran, ticketId], (error, results) => {
            if (error) {
                console.error('Error al actualizar el ticket:', error);
                res.status(500).send({ message: 'Error interno del servidor' });
                return;
            }
            
            // Email sending logic
            sendEmail(ticketId, placa, conductor, celular, res);
        });
    } else {
        res.status(403).send({ message: 'No autorizado' });
    }
});






function sendEmail(ticketId, placa, conductor, celular, res) {
    // Obtener el correo electrónico del servicio tercerizado y toda la información del servicio
    const getEmailAndServiceQuery = 'SELECT email, realizadopor, numero_tarea, fecha_servicio, hora_servicio, tipo_vehiculo, otro_vehiculo, cliente, otro_cliente, punto_origen, punto_destino, observaciones, nombrePersona, contacto FROM servicios_terceros WHERE id = ?';
    pool.query(getEmailAndServiceQuery, [ticketId], (getError, getResult) => {
        if (getError) {
            console.error('Error al obtener la información del servicio:', getError);
            res.status(500).send({ message: 'Error interno del servidor' });
            return;
        }
    
        if (getResult.length === 0) {
            console.error('No se pudo obtener la información del servicio');
            res.status(500).send({ message: 'No se pudo obtener la información del servicio' });
            return;
        }
    
        const email = getResult[0].email;
    
        if (!email || !validateEmail(email)) {
            console.error('La dirección de correo electrónico es inválida');
            res.status(500).send({ message: 'La dirección de correo electrónico es inválida' });
            return;
        }
    
        const serviceInfo = getResult[0];
        const fechaServicio = new Date(serviceInfo.fecha_servicio).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    
        const mailBody = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    color: #333;
                    line-height: 1.6;
                }
                .container {
                    width: 80%;
                    margin: auto;
                    border: 1px solid #ccc;
                    padding: 20px;
                    border-radius: 10px;
                    background-color: #f9f9f9;
                }
                h1, h2 {
                    color:#90c9a7;
                }
                .section-title {
                    font-size: 1.2em;
                    margin-top: 20px;
                    margin-bottom: 10px;
                    color: #0056b3;
                }
                .section-content {
                    margin-bottom: 20px;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 0.9em;
                    color: #555;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Estimado/a, ${serviceInfo.realizadopor}</h1>
                <p>Nos complace informarle que el servicio tercerizado que solicitó para la fecha ${fechaServicio} ha sido confirmado.</p>
                <div class="section-title">Detalles del Servicio:</div>
                <div class="section-content">
                    <p><strong>Realizado por:</strong> ${serviceInfo.realizadopor}</p>
                    <p><strong>Número de tarea:</strong> ${serviceInfo.numero_tarea}</p>
                    <p><strong>Fecha de servicio:</strong> ${fechaServicio}</p>
                    <p><strong>Hora de servicio:</strong> ${serviceInfo.hora_servicio}</p>
                    <p><strong>Tipo de vehículo:</strong> ${serviceInfo.tipo_vehiculo}</p>
                    <p><strong>Otro vehículo:</strong> ${serviceInfo.otro_vehiculo}</p>
                    <p><strong>Cliente:</strong> ${serviceInfo.cliente}</p>
                    <p><strong>Otro cliente:</strong> ${serviceInfo.otro_cliente}</p>
                    <p><strong>Punto de origen:</strong> ${serviceInfo.punto_origen}</p>
                    <p><strong>Punto de destino:</strong> ${serviceInfo.punto_destino}</p>
                    <p><strong>Observaciones:</strong> ${serviceInfo.observaciones}</p>
                    <p><strong>Nombre de persona de contacto:</strong> ${serviceInfo.nombrePersona}</p>
                    <p><strong>Contacto:</strong> ${serviceInfo.contacto}</p>
                </div>
                <div class="section-title">Datos de la Asignación del Vehículo:</div>
                <div class="section-content">
                    <p><strong>Estado:</strong> asignado</p>
                    <p><strong>Placa:</strong> ${placa}</p>
                    <p><strong>Conductor:</strong> ${conductor}</p>
                    <p><strong>Celular:</strong> ${celular}</p>
                </div>
                <div class="footer">
                    <p>Por favor, revise los cambios realizados.</p>
                    <p>Atentamente,<br>SOPORTE IT VIANCO</p>
                </div>
            </div>
        </body>
        </html>
        `;
    
        const mailOptions = {
            from: 'soporte.it.vianco@gmail.com',
            to: email,
            subject: 'Actualización de Datos del Servicio Tercerizado',
            html: mailBody
        };
    
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error al enviar el correo electrónico:', error);
                res.status(500).send({ message: 'Error al enviar el correo electrónico.' });
            } else {
                console.log('Correo electrónico enviado:', info.response);
                res.send({ message: 'Datos actualizados correctamente', success: true, reload: true });
            }
        });
    });
}



// Función para validar la dirección de correo electrónico
function validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}











app.get('/ServiciosTerceros_asignados', (req, res) => {
    if (req.session.loggedin === true) {
        const query = 'SELECT * FROM servicios_terceros WHERE estado = ?';
        pool.query(query, ['asignado'], (error, results) => {
            if (error) {
                console.error('Error al obtener los servicios tercerizados en estado pendiente:', error);
                res.status(500).send('Error interno del servidor');
                return;
            }
            res.render('operaciones/ServiciosTerceros/verificacionservicios.hbs', { servicios: results });
        });
    } else {
        res.redirect("/login");
    }
});

app.get('/download-excel', (req, res) => {
    const { startDate, endDate } = req.query;
    const query = 'SELECT * FROM servicios_terceros WHERE estado = ? AND fecha_servicio BETWEEN ? AND ?';

    pool.query(query, ['asignado', startDate, endDate], async (error, results) => {
        if (error) {
            console.error('Error al obtener los servicios tercerizados en el rango de fechas:', error);
            res.status(500).send('Error interno del servidor');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Servicios Terceros');

        worksheet.columns = [
            { header: 'Solicitado por', key: 'realizadopor', width: 20 },
            { header: 'Número de Tarea', key: 'numero_tarea', width: 15 },
            { header: 'Fecha del Servicio', key: 'fecha_servicio', width: 15 },
            { header: 'Hora del Servicio', key: 'hora_servicio', width: 15 },
            { header: 'Tipo de Vehículo', key: 'tipo_vehiculo', width: 20 },
            { header: 'Otro Vehículo', key: 'otro_vehiculo', width: 20 },
            { header: 'Cliente', key: 'cliente', width: 20 },
            { header: 'Otro Cliente', key: 'otro_cliente', width: 20 },
            { header: 'Punto de Origen', key: 'punto_origen', width: 25 },
            { header: 'Punto de Destino', key: 'punto_destino', width: 25 },
            { header: 'Observaciones', key: 'observaciones', width: 30 },
            { header: 'Persona de Contacto', key: 'nombrePersona', width: 20 },
            { header: 'Contacto', key: 'contacto', width: 15 },
            { header: 'Valor facturado', key: 'valor_dadoCliente', width: 20 },
            { header: 'Información de Asignación', key: 'informacion_asignacion', width: 20 },
            { header: 'Estado', key: 'estado', width: 10 },
            { header: 'Placa', key: 'placa', width: 10 },
            { header: 'Conductor', key: 'conductor', width: 15 },
            { header: 'Celular', key: 'celular', width: 15 },
            { header: 'Provedor', key: 'Provedor', width: 20 },
            { header: 'COSTO PROVEDOR', key: 'valorque_noscobran', width: 20 },
            { header: 'Margen de Ganancia', key: 'margen_ganancia', width: 20 },
            { header: 'Ganancia Neta', key: 'ganancia_neta', width: 20 },
            { header: 'Facturación', key: 'facturacion', width: 20 },
        ];

        results.forEach((servicio) => {
            worksheet.addRow(servicio);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=ServiciosTerceros.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    });
});



app.post('/guardar_VERIFICACIONSERVICIO_TERCERO/:id', (req, res) => {
    if (req.session.loggedin === true) {
        const servicioterceroId = req.params.id;
        const { valorCliente, costeProveedor, facturacion } = req.body;

        let estadoServicio = 'asignado'; // Por defecto, el estado es PENDIENTE

        if (facturacion === 'PAGADO') {
            estadoServicio = 'PAGADO'; // Si la facturación es PAGADO, el estado se actualiza a PAGADO
        }

        const query = 'UPDATE servicios_terceros SET valor_dadoCliente = ?, valorque_noscobran = ?, facturacion = ?, estado = ? WHERE id = ?';
        pool.query(query, [valorCliente, costeProveedor, facturacion, estadoServicio, servicioterceroId], (error, results) => {
            if (error) {
                console.error('Error al actualizar el servicio:', error);
                res.status(500).send({ message: 'Error interno del servidor' });
                return;
            }
            res.status(200).send({ message: 'Servicio actualizado correctamente' });
        });
    } else {
        res.status(403).send({ message: 'No autorizado' });
    }
});






app.get('/consultar_servicioT', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        const { id, fecha_inicio, fecha_fin, estado } = req.query;

        let query = 'SELECT * FROM servicios_terceros WHERE 1=1';
        let queryParams = [];

        if (id) {
            query += ' AND id = ?';
            queryParams.push(id);
        }
        if (fecha_inicio && fecha_fin) {
            query += ' AND fecha_servicio BETWEEN ? AND ?';
            queryParams.push(fecha_inicio, fecha_fin);
        } else if (fecha_inicio) {
            query += ' AND fecha_servicio >= ?';
            queryParams.push(fecha_inicio);
        } else if (fecha_fin) {
            query += ' AND fecha_servicio <= ?';
            queryParams.push(fecha_fin);
        }
        if (estado) {
            query += ' AND estado = ?';
            queryParams.push(estado);
        }

        pool.query(query, queryParams, (err, results) => {
            if (err) {
                return res.status(500).send('Error en la consulta a la base de datos');
            }
            res.render('operaciones/ServiciosTerceros/consultar_servicioT.hbs', { nombreUsuario, results });
        });
    } else {
        res.redirect('/login');
    }
});
















// Ruta para el menu de contabilidad
app.get("/menucontabilidad", (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        console.log(`El usuario ${nombreUsuario} está autenticado.`);
        req.session.nombreGuardado = nombreUsuario; // Guarda el nombre en la sesión

        const rolesString = req.session.roles;
        const roles = Array.isArray(rolesString) ? rolesString : [];
        otraFuncion(req, res); // Llama a otraFuncion para obtener el nombre de usuario



        const auxiliar = roles.includes('auxiliar');
        const cordinacion = roles.includes('cordinacion');
        const director = roles.includes('director');
        const gerencia = roles.includes('gerencia');
        const aeropuerto = roles.includes('aeropuerto');
        const soporte = roles.includes('soporte');

        res.render("contabilidadyfinanzas/menucontabilidad.hbs",{ name: req.session.name, auxiliar, cordinacion, director, gerencia, aeropuerto,soporte }); // Pasar los roles a la plantilla
    } else {
        res.redirect("/login");
    }
});



// Ruta para el menu de contabilidad
app.get("/menucomercial", (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        console.log(`El usuario ${nombreUsuario} está autenticado.`);
        req.session.nombreGuardado = nombreUsuario; // Guarda el nombre en la sesión

        const rolesString = req.session.roles;
        const roles = Array.isArray(rolesString) ? rolesString : [];
        otraFuncion(req, res); // Llama a otraFuncion para obtener el nombre de usuario



        const auxiliar = roles.includes('auxiliar');
        const cordinacion = roles.includes('cordinacion');
        const director = roles.includes('director');
        const gerencia = roles.includes('gerencia');
        const aeropuerto = roles.includes('aeropuerto');
        const soporte = roles.includes('soporte');

        res.render("Comercial/menucomercial.hbs",{ name: req.session.name, auxiliar, cordinacion, director, gerencia, aeropuerto,soporte }); // Pasar los roles a la plantilla
    } else {
        res.redirect("/login");
    }
});



app.get('/PQRS', (req, res) => {
    const nombreUsuario = req.session ? req.session.name : 'Invitado';
    res.render('Comercial/PQRS/crear_pqrs.hbs', { nombreUsuario });
});




// Definir la ruta para procesar el formulario de PQRS
app.post('/guardar_pqrs', (req, res) => {
    // Recuperar los datos del formulario
    const fecha = req.body.fecha;
    const correo = req.body.correo;
    const realiza = req.body.realiza;
    const tipo = req.body.tipo;
    const descripcion = req.body.descripcion;

    // Construir la consulta SQL para insertar los datos
    const sql = `INSERT INTO pqrs (fecha, correo, realiza, tipo, descripcion) 
                 VALUES (?, ?, ?, ?, ?)`;

    // Ejecutar la consulta SQL con los datos del formulario
    pool.query(sql, [fecha, correo, realiza, tipo, descripcion], (error, results, fields) => {
        if (error) {
            console.error("Error al guardar la PQRS:", error);
            res.status(500).send("Error al guardar la PQRS.");
        } else {
            console.log("Registro de PQRS guardado correctamente.");

            // Enviar correo electrónico pasando los datos necesarios
            enviarCorreeeo(correo, fecha, realiza, tipo, descripcion);

            res.status(200).send("Registro de PQRS guardado correctamente.");
        }
    });
});

// Función para enviar el correo electrónico
function enviarCorreeeo(destinatario, fecha, realiza, tipo, descripcion) {
    // Opciones del correo electrónico
    const mailOptions = {
        from: 'dperdomo@viancotetransporta.com', // Remitente (puedes cambiarlo)
        to: destinatario,
        subject: 'Nueva PQRS Generada',
        html: `
            <p>Estimado  Dario Perdomo</p>
            <p>Le informamos que se ha generado una nueva PQRS en el sistema:</p>
            <ul>
                <li><strong>Fecha de la PQRS:</strong> ${fecha}</li>
                <li><strong>Realizada por:</strong> ${realiza}</li>
                <li><strong>Tipo de PQRS:</strong> ${tipo}</li>
                <li><strong>Descripción:</strong> ${descripcion}</li>
            </ul>
            <p>Por favor, tome las acciones necesarias para revisar y responder según corresponda.</p>
            <p>Atentamente,</p>
            <p>Tu Equipo de Soporte</p>
        `
    };

    // Enviar el correo electrónico
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error al enviar el correo electrónico:', error);
        } else {
            console.log('Correo electrónico enviado:', info.response);
        }
    });
}












app.get('/menuGerencia', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        res.render('admin/menugerencia.hbs', { nombreUsuario });
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});













async function obtenerDatoscontabilidadA() {
    return new Promise((resolve, reject) => {
      const query = "SELECT placa, NOMBRES_CONTRATO, VALOR_ADMINISTRACION,junio FROM contabilidad";
      pool.query(query, (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });
  }
  app.get('/Calcular_administracion', async (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        const fechaActual = new Date();
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const mesActual = meses[fechaActual.getMonth()]; // Obtener el nombre del mes actual

        try {
            const vehiculos = await obtenerDatoscontabilidadA();
            // Obtener el valor de administración para el mes actual
            const valorAdminMesActual = obtenerValorAdministracionMesActual(vehiculos, mesActual);
            res.render('contabilidadyfinanzas/administracion/calcular_administracion.hbs', { nombreUsuario, vehiculos, valorAdminMesActual });
        } catch (error) {
            console.error("Error al obtener datos de vehículos:", error);
            res.status(500).send("Error interno del servidor.");
        }
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});

function obtenerValorAdministracionMesActual(vehiculos, mesActual) {
    // Buscar el valor de administración correspondiente al mes actual en el array de vehículos
    for (const vehiculo of vehiculos) {
        if (vehiculo[mesActual]) {
            return vehiculo[mesActual];
        }
    }
    return null; // Si no se encuentra el valor para el mes actual, se puede devolver null o algún otro valor predeterminado
}


function obtenerValorAdministracionMesActual(vehiculos, mesActual) {
    // Buscar el valor de administración correspondiente al mes actual en el array de vehículos
    for (const vehiculo of vehiculos) {
        if (vehiculo[mesActual]) {
            return vehiculo[mesActual];
        }
    }
    return null; // Si no se encuentra el valor para el mes actual, se puede devolver null o algún otro valor predeterminado
}

// Ruta para manejar las solicitudes POST para actualizar el valor en la base de datos
app.post('/actualizar_valor_pagar', (req, res) => {
    const { mes, valor, placa } = req.body;
  
    // Log de la solicitud para depuración
    console.log(`Valor recibido: ${valor}, Mes: ${mes}, Placa: ${placa}`);
  
    // Aquí debes escribir el código para actualizar el valor en la base de datos según el mes recibido
  
    // Convertir el valor a un número decimal
    const valorDecimal = parseFloat(valor);
  
    // Por ejemplo, podrías ejecutar una consulta SQL para actualizar el valor
    const sql = `UPDATE contabilidad SET ${mes} = ? WHERE placa = ?`;
  
    pool.query(sql, [valorDecimal, placa], (err, result) => {
      if (err) {
        console.error('Error al ejecutar la consulta SQL: ', err);
        res.status(500).send('Error al actualizar el valor en la base de datos');
        return;
      }
      console.log('Valor actualizado correctamente en la base de datos');
      res.status(200).send('Valor actualizado correctamente');
    });
});
























const getIndicadores = async () => {
    const connection = await mysql.createConnection({
        host: "69.61.31.131",
        user: "viancote_soporte",
        password: "MXPwPzz4zlU=",
        database: "viancote_nodelogin",
        port: "3306"
    });

    try {
        // Obtener la fecha actual y la fecha hace 15 días
        const hoy = new Date();
        const hace15Dias = new Date();
        hace15Dias.setDate(hace15Dias.getDate() - 15);

        // Consulta para obtener el número de recepciones hoy
        const [recepcionesHoyResult] = await connection.promise().query('SELECT COUNT(*) AS recepcionesHoy FROM aeropuerto WHERE DATE(fecha) = ?', [hoy.toISOString().split('T')[0]]);

        // Consulta para obtener el número de recepciones mensuales
        const firstDayOfMonth = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const lastDayOfMonth = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        const firstDayOfMonthString = firstDayOfMonth.toISOString().split('T')[0];
        const lastDayOfMonthString = lastDayOfMonth.toISOString().split('T')[0];
        const [recepcionesMensualesResult] = await connection.promise().query('SELECT COUNT(*) AS recepcionesMensuales FROM aeropuerto WHERE fecha >= ? AND fecha <= ?', [firstDayOfMonthString, lastDayOfMonthString]);

        // Consulta para obtener el número de recepciones en los últimos 15 días
        const [recepcionesUltimos15Result] = await connection.promise().query('SELECT COUNT(*) AS recepcionesUltimos15 FROM aeropuerto WHERE fecha >= ? AND fecha < ? AND fecha < ?', [hace15Dias.toISOString().split('T')[0], hoy.toISOString().split('T')[0], firstDayOfMonthString]);

        // Consulta para obtener el conductor que más realiza en los últimos 15 días
        const [conductorMasActivoResult] = await connection.promise().query('SELECT conductor, COUNT(*) AS cantidad FROM aeropuerto WHERE fecha >= ? AND fecha < ? GROUP BY conductor ORDER BY cantidad DESC LIMIT 1', [hace15Dias.toISOString().split('T')[0], hoy.toISOString().split('T')[0]]);

        // Consulta para obtener el cliente que más ha estado activo en los últimos 15 días
        const [clienteMasActivoResult] = await connection.promise().query('SELECT cliente, COUNT(*) AS cantidad FROM aeropuerto WHERE fecha >= ? AND fecha < ? GROUP BY cliente ORDER BY cantidad DESC LIMIT 1', [hace15Dias.toISOString().split('T')[0], hoy.toISOString().split('T')[0]]);

        // Devuelve los indicadores como un objeto
        return {
            recepcionesHoy: recepcionesHoyResult[0].recepcionesHoy,
            recepcionesUltimos15: recepcionesUltimos15Result[0].recepcionesUltimos15,
            recepcionesMensuales: recepcionesMensualesResult[0].recepcionesMensuales,
            conductorMasActivo: conductorMasActivoResult.length > 0 ? conductorMasActivoResult[0].conductor : 'N/A', // Si no hay resultados, muestra 'N/A'
            clienteMasActivo: clienteMasActivoResult.length > 0 ? clienteMasActivoResult[0].cliente : 'N/A' // Si no hay resultados, muestra 'N/A'
        };
    } catch (err) {
        throw new Error(err.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

module.exports = {
    getIndicadores
};


  
// Tu ruta para indicadoresAERO
app.get('/indicadoresAERO', async (req, res) => {
    if (req.session.loggedin === true) {
      const nombreUsuario = req.session.name;
      try {
        const indicadores = await getIndicadores();
        res.render('operaciones/aeropuerto/indicadores.hbs', { 
          nombreUsuario, 
          indicadores 
        });
      } catch (error) {
        console.error('Error al obtener los indicadores:', error.message);
        res.status(500).send('Error al obtener los indicadores');
      }
    } else {
      // Manejo para el caso en que el usuario no está autenticado
      res.redirect("/login");
    }
  });




// Ruta para descargar el informe en Excel
router.get('/descargar-informe-excel-aeropuerto', async (req, res) => {
    try {
        const fechaInicio = req.query.fechaInicio;
        const fechaFin = req.query.fechaFin;

        // Aquí debes obtener los datos del servidor usando las fechas proporcionadas
        const datos = await obtenerDatosParaExcel(fechaInicio, fechaFin);

        // Crear el archivo Excel
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Informe');

        // Agregar encabezados con los nombres correctos
        worksheet.addRow(['Fecha', 'Cliente', 'Nombre del Pasajero', 'Vuelo', 'Placa', 'Conductor']);

        // Agregar datos
        datos.forEach(dato => {
            worksheet.addRow([dato.fecha, dato.cliente, dato.nombre_pasajero, dato.vuelo, dato.placa, dato.conductor]);
        });

        // Configurar el tipo de contenido y enviar el archivo Excel al cliente
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=informe.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error al descargar el informe en Excel:', error);
        res.status(500).send('Error al generar el informe en Excel');
    }
});

// Función para obtener los datos desde la base de datos
async function obtenerDatosParaExcel(fechaInicio, fechaFin) {
    return new Promise((resolve, reject) => {
        // Realiza la consulta a la base de datos utilizando las fechas proporcionadas
        const query = `SELECT fecha, cliente, nombre_pasajero, vuelo, placa, conductor FROM aeropuerto WHERE fecha BETWEEN ? AND ?`;
        pool.query(query, [fechaInicio, fechaFin], (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}














// Ruta para manejar la solicitud POST de guardar edición
app.post('/guardar_edicionAE', function(req, res) {
    const datosEditados = req.body;
  
    // Consulta SQL para actualizar los datos
    const sql = `UPDATE aeropuerto  SET  cliente = ?, hora = ?, nombre_pasajero = ?, vuelo = ?, placa = ?, conductor = ?, celular_conductor = ? WHERE id = ?`;
    const values = [
      datosEditados.cliente,
      datosEditados.hora,
      datosEditados.nombre_pasajero,
      datosEditados.vuelo,
      datosEditados.placa,
      datosEditados.conductor,
      datosEditados.celular_conductor,
      datosEditados.id
    ];
  
    // Ejecutar la consulta SQL
    pool.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error al actualizar los datos:', err);
        res.status(500).send('Error al actualizar los datos');
      } else {
        console.log('Datos actualizados correctamente');
        res.send('Datos actualizados correctamente');
      }
    });
  });



// Ruta para consultar PQRS con estado null
router.get('/seguimientopqr', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;

        // Consultar PQRS con estado null
        const query = `
            SELECT * 
            FROM pqrs
            WHERE estado IS NULL
        `;

        pool.query(query, (error, results) => {
            if (error) {
                console.error('Error al obtener PQRS:', error);
                res.status(500).send('Error interno al obtener PQRS');
            } else {
                // Modificar resultados para mostrar "Pendiente" cuando estado es null
                results.forEach(pqr => {
                    if (pqr.estado === null) {
                        pqr.estado = 'Pendiente';
                    }
                });

                res.render('Comercial/PQRS/seguimientopqr.hbs', { nombreUsuario, pqrsList: results });
            }
        });
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});



// Función para formatear la fecha
function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}


app.post('/guardar-seguimientoo', (req, res) => {
    const pqrsId = req.body.pqrsId;
    const responsable = req.body.responsable;
    const fechaSeguimiento = req.body.fechaSeguimiento;
    const seguimiento = req.body.seguimiento;
    const acciones = req.body.acciones;
    const correoDestino = req.body.correo;
    const realiza = req.body.realiza;
    const descripcion = req.body.descripcion;

    const fecha = req.body.fecha; // Asegúrate de que esta variable coincida con el nombre del campo en tu formulario
    
    // Validación de campos
    if (!responsable || !fechaSeguimiento || !seguimiento || !acciones) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    // Aquí continúa tu lógica de actualización en la base de datos y envío de correo
    // Ejemplo:
    const sql = 'UPDATE pqrs SET responsable = ?, fecha_seguimiento = ?, seguimiento = ?, acciones = ?, estado = ? WHERE id = ?';
    pool.query(sql, [responsable, fechaSeguimiento, seguimiento, acciones, 'Respondida', pqrsId], (err, result) => {
        if (err) {
            console.error('Error al guardar el seguimiento:', err);
            return res.status(500).send('Error al guardar el seguimiento');
        }

        // Configurar el contenido del correo
        const mailOptions = {
            from: 'soporte.it.vianco@gmail.com',
            to: correoDestino,
            subject: 'Respuesta a PQRS',
            html: `
                <p>Estimado/a Usuario/a,</p>
                <p>Su PQRS ha sido respondida satisfactoriamente. A continuación, encontrará los detalles:</p>
                <table border="1" cellpadding="5" cellspacing="0">
                    <tr>
                        <td><strong>Responsable del seguimiento:</strong></td>
                        <td>${responsable}</td>
                    </tr>
                    <tr>
                        <td><strong>Fecha de Seguimiento:</strong></td>
                        <td>${fechaSeguimiento}</td>
                    </tr>
                    <tr>
                        <td><strong>Seguimiento realizado:</strong></td>
                        <td>${seguimiento}</td>
                    </tr>
                    <tr>
                        <td><strong>Acciones a tomar:</strong></td>
                        <td>${acciones}</td>
                    </tr>
                    <tr>
                        <td><strong>Fecha de creación de la PQRS:</strong></td>
                        <td>${fecha}</td> <!-- Asegúrate de que 'fecha' esté disponible y tenga el formato correcto -->
                    </tr>
                    <tr>
                        <td><strong>Correo del usuario:</strong></td>
                        <td>${correoDestino}</td>
                    </tr>
                    <tr>
                        <td><strong>Realiza:</strong></td>
                        <td>${realiza}</td>
                    </tr>
                    <tr>
                        <td><strong>Descripción:</strong></td>
                        <td>${descripcion}</td> <!-- Ajusta según cómo recibes 'descripcion' en req.body -->
                    </tr>
                </table>
                <p>Gracias por su atención.</p>
                <p>Atentamente,</p>
                <p>Equipo de Soporte</p>
            `
        };

        // Envía el correo electrónico y maneja la respuesta
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error al enviar el correo:', error);
                // Manejo de error al enviar correo
            } else {
                console.log('Correo enviado:', info.response);
                // Manejo de éxito al enviar correo
            }
        });

        // Redirigir de vuelta a la misma página o a donde sea necesario
        res.redirect('/seguimientopqr'); // Ajusta esta ruta según tu configuración
    });
});















app.get('/consultapqr', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;

        // Consulta SQL para obtener las PQRS
        const sql = 'SELECT * FROM pqrs';
        pool.query(sql, (err, results) => {
            if (err) {
                console.error('Error al consultar las PQRS:', err);
                return res.status(500).send('Error al consultar las PQRS');
            }

            // Filtrar las PQRS según su estado
            const pendientes = results.filter(pqr => pqr.estado === null);
            const completadas = results.filter(pqr => pqr.estado === 'Respondida');

            // Renderizar la plantilla con los datos
            res.render('Comercial/PQRS/consulta_pqr.hbs', {
                nombreUsuario,
                pendientes,
                completadas
            });
        });
    } else {
        // Manejo para el caso en que el usuario no está autenticado
        res.redirect("/login");
    }
});


app.get('/consultapqr/:tipo', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;
        const tipoPQRS = req.params.tipo;

        let sql;
        if (tipoPQRS === 'pendientes') {
            sql = 'SELECT * FROM pqrs WHERE estado IS NULL';
        } else if (tipoPQRS === 'completadas') {
            sql = 'SELECT * FROM pqrs WHERE estado = "Respondida"';
        } else if (tipoPQRS === 'todas') {
            sql = 'SELECT * FROM pqrs';
        } else {
            return res.status(400).send('Tipo de PQRS no válido');
        }

        pool.query(sql, (err, results) => {
            if (err) {
                console.error('Error al consultar las PQRS:', err);
                return res.status(500).send('Error al consultar las PQRS');
            }

            let htmlResult = '';
            results.forEach(pqr => {
                htmlResult += `
                    <tr>
                        <td>${pqr.id}</td>
                        <td>${formatDate(pqr.fecha)}</td>
                        <td>${pqr.correo}</td>
                        <td>${pqr.realiza}</td>
                        <td>${pqr.tipo}</td>
                        <td>${pqr.descripcion}</td>
                        <td>${pqr.estado}</td>
                        <td>${pqr.responsable}</td>
                          <td>${pqr.fecha_seguimiento}</td>
                        <td>${pqr.seguimiento}</td>
                        <td>${pqr.acciones}</td>
                    </tr>
                `;
            });

            res.send(htmlResult);
        });
    } else {
        res.redirect("/login");
    }
});

function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}



router.get('/EnvioActas', (req, res) => {
    if (req.session.loggedin === true) {
        const nombreUsuario = req.session.name;

        const query = `
            SELECT 
                c.id, 
                c.nombre, 
                c.correoacta, 
                c.imagen, 
                IFNULL(es.enviado, 0) AS enviado
            FROM 
                clientes c
            LEFT JOIN 
                email_status es 
            ON 
                c.id = es.cliente_id AND es.fecha = CURDATE();
        `;

        pool.query(query, (error, results, fields) => {
            if (error) {
                console.error('Error al obtener clientes desde MySQL:', error);
                res.status(500).send('Error al obtener clientes desde la base de datos');
            } else {
                const clientes = results;
                res.render('operaciones/actasTasGo/enviodeactas.hbs', { nombreUsuario, clientes });
            }
        });

    } else {
        res.redirect("/login");
    }
});


app.post('/EnvioActas', upload.array('archivosPDF', 4), (req, res) => {
    if (req.session.loggedin !== true) {
        return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const clienteCorreo = req.body.cliente;
    const nombreCliente = req.body.nombreCliente;
    const archivosPDF = req.files;

    if (!archivosPDF || archivosPDF.length === 0) {
        return res.status(400).json({ message: 'Debes seleccionar al menos un archivo PDF.' });
    }

    console.log('Archivos recibidos:', archivosPDF);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'callcenter.vianco@gmail.com',
            pass: 'fnbzfemxneqjmvwc'
        }
    });

    const fechaEnvio = new Date();
    const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
    const fechaFormateada = fechaEnvio.toLocaleDateString('es-ES', opciones);

    const messageId = `<${uuidv4()}@example.com>`;
    const uniqueSubject = `Relación de Servicios ${nombreCliente} ${fechaFormateada}`;

    const mailOptions = {
        from: 'callcenter.vianco@gmail.com',
        to: clienteCorreo,
        subject: uniqueSubject,
        html: `
            <style>
                body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f9; padding: 20px; }
                .email-container { width: 100%; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #fff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                .email-header { font-size: 1.5em; font-weight: bold; color: #2c3e50; margin-bottom: 20px; text-align: center; }
                .email-body { font-size: 1em; margin-bottom: 20px; color: #555; }
                .email-body p { margin-bottom: 20px; }
                .highlight { font-weight: bold; font-size: 1.2em; color: #e74c3c; }
                .bold-large { font-weight: bold; font-size: 1.3em; color: #333; }
                .email-footer { font-size: 1.1em; font-weight: bold; margin-top: 20px; color: #2c3e50; text-align: center; }
            </style>
            <div class="email-container">
                <div class="email-header">
                    Buen día ${nombreCliente},
                </div>
                <div class="email-body">
                    <p>Se realiza el envío de la relación de los servicios de transporte realizados el día ${fechaFormateada}.</p>
                    <p class="bold-large">Por favor tener en cuenta que algunos servicios recibidos cargados al correo electrónico durante el día tienen observaciones que incluyen el costo real de acuerdo a las novedades que se puedan presentar.</p>
                    <p class="highlight">Nota: Agradecemos dar respuesta a este correo con el fin de verificar que los servicios en el acta presentada son correctos. En caso de no recibir notificación alguna en 24 horas se dará por aprobada dicha acta y se procederá a su facturación.</p>
                </div>
                <div class="email-footer">
                    <strong>Cordialmente,</strong>
                </div>
            </div>
        `,
        messageId: messageId,
        attachments: archivosPDF.map(file => ({
            filename: file.originalname,
            content: file.buffer
        }))
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error al enviar correo electrónico:', error);
            return res.status(500).json({ message: 'Error al enviar correo electrónico' });
        }

        console.log('Correo electrónico enviado:', info.response);
        pool.query('SELECT id FROM clientes WHERE correoacta = ?', [clienteCorreo], (err, result) => {
            if (err) {
                console.error('Error al obtener cliente ID:', err);
                return res.status(500).json({ message: 'Error al obtener cliente ID' });
            }
            if (result.length > 0) {
                const clienteId = result[0].id;
                const fechaActual = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
                pool.query(
                    'INSERT INTO email_status (cliente_id, fecha, enviado) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE enviado = ?',
                    [clienteId, fechaActual, true, true],
                    (err) => {
                        if (err) {
                            console.error('Error al actualizar estado de correo:', err);
                            return res.status(500).json({ message: 'Error al actualizar estado de correo' });
                        }
                        console.log('Estado del correo actualizado correctamente en la base de datos');
                        res.json({ message: 'Archivos subidos y correo enviado exitosamente' });
                    }
                );
            } else {
                res.status(404).json({ message: 'Cliente no encontrado' });
            }
        });
    });
});



app.get('/api/emailStatus', (req, res) => {
    pool.query('SELECT cliente_id, fecha, enviado FROM email_status WHERE fecha = CURDATE()', (err, results) => {
        if (err) {
            console.error('Error al obtener estado de los correos:', err);
            return res.status(500).json({ message: 'Error al obtener estado de los correos' });
        }
        res.json(results);
    });
});






app.get('/test', async (req, res) => {
    try {
        await testConnection(req);
        res.send('Consulta ejecutada correctamente.');
    } catch (error) {
        console.error('Error en la ruta /test:', error.message);
        res.status(500).send('Error en la consulta.');
    }
});
// Assuming req.db correctly holds your connection pool as exported from your connection setup file

async function testConnection(req) {
    let pool;
    try {
        pool = req.db; // Assuming req.db holds the connection pool correctly

        // Acquire a connection from the pool
        const connection = await pool.promise().getConnection();

        console.log('Connected to MySQL.');

        // Execute a test query
        const [rows, fields] = await connection.query('SELECT 1 + 1 AS result');
        console.log('Query result:', rows[0].result);

        // Release the connection back to the pool
        connection.release();
        console.log('Connection released.');

    } catch (error) {
        console.error('Error connecting or executing query:', error.message);
        throw error; // Throw the error to handle it in the calling route or function
    }
}



// Inicia el servidor de Socket.IO en el puerto especificado
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor Socket.IO escuchando en el puerto ${PORT}`);
});


const EXPRESS_PORT = 3001; // Elige el puerto que desees para la aplicación Express
app.listen(EXPRESS_PORT, () => {
    console.log(`Aplicación Express escuchando en el puerto ${EXPRESS_PORT}`);
});