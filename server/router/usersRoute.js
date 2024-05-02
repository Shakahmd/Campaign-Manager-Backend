import express from 'express'
import { signupUser,loginUser } from '../controllers/usersControll.js'

export const usersRouter = express.Router()


usersRouter.route('/user/signup').post(signupUser)
usersRouter.route('/user/login').post(loginUser)