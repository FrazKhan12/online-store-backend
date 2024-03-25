import mongoose from "mongoose";

const dbConnect = () => {
  try {
    const data = mongoose.connect(process.env.DATABASE);
    if (data) {
      console.log("Database connected");
    }
  } catch (error) {
    console.log(error);
  }
};

export default dbConnect;
