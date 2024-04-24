import express from 'express'
import dotenv from 'dotenv'
import { connectDb } from './config/db.js';
import { campRoute } from './router/campRoute.js';

dotenv.config()
connectDb()

const app = express();
const port = process.env.PORT || 3000;

app.use(express())
app.use(express.json())
app.use("/api",campRoute)
app.use('/generated',express.static('generated'))




app.listen(port,()=>{
    console.log(`server running on the ${port}`)

})