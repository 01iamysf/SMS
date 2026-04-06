import User from '../models/User.js';
import Department from '../models/Department.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';

export const globalSearch = async (req, res) => {
    try {
        const { q, type } = req.query;
        if (!q) return res.status(400).json({ message: 'Search query is required' });

        const regex = new RegExp(q, 'i');
        let results = {};

        // Find matching departments first to enable linked searches
        const matchedDepts = await Department.find({ departmentName: regex });
        const matchedDeptIds = matchedDepts.map(d => d._id);

        if (!type || type === 'student') {
            results.students = await User.find({
                role: 'student',
                $or: [
                    { name: regex },
                    { email: regex },
                    { rollNumber: regex },
                    { departmentId: { $in: matchedDeptIds } }
                ]
            }).select('-password').populate('classId').populate('departmentId');
        }
        if (!type || type === 'teacher') {
            results.teachers = await User.find({
                role: 'teacher',
                $or: [
                    { name: regex },
                    { email: regex },
                    { departmentId: { $in: matchedDeptIds } }
                ]
            }).select('-password').populate('departmentId');
        }
        if (!type || type === 'department') {
            results.departments = matchedDepts;
        }
        if (!type || type === 'class') {
            results.classes = await Class.find({
                $or: [
                    { className: regex },
                    { departmentId: { $in: matchedDeptIds } }
                ]
            }).populate('departmentId', 'departmentName');
        }
        if (!type || type === 'subject') {
            results.subjects = await Subject.find({
                $or: [
                    { subjectName: regex },
                    { departmentId: { $in: matchedDeptIds } }
                ]
            }).populate('departmentId');
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

