import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, select: false }, // Store hashed password
    contactNo: String,
    image: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // Auth Verification
    isVerified: { type: Boolean, default: false },
    otp: String,
    otpExpiry: Date,

    // Subscription Logic
    subscriptionStatus: { type: String, enum: ['inactive', 'active'], default: 'inactive' },
    planExpiry: Date, // Plan active for 7 days
    razorpayCustomerId: String,

    createdAt: { type: Date, default: Date.now },
});

const SearchSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    query: String,
    model: String,
    leadCount: Number,
    createdAt: { type: Date, default: Date.now },
    leads: [{
        name: String,
        city: String,
        phone: String,
        website: String,
        instagram: String,
        whatsapp_link: String,
        about: String,
        address: String,
        status: { type: String, default: 'new' }, // for follow-ups
        notes: String,
    }]
});

const PlanSchema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    description: String,
    features: [{
        name: { type: String, required: true },
        available: { type: Boolean, default: true }
    }],
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

export const User = models.User || model('User', UserSchema);
export const Search = models.Search || model('Search', SearchSchema);
export const Plan = models.Plan || model('Plan', PlanSchema);
