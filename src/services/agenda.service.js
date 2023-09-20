const { Agenda } = require('@hokify/agenda');
const jobs = require('../jobs');

const agenda = new Agenda({ db: { address: process.env.MONGO_URI, collection: 'jobs' } });

jobs.forEach((job) => {
  agenda.define(...job);
});

module.exports = agenda;
