// Wait for the DOM to fully load before running the script

document.addEventListener("DOMContentLoaded", function () {
  // Function to hide the results table

  function hideResultsTable() {
    const resultsHeading = document.getElementById("resultsHeading");
    if (resultsHeading) {
      resultsHeading.style.display = "none";
    }
    const resultsSection = document.getElementById("resultsSection");
    if (resultsSection) {
      resultsSection.style.display = "none";
    }
    const resultsTable = document.getElementById("resultsTable");
    if (resultsTable) {
      resultsTable.style.display = "none";
    }
  }

  // Function to show the results table
  function showResultsTable() {
    const resultsHeading = document.getElementById("resultsHeading");
    if (resultsHeading) {
      resultsHeading.style.display = "block";
    }
    const resultsSection = document.getElementById("resultsSection");
    if (resultsSection) {
      resultsSection.style.display = "block";
    }
    const resultsTable = document.getElementById("resultsTable");
    if (resultsTable) {
      resultsTable.style.display = "table";
    }
  }

  // Get references to the necessary DOM elements
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const userTokenInput = document.getElementById("userToken");

  // Hide the results table initially
  hideResultsTable();

  // Show the results table after processing the file
  document.getElementById("fileInput").addEventListener("change", function () {
    // Process the file and then show the results table
    showResultsTable();
  });

  // // Add click event to the drop zone to trigger file input click
  dropZone.addEventListener("click", () => fileInput.click());

  // Add dragover event to the drop zone to allow file dragging
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  // Remove dragover class when the file is dragged out of the drop zone
  dropZone.addEventListener("dragleave", () =>
    dropZone.classList.remove("dragover")
  );

  // Handle file drop event
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files.length) {
      for (let i = 0; i < files.length; i++) {
        handleFileUpload(files[i]); // Handle each file upload individually
      }
    }
  });

  // Handle file selection via file input
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      for (let i = 0; i < fileInput.files.length; i++) {
        handleFileUpload(fileInput.files[i]); // Handle each file upload individually
      }
    }
  });

  // Function to handle file upload
  function handleFileUpload(file) {
    if (!file) return;

    // Check if the file type is allowed
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload a JPG, PNG, or PDF file.");
      return;
    }

    const receiptGUID = generateGUID();

    // Create an image preview before uploading
    const reader = new FileReader();
    reader.onload = function (event) {
      const previewSection = document.getElementById("receiptPreview");

      // Create a container for the grid if it doesn't exist
      let gridContainer = document.getElementById("gridContainer");
      if (!gridContainer) {
        gridContainer = document.createElement("div");
        gridContainer.id = "gridContainer";
        gridContainer.className = "uk-grid uk-grid-small uk-child-width-1-4@s";
        previewSection.appendChild(gridContainer);
      }

      // Create the preview card
      const previewCard = document.createElement("div");
      previewCard.id = receiptGUID;

      // Create the inner HTML content
      const article = document.createElement("article");
      article.setAttribute("aria-busy", "true");

      const imageContainer = document.createElement("div");
      const img = document.createElement("img");
      img.src = event.target.result;
      img.alt = "Receipt Image";
      img.style.padding = "10px";

      // Append the image to the image container
      imageContainer.appendChild(img);

      // Append the image container to the article
      article.appendChild(imageContainer);

      // Append the article to the preview card
      previewCard.appendChild(article);

      // Add styles and classes
      previewCard.className = "receipt-preview card uk-animation-slide-right";
      previewCard.style.overflow = "hidden";
      previewCard.style.maxHeight = "200px"; // Set the maximum height of the card
      previewCard.style.marginBottom = "40px"; // Add margin below the card

      article.className = "card overflow";
      imageContainer.className = "image-container";
      imageContainer.style.maxHeight = "200px";
      imageContainer.style.overflowY = "auto";

      // Append the preview card to the grid container
      gridContainer.appendChild(previewCard);
    };

    // Read the file as a data URL
    reader.readAsDataURL(file);

    const fileInput = document.getElementById("fileInput");
    const assignee = document.getElementById("assignee").value;
    const note = document.getElementById("note").value;
    const documentType = document.querySelector(
      'input[name="documentType"]:checked'
    ).value;

    // Create a new FormData object and append the file and additional metadata
    const formData = new FormData();
    formData.append("file", file);
    formData.append("date", new Date().toISOString());
    formData.append("filename", file.name);
    formData.append("content-type", file.type);
    formData.append("file-extension", file.name.split(".").pop());
    formData.append("receiptGUID", receiptGUID);
    formData.append("assignee", assignee);
    formData.append("note", note);
    formData.append("documentType", documentType);

    // Perform the file upload using fetch
    fetch(
      "https://prod-04.australiasoutheast.logic.azure.com:443/workflows/bd37bd65a79d49499f5b0e91986f8a00/triggers/Receive_POST_File/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FReceive_POST_File%2Frun&sv=1.0&sig=X1QhmY8PSR3wq38j4Q7_kfSMxRtMSzmfKGIj67aBMiY",
      {
        method: "POST",
        body: formData,
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok"); // Throw an error if the response is not ok
        }
        return response.json(); // Parse the response as JSON
      })
      .then((data) => {
        const documentResults = data.documentResults[0];
        const items = documentResults.Items.valueArray;
        const tableBody = document
          .getElementById("resultsTable")
          .getElementsByTagName("tbody")[0];
        const weburl = data.weburl;
        const receiptId = data.receiptID;
        const documentType = data.documentType;

        // Remove the preview card after the fetch request is completed
        const cardToRemove = document.getElementById(data.receiptID);
        if (cardToRemove) {
          cardToRemove.remove();
        }

        showResultsTable();

        const progressBar = document.getElementById("loadingProgressBar");
        progressBar.setAttribute("max", 0);
        progressBar.setAttribute("value", 0);
        const totalItems = items.length;
        progressBar.max = totalItems;
        progressBar.value = 0; // Reset progress bar value to 0
        progressBar.style.display = totalItems > 0 ? "block" : "none"; // Show or hide progress bar

        // Create a new row for each item in the document
        const rowPromises = items.map((item, index) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              const formattedDate = getFormattedDate();
              const formattedTime = getFormattedTime();
              const itemID = generateGUID();
              const assignee = data.assignee;
              const note = data.note;
              const rowData = {
                merchantName: documentResults.MerchantName?.valueString || "",
                merchantAddress:
                  documentResults.MerchantAddress?.valueString || "",
                transactionDate:
                  documentType === "Invoice"
                    ? documentResults.InvoiceDate?.valueDate || formattedDate
                    : documentResults.TransactionDate?.valueDate ||
                      formattedDate,
                transactionTime:
                  documentType === "Invoice"
                    ? ""
                    : documentResults.TransactionTime?.valueTime ||
                      formattedTime,
                itemName:
                  documentType === "Invoice"
                    ? `${item.valueObject?.Description?.valueString || ""} ${
                        item.valueObject?.ProductCode?.valueString || ""
                      }`
                    : item.valueObject?.Name?.valueString || "",
                itemQuantity: item.valueObject?.Quantity?.valueNumber || 1,
                itemTotalPrice: item.valueObject?.TotalPrice?.valueNumber || 0,
                id: itemID,
              };
              populateTableRow(
                tableBody,
                rowData,
                weburl,
                receiptId,
                assignee,
                note,
                userTokenInput
              );
              resolve();
            }, index * 5); // Delay of 5ms between each row
          });
        });

        // Wait for all rows to be added before checking for duplicates
        return Promise.all(rowPromises);
      })
      .then(() => {
        const progressBar = document.getElementById("loadingProgressBar");
        progressBar.style.display = "block";
        progressBar.removeAttribute("value");
        progressBar.removeAttribute("max");
        // Check for duplicates after adding the new rows
        checkForDuplicates();

        filterDetails.removeAttribute("open");

        // Scroll the page so the results heading is at the top
        const resultsHeading = document.getElementById("resultsHeading");
        if (resultsHeading) {
          resultsHeading.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
      });
  }

  // Add an event listener to the 'getBtn' button to handle click events
  document.getElementById("getBtn").addEventListener("click", function (event) {
    event.preventDefault(); // Prevent the default form submission behavior
    // Get the values of the 'from' and 'to' date filters and the user token
    const fromDate = document.getElementById("filterFromDate").value;
    const toDate = document.getElementById("filterToDate").value;
    const userTokenInput = document.getElementById("userToken").value;

    // Check if both dates are selected, if not, alert the user and return
    if (!fromDate || !toDate) {
      alert("Please select both From and To dates.");
      return;
    }

    // Create an object with the request data
    const requestData = {
      fromDate: fromDate,
      toDate: toDate,
      user: userTokenInput,
    };

    // Send a POST request to the server with the request data to get historical entries
    fetch(
      "https://prod-03.australiasoutheast.logic.azure.com:443/workflows/03a2ae7b87c140b9a0bdda16a6e8778c/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=YH9nz-b8uHkiHvaPHjSLC5sCVfTv-TA_shzD4yQm3eo",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    )
      .then((response) => {
        // Check if the response is ok, if not, throw an error
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // Parse the response as JSON
      })
      .then((data) => {
        // console.log('Response Data:', data); // Log the response data to inspect its structure

        // Check if the response data has a property 'value' that is an array
        if (!Array.isArray(data.value)) {
          throw new Error("Expected an array in response data");
        }

        // Get the table body element and clear any existing data
        const tableBody = document
          .getElementById("resultsTable")
          .getElementsByTagName("tbody")[0];
        tableBody.innerHTML = ""; // Clear existing table data

        showResultsTable();

        // Populate table row from historical data

        const progressBar = document.getElementById("loadingProgressBar");
        const totalItems = data.value.length;
        progressBar.max = totalItems;
        progressBar.value = 0; // Reset progress bar value to 0
        progressBar.style.display = totalItems > 0 ? "block" : "none"; // Show or hide progress bar

        const promises = data.value.map((entry, index) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              const rowData = {
                merchantName: entry.merchantName || "",
                merchantAddress: entry.merchantAddress || "",
                transactionDate: entry.transactionDate || "",
                transactionTime: entry.transactionTime || "",
                itemName: entry.itemName || "",
                itemQuantity: entry.itemQuantity || 0,
                itemTotalPrice: entry.itemTotalPrice || 0,
                id: entry.id,
              };
              populateTableRow(
                tableBody,
                rowData,
                entry.weburl,
                entry.receiptId,
                entry.assignee,
                entry.note,
                userTokenInput
              );
              resolve();
            }, index * 50); // Delay of 50ms between each row
          });
        });

        Promise.all(promises)
          .then(() => {
            progressBar.removeAttribute("value");
            progressBar.removeAttribute("max");

            // After all rows have been populated, set all submit buttons to done
            const submitButtons = document.querySelectorAll(
              "[id$='-btn-submit']"
            );
            submitButtons.forEach((button) => {
              setDone(button);
            });

            // Check for duplicates after adding the new rows
            checkForDuplicates();

            filterDetails.removeAttribute("open");

            // Scroll the page so the results heading is at the top
            const resultsHeading = document.getElementById("resultsHeading");
            if (resultsHeading) {
              resultsHeading.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          })
          .catch((error) => {
            console.error("Error processing rows:", error);
          });
      })
      .catch((error) => {
        console.error("Error fetching data:", error); // Log any errors that occur during the fetch request
      });
  });
});

// Function to convert table data to CSV format
function tableToCSV() {
  const table = document.getElementById("resultsTable");
  const rows = table.querySelectorAll("tr");
  let csvContent = "";

  // Add headers for the attributes
  const headers = ["ID", "Assignee", "Note", "Total Price"];
  const tableHeaders = Array.from(table.querySelectorAll("th")).map(
    (th) => th.textContent
  );
  csvContent += [...tableHeaders, ...headers].join(",") + "\n";

  rows.forEach((row, index) => {
    // Skip the header row
    if (index === 0) return;

    const cols = row.querySelectorAll("td");
    const rowData = Array.from(cols).map((col) => {
      const anchor = col.querySelector("a");
      return anchor ? anchor.href : col.textContent;
    });

    // Add the row attributes
    const rowId = row.getAttribute("data-row-id") || "";
    const assignee = row.getAttribute("data-row-assignee") || "";
    const note = row.getAttribute("data-row-note") || "";
    const totalPrice = row.getAttribute("data-item-total-price") || "";

    rowData.push(rowId, assignee, note, totalPrice);
    csvContent += rowData.join(",") + "\n";
  });

  return csvContent;
}

// Function to download the CSV file
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  a.click();
  URL.revokeObjectURL(url);
}

// Add event listener to the 'Download' button
document.getElementById("downloadBtn").addEventListener("click", (event) => {
  event.preventDefault(); // Prevent the default form submission behavior
  const csvContent = tableToCSV();
  downloadCSV(csvContent, "table_data.csv");
});

//POPULATE ROW
function populateTableRow(
  tableBody,
  rowData,
  weburl,
  receiptId,
  assignee,
  note,
  userTokenInput
) {
  const row = tableBody.insertRow(0);

  // Add the uk-animation-fade class to the row
  row.classList.add("uk-animation-fade");

  // Set the ID of the row using the value of the id attribute from the entry
  row.setAttribute("data-row-assignee", assignee);
  row.setAttribute("data-row-note", note);
  row.setAttribute("data-row-id", rowData.id);
  // Store the original numeric value in a data attribute
  row.setAttribute("data-item-total-price", rowData.itemTotalPrice || 0);

  row.insertCell(0).textContent = rowData.merchantName || "";
  row.insertCell(1).textContent = rowData.merchantAddress || "";
  row.insertCell(2).textContent = rowData.transactionDate || "";
  row.insertCell(3).textContent = rowData.transactionTime || "";
  row.insertCell(4).textContent = rowData.itemName || "";
  row.insertCell(5).textContent =
    typeof rowData.itemQuantity === "number" ? rowData.itemQuantity : 0;

  // Display the formatted currency value
  row.insertCell(6).textContent =
    typeof rowData.itemTotalPrice === "number"
      ? formatCurrency(rowData.itemTotalPrice)
      : formatCurrency(0);

  // Create a cell for the buttons
  const buttonCell = row.insertCell(7);

  // Create a link to the receipt and add it to the button cell
  const receiptLink = document.createElement("a");
  receiptLink.href = weburl;

  receiptLink.setAttribute("aria-label", "Show Receipt");
  receiptLink.classList.add("uk-icon-button");

  receiptLink.target = "_blank";
  receiptLink.innerHTML = '<span uk-icon="icon: file-text"></span>';
  buttonCell.appendChild(receiptLink);

  // Add event listener to the receipt link
  receiptLink.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent the default action of opening in a new tab
    openReceiptOffCanvas(weburl);
  });

  setReceipt(receiptLink);

  // Create a submit button for each row
  const submitButton = document.createElement("a");
  submitButton.setAttribute("aria-label", "Submit");
  submitButton.id = `${rowData.id}-btn-submit`;
  submitButton.classList.add("subscriber"); // Add the "subscriber" class
  setSubmit(submitButton);

  submitButton.addEventListener("click", function () {
    const rowData = getRowData(
      row,
      weburl,
      receiptId,
      userTokenInput,
      assignee,
      note
    );
    submitRowData(rowData, submitButton);
  });

  buttonCell.appendChild(submitButton);

  // Create an edit button for each row
  const editButton = document.createElement("a");
  editButton.setAttribute("aria-label", "Edit");
  editButton.id = `${rowData.id}-btn-edit`;
  setEdit(editButton);

  editButton.addEventListener("click", function () {
    openEditModal(row);
  });

  buttonCell.appendChild(editButton);

  // Create a delete button for each row
  const deleteButton = document.createElement("a");
  deleteButton.setAttribute("aria-label", "Delete");
  deleteButton.id = `${rowData.id}-btn-delete`;
  setDelete(deleteButton);

  deleteButton.addEventListener("click", function () {
    deleteRow(row);
  });

  buttonCell.appendChild(deleteButton);

  const progressBar = document.getElementById("loadingProgressBar");
  // Update the progress bar value
  progressBar.value += 1;
}

//GET ROW
function getRowData(row, weburl, receiptId, userTokenInput) {
  return {
    merchantName: row.cells[0].textContent || "",
    merchantAddress: row.cells[1].textContent || "",
    transactionDate: row.cells[2].textContent || "",
    transactionTime: row.cells[3].textContent || "",
    itemName: row.cells[4].textContent || "",
    itemTotalPrice: parseFloat(row.getAttribute("data-item-total-price")) || 0,
    itemQuantity: parseInt(row.cells[5].textContent, 10) || 0,
    weburl: weburl ?? "",
    receiptId: receiptId ?? "",
    userID: userTokenInput.value ?? "", // Add userID from userToken input field
    itemStatus: "active",
    id: row.getAttribute("data-row-id") ?? "", // Include the rowID from the attribute
    assignee: row.getAttribute("data-row-assignee") ?? "", // Include the assignee from the attribute
    note: row.getAttribute("data-row-note") ?? "", // Include the Job or Reason from the attribute
  };
}

//SUBMIT ROW

function submitRowData(rowData, submitButton) {
  // Change the submit button to a refresh icon showing pending activity and disable it.
  setPending(submitButton);

  // Check for an active subscription
  if (
    document.getElementById("subscriptionStatus").textContent !== "Active" &&
    document.getElementById("subscriptionStatus").textContent !== "Trialing"
  ) {
    // Open the subscribe modal if no active subscription is found
    showSubscribeModal();
    return; // Exit the function to prevent submission
  }

  fetch(
    "https://prod-06.australiasoutheast.logic.azure.com:443/workflows/4339c710204042cf9787b5f4e548ee2c/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=E7sskUxpn9_lGrl1jXtCrpF-FQXqU2Pkd-SsDL4fi6U",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rowData),
    }
  )
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Failed to submit row data.");
      }
    })
    .then((result) => {
      console.log("Success:", result);
      setDone(submitButton);
      // Delay for half a second and then remove the 'success' class
      setTimeout(() => {
        //Do Something
      }, 500);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// EDIT MODAL

function openEditModal(row) {
  document.getElementById("edit-modal-card").setAttribute("open", "");

  // Get the existing row data
  const merchantName = row.cells[0].textContent;
  const merchantAddress = row.cells[1].textContent;
  const transactionDate = row.cells[2].textContent;
  const transactionTime = row.cells[3].textContent;
  const itemName = row.cells[4].textContent;
  const itemQuantity = row.cells[5].textContent;
  const itemTotalPrice = parseFloat(row.getAttribute("data-item-total-price"));
  const assignee = row.getAttribute("data-row-assignee");
  const note = row.getAttribute("data-row-note");

  // Pre-fill the form with existing row data
  document.getElementById("edit-merchantName").value = merchantName;
  document.getElementById("edit-merchantAddress").value = merchantAddress;
  document.getElementById("edit-transactionDate").value = transactionDate;
  document.getElementById("edit-transactionTime").value = transactionTime;
  document.getElementById("edit-itemName").value = itemName;
  document.getElementById("edit-itemTotalPrice").value = itemTotalPrice;
  document.getElementById("edit-itemQuantity").value = itemQuantity;
  document.getElementById("edit-assignee").value = assignee;
  document.getElementById("edit-note").value = note;

  // Handle form submission
  document.getElementById("edit-form").onsubmit = function (event) {
    event.preventDefault();

    document.getElementById("edit-modal-card").removeAttribute("open", "");

    // Get the updated data from the form
    const updatedMerchantName =
      document.getElementById("edit-merchantName").value;
    const updatedMerchantAddress = document.getElementById(
      "edit-merchantAddress"
    ).value;
    const updatedTransactionDate = document.getElementById(
      "edit-transactionDate"
    ).value;
    const updatedTransactionTime = document.getElementById(
      "edit-transactionTime"
    ).value;
    const updatedItemName = document.getElementById("edit-itemName").value;
    const updatedItemTotalPrice = document.getElementById(
      "edit-itemTotalPrice"
    ).value;
    const updatedItemQuantity =
      document.getElementById("edit-itemQuantity").value;
    const updatedAssignee = document.getElementById("edit-assignee").value;
    const updatedNote = document.getElementById("edit-note").value;

    // Update the row with the new data
    row.cells[0].textContent = updatedMerchantName;
    row.cells[1].textContent = updatedMerchantAddress;
    row.cells[2].textContent = updatedTransactionDate;
    row.cells[3].textContent = updatedTransactionTime;
    row.cells[4].textContent = updatedItemName;
    row.cells[5].textContent = updatedItemQuantity;
    row.setAttribute("data-row-assignee", updatedAssignee);
    row.setAttribute("data-row-note", updatedNote);

    // Display the formatted currency value and update the data attribute
    row.cells[6].textContent = formatCurrency(updatedItemTotalPrice);
    row.setAttribute("data-item-total-price", updatedItemTotalPrice);

    // Define userTokenInput
    const userTokenInput = document.getElementById("userToken");

    // Prepare the updated row data
    const updatedRowData = {
      merchantName: updatedMerchantName,
      merchantAddress: updatedMerchantAddress,
      transactionDate: updatedTransactionDate,
      transactionTime: updatedTransactionTime,
      itemName: updatedItemName,
      itemTotalPrice: parseFloat(updatedItemTotalPrice) || 0,
      itemQuantity: parseInt(updatedItemQuantity, 10) || 0,
      weburl: row.cells[7].querySelector("a").href || "",
      receiptId: row.getAttribute("data-receipt-id") || "",
      userID: userTokenInput.value || "",
      itemStatus: "active",
      id: row.getAttribute("data-row-id") || "",
      assignee: updatedAssignee,
      note: updatedNote,
    };

    // Get the submit button for the row using the unique ID
    const submitButton = document.getElementById(
      `${updatedRowData.id}-btn-submit`
    );

    // Set the submit button to pending state
    setPending(submitButton);

    // Call the submitRowData function with the updated row data
    submitRowData(updatedRowData, submitButton);
  };
}

//DELETE ROW

function deleteRow(row) {
  // Prepare the data to be submitted
  const rowData = {
    id: row.getAttribute("data-row-id"), // Include the rowID from the attribute
    itemStatus: "inactive",
  };

  // Edit (Delete) the individual data line items
  fetch(
    "https://prod-06.australiasoutheast.logic.azure.com:443/workflows/4339c710204042cf9787b5f4e548ee2c/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=E7sskUxpn9_lGrl1jXtCrpF-FQXqU2Pkd-SsDL4fi6U",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rowData),
    }
  )
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Failed to submit row data.");
      }
    })
    .then((result) => {
      console.log("Deleted:", result);

      // Retrieve the rowID from the data-row-id attribute
      const rowID = row.getAttribute("data-row-id");

      // Find the row using the rowID and remove it
      const rowElement = document.querySelector(`[data-row-id="${rowID}"]`);
      if (rowElement) {
        rowElement.remove();
      }

      // Check for duplicates after adding the new rows
      checkForDuplicates();
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// Function to generate a GUID
function generateGUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getFormattedDate() {
  // Get the current date
  const now = new Date();

  // Format the date as YYYY-MM-DD
  return now.toISOString().split("T")[0];
}

function getFormattedTime() {
  // Get the current time
  const now = new Date();

  // Round the time to the nearest minute
  now.setSeconds(0, 0);
  if (now.getSeconds() >= 30) {
    now.setMinutes(now.getMinutes() + 1);
  }

  // Format the time as HH:MM
  return now.toTimeString().split(" ")[0].substring(0, 5);
}

function setSubmit(button) {
  button.classList.remove("refresh", "submit", "error");
  button.setAttribute("uk-icon", "plus-circle");
  button.className = "uk-icon-button action";
  button.disabled = false;
}

function setDelete(button) {
  button.classList.remove("refresh", "submit", "error");
  button.setAttribute("uk-icon", "close");
  button.className = "uk-icon-button action";
  button.disabled = false;
}

function setReceipt(button) {
  button.classList.remove("refresh", "submit", "error");
  // button.setAttribute("uk-icon", "file-text");
  button.className = "uk-icon-button action";
  button.disabled = false;
}

function setEdit(button) {
  button.classList.remove("refresh", "submit", "error");
  button.setAttribute("uk-icon", "pencil");
  button.className = "uk-icon-button action";
  button.disabled = false;
}

function setPending(button) {
  button.setAttribute("uk-icon", "refresh");
  button.className = "uk-icon-button refreshj";
  button.disabled = true;
}

function setDone(button) {
  button.classList.remove("refresh");
  button.setAttribute("uk-icon", "check");
  button.className = "uk-icon-button success";
  button.disabled = false;
}

function setError(button) {
  button.classList.remove("refresh");
  button.setAttribute("uk-icon", "warning");
  button.className = "uk-icon-button error";
  button.disabled = false;
}

function restore(button) {
  button.classList.remove("refresh", "success", "error");
  button.className = "uk-icon-button action";
  button.setAttribute("uk-icon", "plus-circle");
  button.disabled = false;
}

// Function to check for duplicates in the table
function checkForDuplicates() {
  const progressBar = document.getElementById("loadingProgressBar");
  progressBar.style.display = "block";
  progressBar.removeAttribute("value");
  progressBar.removeAttribute("max");

  const tableBody = document
    .getElementById("resultsTable")
    .getElementsByTagName("tbody")[0];
  const rows = Array.from(tableBody.rows);
  const duplicates = {};

  rows.forEach((row) => {
    // Remove duplicate class from the delete button
    const deleteLink = row.querySelector('a[aria-label="Delete"]');
    if (deleteLink) {
      deleteLink.classList.remove("duplicate");
      deleteLink.setAttribute("data-duplicate", "false");
    }

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

  let hasDuplicates = false;

  for (const key in duplicates) {
    if (duplicates[key].length > 1) {
      hasDuplicates = true;
      duplicates[key].forEach((row) => {
        const deleteLink = row.querySelector('a[aria-label="Delete"]');
        if (deleteLink) {
          deleteLink.classList.add("duplicate");
          deleteLink.setAttribute("data-duplicate", "true");
        }
      });
    }
  }

  if (hasDuplicates) {
    document.getElementById("duplicate-notification").style.display = "block";
  } else {
    document.getElementById("duplicate-notification").style.display = "none";
  }

  progressBar.style.display = "none";
}

// Function to open the off-canvas and load the image
function openReceiptOffCanvas(imageUrl) {
  const canvasImg = document.getElementById("canvasImg");
  const offCanvasElement = document.getElementById("imgCanvas");

  offCanvasElement.setAttribute("open", "");

  if (canvasImg && offCanvasElement) {
    console.log("Image URL:", imageUrl); // Debugging: Log the image URL
    canvasImg.src = imageUrl;
    canvasImg.onload = () => {
      console.log("Image loaded successfully"); // Debugging: Log when the image loads
    };
    canvasImg.onerror = (error) => {
      console.error("Error loading image:", error); // Debugging: Log any errors
    };
  } else {
    if (!canvasImg) {
      console.error("imgCanvas element not found"); // Debugging: Log if the imgCanvas element is not found
    }
    if (!offCanvasElement) {
      console.error("receiptOffCanvas element not found"); // Debugging: Log if the receiptOffCanvas element is not found
    }
  }
}

// Helper function to format numbers as currency
function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

//Function to enable date preset buttons.

function formatDateToYYYYMMDD(date, locale = "en-CA") {
  return date
    .toLocaleDateString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .split("/")
    .reverse()
    .join("-");
}

function setCurrentMonth() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const userLocale = navigator.language || "en-CA";
  document.getElementById("filterFromDate").value = formatDateToYYYYMMDD(
    firstDay,
    userLocale
  );
  document.getElementById("filterToDate").value = formatDateToYYYYMMDD(
    lastDay,
    userLocale
  );
}

function setLastMonth() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);

  const userLocale = navigator.language || "en-CA";
  document.getElementById("filterFromDate").value = formatDateToYYYYMMDD(
    firstDay,
    userLocale
  );
  document.getElementById("filterToDate").value = formatDateToYYYYMMDD(
    lastDay,
    userLocale
  );
}

function setCurrentQuarter() {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const firstDay = new Date(now.getFullYear(), quarterStartMonth, 1);
  const lastDay = new Date(now.getFullYear(), quarterStartMonth + 3, 0);

  const userLocale = navigator.language || "en-CA";
  document.getElementById("filterFromDate").value = formatDateToYYYYMMDD(
    firstDay,
    userLocale
  );
  document.getElementById("filterToDate").value = formatDateToYYYYMMDD(
    lastDay,
    userLocale
  );
}

function setLastQuarter() {
  const now = new Date();
  const quarterStartMonth = Math.floor((now.getMonth() - 3) / 3) * 3;
  const firstDay = new Date(now.getFullYear(), quarterStartMonth, 1);
  const lastDay = new Date(now.getFullYear(), quarterStartMonth + 3, 0);

  const userLocale = navigator.language || "en-CA";
  document.getElementById("filterFromDate").value = formatDateToYYYYMMDD(
    firstDay,
    userLocale
  );
  document.getElementById("filterToDate").value = formatDateToYYYYMMDD(
    lastDay,
    userLocale
  );
}

function setCurrentFinancialYear() {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const firstDay = new Date(year, 6, 1);
  const lastDay = new Date(year + 1, 6, 30);

  const userLocale = navigator.language || "en-CA";
  document.getElementById("filterFromDate").value = formatDateToYYYYMMDD(
    firstDay,
    userLocale
  );
  document.getElementById("filterToDate").value = formatDateToYYYYMMDD(
    lastDay,
    userLocale
  );
}

function setLastFinancialYear() {
  const now = new Date();
  const year =
    now.getMonth() >= 6 ? now.getFullYear() - 1 : now.getFullYear() - 2;
  const firstDay = new Date(year, 6, 1);
  const lastDay = new Date(year + 1, 6, 30);

  const userLocale = navigator.language || "en-CA";
  document.getElementById("filterFromDate").value = formatDateToYYYYMMDD(
    firstDay,
    userLocale
  );
  document.getElementById("filterToDate").value = formatDateToYYYYMMDD(
    lastDay,
    userLocale
  );
}

let sortOrder = {}; // Object to keep track of sort order for each column

// Function to sort the table
function sortTable(columnIndex) {
  const table = document.getElementById("resultsTable");
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);

  // Toggle sort order for the column
  sortOrder[columnIndex] = !sortOrder[columnIndex];

  const sortedRows = rows.sort((a, b) => {
    const aText = a.cells[columnIndex].textContent.trim();
    const bText = b.cells[columnIndex].textContent.trim();

    let comparison = 0;
    if (columnIndex === 2) {
      // Date column
      comparison = new Date(aText) - new Date(bText);
    } else if (columnIndex === 6) {
      // Item Total Price column
      comparison =
        parseFloat(aText.replace(/[^0-9.-]+/g, "")) -
        parseFloat(bText.replace(/[^0-9.-]+/g, ""));
    } else {
      comparison = aText.localeCompare(bText);
    }

    return sortOrder[columnIndex] ? comparison : -comparison;
  });

  // Clear the table body and append sorted rows
  tbody.innerHTML = "";
  sortedRows.forEach((row) => tbody.appendChild(row));

  // Update sort icons
  updateSortIcons(columnIndex);
}

// Function to update sort icons
function updateSortIcons(activeColumnIndex) {
  const iconIds = [
    "sort-icon-0",
    "sort-icon-1",
    "sort-icon-2",
    "sort-icon-3",
    "sort-icon-4",
    "sort-icon-5",
    "sort-icon-6",
  ];

  iconIds.forEach((id, index) => {
    const icon = document.getElementById(id);
    if (icon) {
      icon.setAttribute("uk-icon", ""); // Clear icon for all columns
      if (index === activeColumnIndex) {
        icon.setAttribute(
          "uk-icon",
          sortOrder[activeColumnIndex] ? "chevron-up" : "chevron-down"
        );
      }
    }
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.setAttribute("open", "");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.removeAttribute("open", "");
  }
}

// Add event listener to the search box
document.getElementById("searchBox").addEventListener("input", filterTable);

// Function to filter the table based on search input
function filterTable() {
  const searchBox = document.getElementById("searchBox");
  const filter = searchBox.value.toLowerCase();
  const table = document.getElementById("resultsTable");
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);

  rows.forEach((row) => {
    const cells = Array.from(row.cells);
    const match = cells.some((cell) =>
      cell.textContent.toLowerCase().includes(filter)
    );
    row.style.display = match ? "" : "none";
  });
}
