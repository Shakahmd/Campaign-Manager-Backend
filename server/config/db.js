import mongoose from 'mongoose'
import colors from 'colors'

export const connectDb = async()=>{
    try {
         const conn = await mongoose.connect(process.env.MONGO_URI)
         console.log(`mongodb connected ${conn.connection.host}`.cyan.underline)
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}