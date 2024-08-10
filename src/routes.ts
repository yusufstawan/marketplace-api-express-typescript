import express from "express";

// middlewares
import uploadMiddleware from "./middlewares/upload.middleware";
import authMiddleware from "./middlewares/auth.middleware";
import aclMiddleware from "./middlewares/acl.middleware";

// controllers
import uploadController from "./controllers/upload.controller";
import productsController from "./controllers/products.controller";
import categoriesController from "./controllers/categories.controller";
import authController from "./controllers/auth.controller";
import ordersController from "./controllers/orders.controller";

const router = express.Router();

// categories
router.get("/categories", categoriesController.findAll);
router.post("/categories", categoriesController.create);
router.get("/categories/:id", categoriesController.findOne);
router.put("/categories/:id", categoriesController.update);
router.delete("/categories/:id", categoriesController.delete);

// products
router.get("/products", productsController.findAll);
router.post("/products", productsController.create);
router.get("/products/:id", productsController.findOne);
router.put("/products/:id", productsController.update);
router.delete("/products/:id", productsController.delete);

// orders
router.post("/orders", authMiddleware, ordersController.create);
router.get("/orders", authMiddleware, ordersController.findAll);

// health check
router.get("/", (req, res) => {
  res.status(200).json({
    message: "server is running...",
    data: "ok",
  });
});

// auth
router.post("/auth/login", authController.login);
router.post("/auth/register", authController.register);
router.get(
  "/auth/me",
  [authMiddleware, aclMiddleware(["admin"])],
  authController.me
);
router.put("/auth/profile", authMiddleware, authController.profile);

router.post("/upload", uploadMiddleware.single, uploadController.single);
router.post("/uploads", uploadMiddleware.multiple, uploadController.multiple);

export default router;
