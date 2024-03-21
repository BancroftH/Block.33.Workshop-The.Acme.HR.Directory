require('dotenv').config();
const pg = require('pg');
const express = require('express');

const app = express(); 
app.use(express.json()); // parses req.bodies

const client = new pg.Client(process.env.DATABASE_URL || `postgres://localhost/${process.env.DB_NAME}`);

const init = async () => {
    try {
      await client.connect();
      console.log('db connected'); 
  
      // Create tables
      let SQL = `
        CREATE TABLE IF NOT EXISTS departments (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS employees (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now(),
          department_id INTEGER REFERENCES departments(id) NOT NULL
        );
      `;
      await client.query(SQL);
      console.log('tables created');
  
      // Seed tables with sample data
      SQL = `
        INSERT INTO departments(name) VALUES ('HR');
        INSERT INTO departments(name) VALUES ('Engineering');
        INSERT INTO employees(name, department_id) VALUES ('John Doe', 1);
        INSERT INTO employees(name, department_id) VALUES ('Jane Smith', 2);
      `;
      await client.query(SQL);
      console.log('tables seeded');
  
      const port = process.env.PORT || 3000;
      app.listen(port, () => console.log(`listening on port ${port}`));
    } catch (error) {
      console.error('Error initializing:', error);
    }
  }; 
  
  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
  });
  
  // Routes for handling CRUD operations on employees
  app.get('/api/employees', async (req, res, next) => {
    try {
      const SQL = `SELECT * FROM employees`;
      const response = await client.query(SQL); 
      res.json(response.rows);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/employees', async (req, res, next) => {
    try {
      const { name, department_id } = req.body;
      const SQL = `INSERT INTO employees(name, department_id) VALUES($1, $2) RETURNING *`;
      const response = await client.query(SQL, [name, department_id]);
      res.status(201).json(response.rows[0]);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete('/api/employees/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const SQL = `DELETE FROM employees WHERE id = $1`;
      await client.query(SQL, [id]);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/employees/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, department_id } = req.body;
      const SQL = `UPDATE employees SET name = $1, department_id = $2, updated_at = now() WHERE id = $3 RETURNING *`;
      const response = await client.query(SQL, [name, department_id, id]);
      res.json(response.rows[0]);
    } catch (error) {
      next(error);
    }
  });
  
  // Routes for handling CRUD operations on departments
app.get('/api/departments', async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM departments`;
    const response = await client.query(SQL); 
    res.json(response.rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/departments', async (req, res, next) => {
  try {
    const { name } = req.body;
    const SQL = `INSERT INTO departments(name) VALUES($1) RETURNING *`;
    const response = await client.query(SQL, [name]);
    res.status(201).json(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/departments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const SQL = `DELETE FROM departments WHERE id = $1`;
    await client.query(SQL, [id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.put('/api/departments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const SQL = `UPDATE departments SET name = $1 WHERE id = $2 RETURNING *`;
    const response = await client.query(SQL, [name, id]);
    res.json(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

init();