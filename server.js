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

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url_input;

  if (!validUrl.isWebUri(url)) {
    res.json({ 'error': 'Invalid URL' });
  } else {
    urlModel.find()
      .exec()
      .then(data => {
        new urlModel({
          id: data.length + 1,
          url: url
        })
          .save()
          .then(() => {
            res.json({
              original_url: url,
              short_url: data.length + 1
            });
          })
          .catch(err => {
            res.json(err);
          })
      })
  }
});

app.get('/api/shorturl/:number', (req, res) => {
  urlModel.find({ id: req.params.number })
    .exec()
    .then(url => {
      res.redirect(url[0]["url"])
    })
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});