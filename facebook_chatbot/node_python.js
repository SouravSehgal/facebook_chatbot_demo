var movieName="jab we met";
var spawn = require('child_process').spawn,
py = spawn('python', ["python_imdb.py",movieName]);

py.stdout.on('data',function(movieDetails)
{
	var textChunk = movieDetails.toString('utf8');
	console.log("Result:",textChunk);
});
