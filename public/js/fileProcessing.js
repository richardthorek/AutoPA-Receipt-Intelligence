// Wait for the DOM to fully load before running the script
document.addEventListener('DOMContentLoaded', function () {
    // Get references to the necessary DOM elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const processingIndicator = document.getElementById('processingIndicator');
    const countdownSpan = document.getElementById('countdown');
    const fileNameSpan = document.getElementById('fileName');
    const userTokenInput = document.getElementById('userToken');

    // Add click event to the drop zone to trigger file input click
    dropZone.addEventListener('click', () => fileInput.click());

    // Add dragover event to the drop zone to allow file dragging
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    // Remove dragover class when the file is dragged out of the drop zone
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    // Handle file drop event
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length) {
            fileInput.files = files; // Set the files to the file input
            handleFileUpload(files[0]); // Handle the file upload
        }
    });

    // Handle file selection via file input
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFileUpload(fileInput.files[0]); // Handle the file upload
        }
    });

    // Function to start a countdown timer
    function startCountdown(seconds) {
        let remaining = seconds;
        countdownSpan.textContent = remaining;
        processingIndicator.style.display = 'block'; // Show the processing indicator

        const interval = setInterval(() => {
            remaining -= 1;
            countdownSpan.textContent = remaining;
            if (remaining <= 0) {
                clearInterval(interval); // Clear the interval when countdown reaches 0
            }
        }, 1000);
    }

     // Add an event listener to the 'getBtn' button to handle click events
     document.getElementById('getBtn').addEventListener('click', function () {
        // Get the values of the 'from' and 'to' date filters and the user token
        const fromDate = document.getElementById('filterFromDate').value;
        const toDate = document.getElementById('filterToDate').value;
        const userTokenInput = document.getElementById('userToken').value;

        // Check if both dates are selected, if not, alert the user and return
        if (!fromDate || !toDate) {
            alert('Please select both From and To dates.');
            return;
        }

        // Create an object with the request data
        const requestData = {
            fromDate: fromDate,
            toDate: toDate,
            user: userTokenInput
        };

        // Send a POST request to the server with the request data to get historical entries
        fetch('https://prod-03.australiasoutheast.logic.azure.com:443/workflows/03a2ae7b87c140b9a0bdda16a6e8778c/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=YH9nz-b8uHkiHvaPHjSLC5sCVfTv-TA_shzD4yQm3eo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
            .then(response => {
                // Check if the response is ok, if not, throw an error
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Parse the response as JSON
            })
            .then(data => {
                console.log('Response Data:', data); // Log the response data to inspect its structure

                // Check if the response data has a property 'value' that is an array
                if (!Array.isArray(data.value)) {
                    throw new Error('Expected an array in response data');
                }

                // Get the table body element and clear any existing data
                const tableBody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
                tableBody.innerHTML = ''; // Clear existing table data

                // Iterate over each entry in the response data and add it to the table
                data.value.forEach(entry => {
                    const row = tableBody.insertRow();
                    row.insertCell(0).textContent = entry.merchantName;
                    row.insertCell(1).textContent = entry.merchantAddress;
                    row.insertCell(2).textContent = entry.transactionDate;
                    row.insertCell(3).textContent = entry.transactionTime;
                    row.insertCell(4).textContent = entry.itemName;
                    row.insertCell(5).textContent = entry.itemTotalPrice;

                    // Create a link to the receipt and add it to the table
                    const receiptCell = row.insertCell(6);
                    const receiptLink = document.createElement('a');
                    receiptLink.href = entry.receiptLink;
                    receiptLink.textContent = 'receipt';
                    receiptLink.target = '_blank';
                    receiptCell.appendChild(receiptLink);

                    row.insertCell(7).textContent = entry.receiptId;

                    // // Create a submit button for each row - ## FUTURE FEATURE TO BE A DELETE BUTTON.
                    // const submitCell = row.insertCell(8);
                    // const submitButton = document.createElement('button');
                    // submitButton.textContent = 'Submit';
                    // submitButton.className = 'btn btn-primary';
                    // submitCell.appendChild(submitButton);

                    row.insertCell(8).textContent = 'N/A';

                    row.insertCell(9).textContent = entry.id
                });
            })
            .catch(error => {
                console.error('Error fetching data:', error); // Log any errors that occur during the fetch request
            });
    });

    // Function to handle file upload
    function handleFileUpload(file) {
        if (!file) return;

        // Check if the file type is allowed
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload a JPG, PNG, or PDF file.');
            return;
        }

        fileNameSpan.textContent = file.name; // Display the file name
        startCountdown(10); // Start the countdown

        // Create a new FormData object and append the file and additional metadata
        const formData = new FormData();
        formData.append('file', file);
        formData.append('date', new Date().toISOString());
        formData.append('filename', file.name);
        formData.append('content-type', file.type);
        formData.append('file-extension', file.name.split('.').pop());

        uploadBtn.textContent = 'Uploading...'; // Update the upload button text to indicate uploading
        uploadBtn.disabled = true; // Disable the upload button to prevent multiple submissions

        // Perform the file upload using fetch
        fetch('https://prod-04.australiasoutheast.logic.azure.com:443/workflows/bd37bd65a79d49499f5b0e91986f8a00/triggers/Receive_POST_File/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FReceive_POST_File%2Frun&sv=1.0&sig=X1QhmY8PSR3wq38j4Q7_kfSMxRtMSzmfKGIj67aBMiY', {
            method: 'POST',
            body: formData,
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok'); // Throw an error if the response is not ok
                }
                return response.json(); // Parse the response as JSON
            })
            .then(data => {
                // Process the response data
                const receipt = data.documentResults[0].fields;
                const items = receipt.Items.valueArray;
                const tableBody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
                const weburl = data.weburl;
                const receiptId = data.receiptID;

                // Iterate over each item in the receipt and add it to the table
                items.forEach(item => {
                    try {
                        const row = tableBody.insertRow();
                        row.insertCell(0).textContent = receipt.MerchantName.valueString;
                        row.insertCell(1).textContent = receipt.MerchantAddress.valueString;
                        row.insertCell(2).textContent = receipt.TransactionDate.valueDate;
                        row.insertCell(3).textContent = receipt.TransactionTime.valueTime;
                        row.insertCell(4).textContent = item.valueObject.Name.valueString;
                        row.insertCell(5).textContent = item.valueObject.TotalPrice.valueNumber;

                        // Create a link to the receipt and add it to the table
                        const thumbnailCell = row.insertCell(6);
                        const receiptLink = document.createElement('a');
                        receiptLink.href = weburl;
                        receiptLink.textContent = 'receipt';
                        receiptLink.target = '_blank';
                        thumbnailCell.appendChild(receiptLink);

                        row.insertCell(7).textContent = receiptId; // Add Receipt ID column

                        // Create a submit button for each row
                        const submitCell = row.insertCell(8);
                        const submitButton = document.createElement('button');
                        submitButton.textContent = 'Submit';
                        submitButton.className = 'btn btn-primary';
                        submitButton.addEventListener('click', function () {
                            // Prepare the data to be submitted
                            const rowData = {
                                merchantName: receipt.MerchantName.valueString,
                                merchantAddress: receipt.MerchantAddress.valueString,
                                transactionDate: receipt.TransactionDate.valueDate,
                                transactionTime: receipt.TransactionTime.valueTime,
                                itemName: item.valueObject.Name.valueString,
                                itemTotalPrice: item.valueObject.TotalPrice.valueNumber,
                                receiptId: receiptId,
                                userID: userTokenInput.value // Add userID from userToken input field
                            };
                            // Submit the individual data line items
                            fetch('https://prod-06.australiasoutheast.logic.azure.com:443/workflows/4339c710204042cf9787b5f4e548ee2c/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=E7sskUxpn9_lGrl1jXtCrpF-FQXqU2Pkd-SsDL4fi6U', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(rowData)
                            })
                                .then(response => {
                                    if (response.ok) {
                                        return response.json();
                                    } else {
                                        throw new Error('Failed to submit row data.');
                                    }
                                })
                                .then(result => {
                                    console.log('Success:', result);
                                    submitButton.textContent = 'Submitted';
                                    submitButton.className = 'btn btn-success';
                                    submitButton.disabled = true;
                                    // Update the table row with the item ID
                                    const itemIdCell = row.insertCell(9); // Assuming the item ID column is the 9th column
                                    itemIdCell.textContent = result.id;
                                })
                                .catch(error => {
                                    console.error('Error:', error);
                                });
                        });
                        submitCell.appendChild(submitButton);
                    } catch (error) {
                        console.error('Error processing item:', error);
                    }
                });

                uploadBtn.textContent = 'Upload'; // Reset the upload button text
                uploadBtn.disabled = false; // Enable the upload button
                processingIndicator.style.display = 'none'; // Hide the processing indicator
            })
            .catch(error => {
                console.error('Error uploading file:', error);
                uploadBtn.textContent = 'Upload'; // Reset the upload button text
                uploadBtn.disabled = false; // Enable the upload button
                processingIndicator.style.display = 'none'; // Hide the processing indicator
            });

       
    }
})

// Function to convert table data to CSV format
function tableToCSV() {
    const table = document.getElementById('resultsTable');
    const rows = table.querySelectorAll('tr');
    let csvContent = '';

    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = Array.from(cols).map(col => {
            const anchor = col.querySelector('a');
            return anchor ? anchor.href : col.textContent;
        }).join(',');
        csvContent += rowData + '\n';
    });

    return csvContent;
}

// Function to download the CSV file
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
    URL.revokeObjectURL(url);
}

// Add event listener to the 'Download' button
document.getElementById('downloadBtn').addEventListener('click', () => {
    const csvContent = tableToCSV();
    downloadCSV(csvContent, 'table_data.csv');
});