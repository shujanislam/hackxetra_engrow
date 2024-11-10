
const express = require('express');
const cors = require('cors');
const User = require('./models/User');
const mongoose = require('mongoose');
const multer = require('multer');
const Post = require("./models/Post");
const path = require('path');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);

const port = 8080;

// Middleware to parse incoming request bodies
app.use(express.json());
app.use(cors()); // Allow all origins for now

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/users', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.log('Failed to connect to MongoDB:', err));

// Set up Socket.io
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Full Next.js URL without path
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for incoming messages
  socket.on('sendMessage', (message) => {
    console.log('Received message:', message);
    io.emit('receiveMessage', message); // Broadcast message to all clients
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Function to validate email domain
const isValidEmailDomain = (email) => {
  const allowedDomains = ['tezu.ac.in', 'tezu.ernet.in'];
  const emailDomain = email.split('@')[1];
  return allowedDomains.includes(emailDomain);
};

// Signup, Signin, Post Creation, and other routes

app.post('/signup', async (req, res) => {
  const { fname, lname, email, password } = req.body;
  
  console.log("Received data:", req.body);

  try {
    if (!fname || !lname || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!isValidEmailDomain(email)) {
      return res.status(400).json({ message: 'Email must be from tezu.ac.in or tezu.ernet.in' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ fname, lname, email, password });
    await newUser.save();

    return res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
      // Validate input fields
      if (!email || !password) {
          return res.status(400).json({ message: 'All fields are required' });
      }

      // Find the user by email
      const user = await User.findOne({ email });
      if (!user || user.password !== password) {
          return res.status(400).json({ message: 'Invalid email or password' });
      }

      // If successful, send a response (you could also generate a JWT token here)
      return res.status(200).json({ message: 'Login successful' });
  } catch (error) {
      console.error('Error signing in:', error);
      return res.status(500).json({ message: 'Internal server error' });
  }
});

// Set up Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Endpoint for creating a post
// Backend route for creating a new post
app.post('/post', async (req, res) => {
  const { imageUrl, caption } = req.body;

  try {
    if (!imageUrl || !caption) {
      return res.status(400).json({ message: 'Image URL and caption are required' });
    }

    // Create and save a new post
    const newPost = new Post({ imageUrl, caption });
    await newPost.save();

    res.status(201).json({ message: 'Post created successfully!' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }); // Sort by createdAt, descending order
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});
// (Keep your existing code for other routes here)
// Endpoint to get all usernames from the database
app.get('/usernames', async (req, res) => {
  try {
    const users = await User.find({}, 'fname lname');  // Fetch only fname and lname from User collection
    const usernames = users.map(user => `${user.fname} ${user.lname}`);
    res.status(200).json(usernames);
  } catch (error) {
    console.error('Error fetching usernames:', error);
    res.status(500).json({ message: 'Failed to fetch usernames' });
  }
});

// Start the server (use `server.listen` instead of `app.listen`)
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
