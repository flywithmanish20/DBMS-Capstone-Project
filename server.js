const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "MYSQL@Project",
    database: "employee_payroll_db"
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err.message);
        return;
    }
    console.log("MySQL Database Connected Successfully!");
});

app.get("/api/employees", (req, res) => {
    const sql = `
        SELECT e.employee_id, e.employee_name, e.email,
               e.designation, e.basic_salary, d.department_name
        FROM employees e
        LEFT JOIN departments d
        ON e.department_id = d.department_id
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});
app.post("/api/employees", (req, res) => {
    const {
        employee_name,
        email,
        phone,
        department_id,
        designation,
        joining_date,
        basic_salary
    } = req.body;

    const sql = `
        INSERT INTO employees
        (employee_name, email, phone, department_id,
         designation, joining_date, basic_salary)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        employee_name,
        email,
        phone,
        department_id,
        designation,
        joining_date,
        basic_salary
    ], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
            message: "Employee added successfully!",
            employee_id: result.insertId
        });
    });
});
app.get("/api/departments", (req, res) => {
    db.query("SELECT * FROM departments", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

app.get("/api/attendance", (req, res) => {
    const sql = `
        SELECT a.attendance_id, e.employee_name,
               a.attendance_date, a.status
        FROM attendance a
        JOIN employees e ON a.employee_id = e.employee_id
        ORDER BY a.attendance_date DESC
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});
app.post("/api/attendance", (req, res) => {
    const { employee_id, attendance_date, status } = req.body;

    const sql = `
        INSERT INTO attendance (employee_id, attendance_date, status)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [employee_id, attendance_date, status], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
            message: "Attendance marked successfully!",
            attendance_id: result.insertId
        });
    });
});

app.get("/api/payroll", (req, res) => {
    const sql = `
        SELECT p.*, e.employee_name
        FROM payroll p
        JOIN employees e ON p.employee_id = e.employee_id
        ORDER BY p.payroll_year DESC, p.payroll_month DESC
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

app.get("/api/dashboard", (req, res) => {
    const sql = `
        SELECT
        (SELECT COUNT(*) FROM employees) AS totalEmployees,
        (SELECT COUNT(*) FROM departments) AS totalDepartments,
        (SELECT COUNT(*) FROM attendance
         WHERE status = 'Present') AS presentRecords,
        (SELECT COALESCE(SUM(net_salary), 0) FROM payroll)
         AS totalPayroll
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result[0]);
    });
});
// GET ALL LEAVE REQUESTS

app.get("/api/leaves", (req, res) => {

    const sql = `
        SELECT l.leave_id, e.employee_name,
               l.start_date, l.end_date,
               l.reason, l.status
        FROM leave_requests l
        JOIN employees e
        ON l.employee_id = e.employee_id
        ORDER BY l.applied_at DESC
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(result);

    });

});


// SUBMIT LEAVE REQUEST

app.post("/api/leaves", (req, res) => {

    const {
        employee_id,
        start_date,
        end_date,
        reason
    } = req.body;

    if (!employee_id || !start_date || !end_date || !reason) {
        return res.status(400).json({
            error: "Please fill all leave details."
        });
    }

    if (end_date < start_date) {
        return res.status(400).json({
            error: "End date cannot be before start date."
        });
    }

    const sql = `
        INSERT INTO leave_requests
        (employee_id, start_date, end_date, reason)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql,
        [employee_id, start_date, end_date, reason],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Leave request submitted successfully!",
                leave_id: result.insertId
            });

        }
    );

});
// GET SALARY STRUCTURES

app.get("/api/salary-structures", (req, res) => {

    const sql = `
        SELECT s.structure_id, s.employee_id,
               e.employee_name, s.basic_salary,
               s.allowance, s.tax_percentage
        FROM salary_structures s
        JOIN employees e
        ON s.employee_id = e.employee_id
        ORDER BY s.structure_id DESC
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });

});


// ADD SALARY STRUCTURE

app.post("/api/salary-structures", (req, res) => {

    const {
        employee_id,
        basic_salary,
        allowance,
        tax_percentage
    } = req.body;

    if (!employee_id || basic_salary === undefined || basic_salary === "") {
        return res.status(400).json({
            error: "Employee and basic salary are required."
        });
    }

    const sql = `
        INSERT INTO salary_structures
        (employee_id, basic_salary, allowance, tax_percentage)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        basic_salary = VALUES(basic_salary),
        allowance = VALUES(allowance),
        tax_percentage = VALUES(tax_percentage)
    `;

    db.query(sql, [
        employee_id,
        basic_salary,
        allowance || 0,
        tax_percentage || 0
    ], (err, result) => {

        if (err) return res.status(500).json({ error: err.message });

        res.status(201).json({
            message: "Salary structure saved successfully!"
        });

    });

});
// AUTOMATIC PAYROLL GENERATION

app.post("/api/payroll/generate", (req, res) => {

    const { payroll_month, payroll_year } = req.body;

    if (!payroll_month || !payroll_year) {
        return res.status(400).json({
            error: "Please select month and year"
        });
    }

    const sql = `
        SELECT
            e.employee_id,
            s.basic_salary,
            COALESCE(s.allowance, 0) AS allowance,
            COALESCE(s.tax_percentage, 0) AS tax_percentage
        FROM employees e
        INNER JOIN salary_structures s
        ON e.employee_id = s.employee_id
    `;

    db.query(sql, (err, employees) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (employees.length === 0) {
            return res.status(400).json({
                error: "No salary structures found. Add salary structure first."
            });
        }

        const values = employees.map(emp => {
            const grossSalary =
                Number(emp.basic_salary) + Number(emp.allowance);

            const deductions =
                grossSalary * Number(emp.tax_percentage) / 100;

            const netSalary = grossSalary - deductions;

            return [
                emp.employee_id,
                payroll_month,
                payroll_year,
                emp.basic_salary,
                deductions,
                netSalary
            ];
        });

        const insertSql = `
            INSERT INTO payroll
            (employee_id, payroll_month, payroll_year,
             basic_salary, deductions, net_salary)
            VALUES ?
        `;

        db.query(insertSql, [values], (insertError, result) => {

            if (insertError) {
                return res.status(500).json({
                    error: insertError.message
                });
            }

            res.json({
                message: "Payroll generated successfully!",
                employees_processed: result.affectedRows
            });

        });

    });

});
// SALARY SLIP GENERATION

app.get("/api/payroll/slip/:employeeId/:month/:year", (req, res) => {

    const { employeeId, month, year } = req.params;

    const sql = `
        SELECT
            e.employee_name,
            p.payroll_month,
            p.payroll_year,
            p.basic_salary,
            p.deductions,
            p.net_salary
        FROM payroll p
        JOIN employees e
        ON p.employee_id = e.employee_id
        WHERE p.employee_id = ?
        AND p.payroll_month = ?
        AND p.payroll_year = ?
        LIMIT 1
    `;

    db.query(sql, [employeeId, month, year], (err, result) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.length === 0) {
            return res.status(404).json({
                error: "Salary slip not found for this employee and month."
            });
        }

        res.json(result[0]);

    });

});
app.get("/{*splat}", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});