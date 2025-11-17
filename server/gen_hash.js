const b = require('bcryptjs');
const pass = process.argv[2] || 'AdminPass123!';
const hash = b.hashSync(pass, 10);
console.log(hash);
