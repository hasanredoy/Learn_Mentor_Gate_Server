const express = require('express');
const cors = require('cors');
const jsonWebToken = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    // all collections
      const partnersCollections = client.db('Learn-Mentor-GateDB').collection('partners')
      const coursesCollections = client.db('Learn-Mentor-GateDB').collection('courses')
      const reviewsCollections = client.db('Learn-Mentor-GateDB').collection('reviews')
      const usersCollections = client.db('Learn-Mentor-GateDB').collection('users')
     
      const teachersCollections = client.db('Learn-Mentor-GateDB').collection('teachers')
     
      // jwt related api 
      app.post('/jwt',async(req,res)=>{
        const user = req.body
        const token = jsonWebToken.sign(user,process.env.Access_Token,{expiresIn:'3h'})
        res.send(token)
      })


      // get partners 
      app.get('/partners',async(req,res)=>{
        const result = await partnersCollections.find().toArray()
        res.send(result)
      })
      // get reviews 
      app.get('/reviews',async(req,res)=>{
        const result = await reviewsCollections.find().toArray()
        res.send(result)
      })

      // get courses 
      app.get('/courses',async(req,res)=>{
        const result = await coursesCollections.find().sort({Total_enrollment:-1}).toArray()
        res.send(result)
      })
      // get single courses 
      app.get('/course/:id',async(req,res)=>{
        const id =req.params.id
        // console.log(req.originalUrl);
        const filter = {_id: new ObjectId(id)}
        console.log(filter);
        const result = await coursesCollections.findOne(filter)
        console.log(id,result);
        res.send(result)
      })

      // users apis 
      app.post('/users',async(req,res)=>{
        const data = req.body
        // console.log(data);
        const filter ={email: data?.email}
        const usersData = await usersCollections.find(filter).toArray()
        if(usersData){
          return res.send({message:'user already exist',insertedId:null})
        }else{
          const result  = await usersCollections.insertOne(data)
          res.send(result)
        }
      })


      // post on teacher collection
      app.post('/teachers',async(req,res)=>{
        const data = req.body
        console.log(data);
        // const filter ={email: data?.email}
        // const teachersData = await teachersCollections.find(filter).toArray()
        // if(teachersData){
        //   return res.send({message:' already exist',insertedId:null})
        // }
        // else{
          const result  = await teachersCollections.insertOne(data)
          res.send(result)
        // }
      })

      // teachers api 
     


    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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