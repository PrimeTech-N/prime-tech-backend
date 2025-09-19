// backend/scripts/migrate-set-status.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Article = require('../src/models/Article');

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('Missing MONGO_URI');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected');

  // Example: set status=draft for articles that don't have the field
  const res = await Article.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'draft' } }
  );
  console.log('Updated:', res.nModified || res.modifiedCount, 'documents');

  mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
