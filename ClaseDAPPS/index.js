const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Cors = require('cors');

//const userRoutes = require('./routes/user');
const pagosRoutes = require('./routes/pagos');
const walletRoutes = require('./routes/wallet');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(Cors());

//app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/pagos', pagosRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server at port ${PORT}`));