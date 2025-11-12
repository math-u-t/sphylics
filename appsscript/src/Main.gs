/**
 * bbauth - Google Apps Script
 * Identity Verification Layer
 */

/**
 * Main entry point for HTTP GET requests
 * @param {Object} e - Event parameter containing request details
 * @return {HtmlOutput} Redirect response
 */
function doGet(e) {
  try {
    const sessionId = e.parameter.session_id;

    if (!sessionId) {
      return createErrorResponse('invalid_request', 'Missing session_id parameter');
    }

    // Get authenticated user's email
    const email = Session.getActiveUser().getEmail();

    if (!email) {
      return createErrorResponse('access_denied', 'Unable to retrieve user email. Please ensure you are logged in.');
    }

    // Get callback URL from script properties
    const callbackUrl = getCallbackUrl();

    // Build redirect URL
    const redirectUrl = buildRedirectUrl(callbackUrl, sessionId, email);

    // Redirect back to bbauth callback endpoint
    return HtmlService.createHtmlOutput(
      '<html><head><meta http-equiv="refresh" content="0;url=' + redirectUrl + '"></head></html>'
    );

  } catch (error) {
    Logger.log('Error in doGet: ' + error);
    return createErrorResponse('server_error', 'An error occurred: ' + error.toString());
  }
}

/**
 * Build redirect URL with parameters
 * @param {string} baseUrl - Base callback URL
 * @param {string} sessionId - Session ID
 * @param {string} email - User email
 * @return {string} Complete redirect URL
 */
function buildRedirectUrl(baseUrl, sessionId, email) {
  const params = {
    session_id: sessionId,
    email: email
  };

  const queryString = Object.keys(params)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');

  return baseUrl + '?' + queryString;
}

/**
 * Create error response HTML
 * @param {string} error - Error code
 * @param {string} description - Error description
 * @return {HtmlOutput} Error page
 */
function createErrorResponse(error, description) {
  const callbackUrl = getCallbackUrl();
  const redirectUrl = callbackUrl + '?error=' + encodeURIComponent(error) +
                      '&error_description=' + encodeURIComponent(description);

  return HtmlService.createHtmlOutput(
    '<html><head><meta http-equiv="refresh" content="0;url=' + redirectUrl + '"></head></html>'
  );
}

/**
 * Get callback URL from script properties
 * @return {string} Callback URL
 */
function getCallbackUrl() {
  const props = PropertiesService.getScriptProperties();
  const callbackUrl = props.getProperty('CALLBACK_URL');

  if (!callbackUrl) {
    throw new Error('CALLBACK_URL not configured in script properties');
  }

  return callbackUrl;
}

/**
 * Setup function - run this once to configure the script
 * Sets the callback URL in script properties
 */
function setup() {
  const callbackUrl = 'https://bbauth.example.com/oauth/callback'; // Change this to your actual URL
  const props = PropertiesService.getScriptProperties();
  props.setProperty('CALLBACK_URL', callbackUrl);
  Logger.log('Setup complete. Callback URL set to: ' + callbackUrl);
}
