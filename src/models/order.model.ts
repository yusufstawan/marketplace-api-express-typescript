import { Schema, model, Document, models, Types } from "mongoose";

interface IOrder extends Document {
  grandTotal: number;
  orderItems: {
    productId: Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
  }[];
  createdBy: Types.ObjectId;
  status: string;
}

const orderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
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

const orderSchema = new Schema<IOrder>(
  {
    grandTotal: {
      type: Number,
      required: true,
    },
    orderItems: [orderItemSchema],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const OrderModel = models.Order || model<IOrder>("Order", orderSchema);

export default OrderModel;
export { IOrder };
