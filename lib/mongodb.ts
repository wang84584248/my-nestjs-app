import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_PUBLIC_URL || 'mongodb://mongo:dKEugCtQAkGIbmqgTJIfxgglhpiqvbMr@yamabiko.proxy.rlwy.net:36910';

if (!MONGODB_URI) {
  throw new Error('请定义MONGO_PUBLIC_URL环境变量');
}

/**
 * 全局变量用于缓存MongoDB连接
 * 在开发模式下帮助避免连接数过多
 */
interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: GlobalMongoose | undefined;
}

// 确保cached一定是GlobalMongoose类型
let cached: GlobalMongoose = global.mongoose || { conn: null, promise: null };

// 如果cached尚未初始化，则进行初始化
if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB连接成功!');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB连接失败:', e);
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase; 