const validator = require('validator');
const pool = require('./db');

async function userValidator(userData, idForUpdate) {

    const { first_name, last_name, email, phone, password, password2 } = userData;
    let errors = [];

    if (!first_name || !email || !password || !password2) {
        errors.push('Please enter all required fields');
    }
    
    if (password !== password2) {
        errors.push('Passwords do not match');
    }
    
    if (!validator.isEmail(email)) {
        errors.push('Incorrect email value');
    }
    
    if (!validator.isMobilePhone(phone)) {
        errors.push('Incorrect phone value');
    }
    
    if (!validator.isAlpha(first_name)) {
        errors.push('First name may contents letters only');
    }
    
    if (!validator.isAlpha(last_name)) {
        errors.push('Last name may contents letters only');
    }
    
    try {
        const isEmailFree = await pool.query('SELECT * FROM users WHERE email = $1 AND id <> $2', [email, idForUpdate]);
        if (isEmailFree.rows.length > 0) {
             errors.push('Email is already registered');
        }
    } catch (error) {
        errors.push(error.message)
    }
    

    return errors;
    
}

module.exports = userValidator;

