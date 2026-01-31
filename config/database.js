import mongoose from "mongoose";

const connectDB = async () => {
  // Try multiple possible environment variable names
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!mongoURI) {
    console.error("❌ MongoDB URI is not defined in environment variables");
    console.error("⚠️  Please set either MONGODB_URI or MONGO_URI in your environment");
    console.error("💡 On Render: Go to Dashboard → Your Service → Environment → Add variable");
    process.exit(1);
  }

  console.log("🔗 MongoDB URI found:", mongoURI.substring(0, 50) + "...");
  
  // Configure mongoose to handle new URL parser
  mongoose.set("strictQuery", true);
  
  const options = {
    serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    socketTimeoutMS: 45000, // 45 seconds socket timeout
    connectTimeoutMS: 10000, // 10 seconds connection timeout
    family: 4, // Use IPv4, skip trying IPv6
    retryWrites: true,
    w: "majority"
  };

  try {
    console.log("⏳ Attempting to connect to MongoDB...");
    
    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Port: ${conn.connection.port}`);
    console.log(`   Ready State: ${conn.connection.readyState === 1 ? "Connected" : "Disconnected"}`);
    
    // Connection event listeners
    mongoose.connection.on("connected", () => {
      console.log("📡 Mongoose connected to DB");
    });
    
    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err.message);
    });
    
    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  Mongoose disconnected from DB");
    });
    
    return conn;
    
  } catch (error) {
    console.error("\n❌ MONGODB CONNECTION FAILED!");
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || "N/A"}`);
    console.error(`   Name: ${error.name}`);
    
    // Provide helpful troubleshooting tips
    console.error("\n🔧 Troubleshooting Tips:");
    console.error("1. Check your MongoDB connection string format");
    console.error("2. Verify username/password are correct");
    console.error("3. Ensure your IP is whitelisted in MongoDB Atlas");
    console.error("4. Check if the database cluster is running");
    console.error("5. Verify network connectivity from Render's servers");
    
    console.error("\n📝 For MongoDB Atlas users:");
    console.error("   - Go to Network Access → Add IP Address → 0.0.0.0/0 (temporarily)");
    console.error("   - Check Database Access → ensure user has correct privileges");
    
    process.exit(1);
  }
};

export default connectDB;