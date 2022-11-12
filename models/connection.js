const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://admin:hzph4yJPpIYGEQiB@cluster0.pxdm6m3.mongodb.net/adog';

mongoose.connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log('🐶 Database connected'))
  .catch(error => console.error(error));


  // connection à mongoose