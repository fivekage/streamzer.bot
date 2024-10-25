const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient(
   {
      log: [
         {
            emit: 'event',
            level: 'query',
         },
      ],
   }

)

module.exports.prisma = prisma