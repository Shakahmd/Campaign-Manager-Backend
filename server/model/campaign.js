import mongoose from 'mongoose'

const positionSchema = new mongoose.Schema({
    x:{type:Number,required:false},
    y:{type:Number,required:false}

},{_id:false});
//  const textSizeSchema = new mongoose.Schema({
//     width:{type:Number,required:true},
//     height:{type:Number,required:true}
//  },{_id:false})


const campaignSchema =  new mongoose.Schema({
    createdby:{type:String,required:true},
    title:{type:String,required:true},
    description:{type:String,required:true},
    bg_image:{type:String,required:true},
    fg_image_position:{type:positionSchema,required:true},
    fg_image_width:{type:Number,required:true},
    fg_image_height:{type:Number,required:true},
    text_position:{type:positionSchema,required:false},
    text_font_size:{type:String,required:false},
    text_font_color:{type:String,required:false},
    active:{type:Boolean,required:false},
    slug:{type:String,required:false,unique:true}
},{
    timestamps:true
})



export const campaignModel = mongoose.model("Campaign",campaignSchema)