// The Auth0 client, initialized in configureClient()
let auth0Client = null;

/**
 * Retrieves the auth configuration from the server
 */
const fetchAuthConfig = () => fetch("/auth_config.json");

/**
 * Initializes the Auth0 client
 */
const configureClient = async () => {
  try {
    const response = await fetchAuthConfig();
    const config = await response.json();

    auth0Client = await auth0.createAuth0Client({
      domain: config.domain,
      clientId: config.clientId
    });
  } catch (err) {
    console.error("Error configuring Auth0 client:", err);
  }
};

/**
 * Ensures the Auth0 client is initialized before proceeding
 */
const ensureAuth0ClientInitialized = async () => {
  if (!auth0Client) {
    await configureClient();
  }
};

/**
 * Starts the authentication flow
 */
const login = async (targetUrl) => {
  try {
    console.log("Logging in", targetUrl);

    await ensureAuth0ClientInitialized();

    const options = {
      authorizationParams: {
        redirect_uri: window.location.origin
      }
    };

    if (targetUrl) {
      options.appState = { targetUrl };
    }

    await auth0Client.loginWithRedirect(options);
  } catch (err) {
    console.log("Log in failed", err);
  }
};

/**
 * Executes the logout flow
 */
const logout = async () => {
  try {
    console.log("Logging out");

    await ensureAuth0ClientInitialized();

    await auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  } catch (err) {
    console.log("Log out failed", err);
  }
};

/**
 * Checks to see if the user is authenticated. If so, `fn` is executed. Otherwise, the user
 * is prompted to log in
 * @param {*} fn The function to execute if the user is logged in
 */
const requireAuth = async (fn, targetUrl) => {
  try {
    await ensureAuth0ClientInitialized();

    const isAuthenticated = await auth0Client.isAuthenticated();

    if (isAuthenticated) {
      return fn();
    }
    return login(targetUrl);
  } catch (err) {
    console.error("Error during authentication check:", err);
    return login(targetUrl);
  }
};

// Will run when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await ensureAuth0ClientInitialized();

    // If unable to parse the history hash, default to the root URL
    if (!showContentFromUrl(window.location.pathname)) {
      showContentFromUrl("/");
      window.history.replaceState({ url: "/" }, {}, "/");
    }

    const bodyElement = document.getElementsByTagName("body")[0];

    // Listen out for clicks on any hyperlink that navigates to a #/ URL
    bodyElement.addEventListener("click", (e) => {
      if (isRouteLink(e.target)) {
        const url = e.target.getAttribute("href");

        if (showContentFromUrl(url)) {
          e.preventDefault();
          window.history.pushState({ url }, {}, url);
        }
      }
    });

    document.getElementById('loginLoading').setAttribute("aria-busy", "true");
    console.log("Checking authentication status");
    const isAuthenticated = await auth0Client.isAuthenticated();
    document.getElementById('loginLoading').setAttribute("aria-busy", "false");
    console.log("Checked authentication status");

    if (isAuthenticated) {
      console.log("> User is authenticated");
      window.history.replaceState({}, document.title, window.location.pathname);
      updateUI();
      return;
    }

    console.log("> User not authenticated");

    const query = window.location.search;
    const shouldParseResult = query.includes("code=") && query.includes("state=");

    if (shouldParseResult) {
      console.log("> Parsing redirect");
      try {
        const result = await auth0Client.handleRedirectCallback();

        if (result.appState && result.appState.targetUrl) {
          showContentFromUrl(result.appState.targetUrl);
        }

        console.log("Logged in!");
      } catch (err) {
        console.log("Error parsing redirect:", err);
      }

      window.history.replaceState({}, document.title, "/");
    }

    updateUI();
  } catch (err) {
    console.error("Error during initialization:", err);
  }
});