var imdb = require('imdb-api');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient ;
var url ='mongodb://localhost:27017/duplicateTest';
//var url ='mongodb://54.173.120.23:27017/chatbotdb';
//var url  ='mongodb://localhost:27017/test';
var fs = require('fs');
var mongoose=require('mongoose');
Schema=mongoose.Schema;
mongoose.connect(url);
var movieSchema=new Schema
({
	'imdbid':{type:String},
	'language':{type:String},
	'title':{type:String},
	'relesed':{type:String},
	'rating':{type:String},
	'genres':{type:String},
	'year':{type:String},
	'rated':{type:String},
	'director':{type:String},
	'writer':{type:String},
	'plot':{type:String},
	'poster':{type:String},
	'runtime':{type:String},
	'votes':{type:String}
});
var Movie=mongoose.model('duplicate',movieSchema);
var k ;
var title1;
var movieList=fs.readFileSync('/home/logituit/movielists/newMovie.txt').toString().split("\n");
k=0;
movieInfo(movieList[k]);
function movieInfo(movie)
{
	var movie_id = "'"+movie+"'";
	console.log(movie);
	if(movie!='')
	{
		imdb.getReq({ id: movie }, function(err, things) 
		{
 			if (err) 
			{
	  			k++;
    				console.error('Oops!!! No movie found in my database with that name.\nTry some other Popular Movie.\n', err);
    				if(k<movieList.length)
				{
					console.log('the movie is gng to insert',movieList[k]+ " myposition is "+k+1);
					movieInfo(movieList[k]);
				}
  			}
			if(things)
			{
				k++;
				var releseDate1=things.released ? things.released : null;
				var actors1=things.actors ? things.actors : null;
				var geners1=things.genres ? things.genres :null;
				var director1=things.director ? things.director: null;
				var writer1=things.writer ? things.writer: null;
				var language = things.languages?things.languages:null;
				var rating1=things.rating ? things.rating: null;
				var story1=things.plot ? things.plot: null;
				var poster1=things.poster ? things.poster: null;
				title1=things.title ? things.title: null ;
				var imdbid1=things.imdbid ?things.imdbid : null;
				var year1=things.year ?things.year : null;
				var rated1=things.rated ?things.rated : null;
				var runtime1=things.runtime ?things.runtime : null;
				var votes1=things.votes ?things.votes : null;
				var imdburl1=things.imdburl ? things.imdburl : null;
				var inputArray = {'imdbid':imdbid1,'language':language,'title':title1,'relesed':releseDate1,'rating':rating1,'genres':geners1,'year':year1,'rated':rated1,'director':director1,
	'writer':writer1,'plot':story1,'poster':poster1,'runtime':runtime1,'votes':votes1};
				var moviejson = inputArray;
				MongoClient.connect(url, function (err, db)
 				{
  					if (err) 
					{
    						console.log('Unable to connect to the mongoDB server. Error:', err);
  					} 
					else 
					{
    						console.log('Connection established to', url);
    						var collection = db.collection('duplicate');
						console.log(title1); 
    						/*Movie.count({'title':title1},function(err,count)
						{
    							if(count>0)
							{	console.log("Movie Exists");
								if(k<movieList.length)
								{
									movieInfo(movieList[k]);
								}
								db.close();
							}
							else
							{*/
								collection.insert(inputArray, function (err, result) 
								{
      									if (err) 
									{
        									console.log(err);
      									} 
									else 
									{
        	console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:',result.length, result);
      									}
      									if(k<movieList.length)
									{
								console.log('the movie is gng to insert',movieList[k]+ " myposition is "+k);
										movieInfo(movieList[k]);
									}
									else
									{
									fs.truncate('movie_imdb.txt', 0, function(){console.log('done')});
	      									db.close();
									}
								});							
							//}	
						//});	
					}
   		 		});
			}
		});
	}
}
