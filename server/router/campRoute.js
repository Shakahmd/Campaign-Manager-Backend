import express from 'express'
import { getCampaign,getSingleCampaign,deleteCampaign,uploadImage,multerMiddleware,addText,useCampaign,multerMiddleware2 } from '../controllers/campControll.js'

 export const campRoute = express.Router()

campRoute.route('/campaign').get(getCampaign)
campRoute.route('/campaign/upload').post(multerMiddleware,uploadImage)
campRoute.route('/campaign/:id').get(getSingleCampaign).delete(deleteCampaign)
campRoute.route('/campaign/text').post(addText)
campRoute.route('/campaign/user').post(multerMiddleware2,useCampaign)