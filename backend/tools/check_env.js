import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('--- Environment Check ---');
console.log('Current Directory:', process.cwd());
console.log('Looking for .env in:', path.join(__dirname, '.env'));
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
if (process.env.MONGO_URI) {
    console.log('MONGO_URI prefix:', process.env.MONGO_URI.substring(0, 20));
}
console.log('--- End Check ---');
