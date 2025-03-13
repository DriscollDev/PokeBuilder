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


// Update Password Route
router.post("/update-password", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized. Please log in again." });
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query("UPDATE user SET password = ? WHERE username = ?", [hashedPassword, req.user.username]);
        res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Password update error:", error);
        res.status(500).json({ error: "Server error while updating password." });
    }
});


// Delete Account
router.post("/delete-account", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });

    try {
        await pool.query("DELETE FROM user WHERE username = ?", [req.user.username]);
        req.logout(() => res.redirect("/auth/login"));
    } catch (error) {
        console.error("Account deletion error:", error);
        res.status(500).json({ error: "Server error" });
    }
});



export default router;