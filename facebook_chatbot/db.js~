var imdb = require('imdb-api');
/*var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'welcome@123',
  database : 'movie'
});
connection.connect();*/
//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient ;

// Connection URL. This is where your mongodb server is running.


var url = 'mongodb://sourav:welcome123@jello.modulusmongo.net:27017/yjAze2bi';
var moviesuser=[];
var movieuser_horror=[];
var moviesuser_comedy=[];
var fs = require('fs');
//var movieList=fs.readFileSync('movielist.txt').toString().split("\n");
var horrorMovieList=fs.readFileSync('horror_movies.txt').toString().split("\n");
for(i in horrorMovieList)
{
	movieInfo(horrorMovieList[i]);
}

function movieInfo(movie)
{
	imdb.getReq({ name:movie }, function(err, things) 
	{
		if (err) 
		{
    			console.error('Oops!!! No movie found in my database with that name.\nTry some other Popular Movie.\n',err);
    			return;
  		}
		else
		{	
			//console.log(things);
			var releseDate1=things.released ? things.released : null;
			var actors1=things.actors ? things.actors : null;
			var geners1=things.genres ? things.genres :null;
			var director1=things.director ? things.director: null;
			var writer1=things.writer ? things.writer: null;
			var rating1=things.rating ? things.rating: null;
			var story1=things.plot ? things.plot: null;
			var poster1=things.poster ? things.poster: null;
			var title1=things.title ? things.title: null ;
			var imdbid1=things.imdbid ?things.imdbid : null;
			var year1=things.year ?things.year : null;
			var rated1=things.rated ?things.rated : null;
			var runtime1=things.runtime ?things.runtime : null;
			var votes1=things.votes ?things.votes : null;
			var imdburl1=things.imdburl ? things.imdburl : null;
			var language = things.languages?things.languages:null;
			/*var post={imdbid:imdbid1,title:title1,relesed:releseDate1,rating:rating1,genres:geners1,year:year1,rated:rated1,director:director1 ,writer:writer1,plot:story1,poster:poster1,runtime:runtime1,vots:votes1};
//console.log(post);*/
			var inputArray ={'imdbid':imdbid1,'title':title1,'language':language,'relesed':releseDate1,'rating':rating1,'rating':rating1,'genres':geners1,'year':year1,'rated':rated1,'director':director1,
'writer':writer1,'plot':story1,'poster':poster1,'runtime':runtime1,'votes':votes1};

			//inputArray.push({'':imdburl1});
			//console.log(inputArray);
			var moviejson = inputArray;
	
			MongoClient.connect(url, function (err, db) 
			{
  			if (err) 
			{
    				console.log('Unable to connect to the mongoDB server. Error:', err);
  			} 
			else 
			{
    				//HURRAY!! We are connected. :)
    				//console.log('Connection established to', url);

    				// Get the documents collection
    				var collection = db.collection('movies');

    				/*//Create some users
    				var user1 = {name: 'modulus admin', age: 42, roles: ['admin', 'moderator', 'user']};
    				var user2 = {name: 'modulus user', age: 22, roles: ['user']};
    				var user3 = {name: 'modulus super admin', age: 92, roles: ['super-admin', 'admin', 'moderator', 'user']};*/

    				// Insert some movies
    				/*collection.insert(inputArray, function (err, result) 
				{
	      				if (err) 
					{
        					console.log(err);
      					}	 
					else 
					{
        					console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" 							are:', result.length, result);
      					}
      					//Close connection
      					db.close();
    				});*/
    				var cursor = collection.find({"genres":"Crime, Drama"});
				cursor.each(function (err, doc) 
				{
	      			if (err) 
				{
			        	console.log(err);
				} 
				else 
				{
        				//console.log('Fetched item is:', doc);
        				if(doc!=null)
        				moviesuser.push(doc.title);
        				//console.log('user asked movies is ',moviesuser);
      				}
    			});

			var cursor1=collection.find({"genres":"Horror"});
			cursor.each(function (err,doc)
			{
				if(err)
				{
					console.log(err);
				}
				else
				{
					if(doc!=null)
					movieuser_horror.push(doc.title);
				}
			});
    			var cursor2 = collection.find({"language":"English, Spanish"});
			cursor2.each(function (err, doc) 
			{
      				if (err) 
				{
        				console.log(err);
      				} 
				else 
				{
        				//console.log('Fetched item is:', doc);
        				if(doc!=null)
					{
        					doc.title = doc.title.replace(/[^a-zA-Z 0-9]+/g,'');
        					moviesuser_comedy.push(doc.title);
        				}	
        				//console.log('user asked movies is ',moviesuser);
      				}
    			});
    
 			/* collection.update({name: 'modulus user'}, {$set: {enabled: false}}, function (err, numUpdated) 
			{
  				if (err) 
				{
    					console.log(err);
  				} 
				else if (numUpdated) 
				{
    					console.log('Updated Successfully %d document(s).', numUpdated);
  				}
				else 
				{
    					console.log('No document found with defined "find" criteria!');
  				}
  				//Close connection
  				db.close();
  			});*/
		}
	});

	/*connection.query(query, inputArray, function(err, result) 
	{
		if(err)
		{
			console.log("Error------------>"+err);
		} 
		else
		{
			console.log(result);
		}
	});*/
	//console.log("Movie Details:",things);  
	exports.movielist = function () 
	{
		moviesuser = moviesuser.filter( function( item, index, inputArray ) 
		{
           		return inputArray.indexOf(item) == index;
    		});
  		return moviesuser;
	};
	exports.movielist_horror=function()
	{
		movieuser_horror=movieuser_horror.filter(function(item, index, inputArray)
		{
			return inputArray.indexOf(item)==index;
		});
		return movieuser_horror;
	};  
	exports.movielist_comedy = function () 
	{
		moviesuser_comedy = moviesuser_comedy.filter( function( item, index, inputArray ) 
		{
           		return inputArray.indexOf(item) == index;
    		});
    		console.log('the Comedy movie list',moviesuser_comedy);
    		return moviesuser_comedy;
	};  
	/*connection.query('SELECT * from movie', function(err, rows, fields) 
	{
  		if (!err)
    			console.log('The solution is: ', rows);
  		else
    			console.log('Error while performing Query.');
	});*/
}
