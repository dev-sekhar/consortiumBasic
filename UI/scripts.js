const apiUrl = 'http://localhost:3000';

async function fetchMemberAttributes() {
  const response = await fetch('/usecase/data/memberAttributes.json');
  const data = await response.json();
  return data.attributes;
}

async function populateDynamicAttributes() {
  const attributes = await fetchMemberAttributes();
  const dynamicAttributesDiv = document.getElementById('dynamicAttributes');
  dynamicAttributesDiv.innerHTML = attributes.map(attr => `
    <label for="${attr}">${attr.charAt(0).toUpperCase() + attr.slice(1)}:</label>
    <input type="text" id="${attr}" placeholder="${attr.charAt(0).toUpperCase() + attr.slice(1)}">
  `).join('');
}

async function registerMember() {
  const memberType = document.getElementById('memberType').value;
  const attributes = await fetchMemberAttributes();
  const memberDetails = attributes.reduce((acc, attr) => {
    acc[attr] = document.getElementById(attr).value;
    return acc;
  }, {});

  console.log('Registering member:', memberType, memberDetails); // Log the member details

  try {
    const response = await fetch(`${apiUrl}/member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ memberType, ...memberDetails })
    });
    const data = await response.json();
    console.log('Response:', data); // Log the response
    alert(data.message);
    await populateDropdowns(); // Update dropdowns after registering a member
  } catch (error) {
    console.error('Error registering member:', error); // Log any errors
  }
}

async function approveMember() {
  const memberName = document.getElementById('approvingMember').value;
  const transactionId = document.getElementById('transactionId').value;
  console.log('Approving member:', memberName, 'Transaction ID:', transactionId); // Log the inputs
  try {
    const response = await fetch(`${apiUrl}/approve-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ memberName, transactionId })
    });
    const data = await response.json();
    console.log('Response:', data); // Log the response
    alert(data.message);
    await populateDropdowns(); // Update dropdowns after approving a transaction
  } catch (error) {
    console.error('Error approving member:', error); // Log any errors
  }
}

async function rejectMember() {
  const memberName = document.getElementById('rejectingMember').value;
  const transactionId = document.getElementById('rejectTransactionId').value;
  const reason = document.getElementById('rejectionReason').value;
  console.log('Rejecting member:', memberName, 'Transaction ID:', transactionId, 'Reason:', reason); // Log the inputs
  try {
    const response = await fetch(`${apiUrl}/reject-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ memberName, transactionId, reason })
    });
    const data = await response.json();
    console.log('Response:', data); // Log the response
    alert(data.message);
    await populateDropdowns(); // Update dropdowns after rejecting a transaction
  } catch (error) {
    console.error('Error rejecting member:', error); // Log any errors
  }
}

async function mineTransactions() {
  console.log('Mining transactions'); // Log the action
  try {
    const response = await fetch(`${apiUrl}/mine`, {
      method: 'GET'
    });
    const data = await response.json();
    console.log('Response:', data); // Log the response
    alert(data.message);
  } catch (error) {
    console.error('Error mining transactions:', error); // Log any errors
  }
}

async function viewApprovedMembers() {
  console.log('Viewing approved members'); // Log the action
  try {
    const response = await fetch(`${apiUrl}/approved-members`, {
      method: 'GET'
    });
    const data = await response.json();
    console.log('Response:', data); // Log the response
    const table = createTable(data, ['name', 'attributes', 'approvedBy', 'status']);
    document.getElementById('approvedMembers').innerHTML = '';
    document.getElementById('approvedMembers').appendChild(table);
  } catch (error) {
    console.error('Error viewing approved members:', error); // Log any errors
  }
}

async function viewPendingMembers() {
  console.log('Viewing pending members'); // Log the action
  try {
    const response = await fetch(`${apiUrl}/pending-members`, {
      method: 'GET'
    });
    const data = await response.json();
    console.log('Response:', data); // Log the response
    const table = createTable(data, ['name', 'attributes', 'status']);
    document.getElementById('pendingMembers').innerHTML = '';
    document.getElementById('pendingMembers').appendChild(table);
  } catch (error) {
    console.error('Error viewing pending members:', error); // Log any errors
  }
}

async function viewRejectedMembers() {
  console.log('Viewing rejected members'); // Log the action
  try {
    const response = await fetch(`${apiUrl}/rejected-members`, {
      method: 'GET'
    });
    const data = await response.json();
    console.log('Response:', data); // Log the response
    const table = createTable(data, ['name', 'attributes', 'rejectedBy', 'rejectionReason', 'status']);
    document.getElementById('rejectedMembers').innerHTML = '';
    document.getElementById('rejectedMembers').appendChild(table);
  } catch (error) {
    console.error('Error viewing rejected members:', error); // Log any errors
  }
}

async function viewBlockchain() {
  console.log('Viewing blockchain'); // Log the action
  try {
    const response = await fetch(`${apiUrl}/chain`, {
      method: 'GET'
    });
    const data = await response.json();
    console.log('Response:', data); // Log the response
    const table = createTable(data, ['index', 'timestamp', 'transactions', 'previousHash', 'hash']);
    document.getElementById('blockchain').innerHTML = '';
    document.getElementById('blockchain').appendChild(table);
  } catch (error) {
    console.error('Error viewing blockchain:', error); // Log any errors
  }
}

async function viewMiningQueue() {
  console.log('Viewing mining queue'); // Log the action
  try {
    const response = await fetch(`${apiUrl}/mining-queue`, {
      method: 'GET'
    });
    const data = await response.json();
    console.log('Response:', data); // Log the response
    const table = createTable(data, ['transactionId', 'from', 'to', 'amount', 'timestamp', 'message', 'memberRegistration', 'approvedBy', 'status']);
    document.getElementById('miningQueue').innerHTML = '';
    document.getElementById('miningQueue').appendChild(table);
  } catch (error) {
    console.error('Error viewing mining queue:', error); // Log any errors
  }
}

function createTable(data, columns) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const headerRow = document.createElement('tr');
  columns.forEach(column => {
    const th = document.createElement('th');
    th.innerText = column;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  data.forEach(item => {
    const row = document.createElement('tr');
    columns.forEach(column => {
      const td = document.createElement('td');
      td.innerText = JSON.stringify(item[column], null, 2);
      if (column === 'previousHash' || column === 'hash') {
        td.classList.add('hash-column');
      }
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  return table;
}

async function populateDropdowns() {
  try {
    // Populate approving member dropdown
    const approvedMembersResponse = await fetch(`${apiUrl}/approved-members`, {
      method: 'GET'
    });
    const approvedMembers = await approvedMembersResponse.json();
    const approvingMemberDropdown = document.getElementById('approvingMember');
    approvingMemberDropdown.innerHTML = approvedMembers.map(member => `<option value="${member.name}">${member.name}</option>`).join('');

    // Populate transaction ID dropdown for approval
    const pendingTransactionsResponse = await fetch(`${apiUrl}/pending-transactions`, {
      method: 'GET'
    });
    const pendingTransactions = await pendingTransactionsResponse.json();
    const transactionIdDropdown = document.getElementById('transactionId');
    transactionIdDropdown.innerHTML = pendingTransactions
      .filter(transaction => transaction.message.includes('Member Registration'))
      .map(transaction => `<option value="${transaction.transactionId}">${transaction.transactionId}</option>`)
      .join('');

    // Populate rejecting member dropdown
    const rejectingMemberDropdown = document.getElementById('rejectingMember');
    rejectingMemberDropdown.innerHTML = approvedMembers.map(member => `<option value="${member.name}">${member.name}</option>`).join('');

    // Populate transaction ID dropdown for rejection
    const rejectTransactionIdDropdown = document.getElementById('rejectTransactionId');
    rejectTransactionIdDropdown.innerHTML = pendingTransactions
      .filter(transaction => transaction.message.includes('Member Registration'))
      .map(transaction => `<option value="${transaction.transactionId}">${transaction.transactionId}</option>`)
      .join('');
  } catch (error) {
    console.error('Error populating dropdowns:', error); // Log any errors
  }
}

// Populate dropdowns and dynamic attributes on page load
window.onload = () => {
  populateDropdowns();
  populateDynamicAttributes();
};