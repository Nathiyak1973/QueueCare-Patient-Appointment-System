import mongoose from 'mongoose';

export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[Database] No MONGODB_URI provided. Running in high-reliability embedded in-memory MongoDB mode with initial seed data.');
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('[Database] Connected to MongoDB cluster successfully.');

    // Synchronize or seed Admin account in MongoDB
    try {
      const { UserModel } = await import('../models/User.ts');
      const { db } = await import('../services/dbStore.ts');
      const envAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin@hospital.com';

      const mongoAdmin = await UserModel.findOne({
        $or: [{ role: 'admin' }, { email: envAdminEmail }],
      });

      if (mongoAdmin) {
        db.updateAdminCredentials(mongoAdmin.email, mongoAdmin.password, mongoAdmin.name);
        console.log(`[Database] Admin account synchronized from MongoDB (${mongoAdmin.email}).`);
      } else {
        const memoryAdmin = db.users.find((u) => u.role === 'admin');
        if (memoryAdmin) {
          await UserModel.create({
            name: memoryAdmin.name,
            email: memoryAdmin.email,
            password: memoryAdmin.password,
            role: 'admin',
            phone: memoryAdmin.phone,
            isActive: true,
          });
          console.log(`[Database] Initial admin account provisioned in MongoDB collection (${memoryAdmin.email}).`);
        }
      }
    } catch (syncErr) {
      console.warn('[Database] Admin sync warning:', (syncErr as Error).message);
    }

    return true;
  } catch (err) {
    console.warn('[Database] Could not connect to remote MongoDB URI:', (err as Error).message);
    console.log('[Database] Falling back seamlessly to local in-memory Mongoose data layer.');
    return false;
  }
};
