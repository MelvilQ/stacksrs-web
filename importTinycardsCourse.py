import csv
import sys
import requests
import json

#chapterId = sys.argv[1]
#invertColumns = sys.argv[2] == 'i' if len(sys.argv) > 2 else False
chapterId = '1b64bfc2-83ad-4ff2-a0d1-8d9f8e841882'

# prompt some data from user
fileName = chapterId#input('Please enter a filename for the deck to be generated (without ending): ')
deckName = 'Import-Test'#input('Please enter a name for the deck: ')


# load chapter json
chapterUrl = 'https://tinycards.duolingo.com/api/1/decks/' + chapterId + '?attribution=true&expand=true'
response = requests.get(chapterUrl)
if response.status_code != 200:
	print('Cound not load chapter')
	exit()
chapter = json.loads(response.text)
pairs = [[card['sides'][1]['concepts'][0]['fact']['text'], card['sides'][0]['concepts'][0]['fact']['text']] for card in chapter['cards']]
pairs[0].append(chapter['name'])
front = chapter['fromLanguage']
back = 'pt'#chapter['learningLanguage'] # this guy seems to be null in some cases...
rows = [[deckName], [front, back, 'Thema']]
rows += pairs

# write csv file
with open(fileName + '.csv', 'w') as csvfile:
	writer = csv.writer(csvfile, dialect = csv.excel_tab)
	writer.writerows(rows)
	print('Successfully generated CSV file with ' + str(len(rows)) + ' lines')
