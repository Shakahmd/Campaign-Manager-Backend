import express from 'express'
import { getCreatedCampaign,deleteCampaign,editCampaign,uploadImage,multerMiddleware,useCampaign,multerMiddleware2,getSingleCampaign,getActiveCampaigns} from '../controllers/campControll.js'
import { auth } from '../controllers/usersControll.js'

 export const campRoute = express.Router()

// campRoute.route('/campaign').get(auth,getCampaign)
campRoute.route('/campaign/upload').post(auth,multerMiddleware,uploadImage)
campRoute.route('/campaign/:id').get(auth,getCreatedCampaign).delete(deleteCampaign)
campRoute.route('/campaign/edit').put(multerMiddleware,editCampaign)
campRoute.route('/campaign/user').post(multerMiddleware2,useCampaign)
campRoute.route('/campaign/view/:slug').get(getSingleCampaign)
campRoute.route('/campaign').get(getActiveCampaigns)