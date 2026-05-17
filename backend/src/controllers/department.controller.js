const prisma = require('../config/prisma');
const { sendSuccess } = require('../utils/apiResponse');

const getDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });

    return sendSuccess(res, { departments }, 'Departments retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getDepartments };
