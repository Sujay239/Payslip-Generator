document.addEventListener("DOMContentLoaded", () => {
  // Main Form Elements
  const generateBtn = document.getElementById("generateBtn");
  const form = document.getElementById("payslip-form");
  const employeeSelect = document.getElementById("employeeSelect");
  const addNewEmployeeBtn = document.getElementById("addNewEmployeeBtn");

  // Preview Actions
  const confirmBtn = document.getElementById("confirmBtn");
  const savePdfBtn = document.getElementById("savePdfBtn");

  // Modals
  const modalOverlay = document.getElementById("modalOverlay");
  const employeeModal = document.getElementById("employeeModal");
  const successModal = document.getElementById("successModal");

  // Add Employee Form
  const addEmployeeForm = document.getElementById("addEmployeeForm");

  const inputs = {
    name: document.getElementById("employeeName"),
    id: document.getElementById("employeeId"),
    designation: document.getElementById("designation"),
    gross: document.getElementById("grossSalary"),
    deductions: document.getElementById("deductions"),
    payMonth: document.getElementById("payMonth"),
    payDate: document.getElementById("payDate"),
    paymentMethod: document.getElementById("paymentMethod"),
    bankAccount: document.getElementById("bankAccount"),
    txnId: document.getElementById("txnId"),
  };

  const previews = {
    name: document.getElementById("previewEmployeeName"),
    id: document.getElementById("previewEmployeeId"),
    designation: document.getElementById("previewDesignation"),
    month: document.getElementById("previewMonth"),
    payDate: document.getElementById("previewPayDate"),
    method: document.getElementById("previewPaymentMethod"),
    bank: document.getElementById("previewBankAccount"),
    txnId: document.getElementById("previewTxnId"),
    gross: document.getElementById("previewGross"),
    deductions: document.getElementById("previewDeductions"),
    totalEarnings: document.getElementById("previewTotalEarnings"),
    totalDeductions: document.getElementById("previewTotalDeductions"),
    netTotal: document.getElementById("previewNetTotal"),
  };

  // Employee Database Logic (Data fetched from Webhook)
  let employees = [];
  let selectedEmployeeEmail = "";

  const fetchEmployees = async () => {
    const placeholder =
      '<option value="" disabled selected>Loading employees...</option>';
    employeeSelect.innerHTML = placeholder;

    try {
      const response = await fetch(
        "https://n8n.srv917960.hstgr.cloud/webhook/get-employees",
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('jwtToken')}`
          }
        }
      );
      if (!response.ok) throw new Error("Failed to fetch employees");

      const data = await response.json();

      // Map webhook data to internal format
      employees = data.map((emp) => ({
        name: emp["Full Name"],
        id: emp["Employee ID"],
        designation: emp["Designation"],
        gross: emp["Gross Salary"],
        phone: emp["Phone"],
        email: emp["Email"],
        bank: emp["Bank Account (Last 4 digits) "], // Note the trailing space
        address: emp["Address"],
      }));

      updateEmployeeDropdown();
    } catch (error) {
      console.error("Error fetching employees:", error);
      employeeSelect.innerHTML =
        '<option value="" disabled selected>Error loading employees</option>';
    }
  };

  const updateEmployeeDropdown = () => {
    employeeSelect.innerHTML =
      '<option value="" disabled selected>-- Select an Employee --</option>';
    employees.forEach((emp, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `${emp.name} - ${emp.id}`;
      employeeSelect.appendChild(option);
    });
  };

  // Helper: Toggle Form Disabling
  const setFormDisabled = (disabled) => {
    Object.values(inputs).forEach((input) => {
      input.disabled = disabled;
    });
    generateBtn.disabled = disabled;
  };

  // Auto-fill and Locking logic
  employeeSelect.addEventListener("change", (e) => {
    const index = e.target.value;
    const fieldsToLock = ["name", "id", "designation", "gross", "bankAccount"];

    if (index === "") {
      setFormDisabled(true);
      fieldsToLock.forEach((key) => {
        inputs[key].value = "";
        inputs[key].readOnly = false;
      });
      form.reset();
      setDefaults();
    } else {
      // First enable everything so we can fill it
      setFormDisabled(false);

      const emp = employees[index];
      inputs.name.value = emp.name;
      inputs.id.value = emp.id;
      inputs.designation.value = emp.designation;
      inputs.gross.value = emp.gross;
      inputs.bankAccount.value = emp.bank;
      selectedEmployeeEmail = emp.email;

      // Lock the core details but keep them enabled (for validation/focus)
      fieldsToLock.forEach((key) => {
        inputs[key].readOnly = true;
      });

      // Ensure manual entry fields are NOT readonly
      const manualFields = [
        "deductions",
        "payMonth",
        "payDate",
        "paymentMethod",
        "txnId",
      ];
      manualFields.forEach((key) => {
        inputs[key].readOnly = false;
      });
    }
    resetButtons();
  });

  // Helper: Reset Buttons
  const resetButtons = () => {
    confirmBtn.disabled = true;
    savePdfBtn.disabled = true;
    confirmBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Confirm All Details
        `;
  };

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

  // Helper: Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB");
  };

  // Helper: Get Month Name
  const formatMonthYear = (monthStr) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Update Preview Function
  const updatePreview = () => {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    previews.name.textContent = inputs.name.value;
    previews.id.textContent = inputs.id.value;
    previews.designation.textContent = inputs.designation.value;

    previews.month.textContent = `For the month of ${formatMonthYear(inputs.payMonth.value)}`;
    previews.payDate.textContent = formatDate(inputs.payDate.value);
    previews.method.textContent = inputs.paymentMethod.value;
    previews.bank.textContent = `**** **** ${inputs.bankAccount.value}`;
    previews.txnId.textContent = inputs.txnId.value;

    const gross = parseFloat(inputs.gross.value) || 0;
    const deductions = parseFloat(inputs.deductions.value) || 0;
    const net = gross - deductions;

    previews.gross.textContent = formatCurrency(gross);
    previews.deductions.textContent = formatCurrency(deductions);
    previews.totalEarnings.textContent = formatCurrency(gross);
    previews.totalDeductions.textContent = formatCurrency(deductions);
    previews.netTotal.textContent = formatCurrency(net);

    savePdfBtn.disabled = true;
    confirmBtn.disabled = false;
    resetButtons();
    confirmBtn.disabled = false; // Re-enable confirm after generate
  };

  generateBtn.addEventListener("click", updatePreview);

  // Confirmation Modal Logic
  const toggleModal = (modal, show) => {
    if (show) {
      modal.classList.add("active");
    } else {
      modal.classList.remove("active");
    }
  };

  // Helper: Show Generic Notification Modal with Dynamic Icons
  const showNotification = (title, message, state = "success") => {
    document.getElementById("successModalTitle").textContent = title;
    const msgEl = document.getElementById("successModalMessage");
    const iconContainer = document.querySelector(".success-icon");

    msgEl.textContent = message;

    // Define icons
    const icons = {
      success: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-fade"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
      error: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-pulse"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
      loading: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>`,
    };

    iconContainer.innerHTML = icons[state] || icons.success;
    msgEl.style.color =
      state === "error" ? "var(--accent)" : "var(--text-muted)";

    toggleModal(successModal, true);
  };

  confirmBtn.addEventListener("click", () => {
    document.getElementById("modalEmployeeName").textContent =
      inputs.name.value;
    document.getElementById("modalPayslipMonth").textContent = formatMonthYear(
      inputs.payMonth.value,
    );
    document.getElementById("modalTxnId").textContent = inputs.txnId.value;
    const gross = parseFloat(inputs.gross.value) || 0;
    const deductions = parseFloat(inputs.deductions.value) || 0;
    document.getElementById("modalNetPayable").textContent = formatCurrency(
      gross - deductions,
    );
    toggleModal(modalOverlay, true);
  });

  document.getElementById("cancelConfirm").addEventListener("click", () => toggleModal(modalOverlay, false));
  document.getElementById("closeModal").addEventListener("click", () => toggleModal(modalOverlay, false));

  // Shared PDF Generation Engine (Returns a Blob)
  const generatePdfBlob = async (element) => {
    const originalDisplay = element.style.display;
    element.style.display = "block";
    element.style.position = "fixed";
    element.style.left = "-9999px";
    element.style.top = "0";

    try {
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const ratio = canvas.width / canvas.height;
      const renderedHeight = pdfWidth / ratio;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, renderedHeight);
      return pdf.output("blob");
    } finally {
      element.style.display = originalDisplay;
      element.style.position = "";
      element.style.left = "";
      element.style.top = "";
    }
  };

  document
    .getElementById("finalConfirm")
    .addEventListener("click", async () => {
      const finalConfirmBtn = document.getElementById("finalConfirm");
      const originalText = finalConfirmBtn.textContent;

      try {
        finalConfirmBtn.disabled = true;
        finalConfirmBtn.textContent = "Generating PDF...";

        // Show loading modal immediately
        showNotification(
          "Processing...",
          "We are preparing your payslip and sending it for processing...",
          "loading",
        );

        // 1. Generate the PDF Blob
        const payslipElement = document.getElementById("payslip-template");
        const pdfBlob = await generatePdfBlob(payslipElement);
        const employeeName =
          inputs.name.value.trim().replace(/\s+/g, "_") || "Employee";
        const monthYear =
          formatMonthYear(inputs.payMonth.value).replace(/\s+/g, "_") ||
          "Month";
        const filename = `Payslip_${employeeName}_${monthYear}.pdf`;

        // 2. Build FormData (Binary + Metadata)
        const formData = new FormData();
        formData.append("employeeName", inputs.name.value);
        formData.append("employeeId", inputs.id.value);
        formData.append("email", selectedEmployeeEmail);
        formData.append("designation", inputs.designation.value);
        formData.append("payMonth", inputs.payMonth.value);
        formData.append("paymentDate", inputs.payDate.value);
        formData.append("paymentMethod", inputs.paymentMethod.value);
        formData.append("bankAccount", inputs.bankAccount.value);
        formData.append("txnId", inputs.txnId.value);
        formData.append("grossSalary", inputs.gross.value);
        formData.append("deductions", inputs.deductions.value);
        formData.append(
          "netPayable",
          (parseFloat(inputs.gross.value) || 0) -
            (parseFloat(inputs.deductions.value) || 0),
        );

        // 3. Attach the PDF file
        formData.append("payslip_file", pdfBlob, filename);

        finalConfirmBtn.textContent = "Sending...";

        await fetch(
          "https://n8n.srv917960.hstgr.cloud/webhook/generate-payslip",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem('jwtToken')}`
            },
            body: formData,
          },
        );

        savePdfBtn.disabled = false;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML =
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Details Confirmed';
        toggleModal(modalOverlay, false);

        // Update the loading modal to success
        showNotification(
          "Generated!",
          "Payslip has been generated and sent for processing.",
          "success",
        );
      } catch (error) {
        console.error("Error:", error);
        showNotification(
          "Error",
          "Failed to process and send payslip. Please try again.",
          "error",
        );
      } finally {
        finalConfirmBtn.disabled = false;
        finalConfirmBtn.textContent = originalText;
      }
    });

  // Add Employee Modal Logic
  addNewEmployeeBtn.addEventListener("click", () =>
    toggleModal(employeeModal, true),
  );
  document
    .getElementById("closeEmployeeModal")
    .addEventListener("click", () => toggleModal(employeeModal, false));
  document
    .getElementById("cancelEmployee")
    .addEventListener("click", () => toggleModal(employeeModal, false));

  addEmployeeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

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
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('jwtToken')}`
          },
          body: JSON.stringify(newEmp),
        },
      );

      if (!response.ok) throw new Error("Webhook failed");

      // Add to session list so it works immediately
      employees.push(newEmp);
      updateEmployeeDropdown();

      toggleModal(employeeModal, false);
      addEmployeeForm.reset();

      // Auto-select the newly added employee
      employeeSelect.value = employees.length - 1;
      employeeSelect.dispatchEvent(new Event("change"));

      showNotification(
        "Successful!",
        "Employee information has been saved successfully.",
      );
    } catch (error) {
      console.error("Error:", error);
      showNotification(
        "Error",
        "Failed to save employee. Please check your connection.",
        true,
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });

  // Close Success Modal
  document.getElementById("closeSuccessModal").addEventListener("click", () => {
    toggleModal(successModal, false);
    // Reset message for next time
    document.getElementById("successModalMessage").textContent =
      "Employee details saved successfully.";
    document.getElementById("successModalMessage").style.color =
      "var(--text-muted)";
  });

  // Save PDF Button (Uses the same engine but triggers download)
  savePdfBtn.addEventListener("click", async () => {
    const originalText = savePdfBtn.textContent;
    try {
      savePdfBtn.disabled = true;
      savePdfBtn.textContent = "Preparing PDF...";

      showNotification(
        "Exporting...",
        "Preparing your high-resolution PDF for download...",
        "loading",
      );

      const pdfBlob = await generatePdfBlob(
        document.getElementById("payslip-template"),
      );
      const employeeName =
        inputs.name.value.trim().replace(/\s+/g, "_") || "Employee";
      const monthYear =
        formatMonthYear(inputs.payMonth.value).replace(/\s+/g, "_") || "Month";
      const filename = `Payslip_${employeeName}_${monthYear}.pdf`;

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      // Auto-close notification on download
      toggleModal(successModal, false);
    } catch (error) {
      console.error("Download Error:", error);
      showNotification(
        "Export Error",
        "Error generating download. Please try again.",
        "error",
      );
    } finally {
      savePdfBtn.disabled = false;
      savePdfBtn.textContent = originalText;
    }
  });

  // Defaults
  const setDefaults = () => {
    const today = new Date();
    inputs.payMonth.value = today.toISOString().slice(0, 7);
    inputs.payDate.value = today.toISOString().slice(0, 10);
  };

  setDefaults();
  fetchEmployees();
  // Start with form disabled
  setFormDisabled(true);

  // Reset buttons on any input change
  Object.values(inputs).forEach((input) => {
    input.addEventListener("input", resetButtons);
  });

  // --- Input Validation (No Negative / Symbols) ---
  const salaryInputs = [
    document.getElementById("grossSalary"),
    document.getElementById("deductions"),
    document.getElementById("newEmpGross"),
  ];

  salaryInputs.forEach((input) => {
    if (input) {
      input.addEventListener("keydown", (e) => {
        // Prevent negative sign, plus sign and scientific notation (e, E)
        if (["e", "E", "+", "-"].includes(e.key)) {
          e.preventDefault();
        }
      });

      // Prevent negative values or symbols from being pasted
      input.addEventListener("paste", (e) => {
        const pasteData = (e.clipboardData || window.clipboardData).getData(
          "text",
        );
        if (/[eE\+\-]/.test(pasteData) || parseFloat(pasteData) < 0) {
          e.preventDefault();
        }
      });
    }
  });
});
