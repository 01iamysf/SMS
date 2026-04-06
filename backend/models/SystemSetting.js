import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    description: {
        type: String,
    }
}, {
    timestamps: true,
});

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);
export default SystemSetting;
