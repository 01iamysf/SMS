import mongoose from 'mongoose';

/**
 * Attendance Schema
 * @typedef {Object} Attendance
 * @property {ObjectId} studentId - Ref to Student User
 * @property {ObjectId} teacherId - Ref to Teacher User who marked it
 * @property {ObjectId} classId - Ref to Class
 * @property {ObjectId} subjectId - Ref to Subject
 * @property {Date} date - Date of the class
 * @property {String} time - Time of marking
 * @property {String} method - Enum: 'manual'
 * @property {String} status - Enum: 'present', 'absent', 'leave'
 */
const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    method: {
        type: String,
        enum: ['manual'],
        required: true,
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'leave'],
        default: 'present',
        required: true,
    }
}, {
    timestamps: true,
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
