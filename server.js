const express = require('express');
const cors = require('cors');
const path = require('path');

const pvpcRouter = require('./api/pvpc');

const app = express();
const PORT = 3000;

// ✅ Permitir CORS para todos los orígenes
app.use(cors());

// ✅ Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Ruta API PVPC
app.use('/api/pvpc', pvpcRouter);

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));