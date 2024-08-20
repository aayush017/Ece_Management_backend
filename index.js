const connectToMongo = require("./db");
const express = require("express");
const cors = require("cors");
const path = require('path');

connectToMongo();
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({
  origin: '*'
}));

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, './dist')));

// Define your API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/transaction", require("./routes/transaction"));
app.use("/api/equipment", require("./routes/equipment"));
app.use("/api/transaction", require("./routes/transaction"));

// Serve the index.html file for any other requests
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, './dist/index.html');
  res.sendFile(indexPath);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
