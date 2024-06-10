const express = require("express");
const cors = require("cors");
const jsonWebToken = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(
  cors({
    origin: ['https://learn-mentor-gate.firebaseapp.com','https://learn-mentor-gate.web.app'],
  })
);
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.Db_user}:${process.env.Db_pass}@cluster01.2xfw1xu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect()
    // all collections
    const partnersCollections = client
      .db("Learn-Mentor-GateDB")
      .collection("partners");
    const coursesCollections = client
      .db("Learn-Mentor-GateDB")
      .collection("courses");
    const reviewsCollections = client
      .db("Learn-Mentor-GateDB")
      .collection("reviews");
    const usersCollections = client
      .db("Learn-Mentor-GateDB")
      .collection("users");

    const teachersCollections = client
      .db("Learn-Mentor-GateDB")
      .collection("teachers");
    const assignmentCollections = client
      .db("Learn-Mentor-GateDB")
      .collection("assignments");
    const paidCoursesCollections = client
      .db("Learn-Mentor-GateDB")
      .collection("paidCourses");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jsonWebToken.sign(user, process.env.Access_Token, {
        expiresIn: "3h",
      });
      res.send(token);
    });
    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req?.decoded.email;
      const query = { email: email };
      // console.log('decoded email===>',email);
      const user = await usersCollections.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };
    const verify = (req, res, next) => {
      // console.log('header-->',req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized" });
      }
      const token = req?.headers?.authorization.split(" ")[1];
      // console.log( "token is", token);
      jsonWebToken.verify(token, process.env.Access_Token, (err, decoded) => {
        if (err) {
          return res.status(401);
        }
        req.decoded = decoded;
        next();
      });
    };

    // get partners
    app.get("/partners", async (req, res) => {
      const result = await partnersCollections.find().toArray();
      res.send(result);
    });
    // get reviews
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollections.find().toArray();
      res.send(result);
    });
    // get reviews by id
    app.get("/reviews/:id", verify, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      // console.log('review id' ,id);
      const filter = { reviewId: id };
      const result = await reviewsCollections.find(filter).toArray();
      res.send(result);
    });
    // get reviews
    app.post("/reviews", async (req, res) => {
      const data = req.body;
      const result = await reviewsCollections.insertOne(data);
      res.send(result);
    });

    // get courses for display in home screen and all classes page
    app.get("/courses", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);

      const result = await coursesCollections
        .find({ status: "approved" })
        .skip(size * page)
        .limit(size)
        .sort({ Total_enrollment: -1 })
        .toArray();
      res.send(result);
    });

    // get courses for display in home length only
    app.get("/courses-length", async (req, res) => {
      const result = await coursesCollections
        .find({ status: "approved" })
        .sort({ Total_enrollment: -1 })
        .toArray();
      res.send(result);
    });
    // get all courses for admin
    app.get("/allCourses", verify, verifyAdmin, async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      console.log({ size, page });
      const result = await coursesCollections
        .find()
        .skip(size * page)
        .limit(size)
        .toArray();
      res.send(result);
    });
    // get all courses length
    app.get("/allCourses-length", async (req, res) => {
      const result = await coursesCollections.estimatedDocumentCount();
      res.send({ count: result });
    });
    // get all courses for teacher
    app.get("/teacher-classes", verify, async (req, res) => {
      const email = req?.query?.email;
      // console.log("email", email);
      const filter = { email: email };
      const page = parseInt(req.query.page)
      const size = parseInt(req.query.size)
      const result = await coursesCollections.find(filter).skip(size*page).limit(size).toArray();
      res.send(result);
    });
    // get all courses for teacher length only
    app.get("/teacher-classes-length", verify, async (req, res) => {
      const email = req?.query?.email;
      // console.log("email", email);
      const filter = { email: email };
      const result = await coursesCollections.find(filter).toArray();
      res.send(result);
    });
    // get single courses
    app.get("/course/:id", verify, async (req, res) => {
      const id = req.params.id;
      // console.log(req.originalUrl);
      const filter = { _id: new ObjectId(id) };
      // console.log(filter);
      const result = await coursesCollections.findOne(filter);
      // console.log(id);
      res.send(result);
    });

    // post on course collection
    app.post("/courses", async (req, res) => {
      const data = req.body;
      // console.log(data);
      // checking the class already exist
      const filter = { Title: data?.Title };
      const courseData = await coursesCollections.findOne(filter);
      if (courseData) {
        return res.send({ message: "course already exist", insertedId: null });
      } else {
        const result = await coursesCollections.insertOne(data);
        res.send(result);
      }
    });
    // delete class
    app.delete("/delete-course/:id", verify, async (req, res) => {
      const id = req.params?.id;
      const filter = { _id: new ObjectId(id) };
      const result = await coursesCollections.deleteOne(filter);
      res.send(result);
    });
    // update course status
    app.patch("/approve-course/:id", async (req, res) => {
      const id = req.params?.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await coursesCollections.updateOne(filter, updateDoc);
      res.send(result);
    });
    // update course status to rejected
    app.patch("/reject-course/:id", async (req, res) => {
      const id = req.params?.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "rejected",
        },
      };
      const result = await coursesCollections.updateOne(filter, updateDoc);
      res.send(result);
    });
    // update single course
    app.put("/update-course/:id", async (req, res) => {
      const id = req.params?.id;
      const updateData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          Title: updateData?.Title,
          Instructor: updateData?.Instructor,
          Short_description: updateData?.Short_description,
          Long_description: updateData?.Long_description,
          Duration: updateData?.Duration,
          Enrollment: updateData?.Enrollment,
          Price: updateData?.Price,
          Posted_on: updateData?.Posted_on,
          Instructor_Image: updateData?.Instructor_Image,
          Course_Image: updateData?.Course_Image,
          email: updateData?.email,
          status: updateData?.status,
          perDayAssignment: updateData?.perDayAssignment,
          assignments: updateData?.assignments,
        },
      };
      const options = { upsert: true };
      const result = await coursesCollections.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // users apis
    // get users
    app.get("/users", verify, verifyAdmin, async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await usersCollections
        .find()
        .skip(size * page)
        .limit(size)
        .toArray();
      res.send(result);
    });
    // get users length
    app.get("/users-length", async (req, res) => {
      const result = await usersCollections.estimatedDocumentCount();
      res.send({ result });
    });
    // get single user
    app.get("/user", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const result = await usersCollections.findOne(filter);
      res.send(result);
    });
    // get user role
    app.get("/user/role", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const result = await usersCollections.findOne(filter);
      const role = result?.role;
      res.send({ role });
    });

    // post on users collection
    app.post("/users", async (req, res) => {
      const data = req.body;
      // console.log(data);
      const filter = { email: data?.email };
      const usersData = await usersCollections.findOne(filter);
      if (usersData) {
        return res.send({ message: "user already exist", insertedId: null });
      } else {
        const result = await usersCollections.insertOne(data);
        res.send(result);
      }
    });
    //  update user role to admin
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;

      const filter = { _id: new ObjectId(id) };
      const update = {
        $set: {
          role: "admin",
        },
      };

      const result = await usersCollections.updateOne(filter, update);
      res.send(result);
    });
    //  update user role to teacher
    app.patch("/user/teacher/:id", async (req, res) => {
      const id = req.params.id;
      const queryEmail = req.query?.email;
      const query = { email: queryEmail };
      const filter = { _id: new ObjectId(id) };
      const update = {
        $set: {
          role: "teacher",
        },
      };
      // console.log('queryId>',queryEmail);
      // console.log('Id>',id);

      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      const teacherCollectionResult = await teachersCollections.updateOne(
        filter,
        updateDoc
      );
      const result = await usersCollections.updateOne(query, update);
      res.send({ result, teacherCollectionResult });
    });

    // delete user and send status rejected
    app.patch("/teacher/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "rejected",
        },
      };
      const result = await teachersCollections.updateOne(filter, updateDoc);
      res.send(result);
    });

    // get teacher collection
    app.get("/teachers", verify, verifyAdmin, async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await teachersCollections
        .find()
        .skip(size * page)
        .limit(size)
        .toArray();
      res.send(result);
    });
    // get teacher collection
    app.get("/teachers-length", async (req, res) => {
      const result = await teachersCollections.estimatedDocumentCount();
      res.send({ result });
    });
    // update teacher status
    app.patch("/teacher/approve/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await teachersCollections.updateOne(filter, updateDoc);
      res.send(result);
    });
    // get teacher status
    app.get("/teacher-status", async (req, res) => {
      const email = req?.query?.email;
      // console.log(email);
      const filter = { email: email };
      const teacherData = await teachersCollections.findOne(filter);
      res.send({ status: teacherData?.status });
    });
    // post on teacher collection
    app.post("/teachers", async (req, res) => {
      const data = req.body;

      const result = await teachersCollections.insertOne(data);
      res.send(result);
    });

    // assignment apis
    // get assignment collection
    app.get("/assignments", verify, async (req, res) => {
      const id = req.query?.id;
      let query = {};
      if (id) {
        query = { assignmentId: id };
      }
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await assignmentCollections
        .find(query)
        .skip(size * page)
        .limit(size)
        .toArray();
      res.send(result);
    });
    // get assignment collection length
    app.get("/assignments-length", verify, async (req, res) => {
      const id = req.query?.id;
      let query = {};
      if (id) {
        query = { assignmentId: id };
      }
      const result = await assignmentCollections.find(query).toArray();
      res.send(result);
    });

    // post on assignment collection
    app.post("/assignments", async (req, res) => {
      const data = req.body;
      // console.log(data);
      const filter = { Assignment_Title: data?.Assignment_Title };
      const usersData = await assignmentCollections.findOne(filter);
      if (usersData) {
        return res.send({
          message: "assignment already exist",
          insertedId: null,
        });
      } else {
        const result = await assignmentCollections.insertOne(data);
        res.send(result);
      }
    });
    // update assignment
    app.patch("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const queryId = req.query.id;
      const query = { _id: new ObjectId(queryId) };
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "submitted",
        },
      };
      const updateDocQuery = {
        $inc: {
          perDayAssignment: 1,
        },
      };
      const assignmentResult = await coursesCollections.updateOne(
        query,
        updateDocQuery
      );
      const result = await assignmentCollections.updateOne(filter, updateDoc);
      res.send({ result, assignmentResult });
    });
    // payments intent
    app.post(`/create-payment-intent`, async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);

      console.log("amount==>", amount);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    //  paid courses collections
    app.get("/paid-course", verify, async (req, res) => {
      const email = req.query?.email;
      let query = {};
      if (email) {
        query = { email: email };
      }
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      console.log("query for size and page", page, size);
      const result = await paidCoursesCollections
        .find(query)
        .skip(size * page)
        .limit(size)
        .toArray();
      res.send(result);
    });
    //  paid courses collections length
    app.get("/paid-course-length", verify, async (req, res) => {
      const email = req.query?.email;
      let query = {};
      if (email) {
        query = { email: email };
      }
      const result = await paidCoursesCollections.find(query).toArray();
      res.send(result);
    });
    // all paid courses collections length
    app.get("/all-paid-course-length",  async (req, res) => {
     
      const result = await paidCoursesCollections.estimatedDocumentCount()
      res.send({count:result});
    });
    // post on corse collection
    app.post("/paid-course", async (req, res) => {
      const data = req.body;
      const queryId = req.query.id;
      const query = { _id: new ObjectId(queryId) };

      const updateDocQuery = {
        $inc: {
          Enrollment: 1,
        },
      };
      const assignmentResult = await coursesCollections.updateOne(
        query,
        updateDocQuery
      );
      const result = await paidCoursesCollections.insertOne(data);
      res.send({ result, assignmentResult });
    });

    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Learn Monitor Gate Server is Running");
});

app.listen(port, () => {
  console.log("running on", port);
});
