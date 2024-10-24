const express = require("express");
const mongoose = require("mongoose");
const dotEnv = require("dotenv");
const app = express();
const cors = require('cors')
dotEnv.config();
console.log("PORT from .env:", process.env.PORT); // Check if the port is loading properly

// Middleware (replacing body-parser)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true, // Typo fixed
  })
);
app.use('/api', require('./routes/routes'))

const db = async () => {
  try {
    await mongoose.connect(process.env.db_url, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('db connected');
  } catch (error) {
    console.error('Database connection error:', error); // Error message will be logged
  }
};
db()

const port = process.env.PORT || 3000; // Default port to 3000 if PORT is not defined

// Basic route
app.get("/", (req, res) => res.send("Server is running!"));

// Start server
app.listen(port, (err) => {
  if (err) {
    console.error("Failed to start server:", err);
  } else {
    console.log(`Example app listening on port ${port}!`);
  }
});
