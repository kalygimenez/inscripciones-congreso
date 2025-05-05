// server/app.js
import express from 'express';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3001;

// Obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos y parsear JSON
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Ruta raíz → index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta para crear la preferencia y redirigir al checkout
app.get('/pagos', async (req, res) => {
  try {
    const mpResponse = await axios.post(
      'https://api.mercadopago.com/checkout/preferences',
      {
        items: [
          {
            title: 'Inscripción Congreso',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: 130000    // Precio: $130.000,00
          }
        ],
        back_urls: {
          success: `http://localhost:${port}/yapague.html`,
          failure: `http://localhost:${port}/yapague.html`,
          pending: `http://localhost:${port}/yapague.html`
        }
      },
      {
        headers: {
          Authorization: 'Bearer APP_USR-2411392677568567-083010-eaddba35f792ec5c2d4b3591411b3e98__LD_LC__-59441742',
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

// Endpoint para recibir datos del formulario "Ya pagué"
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

// Arrancar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
