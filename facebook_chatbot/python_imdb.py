from imdb import IMDb
import sys

movieName = sys.argv[1]
ia = IMDb()
the_matrix = ia.search_movie(movieName)
print the_matrix
sys.stdout.flush()
