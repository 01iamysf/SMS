import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 */
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        let isMatch = false;

        if (user) {
            isMatch = await user.matchPassword(password);

            // Allow parent to log in using their child's password
            if (!isMatch && user.role === 'parent') {
                const child = await User.findOne({ parentEmail: email, role: 'student' });
                if (child) {
                    isMatch = await child.matchPassword(password);
                }
            }
        }

        if (user && isMatch) {
            const token = generateToken(user._id);

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                token,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 */
export const logoutUser = (req, res) => {
    res.json({ message: 'Logged out successfully' });
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 */
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').populate('departmentId').populate('classId');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
