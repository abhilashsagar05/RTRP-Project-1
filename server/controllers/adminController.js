const Report = require('../models/Report');
const User = require('../models/User');
const { Op } = require('sequelize');

// @desc    Register a police officer (admin only)
// @route   POST /api/admin/register-police
exports.registerPolice = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check if user already exists in backend DB
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Create in backend DB with role 'police'
    const user = await User.create({
      name,
      email,
      password, // Use the provided password
      role: 'police'
    });

    res.status(201).json({
      message: `Police officer "${name}" registered successfully.`,
      user: { _id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Register police error:', error);
    res.status(500).json({ message: 'Failed to register police officer.', error: error.message });
  }
};

// @desc    Register an admin (admin only)
// @route   POST /api/admin/register-admin
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check if user already exists in backend DB
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Create in backend DB with role 'admin'
    const user = await User.create({
      name,
      email,
      password, // Use the provided password
      role: 'admin'
    });

    res.status(201).json({
      message: `Admin "${name}" registered successfully.`,
      user: { _id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Register admin error:', error);
    res.status(500).json({ message: 'Failed to register admin.', error: error.message });
  }
};

// @desc    Register a user (admin only)
// @route   POST /api/admin/register-user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      password, // Use the provided password
      role: 'user'
    });

    res.status(201).json({
      message: `Citizen user "${name}" registered successfully.`,
      user: { _id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Register user error:', error);
    res.status(500).json({ message: 'Failed to register user.', error: error.message });
  }
};

// @desc    Get all reports (admin)
// @route   GET /api/admin/reports
exports.getAllReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Build filter
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.violationType) where.violationType = req.query.violationType;
    if (req.query.startDate || req.query.endDate) {
      where.createdAt = {};
      if (req.query.startDate) where.createdAt[Op.gte] = new Date(req.query.startDate);
      if (req.query.endDate) where.createdAt[Op.lte] = new Date(req.query.endDate);
    }

    const { count, rows } = await Report.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    // Get users for all reports
    const userIds = [...new Set(rows.map(r => r.userId))];
    const users = await User.findAll({ where: { id: userIds } });
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const reports = rows.map(r => r.toAPIFormat(userMap[r.userId]));

    res.json({
      reports,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update report status (admin)
// @route   PUT /api/admin/reports/:id
exports.updateReport = async (req, res) => {
  try {
    const { status, adminNotes, verifiedNumberPlate, verifiedVehicleType } = req.body;

    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // If status is 'resolved', delete the report and its media files
    if (status === 'resolved') {
      const fs = require('fs');
      const path = require('path');
      if (report.media && Array.isArray(report.media)) {
        report.media.forEach(m => {
          if (m.url) {
            const filePath = path.join(__dirname, '..', m.url);
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted media file: ${filePath}`);
              }
            } catch (err) {
              console.error(`Failed to delete media file: ${filePath}`, err.message);
            }
          }
        });
      }
      await report.destroy();
      return res.json({ message: 'Report resolved and deleted successfully.' });
    }

    if (status) report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;
    if (verifiedNumberPlate !== undefined) report.verifiedNumberPlate = verifiedNumberPlate;
    if (verifiedVehicleType !== undefined) report.verifiedVehicleType = verifiedVehicleType;

    await report.save();

    const user = await User.findByPk(report.userId);
    res.json(report.toAPIFormat(user));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all users (admin)
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    // Get report counts per user
    const usersWithCounts = await Promise.all(
      rows.map(async (user) => {
        const reportCount = await Report.count({ where: { userId: user.id } });
        return {
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isBanned: user.isBanned,
          createdAt: user.createdAt,
          reportCount
        };
      })
    );

    res.json({
      users: usersWithCounts,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Toggle user ban status (admin)
// @route   PATCH /api/admin/users/:id/ban
exports.toggleBanUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from banning themselves
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot ban yourself' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({ 
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
      isBanned: user.isBanned 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete report (admin)
// @route   DELETE /api/admin/reports/:id
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    await report.destroy();
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
