const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const pool = require('./db');
const userValidator = require('./userValidator');


const PORT = 3000;

app.use(express.json());

app.post('/login', async (req, res) => {
    try {
        console.log('here', req.body.email)
        const candidateData = await pool.query('SELECT * FROM users WHERE email = $1', [req.body.email]);
        const candidate = candidateData.rows[0];
        console.log(candidate)
        if (candidate) {
            const passwordResult = bcrypt.compareSync(req.body.password, candidate.password);

            if (passwordResult) {
                const token = jwt.sign({
                    email: candidate.email,
                    id: candidate.id
                }, 'secure key', {expiresIn: 3600});

                res.status(200).json({
                    token: `Bearer ${token}`
                });
            } else {
                res.status(401).json({
                    message: 'wrong password'
                });
            }
        } else {
            res.status(404).json({
                message: 'email is not found'
            });
        }
    } catch (error) {
        console.log("Error:", error)
    }
})


app.get('/users/:id', async (req, res) => {
    try {
       const id = req.params.id; 
       const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
       res.status(200).json(user.rows[0]);
    } catch (error) {
        res.status(404).json(error.message);
    }
});

app.put('/users/:id', async (req, res) => {
    try {
       const id = req.params.id; 
       const user = req.body;
       let errors = await userValidator(user, id);
        
       if (errors.length > 0) {
        res.status(409).json(errors)
        }
        else {
            const { first_name, last_name, email, phone, password, password2 } = req.body;
            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(password, salt);
            
            await pool.query(`UPDATE users 
                              SET first_name = $1, last_name = $2, email = $3, phone = $4, password = $5  
                              WHERE id = $6`, 
                              [first_name, last_name, email, phone, passwordHash, id]);

            res.status(200).json({message: 'Updated'});
                    
    }

      
    } catch (error) {
        res.status(500).json(error.message);
    }
});

app.post('/users', async (req, res) => {
    try {
        
        let errors = await userValidator(req.body);

        if (errors.length > 0) {
            res.status(409).json(errors)
        }
        else {
            const { first_name, last_name, email, phone, password, password2 } = req.body;
            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(password, salt);
            
            await pool.query(`INSERT INTO users (first_name, last_name, email, phone, password)
                        VALUES ($1, $2, $3, $4, $5)`, 
                        [first_name, last_name, email, phone, passwordHash]);
            res.status(201).json({message: 'Created'})
                        
        }

        

    } catch (error) {
        
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

