import express from 'express'

import { campaignModel } from '../model/campaign.js'
import multer from 'multer'
import sharp from 'sharp'
import os from 'os'
import fs from 'fs';
import path from 'path'




const upload = multer({dest:'uploads/'})
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
    const {title,description} = req.body
    if(!imageFile){
      return  res.status(400).send({message:"No image file found !"})
     
    }
       console.log("imageFile:",imageFile)
       const  imageInfo = await  processImage(imageFile.path)
        console.log(imageInfo);
       if(!title||!description){
         return res.status(400).send({message:"All required field must be provided !"})
      }
       
      const userId = req.user
      console.log(userId)
        
      const ImageDetails =  new campaignModel({
        createdby:userId,
        title:title,
        description:description,
        bg_image:imageFile.path,
        fg_image_position:imageInfo.startingPixel,
        fg_image_height:imageInfo.tpHeight,
        fg_image_width:imageInfo.tpWidth

      })
     
      const savedImage = await ImageDetails.save()
      console.log("new campaign created",savedImage)
       
     return res.status(200).send({message:"image saved successfully"})

     
         
           
  } catch (error) {
     console.error(error)
      return  res.status(500).send({message:error.message})
  }
   
 
    

}




//get all campaign
const getCampaign = async(req,res)=>{
    try {
        const campaign = await campaignModel.find()
        res.status(201).json(campaign)
    } catch (error) {
         res.status(400).send({message:error.message})
    }
   
  }

  //get a single campaign
  const getSingleCampaign = async(req,res)=>{
    try {
        const singleCampaign = await campaignModel.findById(req.params.id)
            if(!singleCampaign){
                return res.status(404).send({message:"no campaign found"})
            }
             res.status(200).json(singleCampaign)
    } catch (error) {
         res.status(500).send({message:error.message})
    }
         
         
  }

  //delete a campaign
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



  // @desc adding text
  // @route POST api/campaign/text

    const addText = async(req,res)=>{
      try {

        
        const {campaignId,text_position,text_font_size,text_font_colors} = req.body
           
      
        if(!campaignId||
          !text_position||
          !text_font_size||
          !text_font_colors){
              
            return  res.status(400).send({message:"All required field must be provided"})

        }

            let campaign = await campaignModel.findById(campaignId)
             if(!campaign){
              res.status(400).send({message:"No campaign found"})
             }
               
             campaign.set(req.body)
             console.log(campaign);

        
            await campaign.save()
             return  res.status(200).send({message:"text details added sucessfully"})

        
      } catch (error) {
          res.status(500).send({message:error.message})
        
      }

    }



    const createPoster = async(campaign,profilePicture,nameText,campaignId)=>{
             
      const date = new Date();
      const year = date.getFullYear(); // Get the year
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Get the month and pad with leading zero if needed
       const day = String(date.getDate()).padStart(2, '0'); 
      const time = date.getTime();
      const formattedDate = `${year}${month}${day}`; // Construct the formatted date string
      const uniqueFileName = `${formattedDate}_${campaignId}_${time}.jpeg`
      const outputPath = `/home/shak/campaignproject/cpserver/generated/${uniqueFileName}`
      // console.log(outputPath)


          try {
                  
                await sharp(campaign.bg_image).composite([
                  {input:profilePicture.path,left:campaign.fg_image_position.x,top:campaign.fg_image_position.y,blend:"dest-over"},
                     {input:{
                        text:{
                          text: `<span foreground="${campaign.text_font_colors}"size="x-large">` + nameText +`</span>` ,
                          rgba:true,
                          width:200,
                          height:100
                         
                        
                        
                        }
                      },left:campaign.text_position.x,top:campaign.text_position.y}
                     ]).toFile(outputPath).then(info =>{
                        console.log("campaignPOster",info)
                              // console.log(outputPath)
                              return outputPath
                     }).catch(err=>{
                      console.error(err)
                     })
                     
                    
                    
                   return uniqueFileName

            
            
          } catch (error) {
             console.error("creating camapign poster failed",error)
            throw error
            
          }

    }

     


    //@desc sending pfp and text
    // @route POST api/campaign/user

    const useCampaign = async(req,res)=>{
       
        try {
          const profilePicture = req.file
            sharp(profilePicture.path).metadata().then((metadata)=>{
                    console.log("pfp width :",metadata.width)
                    console.log("pfp height :",metadata.height)
                    
                 
            })

             
              
          const {nameText,campaignId} = req.body
          if(!profilePicture||!nameText||!campaignId){
               return res.status(400).send({message:"All required field must be provided!"})
          }

           const campaign = await campaignModel.findById(campaignId)
            if(!campaign){
                 return res.status(400).send({message:'No campaign found !'})
            }
           
              const campaignPoster =  await createPoster(campaign,profilePicture,nameText,campaignId)
                 
                
                console.log(campaignPoster)

               
             return res.status(200).json({message:"profile picture and text added sucessfully",campaignPoster:campaignPoster})
              

          
        } catch (error) {
           console.error(error)

           res.status(500).send({message:error.message})
            
        }


    }


  export{
    
    getCampaign,
    getSingleCampaign,
    deleteCampaign,
    uploadImage,
    multerMiddleware,
    addText,
    useCampaign,
    multerMiddleware2
  }