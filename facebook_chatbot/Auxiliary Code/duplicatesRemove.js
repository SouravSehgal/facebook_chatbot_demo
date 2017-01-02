var imdb = require('imdb-api');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient ;
var url ='mongodb://localhost:27017/duplicateTest';
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
MongoClient.connect(url, function (err, db)
{
	if (err) 
	{
    		console.log('Unable to connect to the mongoDB server. Error:', err);
  	}
	else
	{
		var collection = db.collection('duplicate');
		collection.aggregate
		([
  			{ $match: { 
    				imdbid: { "$ne": '' }  
  			}},
  			{ $group: { 
    				_id: { imdbid: "$imdbid"}, 
    				dups: { "$addToSet": "$_id" }, 
    				count: { "$sum": 1 } 
  			}}, 
  			{ $match: { 
    				count: { "$gt": 1 }    
  			}}
		],
			{allowDiskUse: true}       
		).forEach(function(doc) 
		{
    			doc.dups.shift();      
    			collection.remove({_id : {$in: doc.dups }});  
		});
	}
}); 
