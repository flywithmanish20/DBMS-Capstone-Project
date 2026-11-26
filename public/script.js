function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(section => {
        section.classList.add("hidden");
    });

    document.getElementById(sectionId).classList.remove("hidden");
}

async function loadDashboard() {
    try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) throw new Error("Dashboard loading failed");

        const data = await response.json();

        document.getElementById("totalEmployees").textContent = data.totalEmployees;
        document.getElementById("totalDepartments").textContent = data.totalDepartments;
        document.getElementById("presentRecords").textContent = data.presentRecords;
        document.getElementById("totalPayroll").textContent =
            "₹" + Number(data.totalPayroll).toLocaleString("en-IN");
    } catch (error) {
        console.error(error);
    }
}

async function loadEmployees() {
    try {
        const response = await fetch("/api/employees");
        if (!response.ok) throw new Error("Employees loading failed");

        const employees = await response.json();

        document.getElementById("employeeTable").innerHTML =
            employees.map(emp => `
                <tr>
                    <td>${emp.employee_id}</td>
                    <td>${emp.employee_name}</td>
                    <td>${emp.email || "-"}</td>
                    <td>${emp.designation || "-"}</td>
                    <td>${emp.department_name || "-"}</td>
                    <td>₹${Number(emp.basic_salary || 0).toLocaleString("en-IN")}</td>
                </tr>
            `).join("");
    } catch (error) {
        console.error(error);
    }
}

async function loadDepartments() {
    try {
        const response = await fetch("/api/departments");
        if (!response.ok) throw new Error("Departments loading failed");

        const departments = await response.json();

        document.getElementById("departmentTable").innerHTML =
            departments.map(dept => `
                <tr>
                    <td>${dept.department_id}</td>
                    <td>${dept.department_name}</td>
                </tr>
            `).join("");
    } catch (error) {
        console.error(error);
    }
}

async function loadAttendance() {
    try {
        const response = await fetch("/api/attendance");
        if (!response.ok) throw new Error("Attendance loading failed");

        const records = await response.json();

        document.getElementById("attendanceTable").innerHTML =
            records.map(item => `
                <tr>
                    <td>${item.attendance_id}</td>
                    <td>${item.employee_name}</td>
                    <td>${new Date(item.attendance_date).toLocaleDateString("en-IN")}</td>
                    <td>${item.status}</td>
                </tr>
            `).join("");
    } catch (error) {
        console.error(error);
    }
}

async function loadPayroll() {
    try {
        const response = await fetch("/api/payroll");
        if (!response.ok) throw new Error("Payroll loading failed");

        const records = await response.json();

        document.getElementById("payrollTable").innerHTML =
            records.map(item => `
                <tr>
                    <td>${item.employee_name}</td>
                    <td>${item.payroll_month}</td>
                    <td>${item.payroll_year}</td>
                    <td>₹${Number(item.basic_salary).toLocaleString("en-IN")}</td>
                    <td>₹${Number(item.deductions).toLocaleString("en-IN")}</td>
                    <td>₹${Number(item.net_salary).toLocaleString("en-IN")}</td>
                </tr>
            `).join("");
    } catch (error) {
        console.error(error);
    }
}

loadDashboard();
loadEmployees();
loadDepartments();
loadAttendance();
loadPayroll();
async function loadDepartmentOptions() {
    try {
        const response = await fetch("/api/departments");
        const departments = await response.json();

        const dropdown = document.getElementById("department_id");

        dropdown.innerHTML = '<option value="">Select Department</option>';

        departments.forEach(dept => {
            dropdown.innerHTML += `
                <option value="${dept.department_id}">
                    ${dept.department_name}
                </option>
            `;
        });
    } catch (error) {
        console.error("Department loading error:", error);
    }
}

document.getElementById("employeeForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const employee = {
        employee_name: document.getElementById("employee_name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        department_id: document.getElementById("department_id").value,
        designation: document.getElementById("designation").value,
        joining_date: document.getElementById("joining_date").value,
        basic_salary: document.getElementById("basic_salary").value
    };

    const message = document.getElementById("formMessage");

    try {
        const response = await fetch("/api/employees", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(employee)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Employee could not be added");
        }

        message.textContent = "Employee added successfully!";
        message.style.color = "green";

        this.reset();

        await loadEmployees();
        await loadDashboard();

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
});

loadDepartmentOptions();
// LOAD EMPLOYEES IN LEAVE DROPDOWN

async function loadLeaveEmployees() {
    try {
        const response = await fetch("/api/employees");

        if (!response.ok) {
            throw new Error("Employees loading failed");
        }

        const employees = await response.json();

        const dropdown = document.getElementById("leaveEmployee");

        dropdown.innerHTML =
            '<option value="">Select Employee</option>';

        employees.forEach(emp => {
            dropdown.innerHTML += `
                <option value="${emp.employee_id}">
                    ${emp.employee_name}
                </option>
            `;
        });

    } catch (error) {
        console.error(error);
    }
}


// LOAD LEAVE RECORDS

async function loadLeaves() {
    try {
        const response = await fetch("/api/leaves");

        if (!response.ok) {
            throw new Error("Leave loading failed");
        }

        const records = await response.json();

        document.getElementById("leaveTable").innerHTML =
            records.map(item => `
                <tr>
                    <td>${item.leave_id}</td>
                    <td>${item.employee_name}</td>
                    <td>${new Date(item.start_date).toLocaleDateString("en-IN")}</td>
                    <td>${new Date(item.end_date).toLocaleDateString("en-IN")}</td>
                    <td>${item.reason}</td>
                    <td>${item.status}</td>
                </tr>
            `).join("");

    } catch (error) {
        console.error(error);
    }
}


// SUBMIT LEAVE REQUEST

document.getElementById("leaveForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const employee_id =
        document.getElementById("leaveEmployee").value;

    const start_date =
        document.getElementById("leaveStartDate").value;

    const end_date =
        document.getElementById("leaveEndDate").value;

    const reason =
        document.getElementById("leaveReason").value.trim();

    const message =
        document.getElementById("leaveMessage");

    if (end_date < start_date) {
        message.textContent = "Invalid leave dates!";
        message.style.color = "red";
        return;
    }

    try {
        const response = await fetch("/api/leaves", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                employee_id,
                start_date,
                end_date,
                reason
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Request failed");
        }

        message.textContent =
            "Leave request submitted successfully!";

        message.style.color = "green";

        this.reset();

        await loadLeaves();

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }

});


// INITIAL LOAD

loadLeaveEmployees();
loadLeaves();
// LOAD EMPLOYEES FOR SALARY

async function loadSalaryEmployees() {
    try {
        const response = await fetch("/api/employees");
        if (!response.ok) throw new Error("Employee loading failed");

        const employees = await response.json();

        const dropdown = document.getElementById("salaryEmployee");

        dropdown.innerHTML = '<option value="">Select Employee</option>';

        employees.forEach(emp => {
            dropdown.innerHTML += `
                <option value="${emp.employee_id}">
                    ${emp.employee_name}
                </option>
            `;
        });

    } catch (error) {
        console.error(error);
    }
}


// LOAD SALARY STRUCTURES

async function loadSalaryStructures() {
    try {
        const response = await fetch("/api/salary-structures");
        if (!response.ok) throw new Error("Salary loading failed");

        const records = await response.json();

        document.getElementById("salaryTable").innerHTML =
            records.map(item => `
                <tr>
                    <td>${item.structure_id}</td>
                    <td>${item.employee_name}</td>
                    <td>₹${Number(item.basic_salary).toLocaleString("en-IN")}</td>
                    <td>₹${Number(item.allowance).toLocaleString("en-IN")}</td>
                    <td>${item.tax_percentage}%</td>
                </tr>
            `).join("");

    } catch (error) {
        console.error(error);
    }
}


// SAVE SALARY STRUCTURE

document.getElementById("salaryForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const message = document.getElementById("salaryMessage");

    const salary = {
        employee_id: document.getElementById("salaryEmployee").value,
        basic_salary: document.getElementById("salaryBasic").value,
        allowance: document.getElementById("salaryAllowance").value || 0,
        tax_percentage: document.getElementById("salaryTax").value || 0
    };

    try {
        const response = await fetch("/api/salary-structures", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(salary)
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || "Save failed");

        message.textContent = "Salary structure saved successfully!";
        message.style.color = "green";

        this.reset();

        await loadSalaryStructures();

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
});

loadSalaryEmployees();
loadSalaryStructures();
// AUTOMATIC PAYROLL GENERATION

document.getElementById("payrollForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const month = document.getElementById("payrollMonth").value;
    const year = document.getElementById("payrollYear").value;
    const message = document.getElementById("payrollMessage");

    try {
        const response = await fetch("/api/payroll/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                payroll_month: month,
                payroll_year: year
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Payroll generation failed");
        }

        message.textContent = result.message || "Payroll generated successfully!";
        message.style.color = "green";

        await loadPayroll();
        await loadDashboard();

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }

});
async function generateSalarySlip() {
    const employeeId = document.getElementById("slipEmployeeId").value;
    const month = document.getElementById("slipMonth").value;
    const year = document.getElementById("slipYear").value;
    const resultBox = document.getElementById("salarySlipResult");

    if (!employeeId || !month || !year) {
        resultBox.textContent = "Please fill all fields.";
        return;
    }

    resultBox.textContent = "Generating salary slip...";

    try {
        const response = await fetch(
            `/api/payroll/slip/${employeeId}/${month}/${year}`-0 
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Salary slip not found");
        }

        resultBox.innerHTML = `
            <h3>Salary Slip</h3>
            <p>Employee: ${data.employee_name}</p>
            <p>Month: ${data.payroll_month}</p>
            <p>Year: ${data.payroll_year}</p>
            <p>Basic Salary: ₹${data.basic_salary}</p>
            <p>Deductions: ₹${data.deductions}</p>
            <h3>Net Salary: ₹${data.net_salary}</h3>
            <button onclick="window.print()">Print Salary Slip</button>
        `;
    } catch (error) {
        resultBox.textContent = error.message;
    }
}