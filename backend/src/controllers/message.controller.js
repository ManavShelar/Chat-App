import User from "../model/user.model.js"
import Message from "../model/message.model.js";
import cloudinary from  "../lib/cloudinary.js"
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersFromSidebar = async (req, res) => {
  try {
    const loggedInUser = req.user._id;
    const filteredUsers = await User.find({_id: { $ne: loggedInUser } }).select("-password");

    res.status(200).json(filteredUsers);

  } catch (error) {
    console.log("Error in getUsersFromSidebar controller",error.message);
    res.status(500).json({message: "Internal server Error"})
  }
}

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or:[
        { senderId:myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId :myId }, 
      ],
    });

    res.status(200).json(messages);

  } catch (error) {
    console.log("Error in getMessages controller",error.message);
    res.status(500).json({message: "Internal server Error"})
  }
}

export const sendMessages = async (req, res) => {
  try {
    const {text, image} = req.body;
    const {id: receiverId} = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if(image) {
      const uploadResponse = await cloudinary.uploader.upload(image)
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if(receiverId){
      io.to(receiverSocketId).emit("newMessage", newMessage)
    }

    res.status(200).json(newMessage);
    
  } catch (error) {
    console.log("Error in sendMessage controller",error.message);
    res.status(500).json({message: "Internal server Error"})
  }
}