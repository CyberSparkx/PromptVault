const express = require('express')
const app = express()
const connectDB = require('./src/db/db')
const cookieParser = require('cookie-parser');
require('dotenv').config();
const registerRoute = require('./src/routes/auth.route')

connectDB();
app.use(express.json())


// Routes
app.get('/', (req,res)=>{
    res.send({
        message:"Hello From Backend"
    })
})

app.use('/api/auth/',registerRoute);



app.listen(3000,()=>{
    console.log('The Server is running on port 3000');
    
})