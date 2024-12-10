require('dotenv').config();

const validUrl = require('valid-url');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URL);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open', () => {
  console.log('MongoDB Connection Successful');
});

const urlModel = mongoose.model('url', new mongoose.Schema({
  id: Number,
  url: String
}));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url;

  console.log('URL:: ', req.body.url);

  if (!validUrl.isWebUri(url)) {
    return res.json({ 'error': 'Invalid URL' });
  }
  
  try {
    const count = await urlModel.countDocuments();
    const newUrl = new urlModel({
      id: count + 1,
      url: url
    });
    await newUrl.save();
    res.json({
      original_url: url,
      short_url: count + 1
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/shorturl/:number', (req, res) => {
  const number = parseInt(req.params.number, 10);

  if (isNaN(number)) {
    return res.status(400).json({ error: 'Invalid ID parameter' });
  }

  urlModel.findOne({ id: number })
    .exec()
    .then(url => {
      if (!url) {
        return res.status(404).json({ error: 'No URL found for the given ID' });
      }
      res.redirect(url.url);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});


app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});