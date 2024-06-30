import express from 'express'
import dotenv from 'dotenv'
import { connectDb } from './config/db.js';
import { campRoute } from './router/campRoute.js';
import { usersRouter } from './router/usersRoute.js';
import cors from 'cors'

dotenv.config()
connectDb()

const app = express();
const port = process.env.PORT || 3000;


app.use(express.json())
app.use(cors())
app.use("/api",campRoute,)
app.use('/api',usersRouter)
app.use('/api/campaign/upload', express.static('public/uploads'));
app.use('/generated',(req,res,next)=>{
    res.set('Content-Disposition', 'attachment')
    next()
}, express.static('public/generated'));










app.listen(port,()=>{
    console.log(`server running on the ${port}`)

})