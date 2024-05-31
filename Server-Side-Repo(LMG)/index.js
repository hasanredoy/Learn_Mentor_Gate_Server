const express = require('express');
const cors = require('cors');
const jsonWebToken = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const app = express()
const PORT = process.env.PORT || 5000
app.use(express.json())
app.use(cors({
  origin:['http://localhost:5173']
}))
app.use(cookieParser)

app.get('/',(req,res)=>{
   res.send('Learn Monitor Gate Server is Running')
})

app.listen(PORT ,()=>{
  console.log('running on',PORT);
})