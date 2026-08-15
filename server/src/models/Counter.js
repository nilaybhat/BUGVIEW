import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1000 },
});

export const Counter = mongoose.model('Counter', counterSchema);

export async function nextBugSequence() {
  const doc = await Counter.findOneAndUpdate(
    { _id: 'bug' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc.seq;
}
