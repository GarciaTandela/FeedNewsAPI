const fs = require('fs');
const path = require('path');

//Helper function to delete the image
const clearImage = filePath => {

    filePath = path.join(__dirname,'..',filePath);
    fs.unlink(filePath, err => console.log(err));

};

exports.clearImage = clearImage;