// server/app.js
import express from 'express';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde tu testyprodu.env
dotenv.config({
  path: path.join(__dirname, '../testyprodu.env'),
  override: true
});

const app = express();
const port = process.env.PORT || 3001;
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

// Servir estáticos y parsear JSON
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Ruta raíz → index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Crear preferencia y redirigir al checkout (sin auto_return)
app.get('/pagos', async (req, res) => {
  try {
    const preferencePayload = {
      items: [
        {
          title: 'Inscripción Congreso',
          quantity: 1,
          currency_id: 'ARS',
          unit_price: 130000  // $130.000,00
        }
      ],
      back_urls: {
        success: `${baseUrl}/yapague.html`,
        failure: `${baseUrl}/yapague.html`,
        pending: `${baseUrl}/yapague.html`
      }
      // auto_return removido para evitar el error en HTTP local
    };

    const mpResponse = await axios.post(
      'https://api.mercadopago.com/checkout/preferences',
      preferencePayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Redirigir al init_point de MercadoPago
    return res.redirect(mpResponse.data.init_point);
  } catch (err) {
    console.error('Error creando preferencia:', err.response?.data || err.message);
    return res.status(500).send('Error procesando el pago. Revisa la consola.');
  }
});

// Endpoint para recibir datos del formulario “Ya pagué”
app.post('/api/inscripcion', (req, res) => {
  const nueva = req.body;
  const filePath = path.join(__dirname, '../data/registros.json');
  const registros = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath))
    : [];

  registros.push(nueva);
  fs.writeFileSync(filePath, JSON.stringify(registros, null, 2));
  res.sendStatus(200);
});

// Levantar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
