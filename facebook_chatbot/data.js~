var request = require("request");

var url = 'https://api.whatismymovie.com/1.0/?api_key=vxeDrfM5euJZMezu&text=temper';

request
({
	url: url,
    	json: true
}, function (error, response, body) 
{
    	if (!error && response.statusCode === 200) 
	{
        	//console.log(body) // Print the json response
		for(var i in body)
		{
			console.log(body[i].imdb_id_long);
		}
    	}
});
