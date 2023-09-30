const date = require(`./date.js`);

const currentDate = new Date();
const isoFormattedDate = currentDate.toISOString();
console.log(isoFormattedDate);