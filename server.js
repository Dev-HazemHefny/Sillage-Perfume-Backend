import express from 'express';
import cors from 'cors';import dotenv from 'dotenv';
import { dbConnection } from './server/config/db.js';
dotenv.config();

const app = express();
dbConnection;
// Middleware
app.use(cors());
app.use(express.json());





const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});