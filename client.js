const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient(
   {
      log: [
         {
            emit: 'event',
            level: 'query',
         },
      ],
      errorFormat: 'pretty',
      datasourceUrl: process.env.DATABASE_URL ?? new Error('DATABASE_URL is not defined'),
   }
)

module.exports.prisma = prisma