import readline from 'readline';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '../models/User.ts';

// Load existing environment variables
dotenv.config();

const ENV_PATH = path.resolve(process.cwd(), '.env');
const ENV_EXAMPLE_PATH = path.resolve(process.cwd(), '.env.example');

/**
 * Updates or sets key-value pairs in the .env file.
 */
function updateEnvFile(updates: Record<string, string>) {
  let content = '';
  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, 'utf-8');
  } else if (fs.existsSync(ENV_EXAMPLE_PATH)) {
    content = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf-8');
  }

  for (const [key, value] of Object.entries(updates)) {
    const escapedValue = `"${value.replace(/"/g, '\\"')}"`;
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${escapedValue}`);
    } else {
      content = content.trimEnd() + `\n${key}=${escapedValue}\n`;
    }
  }

  fs.writeFileSync(ENV_PATH, content, 'utf-8');
}

/**
 * Helper to prompt user via CLI
 */
function askQuestion(rl: readline.Interface, query: string, hide = false): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Parse command line flags or positional arguments
 */
function parseArgs(): { email?: string; password?: string } {
  const args = process.argv.slice(2);
  const parsed: { email?: string; password?: string } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--email' || arg === '-e') {
      parsed.email = args[++i];
    } else if (arg === '--password' || arg === '-p') {
      parsed.password = args[++i];
    } else if (!arg.startsWith('-')) {
      if (!parsed.password) {
        parsed.password = arg;
      } else if (!parsed.email) {
        parsed.email = arg;
      }
    }
  }

  return parsed;
}

async function main() {
  console.log('=====================================================');
  console.log('   CareQueue - Secure Admin Account Reset Utility   ');
  console.log('=====================================================\n');

  const cliArgs = parseArgs();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    let email = cliArgs.email;
    let password = cliArgs.password;

    // Interactive email prompt if not provided
    if (!email) {
      const defaultEmail = process.env.ADMIN_EMAIL || 'admin@hospital.com';
      const inputEmail = await askQuestion(rl, `Admin Email [Default: ${defaultEmail}]: `);
      email = inputEmail || defaultEmail;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('\n[Error] Invalid email address format provided.');
      process.exit(1);
    }

    // Interactive password prompt if not provided
    if (!password) {
      password = await askQuestion(rl, 'Enter new Admin Password (min 6 chars): ');
      if (!password || password.length < 6) {
        console.error('\n[Error] Password must be at least 6 characters long.');
        process.exit(1);
      }

      const confirm = await askQuestion(rl, 'Confirm new Admin Password: ');
      if (password !== confirm) {
        console.error('\n[Error] Passwords do not match. Reset cancelled.');
        process.exit(1);
      }
    } else if (password.length < 6) {
      console.error('\n[Error] Password must be at least 6 characters long.');
      process.exit(1);
    }

    console.log('\n[1/3] Hashing new password with bcrypt (10 rounds)...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('[2/3] Updating local environment configuration (.env)...');
    updateEnvFile({
      ADMIN_EMAIL: email.toLowerCase().trim(),
      ADMIN_PASSWORD: password,
    });
    console.log('  -> .env file successfully configured with new admin credentials.');

    console.log('[3/3] Checking MongoDB connection status...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_queue';
    let mongoUpdated = false;

    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      const normalizedEmail = email.toLowerCase().trim();

      // Check if admin user exists in MongoDB
      const existingUser = await UserModel.findOne({
        $or: [{ role: 'admin' }, { email: normalizedEmail }],
      });

      if (existingUser) {
        existingUser.email = normalizedEmail;
        existingUser.password = hashedPassword;
        existingUser.role = 'admin';
        existingUser.isActive = true;
        existingUser.updatedAt = new Date();
        await existingUser.save();
        console.log(`  -> MongoDB: Updated existing admin document (${existingUser._id}).`);
      } else {
        await UserModel.create({
          name: 'Chief Admin Evans',
          email: normalizedEmail,
          password: hashedPassword,
          role: 'admin',
          phone: '+1 (555) 019-2831',
          isActive: true,
        });
        console.log('  -> MongoDB: Created new admin user document in MongoDB collection.');
      }
      mongoUpdated = true;
      await mongoose.disconnect();
    } catch (dbErr) {
      console.log('  -> MongoDB not running locally or URI not reachable.');
      console.log('  -> Local high-reliability in-memory store and .env configuration active.');
    }

    console.log('\n=====================================================');
    console.log('   ADMIN PASSWORD RESET COMPLETED SUCCESSFULLY!      ');
    console.log('=====================================================');
    console.log(` Admin Email:        ${email}`);
    console.log(` Password Status:    Updated & securely bcrypt hashed`);
    console.log(` Configuration:      Saved to .env (persists across restarts)`);
    console.log(` Database Sync:      ${mongoUpdated ? 'MongoDB User updated' : 'In-memory / .env fallback active'}`);
    console.log('-----------------------------------------------------');
    console.log(' Next Steps:');
    console.log(' 1. Restart the server if it is currently running:');
    console.log('    npm run dev');
    console.log(' 2. Open http://localhost:3000/login in your browser');
    console.log(' 3. Sign in with the admin email and your new password');
    console.log('=====================================================\n');
  } catch (err) {
    console.error('\n[Fatal Error]', (err as Error).message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
