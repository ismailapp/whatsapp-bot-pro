const apiKey = function(key) {
    let formatted = key.replace(/\D/g, '');
    if (formatted.startsWith('0')) {
      formatted = '62' + formatted.substr(1);
    }
  }
  module.exports = {
    apiKey
  }