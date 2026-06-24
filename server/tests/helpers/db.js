const prisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  school: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  question: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  $disconnect: jest.fn(),
}

const resetMocks = () => {
  Object.values(prisma).forEach((model) => {
    if (typeof model === 'object') {
      Object.values(model).forEach((fn) => {
        if (fn.mockReset) fn.mockReset()
      })
    }
  })
}

module.exports = { prisma, resetMocks }
