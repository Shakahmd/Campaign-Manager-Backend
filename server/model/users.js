import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    fullname:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true,unique:true,minlength:8}
},{
    timestamps:true
})

 export const userModel = mongoose.model("User",userSchema)