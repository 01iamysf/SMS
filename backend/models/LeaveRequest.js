import mongoose from 'mongoose';

/**
 * LeaveRequest Schema
 * @typedef {Object} LeaveRequest
 * @property {ObjectId} userId - Ref to User (Student/Teacher) applying for leave
 * @property {String} role - Role of the applicant ('teacher' or 'student')
 * @property {Date} startDate - Start date of the leave
 * @property {Date} endDate - End date of the leave
 * @property {String} reason - Detailed reason for the leave
 * @property {String} status - Enum: 'pending', 'approved', 'rejected', 'revoked'
 * @property {ObjectId} approvedBy - Ref to User (Coordinator/Admin) who took action
 * @property {ObjectId} revokedBy - Ref to User who revoked the leave
 * @property {String} revocationReason - Reason for revoking an approved leave
 */
const leaveRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    role: {
        type: String,
        enum: ['teacher', 'student'],
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'revoked'],
        default: 'pending',
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    revokedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    revocationReason: {
        type: String,
    }
}, {
    timestamps: true,
});

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
export default LeaveRequest;
