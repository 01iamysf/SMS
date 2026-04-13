import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema
 * @typedef {Object} User
 * @property {String} name - User's full name
 * @property {String} email - Unique email for login
 * @property {String} password - Hashed password
 * @property {String} role - Role enum: 'admin', 'teacher', 'student', 'parent'
 * @property {ObjectId} departmentId - Ref to Department model
 * @property {ObjectId} classId - Ref to Class model
 * @property {String} section - Class section (e.g., 'A')
 * @property {String} rollNumber - Student's roll number
 * @property {ObjectId} parentId - Ref to Parent User (for students)
 * @property {String} parentEmail - Parent's contact email
 * @property {Array<String>} permissions - List of granular access permissions
 * @property {ObjectId} classCoordinatorFor - Ref to Class this teacher coordinates
 * @property {Array<Object>} enrolledSubjects - List of subjects the student is taking
 * @property {Number} streakCount - Current consecutive days present
 * @property {Number} bestStreak - Record best streak count
 * @property {Date} lastAttendanceDate - Date of last marked attendance
 * @property {String} avatar - URL or base64 for profile image
 * @property {String} coverImage - URL or base64 for profile cover image
 */
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'student', 'parent'],
        required: true,
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
    },
    section: {
        type: String,
    },
    rollNumber: {
        type: String,
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    parentEmail: {
        type: String,
    },
    permissions: [{
        type: String,
        enum: [
            'markAttendance',
            'manualAttendance',
            'viewAttendance',
            'editAttendance',
            'deleteAttendance',
            'exportAttendance',
            'bypassTimeRestraint',
            // Keeping older ones just in case 
            'applyLeave', 'viewReports', 'manageStudents', 'manageSystem'
        ],
    }],
    classCoordinatorFor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
    },
    enrolledSubjects: [{
        subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        semester: { type: String },
        year: { type: String }
    }],
    streakCount: {
        type: Number,
        default: 0,
    },
    bestStreak: {
        type: Number,
        default: 0,
    },
    lastAttendanceDate: {
        type: Date,
    },
    avatar: {
        type: String,
        default: '',
    },
    coverImage: {
        type: String,
        default: '',
    }
}, {
    timestamps: true,
});

/**
 * Compare entered password with hashed password in database
 * @param {String} enteredPassword 
 * @returns {Promise<Boolean>}
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Pre-save middleware to hash password before saving to database
 */
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
