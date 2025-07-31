import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import user from "../models/user.js";
import { inngest } from "../inngest/client.js";

export const signup = async (req, res) => {
  const { email, password, skills } = req.body;
  try {
    const hased = bcrypt.hash(password, 10);
    const User = await user.create({ email, password: hased, skills });

    await inngest.send({
      name: "user/signup",
      data: { email },
    });

    const token = jwt.sign(
      { id: User.id, role: User.role },
      process.env.JWT_SECRET
    );

    res.json({ User, token });
  } catch (error) {
    res.status(500).json({ error: "Signup Failed", details: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const User = user.findOne({ email });
    if (!User) return res.status(401).json({ error: "User not found" });

    const isMatch = bcrypt.compare(password, User.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid Credentials" });
    }

    const token = jwt.sign(
      { id: User.id, role: User.role },
      process.env.JWT_SECRET
    );

    res.json({ User, token });
  } catch (error) {
    res.status(500).json({ error: "Login Failed", details: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    // Doubt
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ error: "Unauthorized" });
    });
    res.json({ message: "Logout Successfully" });
  } catch (error) {
    res.status(500).json({ error: "Logout Failed", details: error.message });
  }
};

export const updateUser = async (req, res) => {
  const {
    skills: [],
    role,
    email,
  } = req.body;
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "ForHidden" });
    }
    const User = await user.findOne({ email });

    if (!User) return res.status(401).json({ error: "User not found" });

    await User.updateOne(
      { email },
      { skills: skills.length ? skills : user.skills, role }
    );
    return res.json({ message: "User Updated Successfully" });
  } catch (error) {
    res.status(500).json({ error: "Update Failed", details: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "For Hidden" });
    }

    const Users = await user.find().select("-password");
    return res.json(Users);
  } catch (error) {
    res.status(500).json({ error: "Get User Failed", details: error.message });
  }
};
