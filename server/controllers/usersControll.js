import { userModel } from "../model/users.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'





const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send({ message: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (error) {
    console.error(error);
    return res.status(403).send({ message: 'Authorization failed' });
  }
};
 
const signupUser = async(req,res)=>{
  try {

    const{fullname,email,password}  = req.body

      if(!fullname||!email||!password){
        return res.status(400).send({message:"All required fields must be provided !"})
      }
        const existingUser = await userModel.findOne({email})
        if(existingUser){
            return res.status(400).send({message:"user already exist !"})
        }
         
        const saltRounds = 10

        const salt = await bcrypt.genSalt(saltRounds)
        const hashpassword = await bcrypt.hash(password,salt)
        // console.log(hashpassword)
        
        const user =  new userModel({
            fullname:fullname,
            password:hashpassword,
            email:email
        })

        await user.save()
        
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{
          expiresIn:"3h"
        })
          // console.log(token)

        return res.status(200).json({message:"Details added sucessfully !",token:token})
       

          
         
    
  } catch (error) {
     console.error(error)
     res.status(500).send({message:error.message})
    
  }

}



  const loginUser = async(req,res)=>{
       try {
        const{fullname,email,password} = req.body
        if(!fullname||!email||!password){
          return res.status(400).send({message:"All required field must be provided !"})
        }
        const user = await userModel.findOne({email})
        if(!user){
          return res.status(400).send({message:"user not found !"})
        }
        
        if(!(user && (bcrypt.compare(password,user.password)))){
         return res.status(400).send({message:"Incorrect password"})
            }
        
            const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"3h"})
            res.status(200).json({message:"Login completed successfully",token})

        
       } catch (error) {
        console.error(error)
        res.status(400).send({message:error.message})
        
       }
     
    

  }

 


export {
    signupUser,
    loginUser,
    auth
}