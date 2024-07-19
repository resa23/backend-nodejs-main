const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const { PythonShell } = require('python-shell');

const app = express();
const port = process.env.PORT || 3005;  // Ubah port ke 3005

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(express.static('public'));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('model'), (req, res) => {
  const algorithm = req.body.algorithm;

  // Data dummy untuk clustering
  const data = [
    [1.0, 2.0],
    [1.5, 1.8],
    [5.0, 8.0],
    [8.0, 8.0],
    [1.0, 0.6],
    [9.0, 11.0],
    [8.0, 2.0],
    [10.0, 2.0],
    [9.0, 3.0]
  ];

  const options = {
    args: [
      path.join(__dirname, 'uploads', req.file.originalname),
      JSON.stringify(data)
    ]
  };

  PythonShell.run('load_model.py', options, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error occurred while loading data.');
    } else {
      res.json({ clusters: JSON.parse(results[0]) });
    }
  });
});

// Database connection
mongoose.connect('mongodb://localhost:27017/mydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected...'))
.catch(err => console.log(err));

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
