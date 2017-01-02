var request=require('request');
var cheerio=require('cheerio');
var recommend_movies=new Set();
var recommendIds=new Set();
request('http://www.imdb.com/title/tt0108052/?ref_=fn_al_tt_2',function(err,response,body)
{
		if(!err&&response.statusCode=='200')
		{
			var $=cheerio.load(body);
			$('a','#title_recs').each(function()
			{
				var movieTitle=$('img', this).attr('title');
				if(typeof(movieTitle)!='undefined')
				{				
					recommend_movies.add(movieTitle);
				}
				var movie=$(this).attr('href');
				if(typeof(movie)!='undefined')
				{
						if(movie.includes('tt_rec_tti'))
						{
							var link = movie.split("/");
							recommendIds.add(link[2]);
						}
				}
			});
			console.log(recommend_movies);
			console.log(recommendIds);
		}
});
