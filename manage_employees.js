document.addEventListener("DOMContentLoaded", () => {
  let employees = [];
  let filteredEmployees = [];

  // UI Elements
  const employeeTableBody = document.getElementById("employeeTableBody");
  const employeeTable = document.getElementById("employeeTable");
  const loadingState = document.getElementById("loadingState");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("employeeSearch");
  const refreshBtn = document.getElementById("refreshBtn");

  // Modals
  const editModal = document.getElementById("editModal");
  const deleteModal = document.getElementById("deleteModal");
  const successModal = document.getElementById("successModal");

  // Forms
  const editEmployeeForm = document.getElementById("editEmployeeForm");
  const addEmployeeForm = document.getElementById("addEmployeeForm");
  const openAddModalBtn = document.getElementById("openAddModalBtn");

  // Helper: Format Currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("₹", "₹ ");
  };

  // Helper: Toggle Modal
  window.openModal = (id) =>
    document.getElementById(id).classList.add("active");
  window.closeModal = (id) =>
    document.getElementById(id).classList.remove("active");

  // Helper: Show Notification
  const showNotification = (title, message, type = "success") => {
    document.getElementById("statusTitle").textContent = title;
    document.getElementById("statusMessage").textContent = message;

    const iconContainer = document.getElementById("statusIcon");
    const icons = {
      success: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-fade"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
      error: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-pulse"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
      loading: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>`,
    };
    iconContainer.innerHTML = icons[type];
    openModal("successModal");
  };

  // Fetch Employees
  const fetchEmployees = async () => {
    loadingState.style.display = "flex";
    employeeTable.style.display = "none";
    emptyState.style.display = "none";

    try {
      const response = await fetch(
        "https://n8n.srv917960.hstgr.cloud/webhook/get-employees",
      );
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      employees = data.map((emp, index) => ({
        index, // For local tracking if needed
        name: emp["Full Name"],
        id: emp["Employee ID"],
        designation: emp["Designation"],
        gross: emp["Gross Salary"],
        phone: emp["Phone"],
        email: emp["Email"],
        bank: emp["Bank Account (Last 4 digits) "],
        address: emp["Address"],
      }));

      filteredEmployees = [...employees];
      renderTable();
    } catch (error) {
      console.error("Error fetching employees:", error);
      showNotification(
        "Error",
        "Could not load employee data. Please try again.",
        "error",
      );
    } finally {
      loadingState.style.display = "none";
    }
  };

  // Render Table
  const renderTable = () => {
    employeeTableBody.innerHTML = "";

    if (filteredEmployees.length === 0) {
      employeeTable.style.display = "none";
      emptyState.style.display = "block";
      return;
    }

    employeeTable.style.display = "table";
    emptyState.style.display = "none";

    filteredEmployees.forEach((emp) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>
                    <div class="emp-info">
                        <span class="emp-name">${emp.name}</span>
                        <span class="emp-id">${emp.id}</span>
                    </div>
                </td>
                <td class="hide-mobile">${emp.designation}</td>
                <td class="hide-mobile">
                    <div class="emp-info">
                        <span>${emp.email}</span>
                        <span class="emp-id">${emp.phone}</span>
                    </div>
                </td>
                <td>${formatCurrency(emp.gross)}</td>
                <td>
                    <div class="action-btns">
                        <button class="secondary-btn btn-sm edit-btn" data-id="${emp.id}" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button class="secondary-btn btn-sm delete-btn" data-id="${emp.id}" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h20"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    </div>
                </td>
            `;
      employeeTableBody.appendChild(tr);

      // Add Event Listeners to Buttons within this row
      const editBtn = tr.querySelector(".edit-btn");
      const deleteBtn = tr.querySelector(".delete-btn");

      editBtn.addEventListener("click", (e) => {
        e.preventDefault();
        handleEdit(emp.id);
      });

      deleteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        handleDelete(emp.id);
      });
    });
  };

  // Search Logic
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    filteredEmployees = employees.filter(
      (emp) =>
        String(emp.name).toLowerCase().includes(term) ||
        String(emp.id).toLowerCase().includes(term) ||
        String(emp.email).toLowerCase().includes(term) ||
        String(emp.designation).toLowerCase().includes(term),
    );
    renderTable();
  });

  // Refresh Logic
  refreshBtn.addEventListener("click", fetchEmployees);

  // Add Logic
  openAddModalBtn.addEventListener("click", () => {
    addEmployeeForm.reset();
    openModal("employeeModal");
  });

  addEmployeeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    const newEmp = {
      name: document.getElementById("newEmpName").value,
      id: document.getElementById("newEmpId").value,
      designation: document.getElementById("newEmpDesignation").value,
      gross: document.getElementById("newEmpGross").value,
      phone: document.getElementById("newEmpPhone").value,
      email: document.getElementById("newEmpEmail").value,
      bank: document.getElementById("newEmpBank").value,
      address: document.getElementById("newEmpAddress").value,
    };

    try {
      const response = await fetch(
        "https://n8n.srv917960.hstgr.cloud/webhook/new-employee",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEmp),
        },
      );

      if (!response.ok) throw new Error("Creation failed");

      closeModal("employeeModal");
      showNotification("Success", "New employee added successfully.");
      fetchEmployees(); // Refresh list
    } catch (error) {
      console.error("Creation error:", error);
      showNotification("Error", "Failed to add new employee.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save Employee";
    }
  });

  // Edit Logic
  const handleEdit = (id) => {
    const emp = employees.find((e) => String(e.id) === String(id));
    if (!emp) {
      console.error("Employee not found for edit:", id);
      return;
    }

    document.getElementById("editEmpIndex").value = employees.indexOf(emp);
    document.getElementById("editEmpName").value = emp.name || "";
    document.getElementById("editEmpId").value = emp.id || "";
    document.getElementById("editEmpDesignation").value = emp.designation || "";
    document.getElementById("editEmpGross").value = emp.gross || 0;
    document.getElementById("editEmpPhone").value = emp.phone || "";
    document.getElementById("editEmpEmail").value = emp.email || "";
    document.getElementById("editEmpBank").value = emp.bank
      ? String(emp.bank).trim()
      : "";
    document.getElementById("editEmpAddress").value = emp.address || "";

    openModal("editModal");
  };

  editEmployeeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Updating...";

    const updatedEmp = {
      name: document.getElementById("editEmpName").value,
      id: document.getElementById("editEmpId").value,
      designation: document.getElementById("editEmpDesignation").value,
      gross: document.getElementById("editEmpGross").value,
      phone: document.getElementById("editEmpPhone").value,
      email: document.getElementById("editEmpEmail").value,
      bank: document.getElementById("editEmpBank").value,
      address: document.getElementById("editEmpAddress").value,
      row_number: parseInt(document.getElementById("editEmpIndex").value) + 2,
    };

    try {
      const response = await fetch(
        "https://n8n.srv917960.hstgr.cloud/webhook/update-employee",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedEmp),
        },
      );

      if (!response.ok) throw new Error("Update failed");

      closeModal("editModal");
      showNotification("Success", "Employee details updated successfully.");
      fetchEmployees(); // Refresh list
    } catch (error) {
      console.error("Update error:", error);
      showNotification("Error", "Failed to update employee details.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Update Employee";
    }
  });

  // Delete Logic
  let employeeToDelete = null;
  const handleDelete = (id) => {
    const emp = employees.find((e) => String(e.id) === String(id));
    if (!emp) {
      console.error("Employee not found for delete:", id);
      return;
    }
    employeeToDelete = emp;
    document.getElementById("deleteEmpName").textContent =
      emp.name || "this employee";
    openModal("deleteModal");
  };

  document
    .getElementById("confirmDeleteBtn")
    .addEventListener("click", async () => {
      if (!employeeToDelete) return;

      const btn = document.getElementById("confirmDeleteBtn");
      btn.disabled = true;
      btn.textContent = "Deleting...";

      try {
        const response = await fetch(
          "https://n8n.srv917960.hstgr.cloud/webhook/delete-employee",
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: employeeToDelete.id,
              email: employeeToDelete.email,
              row_number: employeeToDelete.index + 2,
            }),
          },
        );

        if (!response.ok) throw new Error("Delete failed");

        closeModal("deleteModal");
        showNotification(
          "Deleted!",
          `${employeeToDelete.name} has been removed.`,
        );
        fetchEmployees();
      } catch (error) {
        console.error("Delete error:", error);
        showNotification("Error", "Failed to delete employee.", "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "Yes, Delete";
        employeeToDelete = null;
      }
    });

  // Input Validation (No Negative values for salary)
  const salaryInputs = [
    document.getElementById("editEmpGross"),
    document.getElementById("newEmpGross"),
  ];
  salaryInputs.forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
    });
    input.addEventListener("paste", (e) => {
      const pasteData = (e.clipboardData || window.clipboardData).getData(
        "text",
      );
      if (/[eE\+\-]/.test(pasteData) || parseFloat(pasteData) < 0)
        e.preventDefault();
    });
  });

  // Initial Load
  fetchEmployees();
});
