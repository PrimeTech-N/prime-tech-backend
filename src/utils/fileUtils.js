// backend/src/utils/fileUtils.js
const fs = require('fs');
const path = require('path');

function removeUploadFile(uploadDir, fileUrl) {
  if (!fileUrl) return;
  const fname = path.basename(fileUrl);
  const p = path.join(uploadDir, fname);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

module.exports = { removeUploadFile };
