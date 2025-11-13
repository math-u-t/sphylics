/**
 * bbauth - Google Apps Script
 * Identity Verification Layer
 */

/**
 * Main entry point for HTTP GET requests
 * Enhanced with authuser support for multi-account switching
 * @param {Object} e - Event parameter containing request details
 * @return {HtmlOutput} Redirect response
 */
function doGet(e) {
  try {
    const sessionId = e.parameter.session_id;
    const authuser = e.parameter.authuser;

    if (!sessionId) {
      return createErrorResponse('invalid_request', 'Missing session_id parameter');
    }

    // Get authenticated user's email
    const email = Session.getActiveUser().getEmail();

    if (!email) {
      // If authuser is provided, construct Google account chooser URL
      if (authuser !== undefined) {
        return createAccountChooserPage(sessionId);
      }
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
 * Create Google account chooser page
 * @param {string} sessionId - Session ID
 * @return {HtmlOutput} Account chooser page
 */
function createAccountChooserPage(sessionId) {
  const scriptUrl = ScriptApp.getService().getUrl();
  const redirectUrl = scriptUrl + '?session_id=' + encodeURIComponent(sessionId);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>bbauth - Sign In</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
          }
          h1 {
            color: #333;
            margin-bottom: 10px;
          }
          p {
            color: #666;
            margin-bottom: 30px;
          }
          .btn {
            display: inline-block;
            padding: 12px 30px;
            background: #4285f4;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 500;
            transition: background 0.3s;
          }
          .btn:hover {
            background: #357ae8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔐 bbauth</h1>
          <p>Sign in with your Google Account</p>
          <a href="${redirectUrl}" class="btn">Sign In with Google</a>
        </div>
      </body>
    </html>
  `;

  return HtmlService.createHtmlOutput(html);
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
