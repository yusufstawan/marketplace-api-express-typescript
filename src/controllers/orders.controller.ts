import OrdersModel from "../models/orders.model";
import ProductsModel from "../models/products.model";
import UserModel from "../models/user.model";
import { IPaginationQuery, IReqUser } from "../utils/interfaces";
import { Request, Response } from "express";
import * as Yup from "yup";

const orderValidationSchema = Yup.object().shape({
  grandTotal: Yup.number()
    .required("Grand total is required")
    .positive("Grand total must be positive"),
  orderItems: Yup.array()
    .of(
      Yup.object().shape({
        quantity: Yup.number()
          .required("Quantity is required")
          .min(1, "Quantity must be at least 1")
          .max(5, "Quantity must not exceed 5"),
      })
    )
    .required("Order items are required")
    .min(1, "At least one order item is required"),
  status: Yup.mixed<"pending" | "completed" | "cancelled">()
    .oneOf(["pending", "completed", "cancelled"], "Invalid status")
    .required("Status is required"),
});

export default {
  async create(req: Request, res: Response) {
    try {
      await orderValidationSchema.validate(req.body, { abortEarly: false });
      const { orderItems, grandTotal, status } = req.body;
      const userId = (req as IReqUser).user.id;
      const createdBy = await UserModel.findById(userId);

      if (!createdBy) {
        throw new Error(`User with ID ${userId} not found`);
      }

      const historyQuantity: any[] = [];

      const updatedOrderItems = await Promise.all(
        orderItems.map(async (item: any) => {
          const product = await ProductsModel.findById(item.productId);
          if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }
          if (product.qty < item.quantity) {
            throw new Error(
              `Product with ID ${item.productId} is out of stock`
            );
          }

          const qty = product.qty - item.quantity;
          await ProductsModel.updateOne({ _id: product._id }, { qty: qty });
          return {
            ...item,
            name: product.name,
            price: product.price,
          };
        })
      );

      const newOrder = new OrdersModel({
        grandTotal: grandTotal,
        orderItems: updatedOrderItems,
        createdBy,
        status,
      });

      const savedOrder = await newOrder.save();

      res.status(201).json({
        message: "Order created successfully",
        order: savedOrder,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "ValidationError") {
          res.status(400).json({
            message: "Validation failed",
            errors: (error as any).errors,
          });
        } else {
          console.error("Error creating order:", error);
          res.status(500).json({
            message: "Internal server error",
            error: error.message,
          });
        }
      } else {
        res.status(500).json({
          message: "Internal server error",
          error: "An unknown error occurred",
        });
      }
    }
  },
  async findAll(req: Request, res: Response) {
    try {
      const userId = (req as IReqUser).user.id;
      const {
        limit = 10,
        page = 1,
        search = "",
      } = req.query as unknown as IPaginationQuery;

      const query = { createdBy: userId };
      if (search) {
        Object.assign(query, {
          name: { $regex: search, $options: "i" },
        });
      }

      const result = await OrdersModel.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await OrdersModel.countDocuments(query);
      res.status(200).json({
        data: result,
        message: "Success get all orders",
        page: +page,
        limit: +limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        data: err.message,
        message: "Failed get all orders",
      });
    }
  },
};
