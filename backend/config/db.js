import mongoose from "mongoose"

const connectDB = async () => {
    try{
        const conn=await mongoose.connect(process.env.MONGODB_URL)
        console.log("db connected")
    } catch (error) {
        console.error("Error connecting to MongoDB:", error)
    }
}

export default connectDB;