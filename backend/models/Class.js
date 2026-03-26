import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true,
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
    },
    section: {
        type: String,
        required: false,
        default: 'A'
    },
    year: {
        type: Number,
        required: true,
    }
}, {
    timestamps: true,
});

// Ensure uniqueness of a class within a department and year (className now includes section potentially)
classSchema.index({ className: 1, departmentId: 1, year: 1 }, { unique: true });

const Class = mongoose.model('Class', classSchema);
export default Class;
