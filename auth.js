const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const users = {};  // Временное хранилище пользователей

const SECRET_KEY = 'your_secret_key';  // Используйте более надежный ключ в реальном приложении

const register = (username, password) => {
    if (users[username]) {
        throw new Error('User already exists');
    }
    const hashedPassword = bcrypt.hashSync(password, 8);
    users[username] = { password: hashedPassword };
    return generateToken(username);
};

const login = (username, password) => {
    const user = users[username];
    if (!user) {
        throw new Error('User not found');
    }
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
        throw new Error('Invalid password');
    }
    return generateToken(username);
};

const generateToken = (username) => {
    return jwt.sign({ username }, SECRET_KEY, { expiresIn: '24h' });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (e) {
        throw new Error('Invalid token');
    }
};

module.exports = { register, login, verifyToken };
