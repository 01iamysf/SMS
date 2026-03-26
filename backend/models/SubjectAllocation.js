import mongoose from 'mongoose';

const subjectAllocationSchema = new mongoose.Schema({
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    timeSlot: {
        type: String,
        required: false,
    },
    dayOfWeek: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: false,
    },
    startTime: {
        type: String,
        required: false,
    },
    endTime: {
        type: String,
        required: false,
    },
    roomNumber: {
        type: String,
        required: false,
    }
}, {
    timestamps: true,
});

const SubjectAllocation = mongoose.model('SubjectAllocation', subjectAllocationSchema);
export default SubjectAllocation;
