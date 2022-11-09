const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

//wildDB
//4t6d8W7wCskoQaqg
//mongodb://localhost:27017
// const uri = 'mongodb://localhost:27017';

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tsmlaiu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const serviceCollection = client.db("HarryDB").collection("services");
    const reviewCollection = client.db("HarryDB").collection("reviews");

    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    app.get("/limited", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const limitedService = await cursor.limit(3).toArray();
      res.send(limitedService);

      // reviews start here
      app.get("/reviews", async (req, res) => {
        let query = {};
        if (req.query.email) {
          query = {
            email: req.query.email,
          };
        }
        if (req.query.id) {
          const sid = req.query.id;
          query = { service : sid };
        }
        const cursor = reviewCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      });

      app.post("/reviews", async (req, res) => {
        const review = req.body;
        const result = await reviewCollection.insertOne(review);
        res.send(result);
      });

      app.delete("/reviews/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await reviewCollection.deleteOne(query);
        res.send(result);
      });
    });
  } finally {
  }
}

run().catch((error) => console.log(error));

app.get("/", (req, res) => {
  res.send("Harry is running");
});

app.listen(port, () => {
  console.log(`Harry server running on ${port}`);
});
