import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});


export default mongoose.model('questions', questionSchema);