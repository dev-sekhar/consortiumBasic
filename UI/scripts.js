const apiUrl = "http://localhost:3000";

async function fetchMemberAttributes() {
  try {
    const response = await fetch(`${apiUrl}/memberAttributes`);
    const data = await response.json();
    return data.attributes;
  } catch (error) {
    console.error("Error fetching member attributes:", error);
    return [];
  }
}

async function populateDynamicAttributes() {
  const attributes = await fetchMemberAttributes();
  const container = document.getElementById("dynamicAttributes");
  container.innerHTML = ""; // Clear existing content

  attributes.forEach((attr) => {
    const fieldGroup = document.createElement("div");
    fieldGroup.className = "field-group";

    const label = document.createElement("label");
    label.htmlFor = attr.name;
    label.textContent = `${
      attr.name.charAt(0).toUpperCase() + attr.name.slice(1)
    }${attr.mandatory ? " *" : ""}:`;

    let input;
    if (attr.validation.enum) {
      input = document.createElement("select");
      attr.validation.enum.forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option;
        opt.textContent = option.charAt(0).toUpperCase() + option.slice(1);
        input.appendChild(opt);
      });
    } else {
      input = document.createElement("input");
      input.type = attr.validation.type === "number" ? "number" : "text";
    }

    input.id = attr.name;
    input.name = attr.name;
    input.required = attr.mandatory;

    // Add validation attributes
    if (attr.validation.type === "number") {
      if (attr.validation.min !== undefined) input.min = attr.validation.min;
      if (attr.validation.max !== undefined) input.max = attr.validation.max;
    } else if (attr.validation.type === "string") {
      if (attr.validation.maxLength !== undefined)
        input.maxLength = attr.validation.maxLength;
      if (attr.validation.regex !== undefined)
        input.pattern = attr.validation.regex;
    }

    // Add validation message
    const validationMessage = document.createElement("span");
    validationMessage.className = "validation-message";
    if (attr.validation.type === "number") {
      validationMessage.textContent = `(${attr.validation.min}-${attr.validation.max})`;
    } else if (attr.validation.maxLength) {
      validationMessage.textContent = `(Max ${attr.validation.maxLength} characters)`;
    }

    fieldGroup.appendChild(label);
    fieldGroup.appendChild(input);
    fieldGroup.appendChild(validationMessage);
    container.appendChild(fieldGroup);
  });
}

async function registerMember() {
  const attributes = await fetchMemberAttributes();
  const memberDetails = attributes.reduce((acc, attr) => {
    acc[attr.name] = document.getElementById(attr.name).value;
    return acc;
  }, {});

  console.log("Registering member:", memberDetails); // Log the member details

  try {
    const response = await fetch(`${apiUrl}/member`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memberDetails),
    });
    const data = await response.json();
    console.log("Response:", data); // Log the response
    alert(data.message);
    await populateDropdowns(); // Update dropdowns after registering a member
  } catch (error) {
    console.error("Error registering member:", error); // Log any errors
  }
}

async function approveMember() {
  const memberName = document.getElementById("approvingMember").value;
  const transactionId = document.getElementById("transactionId").value;
  console.log(
    "Approving member:",
    memberName,
    "Transaction ID:",
    transactionId
  ); // Log the inputs
  try {
    const response = await fetch(`${apiUrl}/approve-transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ memberName, transactionId }),
    });
    const data = await response.json();
    console.log("Response:", data); // Log the response
    alert(data.message);
    await populateDropdowns(); // Update dropdowns after approving a transaction
  } catch (error) {
    console.error("Error approving member:", error); // Log any errors
  }
}

async function rejectMember() {
  const memberName = document.getElementById("rejectingMember").value;
  const transactionId = document.getElementById("rejectTransactionId").value;
  const reason = document.getElementById("rejectionReason").value;
  console.log(
    "Rejecting member:",
    memberName,
    "Transaction ID:",
    transactionId,
    "Reason:",
    reason
  ); // Log the inputs
  try {
    const response = await fetch(`${apiUrl}/reject-transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ memberName, transactionId, reason }),
    });
    const data = await response.json();
    console.log("Response:", data); // Log the response
    alert(data.message);
    await populateDropdowns(); // Update dropdowns after rejecting a transaction
  } catch (error) {
    console.error("Error rejecting member:", error); // Log any errors
  }
}

async function mineTransactions() {
  console.log("Mining transactions"); // Log the action
  try {
    const response = await fetch(`${apiUrl}/mine`, {
      method: "GET",
    });
    const data = await response.json();
    console.log("Response:", data); // Log the response
    alert(data.message);
  } catch (error) {
    console.error("Error mining transactions:", error); // Log any errors
  }
}

async function viewApprovedMembers() {
  console.log("Viewing approved members"); // Log the action
  try {
    const response = await fetch(`${apiUrl}/approved-members`, {
      method: "GET",
    });
    const data = await response.json();
    console.log("Response:", data); // Log the response
    const table = createTable(data, [
      "name",
      "attributes",
      "approvedBy",
      "status",
    ]);
    document.getElementById("approvedMembers").innerHTML = "";
    document.getElementById("approvedMembers").appendChild(table);
  } catch (error) {
    console.error("Error viewing approved members:", error); // Log any errors
  }
}

async function viewPendingMembers() {
  console.log("Viewing pending members"); // Log the action
  try {
    const response = await fetch(`${apiUrl}/pending-members`, {
      method: "GET",
    });
    const data = await response.json();
    console.log("Response:", data); // Log the response
    const table = createTable(data, ["name", "attributes", "status"]);
    document.getElementById("pendingMembers").innerHTML = "";
    document.getElementById("pendingMembers").appendChild(table);
  } catch (error) {
    console.error("Error viewing pending members:", error); // Log any errors
  }
}

async function viewRejectedMembers() {
  console.log("Viewing rejected members"); // Log the action
  try {
    const response = await fetch(`${apiUrl}/rejected-members`, {
      method: "GET",
    });
    const data = await response.json();
    console.log("Response:", data); // Log the response
    const table = createTable(data, [
      "name",
      "attributes",
      "rejectedBy",
      "rejectionReason",
      "status",
    ]);
    document.getElementById("rejectedMembers").innerHTML = "";
    document.getElementById("rejectedMembers").appendChild(table);
  } catch (error) {
    console.error("Error viewing rejected members:", error); // Log any errors
  }
}

async function viewBlockchain() {
  console.log("Viewing blockchain"); // Log the action
  try {
    const response = await fetch(`${apiUrl}/chain`, {
      method: "GET",
    });
    const data = await response.json();
    console.log("Response:", data); // Log the response
    const table = createTable(data, [
      "index",
      "timestamp",
      "transactions",
      "previousHash",
      "hash",
    ]);
    document.getElementById("blockchain").innerHTML = "";
    document.getElementById("blockchain").appendChild(table);
  } catch (error) {
    console.error("Error viewing blockchain:", error); // Log any errors
  }
}

async function viewMiningQueue() {
  console.log("Viewing mining queue"); // Log the action
  try {
    const response = await fetch(`${apiUrl}/mining-queue`, {
      method: "GET",
    });
    const data = await response.json();
    console.log("Response:", data); // Log the response
    const table = createTable(data, [
      "transactionId",
      "from",
      "to",
      "amount",
      "timestamp",
      "message",
      "memberRegistration",
      "approvedBy",
      "status",
    ]);
    document.getElementById("miningQueue").innerHTML = "";
    document.getElementById("miningQueue").appendChild(table);
  } catch (error) {
    console.error("Error viewing mining queue:", error); // Log any errors
  }
}

function createTable(data, columns) {
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const headerRow = document.createElement("tr");
  columns.forEach((column) => {
    const th = document.createElement("th");
    th.innerText = column;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  data.forEach((item) => {
    const row = document.createElement("tr");
    columns.forEach((column) => {
      const td = document.createElement("td");
      td.innerText = formatValue(item[column]);
      if (column === "previousHash" || column === "hash") {
        td.classList.add("hash-column");
      }
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  return table;
}

function formatValue(value) {
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return value;
}

async function populateDropdowns() {
  try {
    // Populate approving member dropdown
    const approvedMembersResponse = await fetch(`${apiUrl}/approved-members`, {
      method: "GET",
    });
    const approvedMembers = await approvedMembersResponse.json();
    const approvingMemberDropdown = document.getElementById("approvingMember");
    approvingMemberDropdown.innerHTML = approvedMembers
      .map((member) => `<option value="${member.name}">${member.name}</option>`)
      .join("");

    // Populate transaction ID dropdown for approval
    const pendingTransactionsResponse = await fetch(
      `${apiUrl}/pending-transactions`,
      {
        method: "GET",
      }
    );
    const pendingTransactions = await pendingTransactionsResponse.json();
    const transactionIdDropdown = document.getElementById("transactionId");
    transactionIdDropdown.innerHTML = pendingTransactions
      .filter((transaction) =>
        transaction.message.includes("Member Registration")
      )
      .map(
        (transaction) =>
          `<option value="${transaction.transactionId}">${transaction.transactionId}</option>`
      )
      .join("");

    // Populate rejecting member dropdown
    const rejectingMemberDropdown = document.getElementById("rejectingMember");
    rejectingMemberDropdown.innerHTML = approvedMembers
      .map((member) => `<option value="${member.name}">${member.name}</option>`)
      .join("");

    // Populate transaction ID dropdown for rejection
    const rejectTransactionIdDropdown = document.getElementById(
      "rejectTransactionId"
    );
    rejectTransactionIdDropdown.innerHTML = pendingTransactions
      .filter((transaction) =>
        transaction.message.includes("Member Registration")
      )
      .map(
        (transaction) =>
          `<option value="${transaction.transactionId}">${transaction.transactionId}</option>`
      )
      .join("");
  } catch (error) {
    console.error("Error populating dropdowns:", error); // Log any errors
  }
}

// Initialize the form
document.addEventListener("DOMContentLoaded", () => {
  populateDynamicAttributes();

  document
    .getElementById("memberRegistrationForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      await registerMember();
    });
});

// Populate dropdowns and dynamic attributes on page load
window.onload = () => {
  populateDropdowns();
};

// Tab navigation
function openTab(tabName) {
  var i;
  var x = document.getElementsByClassName("tab");
  var tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < x.length; i++) {
    x[i].classList.remove("active");
  }
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active");
  }
  document.getElementById(tabName).classList.add("active");
  event.currentTarget.classList.add("active");
}
