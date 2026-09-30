import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User';

(async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
  await User.deleteMany({ username: 'admin' });
  await User.create({
    username: 'admin',
    passwordHash: await bcrypt.hash('Admin123*', 10),
    name: 'Haisiuletj',
    lastName: 'Demo',
    email: 'haisiuletj@example.com',
    userType: 'admin',
  });
  await mongoose.disconnect();
})();
