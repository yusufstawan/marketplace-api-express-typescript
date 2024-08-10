import mail from "../utils/mail";
import mongoose from "mongoose";
import UserModel from "./user.model";

const Schema = mongoose.Schema;

interface OrderItem {
  name: string;
  productId: mongoose.Schema.Types.ObjectId;
  price: number;
  quantity: number;
}

interface Order extends Document {
  grandTotal: number;
  orderItems: OrderItem[];
  createdBy: mongoose.Schema.Types.ObjectId;
  status: "pending" | "completed" | "cancelled";
}

const orderItemSchema = new Schema<OrderItem>({
  name: {
    type: String,
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});

const OrderSchema = new Schema({
  grandTotal: {
    type: Number,
    required: true,
  },
  orderItems: {
    type: [orderItemSchema],
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
    required: true,
  },
});

OrderSchema.post("save", async function (doc, next) {
  const order = doc;

  const user = await UserModel.findById(order.createdBy);
  if (!user) {
    throw new Error(`User with ID ${order.createdBy} not found`);
  }

  const content = await mail.render("invoice.ejs", {
    customerName: user?.fullName,
    orderItems: order.orderItems,
    grandTotal: order.grandTotal,
    contactEmail: process.env.MAIL_USERNAME,
    companyName: "Tokopedia",
    year: 2024,
  });

  await mail.send({
    to: user.email,
    subject: "Order Confirmation",
    content,
  });

  next();
});

const OrdersModel = mongoose.model<Order>("Orders", OrderSchema);

export default OrdersModel;
