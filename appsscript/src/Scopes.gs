/**
 * bbauth - Scope Execution
 * Execute Google Apps Script APIs based on granted scopes
 */

/**
 * Execute action based on scope
 * This function is called from bbauth backend to perform actions
 * @param {Object} e - Event parameter containing scope and action details
 * @return {Object} Result of the action
 */
function executeScope(e) {
  const scope = e.parameter.scope;
  const action = e.parameter.action;

  try {
    switch (scope) {
      case 'gmail.send':
        return executeGmailSend(e);

      case 'drive.readonly':
        return executeDriveReadonly(e);

      case 'email':
        return executeEmailScope(e);

      default:
        return {
          error: 'invalid_scope',
          error_description: 'Scope not supported: ' + scope
        };
    }
  } catch (error) {
    Logger.log('Error in executeScope: ' + error);
    return {
      error: 'server_error',
      error_description: error.toString()
    };
  }
}

/**
 * Execute Gmail send scope
 * @param {Object} e - Event parameter
 * @return {Object} Result
 */
function executeGmailSend(e) {
  const action = e.parameter.action;

  if (action === 'send') {
    const to = e.parameter.to;
    const subject = e.parameter.subject;
    const body = e.parameter.body;

    if (!to || !subject || !body) {
      return {
        error: 'invalid_request',
        error_description: 'Missing required parameters: to, subject, body'
      };
    }

    try {
      GmailApp.sendEmail(to, subject, body);
      return {
        success: true,
        message: 'Email sent successfully'
      };
    } catch (error) {
      return {
        error: 'execution_failed',
        error_description: 'Failed to send email: ' + error.toString()
      };
    }
  }

  return {
    error: 'invalid_action',
    error_description: 'Unknown action: ' + action
  };
}

/**
 * Execute Drive readonly scope
 * @param {Object} e - Event parameter
 * @return {Object} Result
 */
function executeDriveReadonly(e) {
  const action = e.parameter.action;

  if (action === 'list') {
    const limit = parseInt(e.parameter.limit) || 10;

    try {
      const files = DriveApp.getFiles();
      const fileList = [];

      let count = 0;
      while (files.hasNext() && count < limit) {
        const file = files.next();
        fileList.push({
          id: file.getId(),
          name: file.getName(),
          mimeType: file.getMimeType(),
          size: file.getSize(),
          createdDate: file.getDateCreated().toISOString(),
          modifiedDate: file.getLastUpdated().toISOString(),
          url: file.getUrl()
        });
        count++;
      }

      return {
        success: true,
        files: fileList
      };
    } catch (error) {
      return {
        error: 'execution_failed',
        error_description: 'Failed to list files: ' + error.toString()
      };
    }
  }

  if (action === 'get') {
    const fileId = e.parameter.file_id;

    if (!fileId) {
      return {
        error: 'invalid_request',
        error_description: 'Missing file_id parameter'
      };
    }

    try {
      const file = DriveApp.getFileById(fileId);
      return {
        success: true,
        file: {
          id: file.getId(),
          name: file.getName(),
          mimeType: file.getMimeType(),
          size: file.getSize(),
          createdDate: file.getDateCreated().toISOString(),
          modifiedDate: file.getLastUpdated().toISOString(),
          url: file.getUrl(),
          downloadUrl: file.getDownloadUrl()
        }
      };
    } catch (error) {
      return {
        error: 'execution_failed',
        error_description: 'Failed to get file: ' + error.toString()
      };
    }
  }

  return {
    error: 'invalid_action',
    error_description: 'Unknown action: ' + action
  };
}

/**
 * Execute email scope
 * @param {Object} e - Event parameter
 * @return {Object} Result
 */
function executeEmailScope(e) {
  const action = e.parameter.action;

  if (action === 'get') {
    const email = Session.getActiveUser().getEmail();

    if (!email) {
      return {
        error: 'access_denied',
        error_description: 'Unable to retrieve user email'
      };
    }

    return {
      success: true,
      email: email,
      email_verified: true
    };
  }

  return {
    error: 'invalid_action',
    error_description: 'Unknown action: ' + action
  };
}

/**
 * Test function - List available scopes
 * @return {Array<string>} Available scopes
 */
function listAvailableScopes() {
  return [
    'email',
    'gmail.send',
    'drive.readonly'
  ];
}

/**
 * Test function - Check if scope is available
 * @param {string} scope - Scope to check
 * @return {boolean} True if scope is available
 */
function isScopeAvailable(scope) {
  const availableScopes = listAvailableScopes();
  return availableScopes.indexOf(scope) !== -1;
}
