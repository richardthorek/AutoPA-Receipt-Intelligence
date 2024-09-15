// Wait for the DOM to fully load before running the script

document.addEventListener('DOMContentLoaded', function () {
    // Get references to the necessary DOM elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const userTokenInput = document.getElementById('userToken');




    // Functions to show and hide the results table

    // Function to hide the results table
    function hideResultsTable() {
        const resultsHeading = document.getElementById('resultsHeading');
        if (resultsHeading) {
            resultsHeading.style.display = 'none';
        }
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
        const resultsTable = document.getElementById('resultsTable');
        if (resultsTable) {
            resultsTable.style.display = 'none';
        }
    }

    // Function to show the results table
    function showResultsTable() {
        const resultsHeading = document.getElementById('resultsHeading');
        if (resultsHeading) {
            resultsHeading.style.display = 'block';
        }
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
        const resultsTable = document.getElementById('resultsTable');
        if (resultsTable) {
            resultsTable.style.display = 'table';
        }
    }

    // Hide the results table initially
    hideResultsTable();

    // Show the results table after processing the file
    document.getElementById('fileInput').addEventListener('change', function () {
        // Process the file and then show the results table
        showResultsTable();
    });

    // Function to open the off-canvas and load the image
    function openReceiptOffCanvas(imageUrl) {
        const canvasImg = document.getElementById('canvasImg');
        if (canvasImg) {
            canvasImg.src = imageUrl;
            UIkit.offcanvas('#receiptOffCanvas').show();
        }
    }

    // // Add click event to the drop zone to trigger file input click
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
            for (let i = 0; i < files.length; i++) {
                handleFileUpload(files[i]); // Handle each file upload individually
            }
        }
    });

    // Handle file selection via file input
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            for (let i = 0; i < fileInput.files.length; i++) {
                handleFileUpload(fileInput.files[i]); // Handle each file upload individually
            }
        }
    });

    // Function to check for duplicates in the table
    function checkForDuplicates() {
        const tableBody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
        const rows = Array.from(tableBody.rows);
        const duplicates = {};

        rows.forEach(row => {

            row.classList.remove('duplicate');
            row.setAttribute('data-duplicate', 'false');

            const date = row.cells[2].textContent;
            const time = row.cells[3].textContent;
            const item = row.cells[4].textContent;
            const totalPrice = row.cells[5].textContent;

            const key = `${date}_${time}_${item}_${totalPrice}`;
            if (duplicates[key]) {
                duplicates[key].push(row);
            } else {
                duplicates[key] = [row];
            }
        });

        for (const key in duplicates) {
            if (duplicates[key].length > 1) {
                
                UIkit.notification({
                    message: 'Duplicates detected in red below. Please review and delete duplicates.',
                    status: 'warning',
                    pos: 'top-right',
                    timeout: 2000
                });

                duplicates[key].forEach(row => {
                    row.classList.add('duplicate');
                    row.setAttribute('data-duplicate', 'true');
                });
            }
        }
    }

    // Function to handle file upload
    function handleFileUpload(file) {
        if (!file) return;

        // Check if the file type is allowed
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload a JPG, PNG, or PDF file.');
            return;
        }


        // Function to generate a GUID
        function generateGUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        const receiptGUID = generateGUID();

        // Create an image preview before uploading
        const reader = new FileReader();
        reader.onload = function (event) {
            const previewSection = document.getElementById('receiptPreview');

            // Create a container for the grid if it doesn't exist
            let gridContainer = document.getElementById('gridContainer');
            if (!gridContainer) {
                gridContainer = document.createElement('div');
                gridContainer.id = 'gridContainer';
                gridContainer.className = 'uk-grid uk-grid-small uk-child-width-1-4@s';
                previewSection.appendChild(gridContainer);
            }

            // Create the preview card
            const previewCard = document.createElement('div');
            previewCard.id = receiptGUID;
            previewCard.className = 'uk-card uk-card-default uk-card-small uk-card-body uk-margin-top uk-margin-auto uk-animation-slide-right uk-height-max-small';
            previewCard.style.overflowY = 'hidden';
            previewCard.innerHTML = `
        <div class="uk-card uk-card-default uk-card-small uk-flex uk-flex-center uk-flex-middle">
            <img src="${event.target.result}" class="uk-width-1-1" style="padding: 10px;" alt="Receipt Image">
        </div>
        <div class="uk-overlay uk-overlay-primary uk-position-cover">
            <div uk-spinner></div>
        </div>
    `;
            gridContainer.appendChild(previewCard);
        };
        reader.readAsDataURL(file);

        // Create a new FormData object and append the file and additional metadata
        const formData = new FormData();
        formData.append('file', file);
        formData.append('date', new Date().toISOString());
        formData.append('filename', file.name);
        formData.append('content-type', file.type);
        formData.append('file-extension', file.name.split('.').pop());
        formData.append('receiptGUID', receiptGUID);


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


                // Remove the preview card after the fetch request is completed
                const cardToRemove = document.getElementById(data.receiptID);
                if (cardToRemove) {
                    cardToRemove.remove();
                }

                showResultsTable();

                // Iterate over each item in the receipt and add it to the table with a delay
                items.forEach((item, index) => {
                    setTimeout(() => {
                        const row = tableBody.insertRow(0);
                        const rowID = generateGUID(); // Generate a unique ID for the row

                        // Add the uk-animation-fade class to the row
                        row.classList.add('uk-animation-fade');

                        // Set the ID of the row using the value of the id attribute from the entry
                        row.setAttribute('data-row-id', rowID);

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
                        receiptLink.setAttribute('uk-toggle', 'target: #imgCanvas');
                        receiptLink.textContent = 'Receipt';
                        receiptLink.target = '_blank';
                        thumbnailCell.appendChild(receiptLink);

                        // Add event listener to the receipt link
                        receiptLink.addEventListener('click', function (event) {
                            event.preventDefault(); // Prevent the default action of opening in a new tab
                            openReceiptOffCanvas(weburl);
                        });

                        // Create a submit button for each row
                        const submitCell = row.insertCell(7);
                        const submitButton = document.createElement('button');
                        submitButton.className = 'uk-icon-button';
                        submitButton.setAttribute('uk-icon', 'plus-circle');

                        submitButton.addEventListener('click', function () {
                            // Prepare the data to be submitted
                            const rowData = {
                                merchantName: receipt.MerchantName.valueString,
                                merchantAddress: receipt.MerchantAddress.valueString,
                                transactionDate: receipt.TransactionDate.valueDate,
                                transactionTime: receipt.TransactionTime.valueTime,
                                itemName: item.valueObject.Name.valueString,
                                itemTotalPrice: item.valueObject.TotalPrice.valueNumber,
                                weburl: weburl,
                                receiptId: receiptId,
                                userID: userTokenInput.value, // Add userID from userToken input field
                                itemStatus: 'active',
                                id: row.getAttribute('data-row-id') // Include the rowID from the attribute
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
                                    submitButton.setAttribute('uk-icon', 'check');
                                    submitButton.className = 'uk-icon-button success';
                                    submitButton.disabled = true;
                                })
                                .catch(error => {
                                    console.error('Error:', error);
                                });
                        });
                        
                        submitCell.appendChild(submitButton);
                        // Check for duplicates after adding the row
                    }, index * 200); // Delay of 200ms between each row
                });
                checkForDuplicates();
            })
            .catch(error => {
                console.error('Error uploading file:', error);
            });


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
                // console.log('Response Data:', data); // Log the response data to inspect its structure

                // Check if the response data has a property 'value' that is an array
                if (!Array.isArray(data.value)) {
                    throw new Error('Expected an array in response data');
                }

                // Get the table body element and clear any existing data
                const tableBody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
                tableBody.innerHTML = ''; // Clear existing table data

                showResultsTable();

                // Iterate over each entry in the response data and add it to the table with a delay
                data.value.forEach((entry, index) => {
                    setTimeout(() => {
                        const row = tableBody.insertRow(0);
                        // Add the uk-animation-fade class to the row
                        row.classList.add('uk-animation-fade');
                        row.setAttribute('data-row-id', entry.id);
                        row.insertCell(0).textContent = entry.merchantName;
                        row.insertCell(1).textContent = entry.merchantAddress;
                        row.insertCell(2).textContent = entry.transactionDate;
                        row.insertCell(3).textContent = entry.transactionTime;
                        row.insertCell(4).textContent = entry.itemName;
                        row.insertCell(5).textContent = entry.itemTotalPrice;

                        // Create a link to the receipt and add it to the table
                        const receiptCell = row.insertCell(6);
                        const receiptLink = document.createElement('a');
                        receiptLink.href = entry.weburl;
                        receiptLink.setAttribute('uk-toggle', 'target: #imgCanvas');
                        receiptLink.textContent = 'Receipt';
                        receiptLink.target = '_blank';
                        receiptCell.appendChild(receiptLink);

                        // Add event listener to the receipt link
                        receiptLink.addEventListener('click', function (event) {
                            event.preventDefault(); // Prevent the default action of opening in a new tab
                            openReceiptOffCanvas(entry.weburl);
                        });

                        // Create a delete button for each row
                        const editCell = row.insertCell(7);
                        const editButton = document.createElement('button');
                        editButton.className = 'uk-icon-button';
                        editButton.setAttribute('uk-icon', 'minus-circle');
                        editButton.setAttribute('title', 'Permanently Delete');

                        editButton.addEventListener('click', function () {
                            // Prepare the data to be submitted
                            const rowData = {
                                id: row.getAttribute('data-row-id'), // Include the rowID from the attribute
                                itemStatus: 'inactive'
                            };
                            // Edit (Delete) the individual data line items
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
                                    console.log('Deleted:', result);

                                    // Retrieve the rowID from the data-row-id attribute
                                    const rowID = row.getAttribute('data-row-id');

                                    // Find the row using the rowID and remove it
                                    const rowElement = document.querySelector(`[data-row-id="${rowID}"]`);
                                    if (rowElement) {
                                        rowElement.remove();
                                    }
                                    checkForDuplicates();
                                })
                                .catch(error => {
                                    console.error('Error:', error);
                                });
                        });
                        editCell.appendChild(editButton);
                        // Check for duplicates after adding the row
                        checkForDuplicates();
                    }, index * 200); // Delay of 200ms between each row
                   
                });

              



            })
            .catch(error => {
                console.error('Error fetching data:', error); // Log any errors that occur during the fetch request
            });
    });
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

