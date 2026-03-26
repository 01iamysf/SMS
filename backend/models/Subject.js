import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
    subjectName: {
        type: String,
        required: true,
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
    }
}, {
    timestamps: true,
});

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
