import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import SubjectAllocation from './models/SubjectAllocation.js';
import Subject from './models/Subject.js';

dotenv.config();

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const student = await User.findOne({ email: 'yns@gmail.com' }).populate('enrolledSubjects.subject');
        if (!student) {
            console.log("Student yns@gmail.com not found");
            process.exit(1);
        }

        console.log("Found student:", student.name, "ID:", student._id);
        console.log("Student Class:", student.class);
        console.log("Enrolled Subjects Length:", student.enrolledSubjects?.length);

        let classSubjects = [];
        if (student.class) {
            classSubjects = await SubjectAllocation.find({ classId: student.class })
                .populate('teacherId', 'name email')
                .populate('classId', 'className section')
                .populate('subjectId', 'subjectName departmentId')
                .lean();
            console.log("Class Subjects loaded:", classSubjects.length);
        } else {
            console.log("Student has no class assigned.");
        }

        const individualSubjects = (student.enrolledSubjects || [])
            .filter(es => es && es.subject)
            .map(es => {
                const subjectData = es.subject;
                return {
                    _id: es._id ? es._id.toString() : `enrolled_${subjectData._id}`,
                    subjectId: {
                        _id: subjectData._id,
                        subjectName: subjectData.subjectName,
                        departmentId: subjectData.departmentId
                    },
                    timeSlot: `Semester ${es.semester || 'N/A'}, Year ${es.year || 'N/A'}`,
                    isIndividuallyAssigned: true
                };
            });

        console.log("Individual Subjects mapped:", individualSubjects.length);
        const allSubjects = [...classSubjects, ...individualSubjects];
        console.log("Total Subjects:", allSubjects.length);
        console.log("All Subjects List:", JSON.stringify(allSubjects, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("DIAGNOSTIC ERROR:", err);
        process.exit(1);
    }
}

diagnose();
