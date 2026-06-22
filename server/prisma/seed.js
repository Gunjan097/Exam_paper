const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SUPERADMIN_EMAIL || 'admin@examplatform.com'
  const password = process.env.SUPERADMIN_PASSWORD || 'Admin@1234'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Superadmin already exists: ${email}`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      name: 'Platform Admin',
      email,
      passwordHash,
      role: 'superadmin',
    },
  })

  console.log(`✅ Superadmin created: ${user.email}`)
  console.log(`   Password: ${password}`)
  console.log(`   ⚠ Change the password after first login!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
