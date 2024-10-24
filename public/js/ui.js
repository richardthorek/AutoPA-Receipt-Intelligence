// URL mapping, from hash to a function that responds to that URL action
const router = {
  "/": () => showContent("content-home"),
  "/profile": () =>
    requireAuth(() => showContent("content-profile"), "/profile"),
  "/login": () => login(),
};

// Declare helper functions

/**
 * Iterates over the elements matching 'selector' and passes them
 * to 'fn'
 * @param {*} selector The CSS selector to find
 * @param {*} fn The function to execute for every element
 */
const eachElement = (selector, fn) => {
  document.querySelectorAll(selector).forEach(fn);
};

/**
 * Tries to display a content panel that is referenced
 * by the specified route URL. These are matched using the
 * router, defined above.
 * @param {*} url The route URL
 */
const showContentFromUrl = (url) => {
  if (router[url]) {
    router[url]();
    return true;
  }
  return false;
};

/**
 * Returns true if `element` is a hyperlink that can be considered a link to another SPA route
 * @param {*} element The element to check
 */
const isRouteLink = (element) =>
  element.tagName === "A" && element.classList.contains("route-link");

// Define lock at a higher scope
let lock;

/**
 * Displays a content panel specified by the given element id.
 * All the panels that participate in this flow should have the 'page' class applied,
 * so that it can be correctly hidden before the requested content is shown.
 * @param {*} id The id of the content to show
 */
const showContent = (id) => {
  eachElement(".page", (p) => p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
};

/**
 * Updates the user interface
 */
const updateUI = async () => {
  try {
    const isAuthenticated = await auth0Client.isAuthenticated();

    if (isAuthenticated) {
      const user = await auth0Client.getUser();
      eachElement(".auth-invisible", (e) => e.classList.add("hidden"));
      eachElement(".auth-visible", (e) => e.classList.remove("hidden"));
      document.getElementById("userToken").value = user.sub;

      console.log("User:", user);

      // Fetch the Auth0 configuration
      const response = await fetch("/auth_config.json");
      const config = await response.json();

      const subscriptions = user.subscriptions;
      document.getElementById("stripeUser").value = user.stripe_customer_id;

      // Append ?prefilled_email= and the encoded email to the href link
      const encodedEmail = encodeURIComponent(user.email);
      const manageSubButton = document.getElementById("manageSubButton");
      manageSubButton.href += `?prefilled_email=${encodedEmail}`;

      console.log(document.getElementById("stripeUser").value);
      console.log(document.getElementById("userToken").value);

      // Create a new <li> element to display profile information
      const profileInfo = document.createElement("li");
      profileInfo.innerHTML = `
        <span style="display: flex; align-items: center;">
          <img src="${user.picture}" alt="${user.nickname}" style="height: 20px; border-radius: 50%; margin-right: 10px;">
          ${user.name} | ${user.email}
        </span>
      `;
      document.getElementById("profileInfoList").appendChild(profileInfo);

      const subscriptionStatus = document.getElementById("subscriptionStatus");
      const subscriberElements = document.getElementsByClassName("subscriber");
      const notSubscriberElements = document.getElementsByClassName("not-subscriber");

      if (subscriptions && subscriptions.length > 0) {
        const subscription = subscriptions[0];

        if (subscription.status === "active") {
          subscriptionStatus.textContent = "Active";
          Array.from(subscriberElements).forEach((el) => el.classList.remove("hidden"));
          Array.from(notSubscriberElements).forEach((el) => el.classList.add("hidden"));
          document.querySelectorAll(".submit").forEach((btn) => {
            btn.style.display = "block";
          });
        } else if (subscription.status === "inactive") {
          subscriptionStatus.textContent = "Inactive";
          Array.from(subscriberElements).forEach((el) => el.classList.add("hidden"));
          Array.from(notSubscriberElements).forEach((el) => el.classList.remove("hidden"));
          document.querySelectorAll(".submit").forEach((btn) => {
            btn.style.display = "none";
          });
        }
      } else {
        console.log("No subscriptions found.");
        document.getElementById("createSubButton").classList.remove("hidden");
        document.getElementById("manageSubButton").classList.add("hidden");
        document.getElementById("downloadBtn").style.display = "none";
        document.querySelectorAll(".submit").forEach((btn) => {
          btn.style.display = "none";
        });
      }
    } else {
      eachElement(".auth-invisible", (e) => e.classList.remove("hidden"));
      eachElement(".auth-visible", (e) => e.classList.add("hidden"));
    }
  } catch (err) {
    console.log("Error updating UI!", err);
  }
};

window.onpopstate = (e) => {
  if (e.state && e.state.url && router[e.state.url]) {
    showContentFromUrl(e.state.url);
  }
};

/**
 * Fetches a URL and sends a JSON string in the body with the customerid value from the user profile
 * @param {string} customerId The customer ID to send in the body
 */
document.addEventListener("DOMContentLoaded", () => {
  const createSubButton = document.getElementById("createSubButton");

  createSubButton.addEventListener("click", async () => {
    console.log("Button clicked"); // Debugging statement

    // Set aria-busy to true
    createSubButton.setAttribute("aria-busy", "true");

    // Get the stripe_customer_id from the document element with ID stripeID
    const stripeCustomerId = document.getElementById("stripeUser").value;
    console.log("stripeCustomerId:", stripeCustomerId); // Debugging statement

    // Get the domain from the current site's configuration
    const domain = window.location.origin;
    console.log("domain:", domain); // Debugging statement

    const url = "https://autopaserverless.azurewebsites.net/api/stripeEvents";
    const data = {
      stripe_customer_id: stripeCustomerId,
      domain: domain,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // Extract the Location header from the response
      let redirectUrl = response.headers.get("Location");
      if (!redirectUrl) {
        // If the Location header is not present, extract the URL from the response body
        const responseData = await response.json();
        redirectUrl = responseData.url;
      }

      if (redirectUrl) {
        console.log("Redirect URL:", redirectUrl);
        window.location.href = redirectUrl; // Navigate to the redirect URL
      } else {
        console.error("No redirect URL found in the response");
      }
    } catch (error) {
      console.error("Error sending POST request:", error);
    } finally {
      // Remove aria-busy attribute
      createSubButton.removeAttribute("aria-busy");
    }
  });
});

/**
 * Fetches URL parameters
 * @returns {Object} URL parameters
 */
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    error: params.get("error"),
    error_description: params.get("error_description"),
    state: params.get("state"),
  };
}

/**
 * Displays error messages in a Pico CSS modal
 */
function displayErrorModal() {
  const { error, error_description } = getUrlParams();
  if (error && error_description) {
    const modal = document.getElementById("errorModal");
    const modalTitle = document.getElementById("errorModalTitle");
    const modalBody = document.getElementById("errorModalBody");

    modalTitle.textContent = error;
    modalBody.textContent = error_description;

    modal.showModal();

    // Add event listeners to close buttons
    const closeButtons = modal.querySelectorAll('a[href="#close"]');
    closeButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        modal.close();
      });
    });
  }
}

// Call the function to display the error modal if error parameters are present in the URL
document.addEventListener("DOMContentLoaded", displayErrorModal);

// Function to show the subscription modal
function showSubscribeModal() {
  const modal = document.getElementById("subscribeModal");
  modal.showModal();

  // Add event listeners to close buttons
  const closeButtons = modal.querySelectorAll('a[href="#close"]');
  closeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      modal.close();
    });
  });

  // Add event listeners to subscription buttons
  document
    .getElementById("subscribeMonthlyButton")
    .addEventListener("click", () => {
      document.getElementById("createSubButton").click();
    });

  document
    .getElementById("subscribeYearlyButton")
    .addEventListener("click", () => {
      // Implement yearly subscription logic here
    });
}

// Function to show the subscription modal after each receipt is uploaded
function showSubscribeModalAfterUpload() {
  const modal = document.getElementById("subscribeModal");
  modal.showModal();
}