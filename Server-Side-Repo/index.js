const express = require('express');
const cors = require('cors');
const jsonWebToken = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000
app.use(express.json())
app.use(cors({
  origin:['http://localhost:5173']
}))
app.use(cookieParser())




const uri =`mongodb+srv://${process.env.Db_user}:${process.env.Db_pass}@cluster01.2xfw1xu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // await client.connect()
      const partnersCollections = client.db('Learn-Mentor-GateDB').collection('partners')
      const coursesCollections = client.db('Learn-Mentor-GateDB').collection('courses')
      // get partners 
      app.get('/partners',async(req,res)=>{
        const result = await partnersCollections.find().toArray()
        res.send(result)
      })

      // get courses 
      app.get('/courses',async(req,res)=>{
        const result = await coursesCollections.find().sort({Total_enrollment:-1}).toArray()
        res.send(result)
      })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
   res.send('Learn Monitor Gate Server is Running')
})

app.listen(port ,()=>{
  console.log('running on',port);
})