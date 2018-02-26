var request = require('request');

module.exports = function(req, res, next) {
  var id = req.query.id,
    sheet = req.query.sheet || 1,
    query = req.query.q || '',
    useIntegers = req.query.integers || true,
    showRows = req.query.rows || true,
    showColumns = req.query.columns || true,
    url = 'https://spreadsheets.google.com/feeds/list/' + id + '/' + sheet + '/public/values?alt=json';

  request(url, function(error, response, body) {
    if(!error && response.statusCode === 200) {
      var data = JSON.parse(response.body);
      var responseObj = {};
      var rows = [];
      var columns = {};
      // add some meta deta to the sheet
      var author = data.feed.author;
      responseObj.metaData = {
        sheetName: data.feed.title["$t"],
        author: author[0].name["$t"],
        email: author[0].email["$t"]
      }
      // iterate through each entry of the sheet data
      for(var i = 0; i < data.feed.entry.length; i++) {
        var entry = data.feed.entry[i];
        // get the keys of each entry
        var keys = Object.keys(entry);
        var newRow = {};
        var queried = false;
        // iterate through the keys
        for(var j = 0; j < keys.length; j++) {
          // check if the `gsx$` property exists to get the name and value
          var gsxCheck = keys[j].indexOf('gsx$');
          if(gsxCheck > -1) {
            var key = keys[j];
            var name = key.substring(4);
            var content = entry[key];
            // get the content text
            var value = content.$t;
            // convert the property value to lowercase to add as a property to object
            if(value.toLowerCase().indexOf(query.toLowerCase()) > -1) {
              queried = true;
            }
            // if numbers return the property value as numbers for the array
            if(useIntegers === true && !isNaN(value)) {
              value = Number(value);
            }
            newRow[name] = value;
            if(queried === true) {
              if(!columns.hasOwnProperty(name)) {
                columns[name] = [];
                columns[name].push(value);
              } else {
                columns[name].push(value);
              }
            }
          }
        }
        if(queried === true) {
          rows.push(newRow);
        }
      }
      if(showColumns === true) {
        responseObj['columns'] = columns;
      }
      if(showRows === true) {
        responseObj['rows'] = rows;
      }
      return res.status(200).json(responseObj);
    } else {
      return res.status(response.statusCode).json(error);
    }
  });
};
