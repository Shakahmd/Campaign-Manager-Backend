import mongoose from 'mongoose'

const positionSchema = new mongoose.Schema({
    x:{type:Number,required:true},
    y:{type:Number,required:true}

},{_id:false});
 const textSizeSchema = new mongoose.Schema({
    width:{type:Number,required:true},
    height:{type:Number,required:true}
 },{_id:false})


const campaignSchema =  new mongoose.Schema({
    title:{type:String,required:true},
    description:{type:String,required:true},
    bg_image:{type:String,required:true},
    fg_image_position:{type:positionSchema,required:true},
    fg_image_width:{type:Number,required:true},
    fg_image_height:{type:Number,required:true},
    text_position:{type:positionSchema,required:false},
    text_font_size:{type:textSizeSchema,required:false},
    text_font_colors:{type:String,required:false}
},{
    timestamps:true
})



export const campaignModel = mongoose.model("Campaign",campaignSchema)