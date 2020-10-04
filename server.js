import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import Pusher from 'pusher';
import Messages from './dbMessages.js';
import cors from 'cors';
import dotenv from 'dotenv'

dotenv.config()

const app = express();

// Parses incoming requests with json payloads
app.use(express.json());
app.use(cors());
// Allow request to be accepted from anywhere
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});
const port = process.env.PORT || 9001;

const conn_url =
  'mongodb+srv://thor:sAGMwTYoc0UW61qn@cluster0.6qvhc.mongodb.net/Cluster0?retryWrites=true&w=majority';

mongoose.connect(conn_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Pusher config
const pusher = new Pusher({
  appId: process.env.APP_ID,
  key: process.env.KEY,
  secret: process.env.SECRET,
  cluster: process.env.CLUSTER,
  encrypted: true,
});

const db = mongoose.connection;

db.once('open', () => {
  console.log('Db connected');

  const msgCollection = db.collection('messages');
  const changeStream = msgCollection.watch();

  changeStream.on('change', (change) => {
    console.log(change);

    if (change.operationType == 'insert') {
      const messageDetails = change.fullDocument;
      pusher.trigger('messages', 'inserted', {
        name: messageDetails.name,
        message: messageDetails.message,
        received: messageDetails.received,
      });
    } else {
      console.log('Error triggering pusher');
    }
  });
});

app.get('/', (req, res) => {
  res.status(200).send('Hello');
});

app.get('/messages/sync', (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post('/messages/new', (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(`Message created, ${data}`);
    }
  });
});

app.listen(port, () => console.log(`Server running on ${port}`));
