import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

export async function connectDB() {
  // Resolve Mongo URI from multiple candidates to avoid OS-level bad overrides in dev
  const candidates = [
    // Prefer fallbacks first to bypass bad OS-level MONGO_URI overrides in dev
    { key: 'MONGODB_URI', value: (process.env as any).MONGODB_URI },
    { key: 'DATABASE_URL', value: process.env.DATABASE_URL },
    { key: 'MONGO_URI', value: process.env.MONGO_URI },
  ];

  function normalize(val: string) {
    let v = (val || '').trim();
    if (!v) return v;
    // Strip BOM
    if (v.charCodeAt(0) === 0xFEFF) v = v.slice(1);
    // Strip surrounding quotes
    v = v.replace(/^[\'"`]+|[\'"`]+$/g, '');
    return v;
  }

  function isValidMongoUri(v: string) {
    return /^mongodb(\+srv)?:\/\//i.test(v);
  }

  let pickedKey = '';
  let uri = '';
  if (process.env.NODE_ENV !== 'production') {
    const presence = candidates.map(c => `${c.key}=${c.value ? 'set' : 'unset'}`).join(', ');
    console.log('[db] Env presence:', presence);
  }
  for (const { key, value } of candidates) {
    const v = normalize(value || '');
    if (!v) continue;
    if (isValidMongoUri(v)) {
      pickedKey = key;
      uri = v;
      break;
    } else {
      const startCodes = Array.from(v.slice(0, 12)).map((c) => c.charCodeAt(0)).join(',');
      console.warn(`[db] Ignoring invalid ${key}; expected mongodb:// or mongodb+srv:// (char codes: ${startCodes})`);
    }
  }

  if (!uri) {
    throw new Error('No valid Mongo connection string found. Set MONGO_URI (preferred) or MONGODB_URI/DATABASE_URL to a mongodb:// or mongodb+srv:// URI with a database name.');
  }

  // Recommend having a database name (not just trailing /)
  // Recommend having a database name (not just trailing /)
  if (/^mongodb(\+srv)?:\/\/[^/]+\/?$/i.test(uri)) {
    console.warn('[db] MONGO_URI has no database name. Append one, e.g. ":/...mongodb.net/roshanai?retryWrites=true&w=majority"');
  }
  if (!global._mongooseConn) {
    global._mongooseConn = { conn: null, promise: null };
  }
  if (global._mongooseConn.conn) return global._mongooseConn.conn;
  if (!global._mongooseConn.promise) {
    const redacted = uri.replace(/(mongodb(?:\+srv)?:\/\/)([^@]+)@/, '$1***:***@');
    const from = pickedKey ? ` via ${pickedKey}` : '';
    console.log('[db] Connecting to', redacted + from);
    global._mongooseConn.promise = mongoose.connect(uri).then((m: any) => m).catch(err => {
      console.error('[db] Connection error:', err.message);
      throw err;
    });
  }
  global._mongooseConn.conn = await global._mongooseConn.promise;
  return global._mongooseConn.conn;
}
