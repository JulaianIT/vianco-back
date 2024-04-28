const bcrypt = require("bcrypt"); // Importa el módulo bcrypt para el cifrado de contraseñas
const nodemailer = require("nodemailer");
const express = require('express');
const app = express();

// Configuración del transporte del correo electrónico
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'recepciones.vianco@gmail.com',
        pass: 'xaezkqbzfsuegqhm'
    }
});

// Función para renderizar la vista de inicio de sesión
function login(req, res) {
    if (req.session.loggedin != true) {
        res.render("login/index"); // Renderiza la vista de inicio de sesión al usuario
    } else {
        res.redirect("/");
    }
}

// Función para autenticar al usuario
function auth(req, res) {
    const data = req.body;
    const connection = req.db; // Obtener la conexión a la base de datos desde req.db

    connection.query("SELECT * FROM user WHERE email = ?", data.email, (err, userData) => {
        if (err) {
            console.error("Error al buscar usuario en la base de datos:", err);
            res.status(500).send("Error interno del servidor");
            return;
        }

        if (userData.length > 0) {
            const user = userData[0]; // Obtener el primer usuario encontrado
            bcrypt.compare(data.password, user.password, (err, isMatch) => {
                if (err) {
                    console.error("Error al comparar contraseñas:", err);
                    res.status(500).send("Error interno del servidor");
                    return;
                }
                if (!isMatch) {
                    res.render("login/index", { error: "Clave incorrecta" });
                } else {
                    req.session.loggedin = true;
                    req.session.name = user.name; // Asumiendo que el usuario tiene un campo 'name'

                    // Establecer req.session.roles con los roles del usuario si es una cadena
                    req.session.roles = typeof user.roles === 'string' ? user.roles.split(',') : [];

                    // Registro de depuración para verificar el valor de req.session.roles
                    console.log("Valor de req.session.roles:", req.session.roles);

                    res.redirect("/");
                }
            });
        } else {
            res.render("login/index", { error: "El usuario no existe" });
        }
    });
}

// Función para renderizar la vista de registro
function register(req, res) {
    if (req.session.loggedin != true) {
        res.render("login/register"); // Renderiza la vista de inicio de sesión al usuario
    } else {
        res.redirect("/");
    }
}

// Función para manejar el almacenamiento de usuarios
function storeUser(req, res) {
    const data = req.body; // Obtiene los datos de la solicitud
    const connection = req.db; // Obtiene la conexión a la base de datos desde req.db

    connection.query("SELECT * FROM user WHERE email = ?", data.email, (err, userData) => {
        if (err) {
            console.error("Error al buscar usuario en la base de datos:", err);
            res.status(500).send("Error interno del servidor");
            return;
        }

        if (userData.length > 0) {
            res.render("login/register", { error: "Ya existe un usuario con ese correo electrónico" });
            return;
        }

        bcrypt.hash(data.password, 12)
            .then(hash => {
                data.password = hash;
                connection.query("INSERT INTO user SET ?", data, (err, rows) => {
                    if (err) {
                        console.error("Error al insertar usuario en la base de datos:", err);
                        res.status(500).send("Error interno del servidor");
                    } else {
                        console.log("Usuario registrado correctamente");
                        res.redirect("/");
                    }
                });
            })
            .catch(err => {
                console.error("Error al cifrar la contraseña:", err);
                res.status(500).send("Error interno del servidor");
            });
    });
}

// Función para cerrar sesión
function logout(req, res) {
    if (req.session.loggedin == true) {
        req.session.destroy(); // Destruye la sesión del usuario
        res.redirect("/login");
    } else {
        res.redirect("/login");
    }
}

// Función para renderizar la vista de solicitud de restablecimiento de contraseña
function forgotPasswordPage(req, res) {
    res.render("login/forgotPassword.hbs");
}

// Función para generar un token aleatorio
function generateToken() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 32;
    let token = '';
    for (let i = 0; i < length; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
}

// Función para manejar la solicitud de restablecimiento de contraseña
function forgotPassword(req, res, connection) {
    const { email } = req.body;

    // Consulta SQL para buscar el correo electrónico en la base de datos
    const sql = 'SELECT * FROM user WHERE email = ?';

    connection.query(sql, [email], (err, result) => {
        if (err) {
            console.error("Error al buscar el correo electrónico en la base de datos:", err);
            res.status(500).send("Error interno del servidor");
            return;
        }

        // Verificar si el correo electrónico existe en la base de datos
        if (result.length > 0) {
            const tokenExpiration = 24 * 60 * 60 * 1000; // 24 horas de expiración del token en milisegundos
            const tokenExpirationDate = new Date(Date.now() + tokenExpiration);
            const token = generateToken();

            connection.query('INSERT INTO reset_tokens (email, token, expiration_date) VALUES (?, ?, ?)', [email, token, tokenExpirationDate], (err, result) => {
                if (err) {
                    console.error("Error al insertar el token en la base de datos:", err);
                    res.status(500).send("Error interno del servidor");
                    return;
                }
                console.log("Token almacenado en la base de datos correctamente");

                // Envío de correo electrónico de recuperación
                const resetPasswordLink = 'https://vianco-back-svdl.onrender.com/reset-password?token=' + token;
                const mailOptions = {
                    from: 'tu_correo@gmail.com',
                    to: email,
                    subject: 'Recuperación de Contraseña',
                    text: 'Haga clic en el siguiente enlace para restablecer su contraseña: ' + resetPasswordLink
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Error al enviar correo de recuperación:", error);
                        res.status(500).send("Error al enviar correo de recuperación");
                    } else {
                        console.log("Correo de recuperación enviado:", info.response);
                        res.render("login/forgotPasswordSuccess"); // Renderizar una página de éxito de recuperación de contraseña
                    }
                });
            });
        } else {
            // El correo electrónico no existe en la base de datos
            res.render("login/forgotPasswordNotFound"); // Renderizar una página indicando que el correo electrónico no se encuentra
        }
    });
}

// Función para manejar el restablecimiento de contraseña
function resetPassword(req, res, connection) {
    const { token, newPassword } = req.body;

    // Consulta SQL para buscar el usuario utilizando el token de restablecimiento de contraseña
    const sql = 'SELECT * FROM user WHERE reset_token = ?';

    connection.query(sql, [token], (err, result) => {
        if (err) {
            console.error("Error al buscar el usuario en la base de datos:", err);
            res.status(500).send("Error interno del servidor");
            return;
        }

        // Verificar si se encontró el usuario con el token dado
        if (result.length === 1) {
            const userId = result[0].id;

            // Generar el hash de la nueva contraseña
            bcrypt.hash(newPassword, 12, (err, hash) => {
                if (err) {
                    console.error("Error al cifrar la nueva contraseña:", err);
                    res.status(500).send("Error interno del servidor");
                    return;
                }

                // Consulta SQL para actualizar la contraseña del usuario
                const updateSql = 'UPDATE user SET password = ?, reset_token = NULL WHERE id = ?';

                connection.query(updateSql, [hash, userId], (err, updateResult) => {
                    if (err) {
                        console.error("Error al actualizar la contraseña en la base de datos:", err);
                        res.status(500).send("Error interno del servidor");
                        return;
                    }

                    // Verificar si se actualizó correctamente la contraseña
                    if (updateResult.affectedRows === 1) {
                        // Envía una respuesta indicando que el restablecimiento de contraseña fue exitoso
                        res.send('Password reset successful!'); 
                    } else {
                        res.status(400).send('Error al restablecer la contraseña. El token podría ser inválido o haber expirado.');
                    }
                });
            });
        } else {
            res.status(400).send('Token inválido. Por favor, solicita un nuevo enlace para restablecer tu contraseña.');
        }
    });
}


// Exporta las funciones para que estén disponibles para otros módulos
module.exports = {
    login,
    register,
    storeUser,
    auth,
    logout,
    forgotPasswordPage,
    forgotPassword,
    resetPassword
};
