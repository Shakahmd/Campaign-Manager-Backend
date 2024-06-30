import express from 'express'

import { campaignModel } from '../model/campaign.js'
import multer from 'multer'
import sharp from 'sharp'
import os from 'os'
import fs from 'fs'
import path from 'path'




const storage = multer.diskStorage({
  destination:(req,file,cb)=>{
  cb(null,'public/uploads/')
  },
 filename:(req,file,cb)=>{
   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
   cb(null, uniqueSuffix + '-'+file.originalname)
 }
})

const upload = multer({storage:storage},)
const profile = multer({dest:os.tmpdir()})
const multerMiddleware = upload.single('bg_image')
const multerMiddleware2 = profile.single("profilePicture")






//processs image



const processImageData = (pixels,width)=>{
   
    
    let lowestColumn;
    let highestColumn;
    let lowestRow;
    let highestRow;
    let startingPixel = {};
    let firstTransparentPixel = true
 
    
         console.log("pixelLength",pixels.length)
     
      for(let i =3; i<pixels.length;i +=4){
          
           if(pixels[i] === 0){
         
            // console.log("transparentpixel worked")
            
            const column = Math.floor((i/4) % width);
            // console.log("column",column)
          
            const row = Math.floor((i/4) / width);
            // console.log("row",row)
                  
            if(firstTransparentPixel){
              lowestColumn = column;
              highestColumn = column;
              lowestRow = row;
              highestRow = row;

              firstTransparentPixel = false;
           

          
                

              }else{
                // console.log("lowestColumn",lowestColumn)
                   
                 if(column < lowestColumn){
                      lowestColumn = column;     
                 }
               

                   if(column > highestColumn){
                       highestColumn = column;
                   }

                   if(row < lowestRow){
                        lowestRow = row
                   }

                   if(row > highestRow){
                       highestRow = row
             }
            

           }      
              
        }   
      
      }
      startingPixel = {x:lowestColumn,y:lowestRow}
              
      const tpWidth = highestColumn - lowestColumn +1
      const tpHeight = highestRow - lowestRow + 1
       
      
      console.log("startingPixel",startingPixel)
       return {
            startingPixel:startingPixel,
            tpHeight:tpHeight,
            tpWidth:tpWidth
       }
       
}





const processImage = async(imagepath)=>{
  try {

      if(!imagepath){
         throw new Error('No image is provided')
      }

      const{data,info} = await sharp(imagepath).raw().toBuffer({resolveWithObject: true})
      const pixelArray = new Uint8ClampedArray(data.buffer)
       console.log("image width",info.width)
       console.log("image height",info.height)
      const result = processImageData(pixelArray,info.width)
      // console.log(result)
      return result

 
    
  } catch (error) {
    throw error
    
  }

}





// @desc upload image
// @route POST api/camapign/upload
const uploadImage = async(req,res)=>{
  try {
    const imageFile = req.file 
    const {title,description,text_position,text_font_size,text_font_color,active} = req.body
    if(!imageFile){
      return  res.status(400).send({message:"No image file found !"})
     
    }
       console.log("imageFile:",imageFile)
       const  imageInfo = await  processImage(imageFile.path)
        console.log(imageInfo);
       if(!title||!description||!text_position||!text_font_size||!text_font_color){
         return res.status(400).send({message:"All required field must be provided !"})
      }
       
      const userId = req.user
      console.log(userId)
       console.log(imageFile)


       const generatingBaseSlug = (title) =>{
             return title.toLowerCase().trim().replace(/[\s\W-]+/g,'-').replace(/^-+|-+$/g,'')
       
       }

       const generatingUniqueSlug = async(baseSlug) => {
           let counter = 1
           let slug = baseSlug
           while(await campaignModel.exists({slug})){
            counter += 1
             slug = `${baseSlug}-${counter}`
           }
           return slug
       }
      
        

       
        const baseSlug = await generatingBaseSlug(title)
        const slug = await generatingUniqueSlug(baseSlug)

        console.log(slug)
       
       
      const campaign =  new campaignModel({
        createdby:userId,
        title:title,
        description:description,
        bg_image:imageFile.filename,
        fg_image_position:imageInfo.startingPixel,
        fg_image_height:imageInfo.tpHeight,
        fg_image_width:imageInfo.tpWidth,
        text_position:JSON.parse(text_position),
        text_font_size:text_font_size,
        text_font_color:text_font_color,
        active:active,
        slug:slug
        
        


      })
        
      const savedImage = await campaign.save()
      console.log("new campaign created",savedImage)

       


      
   
       
     return res.status(200).send({message:"image saved successfully"})

     
         
           
  } catch (error) {
     console.error(error)
      return  res.status(500).send({message:error.message})
  }
   
 
    

}




// get active campaigns
// @route GET api/camapign

const getActiveCampaigns = async(req,res)=>{
    try {
         const campaign = await campaignModel.find({active:true}).sort({updatedAt: -1}).limit(5)
        res.status(201).json(campaign)
    } catch (error) {
         res.status(400).send({message:error.message})
    }
   
  }

  //get created campaigns
  //@route GET api/camapign/:id
  const getCreatedCampaign = async(req,res)=>{
    try {
        const id = req.user
        const Campaign = await campaignModel.find({createdby:id})
            if(!Campaign){
                return res.status(404).send({message:"no campaign found"})
            }
             res.status(200).json(Campaign)
    } catch (error) {
         res.status(500).send({message:error.message})
    }
         
         
  }

  //get a single campaign for using 
  //@route GET api/campaign/view/:id(campaignObjectId)

    const getSingleCampaign = async(req,res)=>{
          try {
             const {slug} = req.params
             const campaign = await campaignModel.findOne({slug:slug})
             if(!campaign){
              res.status(400).send({message:"campaign not found"})
             }
             res.status(200).json(campaign)

          } catch (error) {
            
            res.status(400).send({message:error.message})
          } 
    }

   //@desc Update the edit campaign
  //@route 

   const editCampaign = async(req,res)=>{
     try {
      
       const imageFile = req.file
       const{id,title,description,text_position,text_font_size,text_font_color,active} = req.body
       if(id){
        const existingCampaign  =  await campaignModel.findById(id)
        if(!existingCampaign){
          res.status(400).send({message:"Campaign Not Found !"})
        }
        
         let imageInfo = {}
        if(imageFile){
          
          const  imageInfo = await  processImage(imageFile.path)
          console.log(imageInfo)
          }

           const editFields = {
            ...existingCampaign.toObject(),
            ...(title !== undefined && {title}),
            ...(description !==undefined &&{description}),
            ...(text_position  !== undefined && {text_position: JSON.parse(text_position)}),
            ...(text_font_size  !== undefined && {text_font_size}),
            ...(text_font_color !== undefined &&{text_font_color}),
            ...(active !==undefined && {active}),
            ...(imageFile && {
               bg_image:imageFile.filename,
                 fg_image_position:imageInfo.startingPixel,
        fg_image_height:imageInfo.tpHeight,
        fg_image_width:imageInfo.tpWidth,

            })
           }

          const update = await campaignModel.findByIdAndUpdate(id,editFields,{new:true})
          if(!update){
            res.status(400).send({error:"Failed to update campaign"})
          }
          res.status(200).json({message:'Campaign Updated Successfully !',data:update},)



       
       
       }


         
      
      
     } catch (error) {
       return res.status(500).send({message:"Failed to Update",error:error.message})
     }
  }



  //delete a campaign
  //@route DELETE api/camapign/:id
  const deleteCampaign = async(req,res)=>{
      try {
         const deleteCampaign = await campaignModel.findByIdAndDelete(req.params.id)
         if(deleteCampaign){
            return res.status(200).send({message:"campaign deleted successfully"})
         }
          res.status(404).send({message:"no campaign found"})
      } catch (error) {
        res.status(500).send({message:error.message})
      }
         
  }








    const createPoster = async(campaign,resizedProfilePicture,nameText,campaignId,profilePicture)=>{
             
      const date = new Date();
      const year = date.getFullYear(); // Get the year
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Get the month and pad with leading zero if needed
       const day = String(date.getDate()).padStart(2, '0'); 
      const time = date.getTime();
      const formattedDate = `${year}${month}${day}`; // Construct the formatted date string
      const uniqueFileName = `${formattedDate}_${campaignId}_${time}.jpeg`
      const outputPath = `/home/shak/campaignproject/cpserver/public/generated/${uniqueFileName}`
      // console.log(outputPath)


          try {
                 
                  const filePath = profilePicture.path
                   console.log(profilePicture.path)
                   fs.access(filePath,fs.constants.R_OK,(err)=>{
                       if(err){
                        console.error(`unableToAccess ${filePath}`)
                       }else
                       {
                        console.log('profile Picture exist')
                       }
                   })
                  
                   const bgImage = campaign.bg_image
                 const campaignImage = path.join('/home/shak/campaignproject/cpserver/public/uploads',bgImage)
                 console.log(campaignImage)
                  
                 const image = {input:resizedProfilePicture,left:campaign.fg_image_position.x,top:campaign.fg_image_position.y,blend:'dest-over'}
                 const compositeItems = [image]
                  let textMarkUp = ''
                   const textCheck = nameText ? textMarkUp = `<span foreground="${campaign.text_font_color}"size="x-large">` + nameText +`</span>`:null;
                  
                    
                   if(textCheck){
                    const text = {input:{
                      text:{
                        text:textCheck,
                        rgba:true,
                        width:200,
                        height:100
                      }
                    },left:campaign.text_position?.x ?? 0,top:campaign.text_position?.y??0}
                    console.log(text)
                    compositeItems.push(text)
                   }
                   
                    console.log(compositeItems)
                     let pathCheckingForSave = false
                await sharp(campaignImage).composite(compositeItems).toFile(outputPath).then(info =>{
                        console.log("campaignPOster",info)
                              console.log(outputPath)
                              console.log(uniqueFileName)
                              pathCheckingForSave = true
                            fs.access(outputPath,fs.constants.R_OK,(err)=>{
                                if(err){
                                 console.error('Created Poster havig some problem with the saving')
                                }else{
                                  return uniqueFileName
                                }
                               
                            })

                           
                            
                     }).catch(err=>{
                      console.error(err)
                      
                     })
                     
                      
                  
                    
                     if(pathCheckingForSave){
                      return uniqueFileName
                    }
                   
                

            
            
          } catch (error) {
             console.error("creating camapign poster failed",error)
            throw error
            
          }

    }

     


    //@desc sending pfp and text
    // @route POST api/campaign/user

    const useCampaign = async(req,res)=>{
       
        try {
          const {nameText,campaignId} = req.body

          if(!req.file){
            return res.status(400).send({message:'No file uploaded'})
          }
          const profilePicture = req.file
           
          console.log(profilePicture)
            
          if(!profilePicture||!campaignId){
            return res.status(400).send({message:"All required field must be provided!"})
       }

        const campaign = await campaignModel.findById(campaignId)
         if(!campaign){
              return res.status(400).send({message:'No campaign found !'})
         }

            
          const resizedProfilePicture =   await sharp(profilePicture.path).resize(campaign.fg_image_width,campaign.fg_image_height).toBuffer()
          const metaDataOfResizedProfilePicture = await sharp(resizedProfilePicture).metadata()
          console.log('pfp width :',metaDataOfResizedProfilePicture.width)
          console.log('pfp height :',metaDataOfResizedProfilePicture.height)

            

       



             
              
        
           
              const campaignPoster =  await createPoster(campaign,resizedProfilePicture,nameText,campaignId,profilePicture)
                 
                
                console.log(campaignPoster)
                
                if(campaignPoster){
                  return res.status(200).json({message:"profile picture and text added sucessfully",campaignPoster:campaignPoster})
                }else{
                  return res.status(400).json({message:"some error occured on adding the croppedImage on Campaign"})
                }
                
             
              

          
        } catch (error) {
           console.error(error)

           res.status(500).send({message:error.message})
            
        }


    }


  export{
    
    getActiveCampaigns,
    getCreatedCampaign,
    deleteCampaign,
    editCampaign,
    uploadImage,
    multerMiddleware,
  
    useCampaign,
    multerMiddleware2,
    getSingleCampaign
  }