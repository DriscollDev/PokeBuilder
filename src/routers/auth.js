import { Router } from "express";
import authController from "../controllers/authController.js";

const router = Router();

router.get("/login", (req, res) => {
    res.render("login", { title: "Login", errorMessage: null });
});

router.get("/register", (req, res) => {
    res.render("signup", { title: "Sign Up", errorMessage: null });
});

router.post("/login", authController.loginUser);
router.post("/register", authController.registerUser);

router.post("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect("/");
    });
});

export default router;