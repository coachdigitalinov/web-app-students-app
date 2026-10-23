// Optional demo data: node scripts/seed.mjs   (never run in production)
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

fs.mkdirSync("data", { recursive: true });
const db = new Database(path.join("data", "app.db"));
db.exec(fs.readFileSync(path.join("lib", "schema.sql"), "utf8"));
const add = db.prepare("INSERT OR IGNORE INTO users (name,email,password_hash,role,grade,school,referral_code,referred_by) VALUES (?,?,?,?,?,?,?,?)");
const h = bcrypt.hashSync("demo12345", 10);
add.run("Administrator", "admin@digitalinov.local", bcrypt.hashSync("ChangeMe123!", 10), "admin", null, null, null, null);
add.run("Demo Teacher", "teacher@demo.local", h, "teacher", null, "Demo School", "TDEMO01", null);
const t = db.prepare("SELECT id FROM users WHERE email='teacher@demo.local'").get();
add.run("Demo Student", "student@demo.local", h, "student", "10", "Demo School", null, t.id);
console.log("Seeded: teacher@demo.local / student@demo.local (password demo12345)");
