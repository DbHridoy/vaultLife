import { Schema, model } from "mongoose";

const userSchema = new Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "sales-rep", "production-manager"],
  },
  comission:{
    type: Number, // In perecentage
    default: function(this: any) {
      if (this.role === "admin") return 0;
      if (this.role === "sales-rep") return 5;
      if (this.role === "production-manager") return 0
      return 0;
    },
  },
  cluster: {
    type: String,
  },
  profileImage:{
    type: String,
  },
  phoneNumber:{
    type:String,
  },
  address:{
    type:String,
  },
  password: {
    type: String,
    required: true,
  },
});

const User = model("User", userSchema);

export default User;
