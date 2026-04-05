const fs = require('fs')
const path = require('path')

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const clientSchemaPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client', 'schema.prisma')
const clientEdgePath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client', 'edge.js')
const clientIndexPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client', 'index.js')
const tasksRoutePath = path.join(__dirname, '..', 'app', 'api', 'tasks', 'route.ts')

const clientSchema = fs.readFileSync(clientSchemaPath, 'utf8')
const clientEdge = fs.readFileSync(clientEdgePath, 'utf8')
const clientIndex = fs.readFileSync(clientIndexPath, 'utf8')
const tasksRoute = fs.readFileSync(tasksRoutePath, 'utf8')

const translationTaskBlockMatch = clientSchema.match(/model TranslationTask \{[\s\S]*?\n\}/)
assert(translationTaskBlockMatch, 'TranslationTask model not found in generated Prisma client schema')

const translationTaskBlock = translationTaskBlockMatch[0]

assert(
  !translationTaskBlock.includes('userId'),
  'Generated Prisma client is stale: TranslationTask still includes userId'
)

assert(
  !clientEdge.includes("TranslationTaskScalarFieldEnum = {\r\n  id: 'id',\r\n  repositoryId: 'repositoryId',\r\n  userId: 'userId'") &&
    !clientEdge.includes("TranslationTaskScalarFieldEnum = {\n  id: 'id',\n  repositoryId: 'repositoryId',\n  userId: 'userId'"),
  'Generated Prisma runtime client is stale: TranslationTask scalar enum still includes userId'
)

assert(
  !tasksRoute.includes("mode: 'insensitive'") && !tasksRoute.includes('mode: "insensitive"'),
  'Tasks API still uses mode: insensitive filter, verify this is intentional for PostgreSQL'
)

assert(
  clientIndex.includes('"copyEngine": true'),
  'Generated Prisma runtime client is missing the local engine; run normal prisma generate instead of --no-engine'
)

console.log('Tasks API prerequisites look correct.')
