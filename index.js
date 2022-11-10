const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const serviceCollection = client.db("HarryDB").collection("services");
    const reviewCollection = client.db("HarryDB").collection("reviews");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

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

    //service posted here
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    app.get("/limited", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const limitedService = await cursor.limit(3).toArray();
      res.send(limitedService);

      // reviews start here
      app.get("/reviews", async (req, res) => {
        let query = {};
        if (req.query.id) {
          const sid = req.query.id;
          query = { service: sid };
        }
        const cursor = reviewCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      });

      app.get("/myreviews", verifyJWT, async (req, res) => {
        const decoded = req.decoded;
        if (decoded.email !== req.query.email) {
          res.status(403).send({ message: "Forbidden access" });
        }
        let query = {};
        if (req.query.email) {
          query = {
            email: req.query.email,
          };
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
