/* global use, db, console */
use('roshanai');

function ensureCollection(name) {
  if (!db.getCollectionInfos({ name }).length) {
    db.createCollection(name);
    console.log(`Created collection: ${name}`);
  }
}

function ensureIndexes(name, wanted) {
  const col = db.getCollection(name);
  const existing = new Set(col.getIndexes().map(i => i.name));
  for (const spec of wanted) {
    if (!existing.has(spec.name)) {
      const { key, ...opts } = spec;
      col.createIndex(key, opts); // keys separate from options
      console.log(`Created index '${spec.name}' on ${name}`);
    }
  }
}

ensureCollection('transactions');
ensureCollection('messages');
ensureCollection('complaints');

ensureIndexes('transactions', [
  { key: { lender: 1 }, name: 'by_lender' },
  { key: { borrower: 1 }, name: 'by_borrower' },
  { key: { book: 1 }, name: 'by_book' },
  { key: { status: 1, updatedAt: -1 }, name: 'by_status_updatedAt' },
  { key: { createdAt: -1 }, name: 'created_desc' },
]);

ensureIndexes('messages', [
  { key: { transaction: 1, createdAt: -1 }, name: 'by_tx_created' },
  { key: { sender: 1, createdAt: -1 }, name: 'by_sender_created' },
  { key: { receiver: 1, isRead: 1, createdAt: -1 }, name: 'by_receiver_read_created' },
]);

ensureIndexes('complaints', [
  { key: { transaction: 1 }, name: 'by_tx' },
  { key: { complainant: 1 }, name: 'by_complainant' },
  { key: { against: 1 }, name: 'by_against' },
  { key: { status: 1, createdAt: -1 }, name: 'by_status_created' },
]);

// Verify
console.log('transactions indexes:', db.transactions.getIndexes().map(i => i.name));
console.log('messages indexes:', db.messages.getIndexes().map(i => i.name));
console.log('complaints indexes:', db.complaints.getIndexes().map(i => i.name));
