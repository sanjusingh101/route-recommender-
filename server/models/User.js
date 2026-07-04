const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    defaultPreferences: {
      vehicle: { type: String, enum: ['car', 'bike', 'truck', 'ev'], default: 'car' },
      tripType: { type: String, enum: ['solo', 'family', 'friends', 'business'], default: 'solo' },
      fuelEfficiencyKmpl: { type: Number, default: 15 },
      maxDrivingHours: { type: Number, default: 4 },
      priorities: {
        fastest: { type: Number, default: 1 },
        cheapest: { type: Number, default: 1 },
        comfort: { type: Number, default: 1 },
        safety: { type: Number, default: 1 },
        scenic: { type: Number, default: 0 },
        adventure: { type: Number, default: 0 },
        food: { type: Number, default: 0 },
      },
      avoid: {
        tolls: { type: Boolean, default: false },
        highways: { type: Boolean, default: false },
        ferries: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
