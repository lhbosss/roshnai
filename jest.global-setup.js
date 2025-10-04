const { MongoMemoryServer } = require('mongodb-memory-server')

module.exports = async () => {
  const mongod = new MongoMemoryServer({
    binary: {
      version: '6.0.0',
      skipMD5: true,
    },
  })
  
  await mongod.start()
  const uri = mongod.getUri()
  
  // Store references to clean up later
  global.__MONGOD__ = mongod
  global.__MONGO_URI__ = uri
  
  console.log('MongoDB Memory Server started:', uri)
}