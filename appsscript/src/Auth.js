/**
 * bbauth - Authentication Utilities
 * Handle authuser parameter and multi-account switching
 */

/**
 * Enhanced doGet with authuser support
 * Handles Google's multi-account authuser parameter
 * @param {Object} e - Event parameter
 * @return {HtmlOutput} Response
 */
function doGetWithAuthUser(e) {
  const sessionId = e.parameter.session_id;
  const authuser = e.parameter.authuser;

  if (!sessionId) {
    return createErrorResponse('invalid_request', 'Missing session_id parameter');
  }

  try {
    // Get authenticated user
    const user = Session.getActiveUser();
    const email = user.getEmail();

    if (!email) {
      // If authuser is provided, construct Google account chooser URL
      if (authuser !== undefined) {
        return createAccountChooserRedirect(e);
      }
      return createErrorResponse('access_denied', 'Unable to retrieve user email');
    }

    // Proceed with normal flow
    const callbackUrl = getCallbackUrl();
    const redirectUrl = buildRedirectUrl(callbackUrl, sessionId, email);

    return HtmlService.createHtmlOutput(
      '<html><head><meta http-equiv="refresh" content="0;url=' + redirectUrl + '"></head></html>'
    );

  } catch (error) {
    Logger.log('Error in doGetWithAuthUser: ' + error);
    return createErrorResponse('server_error', error.toString());
  }
}

/**
 * Create Google account chooser redirect
 * @param {Object} e - Event parameter
 * @return {HtmlOutput} Account chooser page
 */
function createAccountChooserRedirect(e) {
  const scriptUrl = ScriptApp.getService().getUrl();
  const sessionId = e.parameter.session_id;

  // Build URL with authuser parameter
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
 * Get effective user (handles delegation and service accounts)
 * @return {string} User email
 */
function getEffectiveUser() {
  // Try Session.getActiveUser() first
  let email = Session.getActiveUser().getEmail();

  // Fallback to Session.getEffectiveUser()
  if (!email) {
    email = Session.getEffectiveUser().getEmail();
  }

  return email;
}

/**
 * Verify user has required scopes
 * @param {Array<string>} requiredScopes - Required scopes
 * @return {boolean} True if user has all required scopes
 */
function verifyScopes(requiredScopes) {
  // Note: Apps Script doesn't provide a direct way to check granted scopes
  // This is a placeholder for future implementation
  return true;
}
