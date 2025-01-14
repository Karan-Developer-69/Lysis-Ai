const express = require("express");
const app = express();
const http = require("http"); // Required to set up server for Socket.io
const { Server } = require("socket.io");
const fs = require("fs").promises;
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const {memoryModel} = require("./DB");
const {trainModel} = require("./DB");

require("dotenv").config();

const API_KEY = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let prevChat = [];
let wholeChat = [];

app.use(cors());
app.use(express.json());

// Create HTTP server and initialize Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Replace '*' with your frontend URL in production
    methods: ["GET", "POST"],
  },
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("userMessage", async (userMsg) => {
    if (!userMsg) {
      socket.emit("errorMessage", "Please enter a prompt.");
      return;
    }

    try {
      // Read previous chats

      try {
        const data = await fs.readFile("./Data/Ai.json", "utf8");
        prevChat = JSON.parse(data);
      } catch (err) {
        console.log("Error reading or parsing Ai.json:", err.message);
      }
      try {
        const data = await fs.readFile("./Data/forAiTraining.json", "utf8");
        wholeChat = JSON.parse(data);
      } catch (err) {
        console.log("Error reading or parsing Ai.json:", err.message);
      }

      // Prepare prompt
      const prompt = `You are an AI assistant in a chat app. Here are the past few interactions:
      ${prevChat
        .map((chat) => `User: ${chat.user}\nAI: ${chat.you}`)
        .join("\n")}
      User's new question is: "${userMsg}". Please respond thoughtfully and concisely.`;

      const result = await model.generateContent(prompt);
      const lysis = result.response.text();

      // Update prevChat if "remember" is included in the user's message
      if (userMsg.includes("remember")) {
        prevChat.push({ user: userMsg, you: lysis });
        memoryChat = prevChat;
        await fs.writeFile("./Data/Ai.json", JSON.stringify(prevChat, null, 2));
    }
        wholeChat.push({ user: userMsg, lysis });
        await fs.writeFile("./Data/forAitraining.json", JSON.stringify(wholeChat, null, 2));
        if (wholeChat.length !== 0) {
            let memory = await trainModel.find();
            if (memory.length !== 0) {
              await trainModel.findByIdAndUpdate(memory[0]._id, {
                memory: wholeChat,
              });
            } else {
              memory = await trainModel.create({
                memory: wholeChat,
              });
            }
          }

      // Send response to the frontend
      socket.emit("lysisResponse", lysis);
    } catch (error) {
      console.log("Error:", error);
      socket.emit("errorMessage", "An error occurred.");
    }
  });

  socket.on("disconnect", async () => {
    console.log(`Client disconnected: ${socket.id}`);
    if (prevChat.length !== 0) {
      let memory = await memoryModel.find();
      if (memory.length !== 0) {
        await memoryModel.findByIdAndUpdate(memory[0]._id, {
          memory: prevChat,
        });
      } else {
        memory = await memoryModel.create({
          memory: prevChat,
        });
      }
    }
  });
});

// Listen for HTTP and WebSocket connections
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
