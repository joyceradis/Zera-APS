import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const cookieName = 'zera_session';
export const passwordMinLength = 12;
export const token = () => randomBytes(32).toString('base64url');
export const hashToken = value => createHash('sha256').update(value).digest('hex');
export const normalizeEmail = value => {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
};
const now = () => Date.now();
export function passwordHash(password) {
  if (typeof password !== 'string' || password.length < passwordMinLength || password.length > 128) throw new Error('INVALID_PASSWORD');
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
}
export function passwordMatch(password, encoded) {
  try {
    const [type, salt, expected] = String(encoded).split('$');
    if (type !== 'scrypt' || !salt || !expected || typeof password !== 'string' || password.length > 128) return false;
    const actual = scryptSync(password, salt, 64);
    const reference = Buffer.from(expected, 'hex');
    return actual.length === reference.length && timingSafeEqual(actual, reference);
  } catch { return false; }
}
export function createStore(filename, maxDoctors = 50) {
  if (!Number.isInteger(maxDoctors) || maxDoctors < 1 || maxDoctors > 5000) throw new Error('INVALID_MAX_DOCTORS');
  const dbFile = filename === ':memory:' ? filename : resolve(filename);
  if (dbFile !== ':memory:') mkdirSync(dirname(dbFile), {recursive:true, mode:0o700});
  const db = new DatabaseSync(dbFile);
  if(dbFile!==':memory:')chmodSync(dbFile,0o600);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL CHECK(role IN ('admin','editor','doctor')),
    password_hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS invites (
    token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','editor','doctor')),
    expires_at INTEGER NOT NULL, created_by TEXT, used_at INTEGER,
    FOREIGN KEY(created_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL, used_at INTEGER, created_by TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(created_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, csrf_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS bookmarks (
    user_id TEXT NOT NULL, rule_id TEXT NOT NULL, PRIMARY KEY(user_id, rule_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS login_attempts (
    key TEXT PRIMARY KEY, count INTEGER NOT NULL, until_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
  CREATE INDEX IF NOT EXISTS idx_invites_expiry ON invites(expires_at);`);
  const one = (sql,...args) => db.prepare(sql).get(...args);
  const many = (sql,...args) => db.prepare(sql).all(...args);
  const exec = (sql,...args) => db.prepare(sql).run(...args);
  function transaction(fn) {
    db.exec('BEGIN IMMEDIATE');
    try {const value=fn(); db.exec('COMMIT'); return value;}
    catch(error) {db.exec('ROLLBACK'); throw error;}
  }
  function countSeats() {
    const active = one("SELECT count(*) n FROM users WHERE role='doctor' AND active=1").n;
    const pending = one("SELECT count(*) n FROM invites WHERE role='doctor' AND used_at IS NULL AND expires_at>?",now()).n;
    return {active,pending,max:maxDoctors,free:Math.max(0,maxDoctors-active-pending)};
  }
  function createInvite(email, role='doctor', createdBy=null, ttlMs=2*24*60*60*1000) {
    email = normalizeEmail(email);
    if (!email || !['admin','editor','doctor'].includes(role)) throw new Error('INVALID_INVITE');
    return transaction(() => {
      if (role==='doctor' && countSeats().free<=0) throw new Error('SEATS_FULL');
      if (one('SELECT id FROM users WHERE email=?',email)) throw new Error('ACCOUNT_EXISTS');
      exec('DELETE FROM invites WHERE email=? AND used_at IS NULL',email);
      const value=token();
      exec('INSERT INTO invites(token_hash,email,role,expires_at,created_by) VALUES(?,?,?,?,?)',hashToken(value),email,role,now()+ttlMs,createdBy);
      return {token:value,email,role,expiresAt:now()+ttlMs};
    });
  }
  function redeemInvite(value,email,password) {
    email = normalizeEmail(email);
    if (!email || typeof value!=='string' || value.length>128) throw new Error('INVALID_INVITE');
    if(typeof password!=='string'||password.length<passwordMinLength||password.length>128)throw new Error('INVALID_PASSWORD');
    return transaction(() => {
      const invite=one('SELECT * FROM invites WHERE token_hash=? AND used_at IS NULL AND expires_at>?',hashToken(value),now());
      if (!invite || invite.email!==email) throw new Error('INVALID_INVITE');
      if (one('SELECT id FROM users WHERE email=?',email)) throw new Error('INVALID_INVITE');
      const pass=passwordHash(password);
      // Reserved doctor seat is already counted in countSeats().
      const id=token();
      exec('INSERT INTO users(id,email,role,password_hash,created_at) VALUES(?,?,?,?,?)',id,email,invite.role,pass,now());
      exec('UPDATE invites SET used_at=? WHERE token_hash=?',now(),hashToken(value));
      return {id,email,role:invite.role};
    });
  }
  function authenticate(email,password,ip) {
    email=normalizeEmail(email);
    const key=hashToken(String(ip||'unknown')+'|'+String(email||'invalid'));
    const attempt=one('SELECT count,until_at FROM login_attempts WHERE key=?',key);
    if (attempt && attempt.until_at>now() && attempt.count>=5) return {status:'limited'};
    const user=email?one('SELECT * FROM users WHERE email=? AND active=1',email):null;
    const dummy='scrypt$e6c41567c2558c6de5a7729ad645054e$8d51e65ca74e8c8f663e2987b3c7d076795ee34d23fcb95b14be4d0243688f5eb034ebcd51d2e25805aefebcdb47eefde5918f091f1fe958a022591e640125e6';
    const valid=passwordMatch(password,user?.password_hash||dummy);
    if (!user||!valid) {
      const count=attempt?.until_at>now()?attempt.count+1:1;
      exec('INSERT INTO login_attempts(key,count,until_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count,until_at=excluded.until_at',key,count,now()+15*60*1000);
      return {status: 'invalid'};
    }
    exec('DELETE FROM login_attempts WHERE key=?',key);
    return {status:'ok',user:{id:user.id,email:user.email,role:user.role}};
  }
  function createReset(userId,createdBy=null,ttlMs=60*60*1000) {
    return transaction(()=>{
      const user=one('SELECT id,email FROM users WHERE id=? AND active=1',userId);
      if(!user)throw new Error('NOT_FOUND');
      const value=token();
      exec('DELETE FROM password_resets WHERE user_id=? AND used_at IS NULL',userId);
      exec('INSERT INTO password_resets(token_hash,user_id,expires_at,created_by) VALUES(?,?,?,?)',hashToken(value),userId,now()+ttlMs,createdBy);
      return {token:value,email:user.email,expiresAt:now()+ttlMs};
    });
  }
  function redeemReset(value,email,password) {
    email=normalizeEmail(email);
    if(!email||typeof value!=='string'||value.length>128||typeof password!=='string'||password.length<passwordMinLength||password.length>128)throw new Error('INVALID_RESET');
    return transaction(()=>{
      const item=one('SELECT r.user_id,u.email,u.role FROM password_resets r JOIN users u ON u.id=r.user_id WHERE r.token_hash=? AND r.used_at IS NULL AND r.expires_at>? AND u.active=1',hashToken(value),now());
      if(!item||item.email!==email)throw new Error('INVALID_RESET');
      const encoded=passwordHash(password);
      exec('UPDATE users SET password_hash=? WHERE id=?',encoded,item.user_id);
      exec('DELETE FROM sessions WHERE user_id=?',item.user_id);
      exec('UPDATE password_resets SET used_at=? WHERE token_hash=?',now(),hashToken(value));
      return {id:item.user_id,email:item.email,role:item.role};
    });
  }
  function sessionFor(userId,ttlMs=8*60*60*1000) {
    const value=token(), csrf=token(), expiry=now()+ttlMs;
    exec('INSERT INTO sessions(token_hash,user_id,csrf_token,expires_at,created_at) VALUES(?,?,?,?,?)',hashToken(value),userId,csrf,expiry,now());
    return {token:value,csrf,expiresAt:expiry};
  }
  function readSession(value) {
    if (!value||typeof value!=='string'||value.length>128)return null;
    const record=one(`SELECT s.token_hash,s.csrf_token,s.expires_at,u.id,u.email,u.role
      FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1`,hashToken(value),now());
    return record ? {hash:record.token_hash,csrf:record.csrf_token,expiresAt:record.expires_at,user:{id:record.id,email:record.email,role:record.role}}:null;
  }
  function revoke(value){if(value&&typeof value==='string')exec('DELETE FROM sessions WHERE token_hash=?',hashToken(value));}
  function listUsers(){return many('SELECT id,email,role,active,created_at FROM users ORDER BY created_at DESC LIMIT 200');}
  function disableUser(id){
    const x=one('SELECT role FROM users WHERE id=?',id);
    if(!x)throw new Error('NOT_FOUND');
    if(x.role==='admin'&&one("SELECT count(*) n FROM users WHERE role='admin' AND active=1").n<2) throw new Error('LAST_ADMIN');
    transaction(()=>{exec('UPDATE users SET active=0 WHERE id=?',id);exec('DELETE FROM sessions WHERE user_id=?',id);});
  }
  function setBookmark(userId,ruleId,enabled){
    if(enabled) exec('INSERT OR IGNORE INTO bookmarks(user_id,rule_id) VALUES(?,?)',userId,ruleId);
    else exec('DELETE FROM bookmarks WHERE user_id=? AND rule_id=?',userId,ruleId);
  }
  function getBookmarks(userId){return many('SELECT rule_id FROM bookmarks WHERE user_id=? ORDER BY rule_id',userId).map(x=>x.rule_id);}
  function sweep(){const time=now();exec('DELETE FROM sessions WHERE expires_at<=?',time);exec('DELETE FROM invites WHERE expires_at<=? OR used_at IS NOT NULL',time);exec('DELETE FROM login_attempts WHERE until_at<=?',time);exec('DELETE FROM password_resets WHERE expires_at<=? OR used_at IS NOT NULL',time);}
  return {db,countSeats,createInvite,redeemInvite,createReset,redeemReset,authenticate,sessionFor,readSession,revoke,listUsers,disableUser,setBookmark,getBookmarks,sweep};
}