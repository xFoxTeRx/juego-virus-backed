// ===================================================================
// server.js - CÓDIGO FINAL Y COMPLETO
// ===================================================================




require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');
const path = require('path');






const app = express();
const PORT = process.env.PORT || 3000;





// --- Configuración de Seguridad y Base de Datos ---
// **¡IMPORTANTE! PEGA TUS CREDENCIALES REALES AQUÍ**
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

const tokenClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
let db;

// --- Middleware ---
app.use(express.json());

app.use(express.static(__dirname));


app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://prueba10.infinityfree.me',
        'http://127.0.0.1', 
        'http://cochabamba.free.nf',
        'http://localhost:5500', 
        'http://127.0.0.1:5501',
        'https://juegos-virus-api.onrender.com']
}));

// --- Conexión a MongoDB ---
async function connectToMongoDB() {
    const client = new MongoClient(MONGO_URI, {
        serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
    });
    try {
        await client.connect();
        db = client.db("juegos_db");
        console.log("Conexión a MongoDB Atlas exitosa!");
        app.listen(PORT, () => {
            console.log(`Servidor escuchando en http://localhost:${PORT}`);
        });
    } catch(error) {
        console.error("Fallo la conexión a MongoDB:", error);
        process.exit(1);
    }
}
connectToMongoDB();

// --- RUTAS API (CRUD) ---

// [R] Ruta de Bienvenida
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// [C y R] RUTA DE LOGIN (Con Lógica de Seguridad para Progreso)
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    if (!db) return res.status(503).json({ message: 'Base de datos no conectada.' });

    try {
        const ticket = await tokenClient.verifyIdToken({ idToken: token, audience: CLIENT_ID });
        const payload = ticket.getPayload();
        const googleId = payload['sub'];
        const name = payload['name'];
        const email = payload['email'];

        const usuariosCollection = db.collection('usuarios');
        const progresosCollection = db.collection('progresos');

        let usuario = await usuariosCollection.findOne({ google_id: googleId });
        let progreso = await progresosCollection.findOne({ usuario_google_id: googleId });

        if (!usuario) {
            usuario = { google_id: googleId, nombre: name, email: email, fecha_registro: new Date() };
            await usuariosCollection.insertOne(usuario);
        }

        if (!progreso) {
            console.log(`Creando progreso inicial para el usuario: ${name}`);
            progreso = {
                usuario_google_id: googleId,
                nombre: name,
                puntuacion_alta: 0,
                datos_guardados: {} // Objeto vacío para futuros juegos
            };
            await progresosCollection.insertOne(progreso);
        }

        res.json({ success: true, usuario: usuario, progreso: progreso });

    } catch (error) {
        console.error("Error en la autenticación/login:", error);
        res.status(401).json({ success: false, message: 'Token inválido o error de verificación.' });
    }
});

// [U] RUTA DE GUARDADO DE PROGRESO
app.patch('/api/juegos/guardar', async (req, res) => {
    console.log("Recibida petición para guardar:", req.body);
    const { googleId, gameId, newValue } = req.body;

    if (!db) return res.status(503).json({ message: 'Base de datos no conectada.' });

    try {
        const progresosCollection = db.collection('progresos');
        const updateObject = {
            $set: {
                [`datos_guardados.${gameId}`]: newValue
            },
            $max: { // Usa $max para asegurar que puntuacion_alta nunca disminuya
                puntuacion_alta: newValue
            }
        };

        const resultado = await progresosCollection.findOneAndUpdate(
            { usuario_google_id: googleId },
            updateObject,
            { returnDocument: 'after' } // Devuelve el documento actualizado
        );

        if (!resultado.value) {
             return res.status(404).json({ message: 'Progreso de usuario no encontrado.' });
        }
        res.json({ success: true, message: 'Progreso guardado con éxito.', progreso: resultado.value });

    } catch (error) {
        console.error("Error al guardar progreso:", error);
        res.status(500).json({ message: 'Error interno al actualizar el progreso.' });
    }
});

// [R] RUTA GET PARA EL LEADERBOARD
app.get('/api/leaderboard', async (req, res) => {
    if (!db) return res.status(503).json({ message: 'Base de datos no conectada.' });

    try {
        const progresosCollection = db.collection('progresos');
        const leaderboardData = await progresosCollection.find({})
            .sort({ puntuacion_alta: -1 })
            .limit(10)
            .project({ _id: 0, nombre: 1, puntuacion_alta: 1, usuario_google_id: 1 })
            .toArray();

        res.json({ success: true, leaderboard: leaderboardData });

    } catch (error) {
        console.error("Error al obtener el leaderboard:", error);
        res.status(500).json({ message: 'Error interno al obtener las puntuaciones.' });
    }
});