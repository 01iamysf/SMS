import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
