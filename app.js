const express = require('express')
const mongoose = require('mongoose')
const userRouter = require('./route/userRoute')
const parlourRouter = require('./route/parlourRoute')
const globalErrorHandler = require('./controller/errorController')
const cors = require('cors')
require('dotenv').config()

// l5tWLMsQ9B1eOuLs
/// your apps /////////////////
const app = express()


app.use(express.static(`${__dirname}/public`))

app.use(express.json())
var whitelist = ['https://obpms.btrchain.com', 'https://parlour.btrchain.com']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}
app.use(cors(corsOptions))
// app.options('*', cors())

mongoose.connect(
    // process.env.MONGO_DB,
    process.env.MONGO_DB_lOCALHOST,
    {
        useNewUrlParser: true,
        // useUnifiedTopology: true
    })
.then(()=>{
    console.log('mongodb_connected')
})
.catch((err)=>{
    // console.log(err)
});


app.get('/',(req,res)=>{
    res.status(200).json({
    message:'This api is working perfactly.',
     
  })
})   



app.use('/api/users',userRouter)
app.use('/api/parlours',parlourRouter)


///app error handler 
app.use(globalErrorHandler)


const port = process.env.PORT || 3000

app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
})
