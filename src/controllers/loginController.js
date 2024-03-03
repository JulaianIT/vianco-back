const bcrypt = require("bcrypt"); // Importa el módulo bcrypt para el cifrado de contraseñas

// Función para renderizar la vista de inicio de sesión
function login(req, res) {
    if (req.session.loggedin != true) {
        res.render("login/index"); // Renderiza la vista de inicio de sesión al usuario
    } else {
        res.redirect("/");
    }
}

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
function logout(req, res) {
    if (req.session.loggedin == true) {
        req.session.destroy(); // Corregir 'red.session.destroy()' a 'req.session.destroy()'
        res.redirect("/login");
    } else {
        res.redirect("/login");
    }
}


// Exporta las funciones para que estén disponibles para otros módulos
// Exporta las funciones para que estén disponibles para otros módulos
module.exports = {
    login, // Función para iniciar sesión
    register, // Función para registrar usuarios
    storeUser, // Función para almacenar usuarios
    auth,
    logout, // Agrega la función logout aquí
};
