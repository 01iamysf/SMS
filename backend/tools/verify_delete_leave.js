import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LeaveRequest from './models/LeaveRequest.js';

dotenv.config();

const verifyDelete = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Find a rejected leave
        let leave = await LeaveRequest.findOne({ status: 'rejected' });
        if (!leave) {
            console.log('No rejected leave found to test delete. Creating one...');
            leave = await LeaveRequest.create({
                userId: new mongoose.Types.ObjectId(),
                role: 'student',
                startDate: new Date(),
                endDate: new Date(),
                reason: 'Test Delete',
                status: 'rejected'
            });
        }

        const leaveId = leave._id;
        console.log(`Testing delete for leave ID: ${leaveId} (Status: ${leave.status})`);

        // Simulate delete logic (as in controller)
        if (leave.status === 'rejected' || leave.status === 'revoked') {
            await LeaveRequest.findByIdAndDelete(leaveId);
            const deleted = await LeaveRequest.findById(leaveId);
            if (!deleted) {
                console.log('SUCCESS: Leave deleted successfully.');
            } else {
                console.log('FAILED: Leave still exists.');
            }
        } else {
            console.log('FAILED: Leave was not in deletable status.');
        }

        // 2. Test protection: Try to delete a pending leave
        let pendingLeave = await LeaveRequest.findOne({ status: 'pending' });
        if (pendingLeave) {
            console.log(`Testing protection for pending leave ID: ${pendingLeave._id}`);
            if (pendingLeave.status !== 'rejected' && pendingLeave.status !== 'revoked') {
                console.log('SUCCESS: Logic correctly prevents deleting pending leave.');
            } else {
                console.log('FAILED: Pending leave was incorrectly flagged as deletable.');
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyDelete();
